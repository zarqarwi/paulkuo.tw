# Handoff: v5.3 護欄落地 commit + 使用者級 skill 同步

**From**: Cowork (Opus 4.7, 2026-04-19 Retro 審核視窗)
**To**: Code
**建議模型**: Sonnet 4.6（例行執行，指令確定，無複雜推理）
**影響範圍**: session-handoff skill（所有 session 共用）+ 使用者級 `~/.claude/skills/`
**本路線已考慮接手方 MCP 能力**: ✅ Code 有 bash + filesystem write + git push 權限，Cowork 沙盒兩者皆無，本任務必須由 Code 執行

---

## 1. 背景

2026-04-19「空中樓閣第 3 次」事件 retro 完成，C4 邊界歧義由 Paul 裁決固化（來源=系統層、方式=同系統查詢策略），Cowork 已完成七個檔案編輯，但：

1. **工作樹尚未 commit + push**：四個修改 + 三個新檔，全部卡在本地 working tree。
2. **使用者級 skill 尚未同步**：`.claude/skills/session-handoff/` 已是 v5.3，但 `~/.claude/skills/session-handoff/` 仍 stale（推測為 v4.13），這就是「空中樓閣第 3 次」的結構根因。

這兩步是「把這一輪處理乾淨」的關鍵收尾。Paul 明示由 Code 整合執行，避免手動搬運指令出錯。

---

## 2. 目標

1. v5.3 護欄落地：SKILL.md v5.3 + CHANGELOG.md + retro report + worklog + PENDING.md + issue-155-body.md 一次 commit + push。
2. 使用者級 `~/.claude/skills/session-handoff/` 同步到 v5.3，確保下一個 Cowork/Code session 開場時讀到的 skill 就是最新版。
3. Worklog 補上執行三維度紀錄，PENDING.md 🔴 使用者級 skill 同步標 `[x]`。

---

## 3. Step 0 — 偵察（執行前必跑）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status --short
git log --oneline -3
ls ~/.claude/skills/session-handoff/ 2>&1 | head -5
grep -c "C4 邊界" ~/.claude/skills/session-handoff/SKILL.md 2>/dev/null || echo "user-level SKILL.md not found or no C4 邊界"
```

**預期**：
- `git status` 顯示 4 modified + 3 untracked worklog/retro files（下面 Step 1 列表）
- `git log` HEAD 應該是 `b9b9eb6 docs(handoffs): v5.1 guardrail retro follow-up handoff`
- `~/.claude/skills/session-handoff/` 存在但 grep `C4 邊界` 應回 0（表示 stale）

若偵察結果與預期不符（例如 HEAD 已不是 b9b9eb6，表示有人先 commit 了；或使用者級 SKILL.md 已含 C4 邊界，表示已同步），**停下來向 Paul 確認**，不要盲目執行。

---

## 4. Step 1 — Commit v5.3 護欄落地（7 個檔案）

### 4.1 加入暫存區

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

git add .claude/skills/session-handoff/SKILL.md \
        .claude/skills/session-handoff/CHANGELOG.md \
        worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md \
        worklogs/code--v5-1-guardrail-retro-alignment-2026-04-19.md \
        worklogs/PENDING.md \
        worklogs/issue-155-body.md \
        worklogs/worklog-2026-04-19.md
```

### 4.2 Commit

```bash
git commit -m "chore(skills): v5.3 固化 C4 邊界（來源 vs 方式）[影響: session-handoff skill + worklog + PENDING + Issue #155]" \
  -m "2026-04-19「空中樓閣第 3 次」retro 閉環：" \
  -m "- SKILL.md 新增 C4 邊界子節（L82-L92）：來源=系統層、方式=同系統查詢策略、🔴=單一來源單一方式" \
  -m "- CHANGELOG.md 新增 v5.3 條目" \
  -m "- retro report 追加 Cowork 審核結論段（獨立跨源驗證 4 個 🟡、2 個新發現）" \
  -m "- PENDING.md 新增 🔴 使用者級 skill 同步待辦" \
  -m "- issue-155-body.md + worklog-2026-04-19.md 三維度完整收斂" \
  -m "Paul 裁決固化歧義 1（C4 邊界），未升 E1 主題（N=3 樣本不足）。"
```

### 4.3 Push

```bash
git push origin main
```

---

## 5. Step 2 — 使用者級 skill 同步

### 5.1 執行 cp

```bash
cp -r ~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/ \
      ~/.claude/skills/session-handoff/
```

