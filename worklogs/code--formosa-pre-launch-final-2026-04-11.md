# Code 交接：起駕前最後修正（P0 × 2）

> 來源：Cowork R1-R5 覆盤
> 時間：2026-04-11
> 優先級：🔴 起駕前必須完成（4/12 前）
> 建議模型：Sonnet + High effort

---

## 修正 1：backup-d1.yml 補齊兩張表

**問題：** `formosa_daily_reports` 和 `formosa_privacy_consent` 不在備份排程裡。活動期間這些資料如果遺失會有糾紛風險。

**檔案：** `.github/workflows/backup-d1.yml`

**做法：** 在現有的 `Export formosa_gps_points` step 之後，新增兩個 export step（格式完全比照現有 step）：

### Step A — Export formosa_daily_reports
```yaml
      - name: Export formosa_daily_reports
        id: export_daily_reports
        continue-on-error: true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          wrangler d1 export paulkuo-auth \
            --config worker/wrangler.toml \
            --remote \
            --table formosa_daily_reports \
            --output backup-formosa_daily_reports.sql
          echo "✅ formosa_daily_reports exported"
```

### Step B — Export formosa_privacy_consent
```yaml
      - name: Export formosa_privacy_consent
        id: export_privacy
        continue-on-error: true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          wrangler d1 export paulkuo-auth \
            --config worker/wrangler.toml \
            --remote \
            --table formosa_privacy_consent \
            --output backup-formosa_privacy_consent.sql
          echo "✅ formosa_privacy_consent exported"
```

### Summary 區塊也要更新

在 `Summary` step 裡，現有 3 張表的 outcome 判斷之後，加上：

```yaml
          if [ "${{ steps.export_daily_reports.outcome }}" = "success" ]; then
            echo "| formosa_daily_reports | ✅ OK |" >> $GITHUB_STEP_SUMMARY
          else
            echo "| formosa_daily_reports | ❌ FAIL |" >> $GITHUB_STEP_SUMMARY
            FAILURES=$((FAILURES + 1))
          fi

          if [ "${{ steps.export_privacy.outcome }}" = "success" ]; then
            echo "| formosa_privacy_consent | ✅ OK |" >> $GITHUB_STEP_SUMMARY
          else
            echo "| formosa_privacy_consent | ❌ FAIL |" >> $GITHUB_STEP_SUMMARY
            FAILURES=$((FAILURES + 1))
          fi
```

同時把 Summary 最後一行的 `**Failures: $FAILURES / 4**` 改成 `**Failures: $FAILURES / 6**`（3→5 張表 + 1 archive = 6 項）。

---

## 修正 2：API 文件碳排係數 0.47515 → 0.12013

**問題：** 程式碼已統一為 0.12013，但 API 文件仍寫舊值 0.47515。活動期間工程紀錄會被檢視，文件與程式碼不一致會造成公信力問題。

**涉及檔案（共 9 個）：**

### API 端點文件（4 語言）
- `src/pages/projects/formosa-esg-2026/docs/_content/api-endpoint-reference.md`
- `src/pages/projects/formosa-esg-2026/docs/_content/api-endpoint-reference.en.md`
- `src/pages/projects/formosa-esg-2026/docs/_content/api-endpoint-reference.zh-Hans.md`
- `src/pages/projects/formosa-esg-2026/docs/_content/api-endpoint-reference.ja.md`

### 資料模型文件
- `src/pages/projects/formosa-esg-2026/docs/_content/data-model-reference.md`

### Changelog（4 語言）
- `src/pages/projects/formosa-esg-2026/docs/_content/_changelog-content.html`
- `src/pages/projects/formosa-esg-2026/docs/_content/_changelog-content.en.html`
- `src/pages/projects/formosa-esg-2026/docs/_content/_changelog-content.zh-Hans.html`
- `src/pages/projects/formosa-esg-2026/docs/_content/_changelog-content.ja.html`

**做法：**

1. 全局搜尋替換 `0.47515` → `0.12013`
2. 同時確認相關文字描述：
   - 「Bus coefficient (default)」→「Unified coefficient (walking + transit weighted average)」
   - 「Public transit (primary default)」→「Unified coefficient」
   - 速度推斷門檻的描述如有提到 bus 作為 default，也一併更正
3. `data-model-reference.md` 裡的 `formosa.js:1909` 行號可能已因 R5 修改而偏移，改成近似行號或移除行號引用

**驗證：**
```bash
# 修改後確認不再有舊值
grep -r "0.47515" src/pages/projects/formosa-esg-2026/docs/
# 預期：0 matches

# 確認新值存在
grep -r "0.12013" src/pages/projects/formosa-esg-2026/docs/
# 預期：多筆 matches
```

---

## 完成後

1. `git add . && git commit && git push`（前端會自動部署）
2. 手動觸發一次 `backup-d1.yml` workflow（GitHub → Actions → D1 Backup → Run workflow）確認 5 張表都 ✅
3. 回報 Cowork 結果
