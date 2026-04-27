# Code Handoff — derived_from acceptance 收尾 + 環境清潔（2026-04-27）

> 建立：2026-04-27 由 Cowork session 接手第三步 acceptance 最後一哩
> 來源：commit `709641e`（Cowork 用 GitHub MCP 直推）+ Issue #157 留言 4328465652
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（5-15 min；純 ops + 環境清潔，不動程式碼）

---

## 1. 上下文

第三步「Article schema 加 derived_from」由 Cowork session 完成程式碼產出（commit `709641e`），5 檔一筆 push：

| 檔案 | 動作 |
|------|------|
| `src/content.config.ts` | articleSchema 加 `derived_from: z.array(z.string()).optional()` |
| `docs/article-derived-from.md` | 新增 SSOT |
| `scripts/wiki-derived-from-validate.py` | 新增 validation CLI |
| `tests/test_wiki_derived_from_validate.py` | 新增 11 tests |
| `scripts/wiki-consistency-check.py` | EXPECTED_REFS +2 |

**已驗收**（Paul 在本機跑）：

- ✅ `pytest tests/ -v` → **163 passed**（136 → 163，含新 11 個）
- ✅ `python3 scripts/wiki-consistency-check.py` → **Verified 12 component references**

**未驗收**：

- ❌ `pnpm exec astro check` → `Command "astro" not found`
- ❌ `pnpm build` → `astro: command not found`

原因：`node_modules/.bin/astro` 缺 link。本 handoff 要把這條收尾。

---

## 2. 環境狀態盤點（Paul terminal 操作軌跡）

Paul 第三輪 terminal 操作期間出現的 side effect，下個 session 要先確認沒有殘留垃圾再動：

### 2.1 autostash `bee4109`

`git pull --rebase` 拉 `709641e` 時，Paul 本機 working tree 有 uncommitted changes，git 自動觸發 autostash `bee4109`，rebase 完成後 pop 回工作區。

**要驗證**：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
git stash list
```

期望：
- `git status` 顯示 Paul 預期的本機未提交變更（如果不確定預期狀態，問 Paul）
- `git stash list` 應該空（autostash 已 pop）

如果 stash list 還有殘留 entry → 需要 Paul 拍板要不要 keep / drop。

### 2.2 npm / pnpm / corepack 嘗試

Paul 跑過：
- `npm run build` → 失敗（這個 repo 用 pnpm，但 corepack warning 觸發過一次）
- `pnpm build` → astro not found
- `pnpm exec astro check` → astro not found

**Side effects**：

- corepack 提示「The local project doesn't define a 'packageManager' field. Corepack will now add one referencing pnpm@10.33.0+sha512.10568bb...」 — 這只是 warning prompt，**未真的寫入** `package.json`（因為 `pnpm` 跑沒成功）。確認 `package.json` 沒被改。
- `node_modules/.bin/astro` 缺 link — 原因不明（可能 Paul 之前手動 `rm -rf node_modules` partial 過，或 install 沒跑完整）

### 2.3 git remote / branch 狀態

確定**沒搞髒**：
- ✅ 沒有意外 commit / branch 推到 origin
- ✅ HEAD 是 `709641e`（從 GitHub API 確認）
- ✅ Cowork 沒在本任務內動別的 repo

---

## 3. 動作清單

### 動作 1：環境清潔檢查

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. working tree 乾淨度
git status                  # 確認狀態符合 Paul 預期；如果有意外修改，問 Paul
git stash list              # 應該空

# 2. package.json 沒被 corepack 寫入
grep -E '"packageManager"' package.json || echo "✅ packageManager not present (clean)"

# 3. 確認在 main、HEAD 是 709641e
git rev-parse HEAD
# 期望：709641e59282a0e847e6c852413ab61ad9e13b42

git branch --show-current
# 期望：main
```

如果 `git status` 顯示有 Paul 不認識的修改檔，**先停下來問 Paul**，不要自作主張 reset。

### 動作 2：重建 node_modules/.bin

```bash
pnpm install
```

如果 corepack prompt：

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

完成後驗證 `.bin/astro` 出現：

```bash
ls -la node_modules/.bin/astro
# 期望：symlink 指向 .pnpm/astro@5.18.1_*/node_modules/astro/astro.js
```

### 動作 3：跑 astro check（不需 full build）

```bash
pnpm exec astro check
```

期望：所有 collection（articles / articles_en / articles_ja / articles_zhcn / wiki_concepts / wiki_entities / wiki_sources / wiki_sources_pending）全 parse 成功，0 errors。

如果有 error，看是不是跟 `derived_from` 有關（不應該有，schema 是 optional）。

如果想跑 full build 確認 OG / sitemap：

```bash
pnpm build
```

期望：554 頁全綠。

### 動作 4：在 Issue #157 留言收尾

