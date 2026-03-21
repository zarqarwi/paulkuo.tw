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

def generate_mutation(strategy, baseline_score, baseline_sub, previous_changes=None):
    """呼叫 Claude API 產生一個修改提案"""
    client = anthropic.Anthropic()

    # 讀取所有白名單檔案的當前內容
    file_contents = {}
    for f in strategy["allowed_files"]:
        if "**" in f:  # glob pattern (articles)
            for path in globmod.glob(f, recursive=True):
                file_contents[path] = open(path, encoding="utf-8").read()
        else:
            if os.path.exists(f):
                file_contents[f] = open(f, encoding="utf-8").read()

    prompt = f"""You are an AI-Ready SEO optimizer for paulkuo.tw.

## Rules
- You may ONLY modify these files: {list(file_contents.keys())}
- For article .md files, you may ONLY add or modify the `faq` frontmatter field. Do NOT change title, description, date, body, or any other field.
- faq format: a YAML list of {{q: "question", a: "answer"}} items
- Make ONE small, targeted modification per iteration
- Focus on the lowest-scoring dimension first

## Current State
- Total score: {baseline_score}/100
- Sub-scores: {json.dumps(baseline_sub)}
- Focus areas: {json.dumps(strategy.get('focus_areas', []))}
- Known gaps: {json.dumps(strategy.get('known_gaps', []))}

## Previous Changes (avoid repeating)
{json.dumps(previous_changes[-2:] if previous_changes else [])}

## Current File Contents
{chr(10).join(f"### {path}{chr(10)}```{chr(10)}{content[:3000]}{chr(10)}```" for path, content in file_contents.items())}

## Output Format
Respond with EXACTLY this JSON structure, nothing else:
{{
  "file": "<file path to modify>",
  "reason": "<why this change will improve the score>",
  "content": "<complete new file content>"
}}
"""

    response = client.messages.create(
        model=strategy.get("model", "claude-sonnet-4-20250514"),
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse JSON from response
    text = response.content[0].text
    # 去除可能的 markdown code fences
    text = re.sub(r'^```json\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text.strip())
    mutation = json.loads(text)

    return {
        "file": mutation["file"],
        "reason": mutation["reason"],
        "content": mutation["content"],
        "token_usage": {
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens
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
    if fnmatch.fnmatch(file_path, ALLOWED_ARTICLE_GLOB):
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


# --- Module 4: Preview Deployer ---

def verify_preview_readiness(preview_url):
    """確認 preview 站點關鍵頁面可存取"""
    critical_paths = [
        "/",              # 首頁
        "/llms.txt",      # llms.txt
        "/blog",          # 文章列表
    ]
    for path in critical_paths:
        url = f"{preview_url}{path}"
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code != 200:
                raise RuntimeError(f"Preview readiness failed: {url} returned {resp.status_code}")
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Preview readiness failed: {url} — {e}")


def deploy_preview(iteration_id, file_path, new_content):
    """推到 preview branch，等 Cloudflare Pages 部署"""
    branch = f"ai-ready-opt-{iteration_id}"

    # 建 branch
    run_cmd(["git", "checkout", "-b", branch, "main"])

    # 寫入修改
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    # commit + push
    run_cmd(["git", "add", file_path])
    run_cmd(["git", "commit", "-m", f"ai-ready-opt: {iteration_id}"])
    run_cmd(["git", "push", "origin", branch])

    # 等 CF Pages preview（polling，最多 5 分鐘）
    preview_url = f"https://{branch}.paulkuo-tw.pages.dev"
    deadline = time.time() + 300
    while time.time() < deadline:
        try:
            resp = requests.head(preview_url, timeout=10)
            if resp.status_code < 500:
                # 等待穩定
                time.sleep(30)
                # Readiness check
                verify_preview_readiness(preview_url)
                return preview_url
        except Exception:
            pass
        time.sleep(15)

    raise TimeoutError(f"Preview deploy timeout: {preview_url}")


def create_pr(iteration_id, mutation_reason, baseline_score, preview_score):
    """keep 後自動開 PR 而非直接 merge"""
    branch = f"ai-ready-opt-{iteration_id}"
    diff = preview_score - baseline_score
    title = f"ai-ready-opt: {iteration_id} (+{diff}pts)"
    body = f"""## AI-Ready Optimization — 自動提案

**修改理由**：{mutation_reason}
**分數變化**：{baseline_score} → {preview_score} (+{diff})

由 AI-Ready Optimization System 自動產生。
Review 後 merge 或 close。
"""
    run_cmd([
        "gh", "pr", "create",
        "--base", "main",
        "--head", branch,
        "--title", title,
        "--body", body,
    ])


def merge_branch(iteration_id):
    """保留修改：merge 到 main（V2 auto-merge 時再啟用）"""
    branch = f"ai-ready-opt-{iteration_id}"
    run_cmd(["git", "checkout", "main"])
    run_cmd(["git", "merge", branch, "--no-ff", "-m", f"ai-ready-opt: keep {iteration_id}"])
    run_cmd(["git", "push", "origin", "main"])
    run_cmd(["git", "branch", "-d", branch])
    run_cmd(["git", "push", "origin", "--delete", branch])


def cleanup_branch(iteration_id):
    """回退修改：刪除 branch"""
    branch = f"ai-ready-opt-{iteration_id}"
    run_cmd(["git", "checkout", "main"])
    try:
        run_cmd(["git", "branch", "-D", branch])
        run_cmd(["git", "push", "origin", "--delete", branch])
    except Exception:
        pass  # branch 可能不存在


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
        "total": result["total"],
        "sub_scores": {
            "llms_txt": result.get("llms_txt", 0),
            "json_ld": result.get("json_ld", 0),
            "mcp_a2a": result.get("mcp_a2a", 0),
            "ai_comprehension": result.get("ai_comprehension", 0),
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
    consecutive_deploy_failures = 0
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
            "branch": f"ai-ready-opt-{iteration_id}",
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

        # 3. Preview deploy (consecutive failure abort at 3)
        print("Deploying preview...")
        try:
            preview_url = deploy_preview(iteration_id, mutation["file"], mutation["content"])
            print(f"  Preview: {preview_url}")
            consecutive_deploy_failures = 0
            entry["preview_url"] = preview_url
            entry["deploy_status"] = "success"
        except Exception as e:
            consecutive_deploy_failures += 1
            print(f"  FAILED: {e}")
            entry["deploy_status"] = "failed"
            entry["failure_reason"] = str(e)
            cleanup_branch(iteration_id)
            log_experiment(entry)
            if consecutive_deploy_failures >= 3:
                print("3 consecutive deploy failures, aborting run")
                break
            continue

        # 4. Evaluate (2 retries, 10s interval; consecutive failure abort at 3)
        print("Evaluating preview...")
        preview_score = None
        preview_sub = None
        for attempt in range(3):
            try:
                result = evaluate(preview_url, auth_token)
                preview_score = result["total"]
                preview_sub = result["sub_scores"]
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
                    cleanup_branch(iteration_id)
                    log_experiment(entry)

        if preview_score is None:
            if consecutive_eval_failures >= 3:
                print("3 consecutive eval failures, aborting run")
                break
            continue

        print(f"  Score: {baseline_score} -> {preview_score} (diff: {preview_score - baseline_score})")
        print(f"  Sub-scores: {preview_sub}")
        entry["baseline_score"] = baseline_score
        entry["preview_score"] = preview_score
        entry["score_diff"] = preview_score - baseline_score
        entry["baseline_sub_scores"] = baseline_sub
        entry["preview_sub_scores"] = preview_sub
        entry["evaluation_status"] = "success"

        # 5. Decide
        decision = decide(baseline_score, preview_score, baseline_sub, preview_sub, strategy)
        print(f"  Decision: {decision['action']} — {decision['reason']}")
        entry["kept_or_reverted"] = decision["action"]

        if decision["action"] == "keep":
            create_pr(iteration_id, mutation["reason"], baseline_score, preview_score)
            baseline_score = preview_score
            baseline_sub = preview_sub
            no_improvement_streak = 0
            previous_changes.append(mutation["reason"])
            print(f"  PR created. New baseline: {baseline_score}")
        else:
            cleanup_branch(iteration_id)
            no_improvement_streak += 1
            entry["failure_reason"] = decision["reason"]
            print(f"  Reverted. Streak: {no_improvement_streak}")

        # 6. Log
        entry["model"] = strategy.get("model", "claude-sonnet-4-20250514")
        log_experiment(entry)

        # 7. Stop conditions
        if preview_score >= strategy.get("target_score", 95):
            print(f"\nTarget reached: {preview_score} >= {strategy['target_score']}")
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
