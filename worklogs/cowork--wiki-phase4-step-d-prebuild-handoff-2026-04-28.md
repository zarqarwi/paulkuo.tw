# Code Handoff — Phase 4 Step D：prebuild 整合 wiki-build-derived-index（2026-04-28）

> 建立：2026-04-28 由 Cowork session 寫，**等 Step C-prime 已完成（dd30e98，pnpm build 835 pages 0 errors）後落地**
> 來源：Phase 4 規劃文件 + Step C-prime handoff（Step D 範疇早已釐清）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（10-15 min；package.json scripts 改動 + 驗收）
> **前置條件**：本機 git pull origin main 後 HEAD 含 `dd30e98`（Step C-prime）

---

## 1. 上下文

Phase 4 雙向 UI（Step A/B/C-prime）已鋪好，但 `data/wiki-derived-index.json` 目前要**手動**跑 `python3 scripts/wiki-build-derived-index.py` 才會更新。Step D 把它接進 `pnpm build` / `pnpm dev` 的 lifecycle，自動化重生。

### 為什麼自動化重要

- Article frontmatter 改 `derived_from` 後，反向索引才需要更新
- 目前如果 author 改完 frontmatter 直接跑 `pnpm build`，「被引用」section 會是過時資料（甚至 build script 沒跑過時 dynamic import fallback 到 `{}`）
- Step F backfill 上線後，author 會頻繁編輯 derived_from，沒自動化會變地雷

---

## 2. 護欄

- **只動 `package.json`** scripts 段
- **不動**：dependencies / packageManager / 其他 scripts
- **不破現有 build / dev 流程**：既有 `pnpm build` / `pnpm dev` 必須不變行為（只是多跑一道 build script）
- **遇到意外狀態先停**：
  - prebuild 失敗導致 build 卡住（例如 build script 強制 strict 但 article 有 invalid slug）
  - pnpm-lock.yaml 出現變更（不該發生）

---

## 3. 動作清單

### 動作 1：環境前置

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
git fetch origin
git pull origin main
git status  # 應該乾淨
git log --oneline -5
# 期望：最近 dd30e98 Step C-prime 在 log
```

### 動作 2：改 `package.json` scripts

讀現有 `package.json`，在 `scripts` 段加三條新指令：

```json
{
  "scripts": {
    "dev": "astro dev",
    "predev": "python3 scripts/wiki-build-derived-index.py",
    "fetch-feed": "node scripts/fetch-feed.mjs",
    "build": "astro build",
    "prebuild": "python3 scripts/wiki-build-derived-index.py --strict",
    "wiki:build-derived-index": "python3 scripts/wiki-build-derived-index.py",
    "preview": "astro preview",
    "astro": "astro",
    "test:wiki-scanner": "python3 -m pytest tests/test_wiki_scanner.py -v",
    "check:wiki-visibility": "python3 scripts/wiki-consistency-check.py"
  }
}
```

**設計理由**：
- `predev`：dev 環境**非 strict**（避免 author 在改 frontmatter 過程中卡住，allow invalid slug + 印 warning）
- `prebuild`：build / CI 環境 **strict**（production build 一定要乾淨，invalid slug 直接 fail）
- `wiki:build-derived-index`：獨立 CLI entry，方便人工觸發重生（例如 author 改完 frontmatter 想立刻看效果不必 dev/build）
- pnpm 原生支援 npm-style `pre*` / `post*` lifecycle hook，不必額外設定

**注意**：`fetch-feed` 是既有 script，**不要動**（保留原排序），prebuild 放 `build` 上面為了視覺對齊。

### 動作 3：驗收

```bash
# 1. pnpm install（packageManager 沒變，應該不需重 install，但跑一下確認 lockfile 不動）
pnpm install
git diff pnpm-lock.yaml  # 應為空

# 2. wiki:build-derived-index 獨立 CLI 跑得過
pnpm wiki:build-derived-index
ls -la data/wiki-derived-index.json
# 期望：JSON 存在，stdout 印「=== Build derived_from reverse index ===」

# 3. predev hook（驗證 dev 啟動會自動跑）
# 把 JSON 刪掉測試 predev 會重生
rm data/wiki-derived-index.json
pnpm dev &
sleep 3
ls -la data/wiki-derived-index.json  # 期望：predev 自動跑，JSON 重生
# 把 dev 關掉
kill %1 || pkill -f "astro dev"

# 4. prebuild hook（驗證 build 會自動跑 strict）
rm data/wiki-derived-index.json
pnpm build
ls -la data/wiki-derived-index.json  # 期望：prebuild 自動跑，JSON 重生
# 期望 build 也跑完：835 pages 0 errors

# 5. 全 pytest 不破
python3 -m pytest tests/ -v
# 期望：171 pass

# 6. consistency-check
python3 scripts/wiki-consistency-check.py
# 期望：12 refs verified

# 7. 確認 .gitignore 仍有效
git status
# 期望：data/wiki-derived-index.json 不出現在 untracked
```

如有任一項 fail → 停下來回 Cowork。

### 動作 4：commit + push

```bash
git add package.json
git status  # 確認只有 package.json modified

git diff --staged

git commit -m "feat(wiki-prebuild): integrate derived_from index build into Astro lifecycle — Phase 4 Step D

新增 package.json scripts：
- predev: 跑 build script（非 strict，dev 環境寬鬆）
- prebuild: 跑 build script（--strict，production 嚴格）
- wiki:build-derived-index: 獨立 CLI entry，給人工觸發

