---
target: code
project: session-handoff skill v5.0 — 主線 B（事前預防基礎設施）
purpose: 產出 skill-schema-lint.sh POC，掃 `.claude/skills/**/SKILL.md` 的 frontmatter + 檔名 schema
date: 2026-04-17
author: Cowork（承接 Chat × Paul 的 revision 3 決策）
upstream: handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md
confidence: 高
estimated_effort: 1 天
execution_order: 路線 C'（序列）——本任務（主線 B）先跑，baseline 回來後 Cowork 依實際行數撰寫主線 A handoff
---

# Code Handoff：skill-schema-lint POC（v5.0 主線 B）

## 0. 任務來源

v5.0 規劃 revision 3 §10.2 明確：

> 獨立於主線 A，可平行執行。工程量估 1 天。掃 `.claude/skills/**/SKILL.md` 的 frontmatter + 檔名 schema，抓 typo、缺必填欄位、description 過長、name 不符 kebab-case 等。跑一次全站 lint 驗證效果。

這是「事前預防基礎設施」的第一步——把「事故後補規則」的迴圈轉成「事前機械擋」。v4.13 #15（SB 253 事故衍生）就是靠 Claude 記住 11 欄位 schema，這次要把它自動化。

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

所有產出路徑都以此為根。

## 2. 交付物

### 2.1 主腳本：`scripts/skill-schema-lint.sh`

Shell script（bash 或 zsh 皆可，但要 shebang 明確）。功能：

1. 遞迴掃 `.claude/skills/**/SKILL.md`
2. 對每個檔案檢查：
   - **frontmatter 存在**：檔頭必須有 `---` 包夾的 YAML block
   - **必填欄位**：`name`、`description`（依 skill-creator 官方 schema）
   - **name 格式**：kebab-case，只允許 `[a-z0-9-]`，不可大寫、底線、空格
   - **name 與資料夾名一致**：`foo/SKILL.md` 的 `name:` 必須是 `foo`（或 `plugin:foo` 的形式由你判斷）
   - **description 長度**：建議上限 1024 字元（skill-creator 實測上限），超過 warn
   - **description 非空**：至少 20 字元，否則 warn
3. 輸出三種等級：
   - `✅ PASS` — 無問題
   - `⚠️ WARN` — 非致命問題（description 過長、偏離建議）
   - `❌ FAIL` — 致命錯誤（缺 frontmatter、缺必填、name 不合法）
4. 最後印統計：`N files scanned, X pass, Y warn, Z fail`
5. Exit code：FAIL > 0 → exit 1；純 WARN → exit 0

### 2.2 Baseline 報告：`worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md`

跑一次全站 lint，把結果寫進這個檔。格式：

```markdown
# Skill Schema Lint — Baseline 2026-04-17

## 統計
- 掃描檔案數：N
- PASS：X
- WARN：Y
- FAIL：Z

## FAIL 清單（致命錯誤）
- `path/to/SKILL.md` — 缺 `name` 欄位
- ...

## WARN 清單（建議修正）
- `path/to/SKILL.md` — description 1180 字元超過 1024
- ...

## 觀察與建議
- （你的分析：是否有系統性問題？是否有 skill 集中在某個資料夾品質較差？）
- （是否建議加入 pre-commit hook？或排程定期 lint？）
```

### 2.3 commit message 規範

一個 commit 一件事：

```
feat(lint): skill-schema-lint.sh POC + baseline report

- scripts/skill-schema-lint.sh: bash lint for skill frontmatter + filename schema
- worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md: first full scan result
- checks: frontmatter exists / name+description required / name kebab-case / name matches dirname / description ≤1024 chars

Part of session-handoff v5.0 主線 B（事前預防基礎設施）.
Upstream: handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md §10.2
```

## 3. 技術細節

### 3.1 YAML 解析策略

bash 沒內建 YAML parser。建議：

