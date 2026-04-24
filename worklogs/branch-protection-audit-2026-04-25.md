# Branch Protection 稽核 · 2026-04-25

**Repo**：zarqarwi/paulkuo.tw
**分支**：main
**當前狀態**：有保護但不完整

## 現況詳情

```json
{
  "required_signatures": {"enabled": false},
  "enforce_admins": {"enabled": true},
  "required_linear_history": {"enabled": false},
  "allow_force_pushes": {"enabled": false},
  "allow_deletions": {"enabled": false},
  "required_pull_request_reviews": (未設定),
  "required_status_checks": (未設定)
}
```

| 規則 | 狀態 | 說明 |
|---|---|---|
| Force push 禁止 | ✅ 已啟用 | `allow_force_pushes: false` |
| 分支刪除禁止 | ✅ 已啟用 | `allow_deletions: false` |
| Admin 不可繞過 | ✅ 已啟用 | `enforce_admins: true` |
| PR 合併前必審 | ❌ 未設定 | 直接 push 到 main 仍然允許 |
| Linear history | ❌ 未設定 | 非線性 merge 仍被允許 |
| CI 狀態檢查 | ❌ 未設定 | 無 required_status_checks |

## 與憲法 v0.2 第一條「ADR immutable」的差距

憲法宣稱：ADR 一旦 Accepted 即 immutable，只能 Superseded 不能修改。

工程實質：
- ✅ Force push 已被禁止（不能改寫 history）
- ❌ 直接 push 仍允許：任何有 push 權限的操作者可以 `git push origin main` 覆蓋任何 ADR 檔案，無需 PR 審查
- 現狀是「半工程 immutable」——history 不可改寫，但檔案內容可直接覆蓋

核心差距：**缺少 PR 強制閘門**，ADR 仍可在無審查紀錄的情況下被覆蓋。

## 補救方案建議（三檔位）

### 最小版（建議優先）

- Require pull request before merging（直接 push 到 main 被拒）
- 成本：幾乎零，只是 Paul 改工作流從 `git push` 變成開 PR
- 注意：需確認現有 CI/CD pipeline 是否有直接 push 依賴

啟用指令（Paul 批准後 Code 可執行）：
```bash
gh api repos/zarqarwi/paulkuo.tw/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews='{"required_approving_review_count":0,"dismiss_stale_reviews":false}' \
  --field enforce_admins=true \
  --field restrictions=null \
  --field required_status_checks=null
```

### 中等版

- 加上「Require approvals: 1」
- 問題：Paul 是唯一 human reviewer，自己的 PR 沒人批——**此條不適用單人 repo**

### 重量版

- 加上 required status checks（CI 必須通過才能 merge）
- 前提：先確認 Cloudflare Pages CI 的 check name，對接 required_status_checks
- 成本：設定約 30 分鐘，之後遇到 CI flaky 時會卡住

## 建議

採用最小版即可。單人 repo 的 branch protection 核心價值是「**防手滑**」和「**讓 immutable 宣稱名實相符**」，不是防惡意竄改。

目前已有 force push 防護（✅），補上 PR 閘門（❌ → ✅）後，憲法 v0.2 §1 的 immutable 宣稱就從「半修辭」升格為「工程事實」。

## 下一步

**裁決（2026-04-25 Paul）：選 (b) 暫不啟用 PR 閘門。**

理由：Force push 禁止已滿足 immutable 的工程核心需求（history 不可改寫）；PR 閘門對單人 repo 屬過度工程，增加工作流摩擦而收益有限。2026-06-25 觀察期結束後，若有實際覆蓋 ADR 的事故案例，再重議啟用。

已記入 PENDING.md 觀察期：`- [-] Branch protection PR 閘門啟用（待 2026-06-25 用實例重議）`

GitHub UI 路徑（供日後參考）：<https://github.com/zarqarwi/paulkuo.tw/settings/branches>
