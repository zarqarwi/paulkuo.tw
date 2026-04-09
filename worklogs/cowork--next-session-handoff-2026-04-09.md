# Handoff → 下一個 Cowork session

> 日期：2026-04-09
> 來源：paulkuo.tw Cowork session（Opus 4.6）
> 主題：多 session 協作管理強化

---

## 本輪完成了什麼

這輪 Cowork 做了一個結構性的管理升級，解決了四個問題：

1. **Issue #155 同步迴路斷裂** → 建了 `sync-dashboard` GitHub Action，自動從 `worklogs/issue-155-body.md` PATCH Issue body。已驗證通過（Issue #155 updated_at 刷新為 07:59:06Z）。
2. **跨專案記憶隔離** → PENDING.md 新增「跨專案備忘」section，所有 Cowork 專案開場掃這個。
3. **模型成本管控** → session-handoff skill v4.4：handoff 必須標注「建議模型」+「預估量級 S/M/L」。
4. **驗證工作下放** → Code 回報必須包含驗證結果，不把低階驗證留給 Cowork（省 Opus token）。

## Commits（已 push 到 main，已驗證）

| commit | 內容 |
|--------|------|
| `e469e9c` | `.github/workflows/sync-dashboard.yml` |
| `e67e755` | `worklogs/issue-155-body.md` |
| `0c45d7e` | `worklogs/PENDING.md` 跨專案備忘格式 |
| `b643cc0` | `.claude/skills/session-handoff/SKILL.md` v4.4 |
| `0500cfa` | handoff 檔案 |

## 還沒 push 的改動（待下一輪 Code commit）

skill 檔案在本輪最後又加了兩筆修改（Code 回報原則 + 預估量級），但還沒 commit：
- `.claude/skills/session-handoff/SKILL.md` — 加了「Code 回報原則」section 和 handoff 回報格式的補充

這是 S 級任務，可以攢著跟其他小改動一起給 Code。

## 新的工作規則（跨所有 Cowork 專案）

1. **Cowork 一律 Opus 4.6**，不降級
2. **所有 handoff 必須標注**：`建議模型: Sonnet/Opus/Haiku` + `預估量級: S/M/L`
3. **Code 回報必須包含驗證結果**，不把驗證留給 Cowork
4. **更新 Issue #155**：改 `worklogs/issue-155-body.md` → push → 自動同步
5. **GitHub MCP bug**：`get_issue`/`update_issue` 有 issue_number 型別 bug，讀 Issue 用 `search_issues`

## auto-memory 已更新

- `feedback_token_efficiency.md` — 模型配置規則 + Code 回報原則
- `reference_status_sources.md` — 不需更新（PENDING.md 已在裡面）

## 下一個 session 不需要做的事

- 不需要驗證 sync-dashboard Action（本輪已驗證通過）
- 不需要手動更新 Issue #155 body（Action 已接管）
- 不需要重新讀 session-handoff skill 的舊版本（repo 裡已是 v4.4）
