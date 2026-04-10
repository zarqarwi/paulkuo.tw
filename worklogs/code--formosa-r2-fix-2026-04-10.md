# Handoff: Formosa R2 盤查 — 2 項 🔴 修復

**From**: Cowork  
**To**: Code (建議 Sonnet + Standard effort — 兩個都是精準定位的值替換)  
**Date**: 2026-04-10  
**Priority**: 🔴 P0 — R1 修復的漏網之魚，必須補完  
**風險等級**: L1 — 純值替換，改動極小

---

## 背景

R2 盤查揪出 R1 FIX-2 和 FIX-3 各漏改了一個檔案：
- FIX-2 改了 MyPage 的等級門檻，但漏了 Dashboard
- FIX-3 改了 MyPage 和 LINE Bot 的碳排係數，但漏了 i18n 說明文字

兩個都是「同一個修復，多一個位置要改」的遺漏。

---

## R2-FIX-1: Dashboard 等級門檻更新

### 問題
`dashboard/_DashboardPage.astro` 第 287 行的 TITLES checkins 門檻仍是 `1/3/5/6/8/10/12/14/14`。
Tracker / MyPage / Worker 都已改為 `1/5/10/15/20/25/30/35/40`，Dashboard 被漏掉。

### 修復
```bash
# 定位
grep -n "1.*3.*5.*6.*8.*10.*12.*14" src/**/dashboard/_DashboardPage.astro
```
將門檻陣列改為 `1, 5, 10, 15, 20, 25, 30, 35, 40`，跟其他三處完全一致。

### 驗證
```bash
# 修完後確認舊門檻完全消失
grep -rn "1.*3.*5.*6.*8.*10.*12.*14" src/
# 預期：0 matches

# 確認四處門檻一致
grep -rn "5,10,15,20,25,30,35,40\|5, 10, 15, 20, 25, 30, 35, 40" src/ worker/
```

---

## R2-FIX-2: i18n 碳排說明文字更新

### 問題
`formosa-i18n.js` 第 54/89/124/159 行，四種語言（zh-Hant/en/ja/zh-Hans）的碳排說明文字都還是 `0.48 kg CO₂e/km`。
LINE Bot 回覆「碳足跡」時顯示的說明文字與實際計算（0.12013）差 4 倍。

### 修復
```bash
# 定位
grep -n "0\.48" worker/src/formosa-i18n.js
# 或
grep -n "0\.48" worker/src/*i18n*
```
四處 `0.48` 全部改為 `0.12013`。注意保持單位文字不變（`kg CO₂e/km`）。

### 額外發現
`buildCarbonInfoMessage()` 裡有正確的 0.12013 但是**死碼**（從未被呼叫）。這輪不動它，但記錄下來活動後清理。

### 驗證
```bash
# 修完後確認 0.48 完全消失
grep -rn "0\.48" worker/src/
# 預期：0 matches（或只剩與碳排無關的數字）

# 確認 0.12013 出現在正確位置
grep -rn "0\.12013" worker/src/
```

---

## 提交

一個 commit 搞定兩個改動：
```
fix: R2 補完 — Dashboard 等級門檻 + i18n 碳排說明文字 (pre-launch audit R2)
```

---

## 部署

修完後需要 Paul 執行：
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull && cd worker && wrangler deploy --config wrangler.toml
```

- R2-FIX-1（Dashboard）是前端，git push 自動部署
- R2-FIX-2（i18n）在 Worker 端，需手動 deploy
