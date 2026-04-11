# Handoff: R5 掃描結果修復

> **來源**: Cowork session（2026-04-11）
> **目標**: Code session
> **模型建議**: Opus + High effort（多處小修，需要精確定位）
> **依據**: `worklogs/worklog-2026-04-11-r5.md`（R5 掃描報告）

---

## 背景

R5 全面性程式碼健康檢查完成，Cowork 研判後決定修復以下項目。
明天（4/12）起駕，P0 必須在這次修完，P1 盡量修完。

**重要：用 grep 定位行號，不要信 R5 報告裡的行號（可能已因前次 commit 位移）。**

---

## 🔴 P0（2 項，必修）

### P0-1: handleFormosaDailyReport GET 無 try/catch

**問題**: `handleFormosaDailyReport` 的 GET 路徑完全無 try/catch。`migrateFormosa()` 和 D1 SELECT 裸露，D1 異常 = Worker unhandled exception。Dashboard 每次載入都打這端點。

**定位**:
```bash
grep -n "handleFormosaDailyReport" worker/src/formosa.js
```

**修復**: 將 GET 路徑的 `migrateFormosa()` 呼叫和 D1 query 包進 try/catch，失敗時回傳 500 JSON：
```javascript
try {
  // 原有的 migrateFormosa() + D1 SELECT 邏輯
} catch (e) {
  console.error('handleFormosaDailyReport GET error:', e);
  return new Response(JSON.stringify({ error: 'Internal error' }), {
    status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
```

### P0-2: ja.ts i18n key 大小寫不一致

**問題**: `ja.ts` 定義 `sec8CollectGps`（小寫 ps），其他三語系和引用處都是 `sec8CollectGPS`（大寫 PS）。日文版 Admin Guide 顯示 raw key。

**定位**:
```bash
grep -rn "sec8Collect" src/i18n/translations/
```

**修復**: `ja.ts` 中 `sec8CollectGps` → `sec8CollectGPS`（只改 key 名稱，value 不動）

---

## 🟡 P1（6 項，盡量修完）

### P1-3: LINE Usage API env key 不一致

**問題**: LINE Usage handler 用 `env.LINE_CHANNEL_ACCESS_TOKEN`，全系統其他地方都用 `env.FORMOSA_LINE_TOKEN`。

**定位**:
```bash
grep -n "LINE_CHANNEL_ACCESS_TOKEN" worker/src/formosa.js
```

**修復**: 改為 `env.FORMOSA_LINE_TOKEN`

### P1-4: User Flow Guide 顯示舊碳排係數

**問題**: 4 語系的 `step65TransitDesc` 列出分項碳排數據（0.21/0.10/0.05/0.03），但系統統一用 0.12013。

**Paul 決定**: 拿掉分項數據，只留統一值。

**定位**:
```bash
grep -rn "step65TransitDesc" src/i18n/translations/
```

**修復**: 4 語系的 `step65TransitDesc` value 改為只說明統一碳排係數，不列分項：
- zh-Hant: 「系統以統一碳排係數 0.12013 kgCO₂/km 計算您的減碳足跡」
- en: "The system calculates your carbon footprint reduction using a unified emission factor of 0.12013 kgCO₂/km"
- ja: 「システムは統一排出係数 0.12013 kgCO₂/km で炭素削減量を計算します」
- zh-Hans: 「系统以统一碳排系数 0.12013 kgCO₂/km 计算您的减碳足迹」

### P1-5: 6 處空 catch 吞錯誤

**問題**: 6 處 `catch {}` 或 `catch (e) {}` 完全無 log，出問題時無法追蹤。

**定位**:
```bash
grep -n "catch.*{}" worker/src/formosa.js
# 或更精確：找空 catch block
```

R5 報告指出的位置（用 grep 重新定位）：
1. `getAuthRole` 的 invite code 驗證
2. `handleFormosaCheckin` 的 sedan DB 寫入
3. `handleFormosaFlushBuffer` 的 KV re-put
4. `getLineProfile` 的 LINE profile 取得
5. `handleFormosaDailyReport` GET（已被 P0-1 修復，跳過）

**修復**: 每個空 catch 加上 console.error，格式統一為：
```javascript
catch (e) {
  console.error('{函數名} {操作描述} error:', e.message || e);
}
```

