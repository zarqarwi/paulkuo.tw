#!/usr/bin/env python3
"""
External AI Validation — Multi-Model Query System (Phase 1: Perplexity only)

Usage:
  # Single benchmark run
  python3 ai-ready-opt/multi_model_query.py --run-benchmark --tag "test-run"

  # Noise calibration (N runs)
  python3 ai-ready-opt/multi_model_query.py --calibrate --runs 10
"""

import os
import sys
import json
import time
import argparse
import statistics
import re
from datetime import datetime

import yaml
from openai import OpenAI

# --- Config ---
BENCHMARK_PATH = "ai-ready-opt/benchmark_questions.yaml"
RESULTS_DIR = "ai-ready-opt/external-eval-results"
CALIBRATION_REPORT_PATH = "ai-ready-opt/calibration_report.json"

MODELS = {
    "perplexity": {
        "enabled": True,
        "api_base": "https://api.perplexity.ai",
        "model": "sonar",
        "env_key": "PERPLEXITY_API_KEY",
    },
    # Phase 2+ (disabled)
    "claude": {"enabled": False},
    "gpt4o": {"enabled": False},
    "gemini": {"enabled": False},
}

# Scoring weights
POSITIVE_WEIGHT = 7.0   # 10 positive questions share 70 points
NEGATIVE_WEIGHT = 10.0  # 3 negative questions share 30 points


# --- Benchmark Loader ---

def load_benchmark(path=BENCHMARK_PATH):
    """Load benchmark questions from YAML"""
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data


# --- Perplexity Query ---