⚠️ 注意尾斜線——有斜線 cp 才會把內容覆蓋進目標目錄而不是嵌套新目錄。若不確定，先 `ls ~/.claude/skills/` 確認結構。

### 5.2 驗證

```bash
# 版本標記應該是 v5.3
grep -c "C4 邊界" ~/.claude/skills/session-handoff/SKILL.md
# 預期：1

# CHANGELOG 最頂端應為 v5.3
head -10 ~/.claude/skills/session-handoff/CHANGELOG.md

# diff 應為空（完全一致）
diff -r ~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/ \
        ~/.claude/skills/session-handoff/
```

**通過條件**：
- `grep -c "C4 邊界"` 回 1
- `head CHANGELOG` 出現 v5.3 條目
- `diff -r` 無輸出（完全同步）

---

## 6. 驗證階段（Step 1+2 做完後）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git log --oneline -3                              # 新 commit 應在最上
git status --short                                # 7 個檔案應不再出現在 modified/untracked
grep -c "C4 邊界" .claude/skills/session-handoff/SKILL.md          # 專案級 = 1
grep -c "C4 邊界" ~/.claude/skills/session-handoff/SKILL.md        # 使用者級 = 1
```

全部 pass → 進 Step 7 交付。任一 fail → 回報錯誤訊息，**不要自行重跑**。

---

## 7. 修改邊界（Code 禁區）

- **禁止改 SKILL.md / CHANGELOG.md / retro report 內容**：Cowork 已審核完成，Code 只 commit 不改寫。
- **禁止動別的 untracked 檔**：`git status` 還有一堆 wiki clips、untracked 舊 handoffs、重複檔（" 2.md"、" 3.md"），**不是這次要處理的**，跳過。只 add 本 handoff §4.1 列出的 7 個檔案。
- **禁止 force push / amend**：若 push 失敗（例如遠端有新 commit），先 `git pull --rebase`，再 push；不要 `--force`。

---

## 8. 交付格式（必填）

### 8.1 Worklog 三維度（追加到 `worklogs/worklog-2026-04-19.md` 底部）

```markdown
- {HH:MM} v5.3 護欄 commit + push + 使用者級 skill 同步完成（commit hash）Code

## 狀態變更（追加）
- v5.3 護欄 commit：工作樹 → ✅ pushed to origin/main
- 使用者級 skill 同步：stale v4.13 → ✅ v5.3（與專案級一致）
- PENDING.md 🔴 使用者級 skill 同步：待辦 → [x] 完成

## 決策紀錄（追加）
- 一次 commit 7 檔而非分批：因全部檔案都屬同一 retro 閉環，分批會破壞 changelog 可讀性。

## 阻礙與踩坑（追加，若無則寫「無阻礙」）
- {若偵察階段發現 HEAD 不是 b9b9eb6 怎麼處理 / 若 push 衝突怎麼解決 / 若 diff -r 有輸出表示 cp 沒完全同步怎麼處理}
```

### 8.2 PENDING.md 更新

把 L109-L114 的 🔴 項目標 `[x]` 完成，並在項目下加一行：
```
  - ✅ 2026-04-19 Code 執行完成（commit {hash}），專案級與使用者級一致（diff -r 無輸出）
```

### 8.3 Worklog + PENDING 一起 commit

```bash
git add worklogs/worklog-2026-04-19.md worklogs/PENDING.md
git commit -m "chore(worklog): v5.3 commit + 使用者級 skill 同步三維度回報 [影響: worklog only]"
git push
```

### 8.4 回報 Paul

用 `## Summary` 段落回覆 Paul，包含：
- Step 1 commit hash（主 commit）
- Step 2 cp 驗證結果（grep 回 1 / diff 無輸出）
- 最終 worklog commit hash
- 若遇到任何偏離預期的情況，列在 「阻礙與踩坑」 段落

---

## 9. 必讀檔案

1. `CLAUDE.md` §工程慣例（Git、部署、Rollback）+ §跨 Session 協作
2. `worklogs/PENDING.md` —— 找到 🔴 使用者級 skill 同步項目（約 L109-L114）
3. 本 handoff

---

## 10. 預估成本與時長

- Sonnet 4.6 執行：< 5 min，< $0.1 USD
- 無網路操作（除 git push），無 rate limit 風險
- Paul 無需介入——全自動化，回報結果即可

---

**啟動口令（Paul 開 Code 後貼這行即可）**：

> 讀 `handoffs/cowork--v5-3-commit-and-user-level-sync-2026-04-19.md` 執行。
