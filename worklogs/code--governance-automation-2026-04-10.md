# Handoff: Governance 資料自動化 + session-handoff v3.3

> 目標：讓治理 Dashboard 的資料自動流入，不需手動跑 seed
> 建議模型：**Sonnet**（YAML/Markdown 修改 + 小幅 shell script 調整）
> 日期：2026-04-10
> 包含三項任務，依序執行

---

## 背景

Governance Dashboard（`/governance/`）已上線，但資料鏈有兩個斷點：
1. KV seed 需要手動跑 `node scripts/governance-kv-seed.cjs`
2. Code session 結束時不會自動產出 metrics JSON

本次修改要把這兩個接點自動化，同時升級 session-handoff skill 加入 Integration Checklist。

完成後的資料流：
```
Code 做事 → push → GitHub Actions 部署 + 自動 KV seed → Dashboard 即時更新
Cowork 排程（每日 10:30）→ 收集 GitHub 活動 → commit metrics → 觸發 Actions → Dashboard 更新
```

---

## Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
grep "governance-kv-seed" .github/workflows/deploy.yml   # 應該沒有結果
grep "v3.3" .claude/skills/session-handoff/SKILL.md       # 應該沒有結果
cat scripts/governance-kv-seed.cjs | head -5              # 確認腳本存在
```

---

## Task 1：GitHub Actions 加入 KV Seed 步驟

檔案：`.github/workflows/deploy.yml`

在 `deploy-worker` job 的 Deploy Worker step **之後**，加一個新 step：

```yaml
      - name: Seed Governance KV
        if: success()
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: kv key put 'gov:seed-trigger' '{"seeded_at":"${{ github.event.head_commit.timestamp }}"}' --namespace-id c066a2fd7942494c8ead37cc518b191b --remote
          workingDirectory: worker
```

等等，上面只 seed 一個 key。我們需要跑完整的 seed 腳本。改成在 deploy-worker job 裡加：

```yaml
      - name: Seed Governance KV
        if: success()
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: node scripts/governance-kv-seed.cjs
```

注意：`governance-kv-seed.cjs` 裡面用 `wrangler kv key put`，所以需要 wrangler 在 PATH 上。
因為前一個 step 用了 `cloudflare/wrangler-action@v3`，wrangler 已安裝。
但 `wrangler-action` 不一定把 wrangler 留在 PATH。安全起見，用 npx：

把 `governance-kv-seed.cjs` 第 20 行的：
```javascript
const cmd = `wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}' --remote`;
```
改成：
```javascript
const cmd = `npx wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}' --remote`;
```

然後在 deploy.yml 的 `deploy-worker` job，Deploy Worker step 之後加：

```yaml
      - name: Seed Governance KV
        if: success()
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: cd .. && node scripts/governance-kv-seed.cjs
```

（因為 workingDirectory 是 `worker`，所以要 `cd ..` 回到 repo root）

**驗證**：push 後看 GitHub Actions log，確認 `Seed Governance KV` step 成功，輸出類似：
```
=== Governance KV Seeder ===
1. gov:projects
  ✓ gov:projects (1.2KB)
...
=== Seed Complete ===
```

---

## Task 2：在 Smoke Test 加入 Governance API 驗證

檔案：`.github/workflows/deploy.yml`

在 `smoke-test` job 最後加一個 step：

```yaml
      - name: Check Governance API
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.paulkuo.tw/api/governance/summary)
          if [ "$STATUS" = "500" ]; then echo "❌ Governance API error: $STATUS" && exit 1; fi
          echo "✅ Governance API OK ($STATUS)"
```

注意：沒有帶 Bearer token 所以會回 401，這是正常的（代表 API 活著且認證邏輯正確）。只檢查不是 500。

---

## Task 3：升級 session-handoff v3.3

檔案：`.claude/skills/session-handoff/SKILL.md`

### 3a. 版本號

第 13 行：
```
# 多 Session 協作狀態管理 SOP v3.2
```
→
```
# 多 Session 協作狀態管理 SOP v3.3
```

### 3b. Changelog

在 v3.2 changelog 之後加：
```markdown
>
> **v3.3 變更**：Handoff 文件必備區塊新增「Integration Checklist」（第 7 項）。
> 解決 Code 未對齊 codebase 現有 pattern 導致 API_BASE 錯誤、CORS 遺漏的問題（4/09 事故）。
```

### 3c. Handoff 文件必備區塊

找到第 252-258 行的六項清單，在第 6 項之後加：
```markdown
7. **Integration Checklist**（涉及跨系統整合時必填）：
   - **API base URL**：明確寫出要打的域名（本 repo 的 Worker API 是 `api.paulkuo.tw`，Pages 靜態站是 `paulkuo.tw`）
   - **認證模式**：Bearer / Cookie / X-Admin-Token？首次使用新模式時標注對 CORS `Allow-Headers` 的影響
   - **CORS 需求**：跨域回應是否需帶 `corsHeaders(request)`？建議用 `jsonResponse()` 以自動帶入，若用 `new Response()` 必須手動加
   - **現有 pattern 參考**：指出「參考 `src/components/XXX` 或 `worker/src/YYY.js` 的寫法」，降低偏離現有慣例的機率
```

---

## 注意事項

- Task 1 的 `cd ..` 是因為 deploy-worker 的 workingDirectory 是 `worker/`，seed 腳本在 repo root 跑
- `governance-kv-seed.cjs` 的 `wrangler` → `npx wrangler` 是為了相容 GitHub Actions 環境
- Task 3 是純文字修改，不影響程式碼
- 三個 task 可以在同一個 commit 裡，commit message：`chore: governance automation + session-handoff v3.3 [影響: 治理框架]`

---

## 驗證方式

```bash
# Task 1: 確認 deploy.yml 有 seed step
grep "governance-kv-seed" .github/workflows/deploy.yml

# Task 2: 確認 smoke test 有 governance check
grep "Governance API" .github/workflows/deploy.yml

# Task 3: 確認 skill 版本
grep "v3.3" .claude/skills/session-handoff/SKILL.md
grep "Integration Checklist" .claude/skills/session-handoff/SKILL.md
```

全部 push 後，GitHub Actions 應該能順利跑完（包含新的 KV seed step 和 governance smoke test）。

---

## 回報格式

```
✅ Governance 自動化 + session-handoff v3.3
- commit: {hash}
- deploy.yml: 新增 Seed Governance KV step + Governance API smoke test
- governance-kv-seed.cjs: wrangler → npx wrangler
- session-handoff: v3.2 → v3.3（Integration Checklist）
- Actions 狀態: {pass/fail}
```
