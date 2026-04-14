# Code Handoff — Wiki Ingest Batch 2026-04-10
> 建立：Cowork session
> 建議模型：Sonnet（單純 commit + 腳本執行，無複雜決策）
> Effort：低（15 分鐘內）

## 背景

Cowork 今日完成 4 篇 wiki source 批次 ingest，已直接寫入本機：
`paulkuo.tw/src/content/wiki/sources/`

需要 Code 執行：
1. git commit 這 4 個新檔案
2. 跑 `wiki-kv-seed.cjs` 更新 Cloudflare KV
3. 確認 KV seed 成功

## 新增的 4 個檔案

```
src/content/wiki/sources/getnote-040232-ai-incarnation-logos.md
src/content/wiki/sources/getnote-939944-gpu-compute-trend-2028.md
src/content/wiki/sources/getnote-483752-alphaevolve-deepmind.md
src/content/wiki/sources/getnote-171560-saito-kohei-anthropocene-capital.md
```

## Step 0 偵察（先確認檔案存在）

```bash
ls src/content/wiki/sources/getnote-040232-ai-incarnation-logos.md
ls src/content/wiki/sources/getnote-939944-gpu-compute-trend-2028.md
ls src/content/wiki/sources/getnote-483752-alphaevolve-deepmind.md
ls src/content/wiki/sources/getnote-171560-saito-kohei-anthropocene-capital.md
```

## Step 1 — git commit

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

git add src/content/wiki/sources/getnote-040232-ai-incarnation-logos.md
git add src/content/wiki/sources/getnote-939944-gpu-compute-trend-2028.md
git add src/content/wiki/sources/getnote-483752-alphaevolve-deepmind.md
git add src/content/wiki/sources/getnote-171560-saito-kohei-anthropocene-capital.md

git commit -m "feat(wiki): ingest 4 public sources (AI embodiment, GPU trend, AlphaEvolve, degrowth)

- getnote-040232: AI道成肉身/Logos具身化類比
- getnote-939944: GPU算力演進A100→Rubin Ultra 2020-2028
- getnote-483752: AlphaEvolve DeepMind演算法自我演化
- getnote-171560: 齋藤幸平人類世資本論去增長UBI

Corpus: 219 → 223 (sources: 201 → 205)"

git push origin main
```

## Step 2 — KV seed 更新

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
node scripts/wiki-kv-seed.cjs
```

⚠️ 注意：如果 kv-seed 有 `--remote` 相關錯誤，參考 be42206 的修復方式。

## Step 3 — 驗證

```bash
# 確認 wiki search API 能找到新 source
curl "https://api.paulkuo.tw/api/wiki/search?q=AlphaEvolve" | jq '.results | length'
# 預期：> 0

curl "https://api.paulkuo.tw/api/wiki/search?q=GPU+算力" | jq '.results | length'
# 預期：> 0
```

## 回報格式

完成後在 Issue #157 回報（或直接告知 Cowork）：
- KV seed 結果（成功/失敗）
- git commit hash
- API 驗證結果

## 注意事項

- 這 4 篇都是 public visibility，不需要去識別化
- KV seed 腳本路徑：`scripts/wiki-kv-seed.cjs`（非 `wiki-kv-seed.js`）
- Concept 頁面本輪**不新增**（候選 ai-embodiment、recursive-self-improvement、degrowth-commons 留待下輪 concept 擴充再建）
