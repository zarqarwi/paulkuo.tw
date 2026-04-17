# Skill Schema Lint — Baseline 2026-04-17

掃描指令：`SKILLS_DIR=.claude/skills bash scripts/skill-schema-lint.sh`
掃描路徑：`~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/**/SKILL.md`

## 統計
- 掃描檔案數：5
- PASS：2
- WARN：0
- FAIL：3

## FAIL 清單（致命錯誤）

| 檔案 | 問題 |
|------|------|
| `.claude/skills/session-handoff/SKILL.md` | 缺少 frontmatter（第一行應為 `---`） |
| `.claude/skills/wiki-ingest/SKILL.md` | 缺少 frontmatter（第一行應為 `---`） |
| `.claude/skills/wiki-lint/SKILL.md` | 缺少 frontmatter（第一行應為 `---`） |

## WARN 清單（建議修正）

（無 WARN）

## 觀察與建議

### 系統性問題

- **60% 的 skill 缺少 frontmatter**（3/5）。這三個 skill 都是較早期建立的，直接以 `#` 標題開頭，符合舊的「純 Markdown」寫法，但不符合 skill-creator 官方 schema。
- 有問題的三個 skill（`session-handoff`、`wiki-ingest`、`wiki-lint`）都是**治理與內務型 skill**，相對不常更新，因此長期未被注意到不合規。
- 兩個通過的 skill（`formosa-feedback-triage`、`cross-project-impact`）都有完整 frontmatter，且 description 長度在合理範圍（213 字元、305 字元，均 < 1024）。

### 建議

1. **立即補齊 frontmatter**：三個 FAIL 的 skill 都只缺 `name` + `description` 兩行 YAML frontmatter，修復工程量極低（約 5–10 分鐘），建議由 Cowork 在下一個 session 處理或由主線 A handoff 包含。
2. **排程定期 lint**：建議加入 `scheduled-tasks` 或 CI，每次 skill 有更動時自動跑 lint。短期替代方案：加進 Cowork session 開場 checklist，每週手動跑一次 `SKILLS_DIR=.claude/skills bash scripts/skill-schema-lint.sh`。
3. **pre-commit hook（v5.1 評估）**：目前不加，但 3/5 的高失敗率說明機械擋有其必要性。建議 v5.1 加入針對 `.claude/skills/**/SKILL.md` 的 pre-commit hook。