效果：
- pnpm dev 啟動時自動重生 data/wiki-derived-index.json
- pnpm build 跑完整流程，prebuild 嚴格擋 invalid slug
- 不必再手動執行 python3 scripts/wiki-build-derived-index.py

不動 dependencies / packageManager / 其他 scripts。

Step E-G（i18n + validator + backfill + 收尾）留後續 handoff。

Refs: Issue #157 Phase 4 / docs/article-derived-from.md SSOT"

git push
```

### 動作 5：Issue #157 留 Step D 收尾

```markdown
## Phase 4 Step D — prebuild 整合 ✅

| Phase | Commit | 內容 |
|-------|--------|------|
| Code — feat | `<sha>` | package.json scripts: predev + prebuild + wiki:build-derived-index |

**Hook 設計**：
- `predev`：非 strict（dev 環境寬鬆）
- `prebuild`：--strict（production 嚴格擋 invalid slug）
- `wiki:build-derived-index`：獨立 CLI 給人工觸發

**驗收**：
- pnpm install / lockfile 不動
- pnpm dev 自動重生 JSON
- pnpm build 自動重生 JSON + 835 pages 0 errors
- pytest 171 pass / consistency 12 refs

**待跑**（Phase 4 收尾）：
- Step E: i18n 多語系字串 + derived_from 限 public source 的 schema validator
- Step F: Cowork 提議 backfill 清單 → Paul 裁決 → 寫進 frontmatter
- Step G: SSOT + Issue #157 收尾
```

### 動作 6：回 Cowork 報告

5 行內：
1. 環境確認 + Step C-prime commit OK
2. package.json scripts 改動內容
3. predev / prebuild hook 自動觸發驗證 OK
4. 全驗收 pass（lockfile / pytest / consistency / build pages 數）
5. commit sha + push + Issue #157 留言連結

---

## 4. Acceptance criteria

| 檢查項 | 期望 |
|--------|------|
| `package.json` scripts 加 predev + prebuild + wiki:build-derived-index | 3 條新 script |
| `pnpm dev` 啟動時自動跑 build script（predev hook） | JSON 自動重生 |
| `pnpm build` 跑完整流程（prebuild hook + astro build） | 835 pages 0 errors |
| 獨立 CLI `pnpm wiki:build-derived-index` 可跑 | exit 0 |
| pnpm-lock.yaml 不動 | `git diff pnpm-lock.yaml` 為空 |
| pytest | 171 pass（不變） |
| consistency-check | 12 refs verified（不變） |
| commit + push | 1 commit fast-forward |
| Issue #157 留言 | 已留 |

---

## 5. 跨專案影響

| 檔案 | 影響 |
|------|------|
| `package.json` | scripts 段加 3 條 — 影響任何跑 `pnpm dev` / `pnpm build` 的人（CI / 本機 / contributor） |
| CI workflow | **無變化**（CI 跑 `pnpm build` 自動連帶 prebuild） |
| `data/wiki-derived-index.json` | 不動內容（仍 gitignore + 自動重生） |
| 其他 scripts | **不動** |
| dependencies / packageManager | **不動** |

CI 影響：CI build 時間略增（多一道 Python script，~1-2 秒），可忽略。

---

## 6. 護欄重申

- 不寫 Step E-G handoff（按 `feedback_handoff_flow_discipline`）
- 不動 dependencies（不裝新套件）
- 不改 build script 本身（Step A 已就位）
- 不改 .gitignore（Step A 已加 `data/wiki-derived-index.json`）
- 不寫 i18n / validator（Step E）

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|--------|------|------|
| 動作 1 環境前置 | Sonnet 4.6 | 1 min |
| 動作 2 改 package.json | Sonnet 4.6 | 2 min |
| 動作 3 驗收 6 項 | Sonnet 4.6 | 6-8 min |
| 動作 4-6 commit + push + 留言 + 報告 | Sonnet 4.6 | 3 min |

整體 **Sonnet 4.6 / Low effort（10-15 min）**。

---

## 8. 不做的事

- 不接 KV seed lifecycle（Phase 5）
- 不做 i18n 完整翻譯（Step E）
- 不加 derived_from 限 public source 的 schema validator（Step E）
- 不寫 backfill 內容（Step F）
- 不寫下個 step handoff

---

## 9. 依賴 / 來源

- Phase 4 規劃文件：`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（workspace）
- Step A handoff：`worklogs/cowork--wiki-phase4-step-a-build-derived-index-handoff-2026-04-28.md`
- Step C-prime handoff：`worklogs/cowork--wiki-phase4-step-c-prime-source-route-handoff-2026-04-28.md`
- 相關 commits：
  - `fda5a7a` feat(wiki-derived-index): build script Step A
  - `6df22ab` feat(article-derived-ui): 衍生自 section Step B
  - `dd30e98` feat(wiki-source-route): source 獨立路由 + 被引用 section Step C-prime
- 相關記憶：
  - `feedback_handoff_flow_discipline`
  - `feedback_no_parallel_code_sessions`
  - `feedback_terminal_cd_explicit`
  - `feedback_model_recommendation`

---

*產出：Cowork session 2026-04-28，Step C-prime 完成後接 Phase 4 Step D 自動化整合*

*下一手：Code 接此 handoff，10-15 min 完成 Step D；完成後回 Cowork，Cowork 接 Step E-G handoff*
