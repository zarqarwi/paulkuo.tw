#!/usr/bin/env python3
"""AI-Ready Continuous Optimization System — MVP (v1.1)"""

import os
import sys
import json
import re
import time
import glob as globmod
import fnmatch
import argparse
import subprocess
from datetime import datetime

import yaml
import requests
import anthropic

# --- Config ---
PRODUCTION_URL = "https://paulkuo.tw"
EVAL_URL = "https://paulkuo-eval.paul-4bf.workers.dev/evaluate"

ALLOWED_FILES = [
    "public/llms.txt",
    "src/data/siteSchema.ts",
    "public/mcp.json",
    "public/.well-known/agent-card.json",
    "public/robots.txt",
]
ALLOWED_ARTICLE_GLOB = "src/content/articles/**/*.md"


# --- Exceptions ---
class PolicyViolation(Exception):
    pass


# --- Module 1: Strategy Loader ---

def load_strategy(path="ai-ready-opt/program.md"):
    """從 program.md 解析 YAML config 區塊"""
    content = open(path, encoding="utf-8").read()

    match = re.search(r'```yaml\n(.*?)```', content, re.DOTALL)
    if not match:
        raise ValueError("No YAML config found in program.md")

    config = yaml.safe_load(match.group(1))
    return config


# --- Module 2: Mutation Agent ---

def _scan_articles(glob_pattern):
    """掃描文章：只讀 frontmatter metadata，不讀 body"""
    article_summaries = []
    for path in sorted(globmod.glob(glob_pattern, recursive=True)):
        try:
            raw = open(path, encoding="utf-8").read()
            parts = raw.split("---", 2)
            if len(parts) < 3:
                continue
            fm = yaml.safe_load(parts[1]) or {}
            faq = fm.get("faq")
            faq_info = f"yes ({len(faq)} items)" if faq else "no"
            title = fm.get("title", "(no title)")
            desc = fm.get("description", "")[:80]
            article_summaries.append(
                f"- {path} — title: {title} | desc: {desc} | has faq: {faq_info}"
            )
        except Exception:
            article_summaries.append(f"- {path} — (parse error)")
    return article_summaries