def query_perplexity(question, model_config):
    """Query Perplexity API with a question about paulkuo.tw"""
    api_key = os.environ.get(model_config["env_key"])
    if not api_key:
        raise RuntimeError(f"Missing env var: {model_config['env_key']}")

    client = OpenAI(
        api_key=api_key,
        base_url=model_config["api_base"],
    )

    system_prompt = (
        "You are a research assistant. Answer the question based on what you can find "
        "about the website paulkuo.tw and its owner Paul Kuo (郭曜郎). "
        "Be factual and concise. If you cannot find information, say so clearly. "
        "Do not make up facts."
    )

    try:
        response = client.chat.completions.create(
            model=model_config["model"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.1,
            max_tokens=500,
        )

        answer = response.choices[0].message.content

        # Extract citations if available
        cited_urls = []
        if hasattr(response, 'citations') and response.citations:
            cited_urls = response.citations
        elif hasattr(response.choices[0].message, 'context') and response.choices[0].message.context:
            ctx = response.choices[0].message.context
            if isinstance(ctx, dict) and 'citations' in ctx:
                cited_urls = [c.get('url', '') for c in ctx['citations'] if isinstance(c, dict)]

        return {
            "answer": answer,
            "cited_urls": cited_urls,
            "model": model_config["model"],
            "status": "success",
        }

    except Exception as e:
        return {
            "answer": "",
            "cited_urls": [],
            "model": model_config["model"],
            "status": "error",
            "error": str(e),
        }


# --- Scoring ---

def score_positive(question_data, answer_text):
    """Score a positive (factual) question"""
    answer_lower = answer_text.lower()
    scoring = question_data["scoring"]

    # Keyword matching
    keywords = question_data.get("expected_keywords", [])
    keyword_hits = sum(1 for kw in keywords if kw.lower() in answer_lower)
    keyword_threshold = scoring.get("keyword_match_threshold", 2)
    keyword_score = min(keyword_hits / max(keyword_threshold, 1), 1.0)

    # Fact matching (looser — check substrings)
    facts = question_data.get("expected_facts", [])
    fact_hits = 0
    for fact in facts:
        # Split fact into key phrases and check if most are present
        phrases = [p.strip().lower() for p in re.split(r'\s+or\s+', fact)]
        if any(phrase in answer_lower for phrase in phrases):
            fact_hits += 1
    fact_threshold = scoring.get("fact_match_threshold", 1)
    fact_score = min(fact_hits / max(fact_threshold, 1), 1.0)

    # Combined: 50% keyword + 50% fact
    combined = (keyword_score * 0.5 + fact_score * 0.5) * 100

    return {
        "score": round(combined, 1),
        "keyword_hits": keyword_hits,
        "keyword_total": len(keywords),
        "fact_hits": fact_hits,
        "fact_total": len(facts),
    }


def score_negative(question_data, answer_text):
    """Score a negative (anti-hallucination) question"""
    answer_lower = answer_text.lower()

    # Check if the model correctly denied/rejected the false claim
    denial_indicators = [
        "no", "not", "no information", "cannot confirm", "don't",
        "doesn't", "isn't", "i could not find", "no evidence",
        "there is no", "i cannot", "unable to confirm",
        "no record", "not a professor", "not the cto",
        "does not sell", "not an online store", "not e-commerce",
    ]

    affirmation_indicators = [
        "yes", "is the cto", "is a professor", "sells products",
        "runs an online store", "e-commerce platform",
    ]

    has_denial = any(ind in answer_lower for ind in denial_indicators)
    has_affirmation = any(ind in answer_lower for ind in affirmation_indicators)

    if has_denial and not has_affirmation:
        score = 100.0
    elif has_affirmation:
        score = 0.0
    else:
        # Ambiguous — partial credit
        score = 50.0

    return {
        "score": score,
        "correctly_denied": has_denial,
        "incorrectly_affirmed": has_affirmation,
    }


def score_question(question_data, response):
    """Route to positive or negative scoring"""
    if response["status"] != "success" or not response["answer"]:
        return {"score": 0, "status": "no_answer"}

    if question_data["type"] == "negative_test":
        result = score_negative(question_data, response["answer"])
    else:
        result = score_positive(question_data, response["answer"])

    # Check if paulkuo.tw is cited
    cited_paulkuo = any("paulkuo" in url for url in response.get("cited_urls", []))
    result["cited_paulkuo"] = cited_paulkuo

    return result


# --- Aggregate ---

def aggregate_scores(questions, scored_results):
    """Compute aggregate scores from individual question scores"""
    positive_scores = []
    negative_scores = []

    for q, sr in zip(questions, scored_results):
        if q["type"] == "negative_test":
            negative_scores.append(sr["score"])
        else:
            positive_scores.append(sr["score"])

    # Overall = weighted blend
    pos_avg = statistics.mean(positive_scores) if positive_scores else 0
    neg_avg = statistics.mean(negative_scores) if negative_scores else 0

    # 70% positive recall + 30% hallucination resistance
    overall = pos_avg * 0.7 + neg_avg * 0.3

    # Per-category aggregation
    cat_scores = {}
    for q, sr in zip(questions, scored_results):
        cat = q["category"]
        if cat not in cat_scores:
            cat_scores[cat] = []
        cat_scores[cat].append(sr["score"])

    per_category = {
        cat: round(statistics.mean(scores), 1)
        for cat, scores in cat_scores.items()
    }

    # Discovery: % of positive questions that cited paulkuo.tw
    cited_count = sum(
        1 for q, sr in zip(questions, scored_results)
        if q["type"] != "negative_test" and sr.get("cited_paulkuo", False)
    )
    discovery = round(cited_count / max(len(positive_scores), 1) * 100, 1)

    return {
        "overall_score": round(overall, 1),
        "positive_recall": round(pos_avg, 1),
        "hallucination_resistance": round(neg_avg, 1),
        "discovery_aggregate": discovery,
        "per_category": per_category,
        "positive_count": len(positive_scores),
        "negative_count": len(negative_scores),
    }


# --- Run Benchmark ---

def run_benchmark(tag="manual", save=True):
    """Run full benchmark: query all questions, score, aggregate"""
    benchmark = load_benchmark()
    questions = benchmark["questions"]
    model_config = MODELS["perplexity"]

    print(f"Running benchmark ({len(questions)} questions, tag={tag})...")

    responses = []
    scored_results = []

    for i, q in enumerate(questions):
        print(f"  [{i+1}/{len(questions)}] {q['id']}: {q['question'][:60]}...")
        resp = query_perplexity(q["question"], model_config)
        responses.append(resp)

        if resp["status"] == "success":
            sr = score_question(q, resp)
            scored_results.append(sr)
            print(f"    -> score={sr['score']}, cited_paulkuo={sr.get('cited_paulkuo', False)}")
        else:
            scored_results.append({"score": 0, "status": "error", "error": resp.get("error", "")})
            print(f"    -> ERROR: {resp.get('error', 'unknown')}")

        # Rate limit spacing
        if i < len(questions) - 1:
            time.sleep(2)

    # Aggregate
    agg = aggregate_scores(questions, scored_results)

    # Run quality
    valid_count = sum(1 for r in responses if r["status"] == "success")
    run_quality = {
        "run_type": "single" if tag != "calibration" else "calibration",
        "models_valid": valid_count,
        "models_total": len(questions),
        "completion_rate": round(valid_count / len(questions) * 100, 1),
    }

    result = {
        "benchmark_version": benchmark["metadata"]["benchmark_version"],
        "timestamp": datetime.now().isoformat(),
        "tag": tag,
        "model": model_config["model"],
        "aggregate": agg,
        "run_quality": run_quality,
        "per_question": [
            {
                "id": q["id"],
                "category": q["category"],
                "type": q["type"],
                "question": q["question"],
                "answer": responses[i]["answer"],
                "cited_urls": responses[i].get("cited_urls", []),
                "scoring": scored_results[i],
            }
            for i, q in enumerate(questions)
        ],
    }

    # Print summary
    print(f"\n--- Results (tag={tag}) ---")
    print(f"Overall: {agg['overall_score']}/100")
    print(f"Positive recall: {agg['positive_recall']}")
    print(f"Hallucination resistance: {agg['hallucination_resistance']}")
    print(f"Discovery: {agg['discovery_aggregate']}%")
    print(f"Valid: {run_quality['models_valid']}/{run_quality['models_total']}")

    # Save
    if save:
        os.makedirs(RESULTS_DIR, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"ext-{tag}-{ts}.json"
        filepath = os.path.join(RESULTS_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Saved: {filepath}")

    return result


# --- Calibration ---

def run_calibration(runs=10):
    """Run N benchmark runs and compute noise statistics"""
    print(f"Starting calibration ({runs} runs)...\n")

    all_results = []
    for i in range(runs):
        print(f"\n=== Calibration Run {i+1}/{runs} ===")
        result = run_benchmark(tag=f"calibration-{i+1}", save=True)
        all_results.append(result)

        if i < runs - 1:
            print(f"  Waiting 5s before next run...")
            time.sleep(5)

    # Compute statistics
    overall_scores = [r["aggregate"]["overall_score"] for r in all_results]
    pos_scores = [r["aggregate"]["positive_recall"] for r in all_results]
    neg_scores = [r["aggregate"]["hallucination_resistance"] for r in all_results]
    discovery_scores = [r["aggregate"]["discovery_aggregate"] for r in all_results]

    def stats(values):
        if len(values) < 2:
            return {"mean": values[0] if values else 0, "stddev": 0, "min": min(values, default=0), "max": max(values, default=0), "n": len(values)}
        return {
            "mean": round(statistics.mean(values), 2),
            "stddev": round(statistics.stdev(values), 2),
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "n": len(values),
        }

    # Per-category stats
    cat_data = {}
    for r in all_results:
        for cat, score in r["aggregate"]["per_category"].items():
            if cat not in cat_data:
                cat_data[cat] = []
            cat_data[cat].append(score)

    # Per-question stats
    q_data = {}
    for r in all_results:
        for pq in r["per_question"]:
            qid = pq["id"]
            if qid not in q_data:
                q_data[qid] = []
            q_data[qid].append(pq["scoring"]["score"])

    overall_stats = stats(overall_scores)

    report = {
        "calibration_timestamp": datetime.now().isoformat(),
        "benchmark_version": all_results[0]["benchmark_version"],
        "runs": runs,
        "overall": overall_stats,
        "positive_recall": stats(pos_scores),
        "hallucination_resistance": stats(neg_scores),
        "discovery": stats(discovery_scores),
        "threshold": {
            "stddev_1x": round(overall_stats["stddev"], 2),
            "stddev_2x": round(overall_stats["stddev"] * 2, 2),
            "description": "strong_signal = score change > 2*stddev from calibration mean",
        },
        "per_category": {cat: stats(scores) for cat, scores in cat_data.items()},
        "per_question": {qid: stats(scores) for qid, scores in q_data.items()},
    }

    # Save calibration report
    with open(CALIBRATION_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nCalibration report saved: {CALIBRATION_REPORT_PATH}")

    # Print summary
    print(f"\n{'='*50}")
    print(f"CALIBRATION SUMMARY ({runs} runs)")
    print(f"{'='*50}")
    print(f"Overall: mean={overall_stats['mean']}, stddev={overall_stats['stddev']}")
    print(f"Range: {overall_stats['min']} ~ {overall_stats['max']}")
    print(f"Strong signal threshold: ±{report['threshold']['stddev_2x']}")
    print(f"\nPositive recall: {stats(pos_scores)}")
    print(f"Hallucination resistance: {stats(neg_scores)}")
    print(f"Discovery: {stats(discovery_scores)}")
    print(f"\nPer category:")
    for cat, s in report["per_category"].items():
        print(f"  {cat}: mean={s['mean']}, stddev={s['stddev']}")
    print(f"\nPer question (highest variance):")
    q_sorted = sorted(report["per_question"].items(), key=lambda x: x[1]["stddev"], reverse=True)
    for qid, s in q_sorted[:5]:
        print(f"  {qid}: mean={s['mean']}, stddev={s['stddev']}, range={s['min']}~{s['max']}")

    return report


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="External AI Validation Benchmark")
    parser.add_argument("--run-benchmark", action="store_true", help="Run single benchmark")
    parser.add_argument("--calibrate", action="store_true", help="Run noise calibration")
    parser.add_argument("--tag", default="manual", help="Tag for benchmark run")
    parser.add_argument("--runs", type=int, default=10, help="Number of calibration runs")
    args = parser.parse_args()

    if args.run_benchmark:
        run_benchmark(tag=args.tag)
    elif args.calibrate:
        run_calibration(runs=args.runs)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
