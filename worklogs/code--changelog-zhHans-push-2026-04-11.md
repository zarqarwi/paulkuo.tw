# Handoff：完成 zh-Hans changelog push
**給：Code**
**日期：2026-04-11**
**專案：zarqarwi/paulkuo.tw**
**狀態：✅ 完成**（2026-04-12 00:06，commit d028a37）

---

## 背景

Cowork 今天更新了 4 個語言版本的 changelog，將志工用戶指南從「規劃中」改為 v1.0 已上線：

- `_changelog-content.html`（zh-Hant）→ 已透過 GitHub MCP 推上去（commit a0f65d4）
- `_changelog-content.en.html`（EN）→ 已透過 GitHub MCP 推上去（commit 58439ee）
- `_changelog-content.ja.html`（JA）→ 已透過 GitHub MCP 推上去（commit c6fbdb6）
- `_changelog-content.zh-Hans.html`（zh-Hans）→ **只寫入了本機，尚未推上 remote**

zh-Hans 的問題：
1. Cowork 用 filesystem MCP 把修改後的內容寫入本機 repo
2. Paul 執行了 `git commit`（commit 784a3f3）
3. `git pull --rebase` 時遇到 conflict（因為 remote 有 3 個新 commit 但本機沒有 pull）
4. Paul 執行了 `git checkout --theirs`（取本機版本）+ `git add` + `git rebase --continue`
5. `git rebase --continue` 打開了編輯器，**目前不確定 Paul 是否已關閉**

---

## Step 0：偵察目前狀態

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
git log --oneline -8
```

根據輸出判斷：

**Case A：rebase 已完成（git status 顯示正常，on branch main）**
→ 直接跳 Step 2 push

**Case B：rebase 仍在進行（git status 顯示 "rebase in progress"）**
→ 執行 Step 1

**Case C：detached HEAD 或其他異常**
→ 先執行 `git rebase --abort`，然後改用 Step 3 的 merge 方式

---

## Step 1：完成 rebase（Case B 才需要）

```bash
# 確認衝突已解決
git status
# 如果 zh-Hans 仍顯示 conflict，重新取本機版本：
git checkout --theirs src/pages/projects/formosa-esg-2026/docs/changelog/_changelog-content.zh-Hans.html
git add src/pages/projects/formosa-esg-2026/docs/changelog/_changelog-content.zh-Hans.html
# 繼續 rebase（commit message 直接用現有的，不用改）
GIT_EDITOR=true git rebase --continue
```

`GIT_EDITOR=true` 讓 git 不開編輯器，直接用現有 commit message。

---

## Step 2：Push

```bash
git push origin main
```

---

## Step 3：如果 rebase 太麻煩，改用這個（備案）

```bash
git rebase --abort
git pull origin main
# 確認本機 zh-Hans 是否還有修改
git diff HEAD src/pages/projects/formosa-esg-2026/docs/changelog/_changelog-content.zh-Hans.html
# 如果 diff 有顯示修改（代表本機有我們的改動）→ 直接 commit push
git add src/pages/projects/formosa-esg-2026/docs/changelog/_changelog-content.zh-Hans.html
git commit -m "docs: update changelog zh-Hans — volunteer guide v1.0 live"
git push origin main
# 如果 diff 沒有顯示修改 → 表示 pull 時已覆蓋，需要重新套用，見 Step 3b
```

### Step 3b：重新套用修改（如果 pull 覆蓋了本機改動）

修改內容只有 3 處：

**修改 1**：Section 9 交付文档表格，找到義工那行
```html
<!-- 舊 -->
<td>义工用户指南</td>
<td>—</td>
<td>义工操作指南</td>
<td><span class="status status-progress">规划中</span></td>

<!-- 新 -->
<td>义工用户指南</td>
<td>v1.0</td>
<td>义工操作指南</td>
<td><span class="status status-deployed">已上线</span></td>
```

**修改 2**：Day 20 rowspan
```html
<!-- 舊 -->
<td rowspan="5"><strong>04/11</strong><br><span style="font-size:0.75rem;color:var(--gray-400)">第 20 天</span></td>
<!-- 新 -->
<td rowspan="6"><strong>04/11</strong>...（同上）
```

**修改 3**：在最後一個 04/11 的 `</tr>` 後面加一行
```html
<tr>
  <td><span class="phase phase-4">阶段 4</span></td>
  <td>义工用户指南上线（v1.0）— 密码保护页面，管理团队专属访问</td>
  <td><span class="status status-deployed">已部署</span></td>
</tr>
```

---

## 驗證方式

push 成功後，等 Cloudflare Pages build（約 1-2 分鐘），確認：

```bash
curl -s "https://mazu.today/projects/formosa-esg-2026/docs/changelog/" | grep -c "已上线"
# 預期：至少 1（zh-Hans 的义工那行）
```

或直接瀏覽 https://mazu.today/projects/formosa-esg-2026/docs/changelog/?lang=zh-Hans 確認 Section 9 顯示「已上线」。

---

## 回報格式

完成後在 worklog 記：
```
- 04-12 {HH:MM} changelog zh-Hans push 完成，4 語言版本全部上線 ({commit hash}) Code
```

並更新本 handoff 檔案加一行：`**狀態：✅ 完成**`