**選項 A（推薦）**：用 `python3 -c "import yaml; ..."`——Mac 預設有 python3，但要確認 PyYAML：`pip3 install pyyaml --break-system-packages` 或用 `python3 -c "import yaml"` 預檢。

**選項 B**：純 bash/awk 手動解析 frontmatter（只抓 `name:` 和 `description:` 兩行），簡單但脆弱。

**選項 C**：用 `yq`（`brew install yq` 如果沒裝）。

Paul 的 Mac 狀態你先 `python3 -c "import yaml; print(yaml.__version__)"` 試一下，沒裝就 pip install。優先選項 A。

### 3.2 檔名 schema

- 資料夾名 = skill 名（不含 `SKILL.md`）
- 允許 plugin namespace：`plugin-xxx/skill-name/SKILL.md` 的 `name:` 可以是 `skill-name` 或 `plugin:skill-name`
- 不要太嚴——先抓明顯錯誤（大寫、底線）

### 3.3 掃描範圍

只掃 `/sessions/intelligent-peaceful-mccarthy/mnt/.claude/skills/**/SKILL.md`。

⚠️ 這個路徑在 Cowork sandbox 看得到，Mac 本機對應 `~/.claude/skills/`——Paul 在本機跑腳本時要確認能讀到。建議腳本支援 `SKILLS_DIR` 環境變數覆寫預設路徑：

```bash
SKILLS_DIR="${SKILLS_DIR:-$HOME/.claude/skills}"
```

這樣 Cowork 和 Mac 本機都能跑。

### 3.4 Smoke test（交付前必跑）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
bash scripts/skill-schema-lint.sh
echo "exit code: $?"
```

確認：
- 有輸出統計行
- exit code 正確反映 FAIL 數
- baseline 報告檔有產出且格式正確

## 4. 非目標（不要做）

- ❌ **不要**加 pre-commit hook——這次只做 POC，hook 放 v5.1 再評估
- ❌ **不要**自動修復——只偵測、不寫檔
- ❌ **不要**改任何 SKILL.md 的內容——即使掃到問題，也只報告，不動檔
- ❌ **不要**掃 `.remote-plugins` 或 `.local-plugins` 下的 plugin skills——只管 user skills（`.claude/skills`）

## 5. 完成檢查清單

- [ ] `scripts/skill-schema-lint.sh` 建立且可執行（`chmod +x`）
- [ ] 腳本支援 `SKILLS_DIR` 環境變數
- [ ] 跑過一次全站 lint 無腳本本身的 runtime error
- [ ] `worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md` 產出且三個段落齊全
- [ ] commit message 含影響範圍標注（此工具不影響子專案，標 `[影響: skill governance only]` 即可）
- [ ] push 到 origin/main
- [ ] 在 `worklogs/worklog-2026-04-17.md` 追加一行完成紀錄

## 6. Handoff 給下一關

POC 跑完後 baseline 報告回到 Cowork，Cowork 會評估：
- FAIL 數是否需要 Paul 立即處理
- 是否把這腳本排進 scheduled task（每週跑）
- 是否進 v5.1 加 pre-commit hook

不需要 Code 操心下一步，做完 POC + baseline 就結束。

## 7. 風險與阻礙預告

- **Python PyYAML 可能沒裝**——先檢查再走。裝不了就 fallback 純 bash 解析（選項 B）。
- **`.claude/skills/` 路徑權限**——Cowork sandbox 有沒有 read permission 要驗一下；Paul 本機 `~/.claude/skills/` 沒問題。
- **plugin skills 混在裡面**——`.claude/skills/` 下可能有 `example/` 子資料夾或使用者自建 skill，過濾規則要清楚。保險做法：只掃直接子資料夾下的 `SKILL.md`，不跨層。

---

**上游文件**：`handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md`
**後續任務**：主線 A（skill 升級 + 拆分）的 handoff 暫緩撰寫，等本任務 baseline 回來後，Cowork 依實際行數校正拆分策略再發。路線 C'（序列）而非平行。
**估時**：1 天