def generate_mutation(strategy, baseline_score, baseline_sub, previous_changes=None):
    """呼叫 Claude API 產生一個修改提案"""
    client = anthropic.Anthropic()

    # 白名單 metadata 檔案：讀完整內容（都很小）
    file_contents = {}
    article_summaries = []
    for f in strategy["allowed_files"]:
        if "**" in f:  # glob pattern (articles) — 只讀 frontmatter
            article_summaries = _scan_articles(f)
        else:
            if os.path.exists(f):
                file_contents[f] = open(f, encoding="utf-8").read()

    # 組裝文章清單區塊
    articles_section = ""
    if article_summaries:
        articles_section = f"""
## Article Inventory ({len(article_summaries)} files)
Articles you may add/modify `faq` frontmatter on:
{chr(10).join(article_summaries)}
"""

    prompt = f"""You are an AI-Ready SEO optimizer for paulkuo.tw.

## Rules
- You may ONLY modify these files: {list(file_contents.keys())} or any article listed below
- For article .md files, you may ONLY add or modify the `faq` frontmatter field. Do NOT change title, description, date, body, or any other field.
- faq format: a YAML list of {{q: "question", a: "answer"}} items
- Make ONE small, targeted modification per iteration
- Focus on the lowest-scoring dimension first
- When modifying an article, output the COMPLETE file content (frontmatter + body). You must preserve the original body exactly.

## Current State
- Total score: {baseline_score}/100
- Sub-scores: {json.dumps(baseline_sub)}
- Focus areas: {json.dumps(strategy.get('focus_areas', []))}
- Known gaps: {json.dumps(strategy.get('known_gaps', []))}

## Previous Changes (avoid repeating)
{json.dumps(previous_changes[-2:] if previous_changes else [])}

## Metadata File Contents
{chr(10).join(f"### {path}{chr(10)}```{chr(10)}{content}{chr(10)}```" for path, content in file_contents.items())}
{articles_section}
## Output Format
Respond with EXACTLY this JSON structure, nothing else:
{{
  "file": "<file path to modify>",
  "reason": "<why this change will improve the score>",
  "content": "<complete new file content>"
}}

If you choose to modify an article, you MUST first read its full content. Since you only see the frontmatter summary above, include a "read_file" field instead:
{{
  "file": "<article path>",
  "reason": "<why adding FAQ to this article will improve the score>",
  "read_file": true
}}
"""

    messages = [{"role": "user", "content": prompt}]
    model = strategy.get("model", "claude-sonnet-4-20250514")
    total_input = 0
    total_output = 0

    response = client.messages.create(
        model=model, max_tokens=8000, messages=messages
    )
    total_input += response.usage.input_tokens
    total_output += response.usage.output_tokens

    # Parse JSON from response
    text = response.content[0].text
    text = re.sub(r'^```json\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text.strip())
    mutation = json.loads(text)

    # Two-step flow: Agent 要改文章，先讀完整內容再產生修改
    if mutation.get("read_file") and os.path.exists(mutation["file"]):
        article_content = open(mutation["file"], encoding="utf-8").read()
        followup = f"""Here is the full content of {mutation["file"]}:

```
{article_content}
```

Now produce the modified version with FAQ added to the frontmatter.
Keep the body EXACTLY the same. Only add/modify the `faq` field.

Respond with EXACTLY this JSON:
{{
  "file": "{mutation['file']}",
  "reason": "{mutation['reason']}",
  "content": "<complete new file content with faq added>"
}}
"""
        messages.append({"role": "assistant", "content": response.content[0].text})
        messages.append({"role": "user", "content": followup})

        response = client.messages.create(
            model=model, max_tokens=8000, messages=messages
        )
        total_input += response.usage.input_tokens
        total_output += response.usage.output_tokens

        text = response.content[0].text
        text = re.sub(r'^```json\s*', '', text.strip())
        text = re.sub(r'\s*```$', '', text.strip())
        mutation = json.loads(text)

    return {
        "file": mutation["file"],
        "reason": mutation["reason"],
        "content": mutation["content"],
        "token_usage": {
            "input": total_input,
            "output": total_output
        }
    }


# --- Module 3: File Guard ---

def guard_check(file_path, new_content):
    """技術性防護：白名單 + 文章 faq-only 檢查"""

    # 路徑 A：靜態白名單
    if file_path in ALLOWED_FILES:
        _check_size(file_path, new_content)
        return True

    # 路徑 B：文章 frontmatter（只允許 faq）
    # 支援 articles/*.md（flat）和 articles/sub/*.md（nested）
    if (file_path.startswith("src/content/articles/")
            and file_path.endswith(".md")):
        _check_article_faq_only(file_path, new_content)
        return True

    # 路徑 C：不在白名單
    raise PolicyViolation(f"File not in whitelist: {file_path}")


def _check_article_faq_only(file_path, new_content):
    """確保文章只有 faq 欄位被新增或修改"""
    original = open(file_path, encoding="utf-8").read()

    def parse_fm(text):
        parts = text.split("---", 2)
        if len(parts) < 3:
            raise PolicyViolation("Invalid frontmatter format")
        return yaml.safe_load(parts[1]), parts[2]

    old_fm, old_body = parse_fm(original)
    new_fm, new_body = parse_fm(new_content)

    # body 不能改
    if old_body.strip() != new_body.strip():
        raise PolicyViolation("Article body was modified — only faq frontmatter allowed")

    # faq 以外的欄位不能改
    for key in set(list(old_fm.keys()) + list(new_fm.keys())):
        if key == "faq":
            continue
        if old_fm.get(key) != new_fm.get(key):
            raise PolicyViolation(f"Frontmatter '{key}' was modified")

    # faq 格式驗證
    if "faq" in new_fm:
        faq = new_fm["faq"]
        if not isinstance(faq, list):
            raise PolicyViolation("faq must be a list")
        for i, item in enumerate(faq):
            if not isinstance(item, dict) or "q" not in item or "a" not in item:
                raise PolicyViolation(f"faq[{i}] must have 'q' and 'a' fields")

    _check_size(file_path, new_content)


def _check_size(file_path, new_content):
    original_size = os.path.getsize(file_path)
    if len(new_content) > original_size * 3:
        raise PolicyViolation(f"Size increase too large: {len(new_content)} > {original_size * 3}")


# --- Module 4: Direct-to-Main Deploy (MVP) ---
# MVP 策略：直接 commit 到 main → 等 CF Pages production rebuild → eval
# 如果分數下降 → git revert + push。比 preview branch 簡單可靠。

def apply_change(iteration_id, file_path, new_content):
    """寫入修改，commit + push 到 main"""
    os.makedirs(os.path.dirname(file_path) or ".", exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    run_cmd(["git", "add", file_path])
    run_cmd(["git", "commit", "-m", f"ai-ready-opt: {iteration_id}"])
    run_cmd(["git", "push", "origin", "main"])

    # 回傳 commit hash 供 revert 用
    sha = run_cmd(["git", "rev-parse", "HEAD"]).strip()
    return sha


def wait_for_production(production_url, max_wait=180):
    """等 CF Pages production rebuild 完成（polling 關鍵頁面）"""
    critical_paths = ["/", "/llms.txt"]
    deadline = time.time() + max_wait
    # 先等 30 秒讓 build 啟動
    time.sleep(30)
    while time.time() < deadline:
        all_ok = True
        for path in critical_paths:
            try:
                resp = requests.get(f"{production_url}{path}", timeout=15)
                if resp.status_code != 200:
                    all_ok = False
                    break
            except Exception:
                all_ok = False
                break
        if all_ok:
            return True
        time.sleep(15)
    # production 通常已經在跑，即使 polling 超時也繼續 eval
    print("  Warning: production readiness polling timed out, proceeding with eval")
    return True


def revert_change(commit_sha):
    """git revert 回退指定 commit 並 push"""
    run_cmd(["git", "revert", "--no-edit", commit_sha])
    run_cmd(["git", "push", "origin", "main"])


def run_cmd(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{result.stderr}")
    return result.stdout


# --- Module 5: Evaluator ---

def evaluate(target_url, auth_token):
    """呼叫 eval Worker 取得分數"""
    response = requests.post(
        EVAL_URL,
        headers={
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        },
        json={"target_url": target_url},
        timeout=120
    )
    response.raise_for_status()
    result = response.json()

    return {
        "total": result["score_total"],
        "sub_scores": {
            "llms_txt": result.get("score_llms_txt", 0),
            "json_ld": result.get("score_json_ld", 0),
            "mcp_a2a": result.get("score_mcp_a2a", 0),
            "ai_comprehension": result.get("score_ai_comprehension", 0),
        },
        "status": "success",
        "details": result.get("details", {})
    }


# --- Module 6: Decision Engine ---

def decide(baseline_score, preview_score, baseline_sub, preview_sub, config):
    """根據分數變化決定 keep 或 revert"""
    diff = preview_score - baseline_score

    # 總分必須提升至少 min_improvement
    if diff < config.get("min_improvement", 2):
        return {"action": "revert", "reason": f"Improvement {diff} < threshold {config.get('min_improvement', 2)}"}

    # 任何子分數下降超過 3 分 → reject
    for key in baseline_sub:
        sub_diff = preview_sub.get(key, 0) - baseline_sub.get(key, 0)
        if sub_diff < -3:
            return {"action": "revert", "reason": f"Sub-score {key} dropped by {abs(sub_diff)}"}

    # 子分數歸零 → reject
    for key, val in preview_sub.items():
        if val == 0 and baseline_sub.get(key, 0) > 0:
            return {"action": "revert", "reason": f"Sub-score {key} dropped to zero"}

    return {"action": "keep", "reason": f"Score improved by {diff}: {baseline_score} -> {preview_score}"}


# --- Module 7: Experiment Logger ---

def log_experiment(entry, log_path="ai-ready-opt/experiments.json"):
    """追加一筆實驗紀錄"""
    if os.path.exists(log_path):
        with open(log_path, encoding="utf-8") as f:
            logs = json.load(f)
    else:
        logs = []

    logs.append(entry)

    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2, ensure_ascii=False)


# --- Module 8: Orchestrator ---

def main():
    parser = argparse.ArgumentParser(description="AI-Ready Continuous Optimization System")
    parser.add_argument("--max-iterations", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true", help="只產 mutation 不部署")
    args = parser.parse_args()

    auth_token = os.environ.get("EVAL_AUTH_TOKEN", "")
    if not auth_token and not args.dry_run:
        print("ERROR: EVAL_AUTH_TOKEN environment variable required")
        sys.exit(1)

    # 載入策略
    strategy = load_strategy()
    max_iter = min(args.max_iterations, strategy.get("max_iterations", 5))

    if args.dry_run:
        print("=== DRY RUN MODE ===")
        print("Will generate mutations but skip deploy + eval\n")

        # dry-run 用 baseline 數值
        baseline_score = strategy.get("current_baseline", 85)
        baseline_sub = {"llms_txt": 25, "json_ld": 12, "mcp_a2a": 25, "ai_comprehension": 23}
    else:
        # 取得當前 baseline
        print("Fetching baseline score...")
        baseline = evaluate(PRODUCTION_URL, auth_token)
        baseline_score = baseline["total"]
        baseline_sub = baseline["sub_scores"]

    print(f"Baseline: {baseline_score}/100 — {baseline_sub}")

    no_improvement_streak = 0
    consecutive_eval_failures = 0
    previous_changes = []

    for i in range(max_iter):
        iteration_id = f"{datetime.now().strftime('%Y%m%d%H%M')}-{i+1}"
        print(f"\n{'='*50}")
        print(f"Iteration {i+1}/{max_iter} — {iteration_id}")
        print(f"{'='*50}")

        entry = {
            "experiment_id": "ai-ready-opt-v1",
            "iteration_id": iteration_id,
            "timestamp": datetime.now().isoformat(),
            "strategy_version": "v1",
        }

        # 1. Mutation (1 retry)
        print("Generating mutation...")
        mutation = None
        for attempt in range(2):
            try:
                mutation = generate_mutation(strategy, baseline_score, baseline_sub, previous_changes)
                print(f"  File: {mutation['file']}")
                print(f"  Reason: {mutation['reason']}")
                break
            except Exception as e:
                if attempt == 0:
                    print(f"  Attempt 1 failed, retrying: {e}")
                else:
                    print(f"  FAILED: {e}")
                    entry["evaluation_status"] = "mutation_failed"
                    entry["failure_reason"] = str(e)
                    log_experiment(entry)

        if mutation is None:
            continue

        entry["change_summary"] = mutation["reason"]
        entry["files_modified"] = [mutation["file"]]
        entry["token_usage"] = mutation.get("token_usage")

        # 2. Guard (no retry)
        print("Checking file guard...")
        try:
            guard_check(mutation["file"], mutation["content"])
            print("  PASSED")
        except PolicyViolation as e:
            print(f"  BLOCKED: {e}")
            entry["evaluation_status"] = "policy_violation"
            entry["failure_reason"] = str(e)
            log_experiment(entry)
            continue

        if args.dry_run:
            print("  [dry-run] Skipping deploy + eval")
            entry["kept_or_reverted"] = "dry_run"
            log_experiment(entry)
            continue

        # 3. Apply change to main (commit + push)
        print("Applying change to main...")
        commit_sha = None
        try:
            commit_sha = apply_change(iteration_id, mutation["file"], mutation["content"])
            print(f"  Committed: {commit_sha[:8]}")
            entry["commit_sha"] = commit_sha
        except Exception as e:
            print(f"  FAILED: {e}")
            entry["evaluation_status"] = "commit_failed"
            entry["failure_reason"] = str(e)
            log_experiment(entry)
            continue

        # 4. Wait for CF Pages production rebuild
        print("Waiting for production rebuild...")
        wait_for_production(PRODUCTION_URL)

        # 5. Evaluate production (2 retries, 10s interval)
        print("Evaluating production...")
        new_score = None
        new_sub = None
        for attempt in range(3):
            try:
                result = evaluate(PRODUCTION_URL, auth_token)
                new_score = result["total"]
                new_sub = result["sub_scores"]
                consecutive_eval_failures = 0
                break
            except Exception as e:
                if attempt < 2:
                    print(f"  Eval attempt {attempt + 1} failed, retrying in 10s...")
                    time.sleep(10)
                else:
                    consecutive_eval_failures += 1
                    print(f"  FAILED after 3 attempts: {e}")
                    entry["evaluation_status"] = "eval_failed"
                    entry["failure_reason"] = str(e)
                    # eval 失敗 → 安全起見 revert
                    print("  Reverting due to eval failure...")
                    try:
                        revert_change(commit_sha)
                    except Exception:
                        print("  Warning: revert also failed")
                    log_experiment(entry)

        if new_score is None:
            if consecutive_eval_failures >= 3:
                print("3 consecutive eval failures, aborting run")
                break
            continue

        print(f"  Score: {baseline_score} -> {new_score} (diff: {new_score - baseline_score})")
        print(f"  Sub-scores: {new_sub}")
        entry["baseline_score"] = baseline_score
        entry["preview_score"] = new_score
        entry["score_diff"] = new_score - baseline_score
        entry["baseline_sub_scores"] = baseline_sub
        entry["preview_sub_scores"] = new_sub
        entry["evaluation_status"] = "success"

        # 6. Decide: keep or revert
        decision = decide(baseline_score, new_score, baseline_sub, new_sub, strategy)
        print(f"  Decision: {decision['action']} — {decision['reason']}")
        entry["kept_or_reverted"] = decision["action"]

        if decision["action"] == "keep":
            baseline_score = new_score
            baseline_sub = new_sub
            no_improvement_streak = 0
            previous_changes.append(mutation["reason"])
            print(f"  Kept. New baseline: {baseline_score}")
        else:
            print("  Reverting...")
            try:
                revert_change(commit_sha)
                print("  Reverted successfully")
            except Exception as e:
                print(f"  Warning: revert failed: {e}")
            no_improvement_streak += 1
            entry["failure_reason"] = decision["reason"]
            print(f"  Streak: {no_improvement_streak}")

        # 7. Log
        entry["model"] = strategy.get("model", "claude-sonnet-4-20250514")
        log_experiment(entry)

        # 8. Stop conditions
        if new_score >= strategy.get("target_score", 95):
            print(f"\nTarget reached: {new_score} >= {strategy['target_score']}")
            break

        if no_improvement_streak >= strategy.get("stop_after_no_improvement", 2):
            print(f"\nNo improvement for {no_improvement_streak} iterations, stopping")
            break

    # Summary
    print(f"\n{'='*50}")
    print(f"Optimization complete")
    print(f"Final score: {baseline_score}/100")
    print(f"Iterations: {i+1}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