acceptance 全綠後，在 Issue #157 加一條收尾留言：

```markdown
## derived_from 第三步 acceptance 全綠（2026-04-27）

Cowork 寫程式（commit 709641e）+ Code 跑 acceptance，第三步閉環。

### 驗收結果

- ✅ pytest 163 passed（含新 11 個 derived_from tests）
- ✅ wiki-consistency-check Verified 12 component references
- ✅ pnpm exec astro check / pnpm build 全綠（X 頁，X errors, X warnings）

### 第三步全部 deliverable

- src/content.config.ts: articleSchema +1 行 derived_from optional
- docs/article-derived-from.md（SSOT）
- scripts/wiki-derived-from-validate.py
- tests/test_wiki_derived_from_validate.py（11 tests）
- scripts/wiki-consistency-check.py（EXPECTED_REFS +2）

### 下一步

Phase 4 由 Paul 拍板再起 handoff。
（按 feedback_handoff_flow_discipline，Cowork 不預先寫 Phase 4 handoff。）
```

### 動作 5（不要做）

- 不要動 `709641e` 的任何檔案
- 不要寫 Phase 4 handoff
- 不要動 schema / derived_from 邏輯
- 不要 commit `package.json`（即使 corepack 寫入 packageManager 欄位，也是另一個議題，請另開 handoff 處理）

---

## 4. 護欄

- **純 acceptance 收尾**：本任務只跑命令、確認狀態、留言。不寫程式。
- **不動 commit 709641e**：所有檔案不動
- **環境清潔優先**：先確認 git working tree、package.json 沒被 corepack 偷偷改，再跑 install
- **遇到意外狀態先停**：例如 `git status` 顯示 Paul 不認識的 modified 檔、`git stash list` 還有 autostash entry — 都要先回報問 Paul

---

## 5. Acceptance criteria

| 檢查項 | 期望 | 怎麼驗 |
|------|------|--------|
| working tree 乾淨 | `git status` 跟 Paul 預期一致 | 動作 1 |
| package.json 沒被 corepack 改 | 沒 `packageManager` 欄位 | 動作 1 |
| node_modules/.bin/astro 存在 | symlink 有效 | 動作 2 |
| `pnpm exec astro check` 全綠 | 0 errors | 動作 3 |
| Issue #157 收尾留言 | 已留言 | 動作 4 |

---

## 6. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `package.json` | **不應該** 被改（corepack 沒寫入成功） |
| `node_modules/` | 重建（`pnpm install`），會新增 .bin/astro |
| `src/content/articles/**/*.md` | 不動 |
| `src/content.config.ts` | 不動 |
| 任何 docs / scripts / tests | 不動 |

如果 `pnpm install` 改動 `pnpm-lock.yaml`，這是新議題（lockfile drift）— 另起 handoff 處理。

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|------|------|------|
| 動作 1 環境檢查 | Sonnet 4.6 | 2 min |
| 動作 2 pnpm install | Sonnet 4.6 | 3-5 min（取決於 cache） |
| 動作 3 astro check | Sonnet 4.6 | 2-3 min |
| 動作 4 Issue 留言 | Sonnet 4.6 | 1-2 min |

整體 **Sonnet 4.6 / Low effort（5-15 min）**。

---

## 8. 不做的事（明確排除）

- 不動 commit `709641e` 任何檔案
- 不動 schema / derived_from 邏輯
- 不寫 Phase 4 handoff
- 不修 corepack `packageManager` 欄位（另議題）
- 不重新 commit pnpm-lock.yaml（如果 lockfile drift 發現了，另開 handoff 給 Paul 拍板）

---

## 9. 依賴 / 來源

- 本任務來源：第三步程式碼產出 commit `709641e` + Cowork session 2026-04-27（GitHub MCP 直推）+ Paul 在本機跑驗收，astro check / build 卡在 .bin 缺 link
- 相關記憶：`feedback_handoff_local`（雙寫）、`feedback_handoff_push`（寫完 push）、`feedback_handoff_flow_discipline`（停手等回報）、`feedback_session_single_project`（單專案）、`feedback_no_parallel_code_sessions`（同 repo 不開並行 Code session）
- 相關 commit：
  - `709641e` feat(article-schema): add derived_from field for article→source provenance
  - `db77710` handoff(code): article schema 加 derived_from — 第三步（Paul）

---

*產出：Cowork session 2026-04-27 接 [WIKI] 第三步、寫程式、push commit `709641e`、跑驗收前兩條（pytest / consistency-check 全綠）、astro check 卡在 .bin link 缺失，將最後一哩交接給下一個 Code session*

*下一手：Code session 接此 handoff，5-15 min 完成 acceptance 收尾。Cowork 寫完此 handoff 停在這裡，按 `feedback_handoff_flow_discipline` 不預先寫 Phase 4 handoff，等 Code 回報 + Paul 拍板後再開*
