# Handoff: Issue #113 — 志工/管理者說明書頁面

**From**: Cowork → **To**: Code
**Date**: 2026-04-06
**Issue**: https://github.com/zarqarwi/paulkuo.tw/issues/113
**Deadline**: 4/11 前（4/12 起駕 freeze）
**Risk**: L1（新頁面 + i18n 內容更新，不影響現有功能）

---

## 背景

Cowork 完成了志工使用說明書 v0.1 和管理者使用說明書 v0.8 更新。
需要 Code 建立 `/guide/volunteer/` 新頁面，並更新 `/guide/admin/` 的 i18n 內容。

---

## Step 0 偵察（先查再改）

```bash
# 1. 確認 admin guide 已存在
ls -la src/pages/projects/formosa-esg-2026/guide/admin/
# 預期：_AdminGuidePage.astro + index.astro

# 2. 確認 volunteer 目錄不存在
ls src/pages/projects/formosa-esg-2026/guide/volunteer/ 2>&1
# 預期：No such file or directory

# 3. 確認 AuthGate 元件
head -20 src/pages/projects/formosa-esg-2026/_components/AuthGate.astro

# 4. 確認 i18n 翻譯檔
grep -c 'adminGuidePage' src/i18n/translations/zh-Hant.ts
# 預期：約 100+ keys

# 5. 確認來源檔
cat worklogs/志工使用說明書.md
cat worklogs/管理者使用說明書.md
```

---

## Task A — 新建 `/guide/volunteer/`（主要工作）

### 步驟

1. **建立 Astro 頁面**
   - 建 `src/pages/projects/formosa-esg-2026/guide/volunteer/_VolunteerGuidePage.astro`
   - 參考 `guide/admin/_AdminGuidePage.astro` 的結構
   - 套 `AuthGate` + `BaseLayout` + `guide-template.css`
   - 內容來源：`worklogs/志工使用說明書.md`

2. **建立 entry files**
   - `guide/volunteer/index.astro` → `<VolunteerGuidePage lang="zh-Hant" />`
   - `src/pages/en/projects/formosa-esg-2026/guide/volunteer/index.astro` → `lang="en"`
   - `src/pages/ja/projects/formosa-esg-2026/guide/volunteer/index.astro` → `lang="ja"`
   - `src/pages/zh-cn/projects/formosa-esg-2026/guide/volunteer/index.astro` → `lang="zh-cn"`

3. **建立 i18n keys**
   - 命名空間：`volunteerGuidePage.*`
   - 在四語系翻譯檔新增 keys（zh-Hant 為主，其他先用中文 placeholder）
   - AuthGate 的 title/subtitle 也要有翻譯 key

### AuthGate 密碼

- 密碼：`g-formosa`（與 Dashboard 共用）
- AuthGate 走 `POST api.paulkuo.tw/validate-code`，回傳 `{ valid: true, role: 'volunteer' }`
- **不需要改 Worker 驗證邏輯**，`g-formosa` 已在 VOLUNTEER_TOKEN 中

---

## Task B — 更新 `/guide/admin/` i18n 內容（次要工作）

管理者使用說明書從 v0.7 更新到 v0.8，以下 i18n keys 需要同步：

1. **三層密碼表**（sec8 或新增區塊）
   - Owner: `gf-admin` / Manager: `gf-manager` / Volunteer: `g-formosa`

2. **推播四模式**（新增區塊）
   - 文字 / 圖片 / 圖文 / URL 預覽

3. **碳排係數修正**
   - 0.47515 → 0.12013 kg CO₂e/person·km
   - key: `adminGuidePage.sec6*` 相關

4. **志工角色描述**
   - sec3 role table: volunteer 現在可以看 Dashboard（基本檢視）
   - 新增志工使用說明書連結

5. **頁面總覽**（sec5）
   - 新增 `/guide/volunteer/`、`/faq/`、`/docs/`、`/verification/`、`/feedback/`、`/privacy/`

6. **密碼安全提醒**
   - 從「兩組密碼」更新為「三組密碼」

來源檔案：`worklogs/管理者使用說明書.md`（commit 41a3a47）

---

## 驗證方式

```bash
# Build 確認
npm run build 2>&1 | tail -5
# 預期：無 error，頁數增加

# 頁面存在確認
ls dist/projects/formosa-esg-2026/guide/volunteer/index.html
ls dist/en/projects/formosa-esg-2026/guide/volunteer/index.html
ls dist/ja/projects/formosa-esg-2026/guide/volunteer/index.html
ls dist/zh-cn/projects/formosa-esg-2026/guide/volunteer/index.html
```

部署後 Cowork 會做瀏覽器驗收：
- https://mazu.today/projects/formosa-esg-2026/guide/volunteer/ 密碼 `g-formosa`
- https://mazu.today/projects/formosa-esg-2026/guide/admin/ 密碼 `gf-manager`

---

## 注意事項

- 志工說明書有一個 `<!-- TODO -->` 標記（Dashboard 功能細節），先保留
- `_GuidePage.astro`（香客版）沒有 AuthGate，admin/volunteer 版有
- AuthGate 有 locale auto-detect redirect，entry files 要確保路徑正確
- guide-template.css 已共用，不用另外建樣式

---

## 回報格式

完成後請寫 worklog 包含：
- commit hash
- build 頁數變化
- 新增/修改的檔案清單