例如：
- `console.error('getAuthRole invite code error:', e.message || e);`
- `console.error('handleFormosaCheckin sedan write error:', e.message || e);`
- `console.error('handleFormosaFlushBuffer KV re-put error:', e.message || e);`
- `console.error('getLineProfile error:', e.message || e);`

### P1-6: MyPage 等級名稱 hardcode 中文

**問題**: MyPage 的等級名稱是 hardcode 中文字串，非中文用戶（en/ja/zh-CN）看到中文。TrackerPage 已正確使用 `_i18n.levels['N']`。

**定位**:
```bash
grep -n "煉氣\|築基\|金丹\|元嬰\|化神\|合體\|大乘\|渡劫\|飛升" src/pages/projects/formosa-esg-2026/my/_MyPage.astro
```

**修復**: 參考 TrackerPage 的做法，改用 i18n 的等級名稱。確認 4 語系的 levels key 都存在：
```bash
grep -rn "levels" src/i18n/translations/ | head -20
```

### P1-7: 死函數清理（4 個，~68 行）

**問題**: 4 個函數零呼叫，hotfix 時增加閱讀噪音。

**定位與刪除**:
```bash
# 逐一確認確實無呼叫後再刪
grep -n "buildUsageMessage" worker/src/formosa.js
grep -n "buildCarbonInfoMessage" worker/src/formosa.js
grep -n "buildMenuMessage" worker/src/formosa.js
grep -n "haversineKm" worker/src/formosa.js
```

每個函數：先 grep 確認除了定義處之外無任何呼叫，確認後刪除整個函數。

⚠️ `haversineKm` 注意跟 `haversine`（有 4 處呼叫）區分，別刪錯。

### P1-8: online 事件 + ScheduledPush per-locale try/catch

**P1-8a: 前端加 online 事件監聽**

**問題**: 無 `addEventListener('online', ...)` 主動 flush。遶境時手機長時間前景開啟不會觸發 visibilitychange。

**定位**:
```bash
grep -n "visibilitychange\|flushCheckinQueue" src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro
```

**修復**: 在既有的 visibilitychange listener 附近加：
```javascript
window.addEventListener('online', () => {
  flushCheckinQueue();
});
```

**P1-8b: ScheduledPush per-locale try/catch**

**問題**: ScheduledPush 處理多個 locale 時，某一個 locale 推播失敗會中斷整個 push，後續 locale 不推送。

**定位**:
```bash
grep -n "ScheduledPush\|scheduledPush\|locale" worker/src/formosa.js | grep -i "push\|locale"
```

**修復**: 在 locale 迴圈內加 per-locale try/catch：
```javascript
for (const locale of locales) {
  try {
    // 原有的推播邏輯
  } catch (e) {
    console.error(`ScheduledPush ${locale} error:`, e.message || e);
    // 繼續處理下一個 locale
  }
}
```

---

## 完成後

1. **一次 commit** 包含所有修復，commit message: `fix: R5 audit fixes — P0 dailyReport try/catch + i18n key, P1 env key + carbon desc + empty catches + dead code + online event + push locale guard`
2. **git push**
3. 寫 worklog 到 `worklogs/worklog-2026-04-11-r5-fix.md`，列出每項修復的 commit 行號
4. **不要 deploy**。前端會 auto-deploy（git push → Pages），Worker 需要 Paul 手動 deploy

---

## 驗證指令（待 Paul deploy Worker 後）

```bash
# P0-1 dailyReport try/catch — 確認不再 crash
curl -s https://mazu.today/api/formosa/daily-report?line_user_id=test | jq .

# P1-3 LINE env key — 確認端點回應（需 admin token）
curl -s -H "X-Admin-Token: {token}" https://mazu.today/api/formosa/admin/line-usage | jq .
```

前端驗證（auto-deploy 生效後，最多等 CDN 1 小時）：
- P0-2: 日文版 Admin Guide → 確認 sec8 區塊有日文翻譯
- P1-4: User Flow Guide → 確認碳排說明只有統一值
- P1-6: MyPage（切英文）→ 確認等級名稱非中文

---

## 注意事項

1. 所有行號用 grep 重新定位，不要信 R5 報告的行號
2. P0 兩項最優先，修完確認能跑再動 P1
3. `haversine` vs `haversineKm` 別刪錯——前者有 4 處呼叫
4. i18n 修改要同步 4 個語系檔
5. 碳排 `step65TransitDesc` 的新措辭已由 Paul 確認，直接用上面的文字
