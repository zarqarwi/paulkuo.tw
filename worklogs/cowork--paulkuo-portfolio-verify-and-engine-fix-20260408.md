# Handoff → Cowork：Portfolio 工具驗證 + 辯論引擎 JSON bug 修復

**來源**：Cowork session 2026-04-08
**目標**：下一個 Cowork session
**建議模型**：Sonnet（驗證 + 小修）/ Effort: Low-Medium

---

## 背景

本次 session 完成了 beyond-man-days 文章的局限段落補強，文章末尾連結到 AI Collaboration Portfolio 工具頁面（`https://paulkuo.tw/tools/ai-collab-portfolio/`）。Paul 需要確認這個工具頁面是否正常運作。另外，辯論引擎 v5.2 升級後跑了一場 adversarial 辯論，結構化摘要的 JSON 解析失敗，需要修 bug。

---

## Task 1：確認 AI Collaboration Portfolio 工具可用性

### 目標
驗證 https://paulkuo.tw/tools/ai-collab-portfolio/ 頁面正常載入、互動功能可用。

### Step 0 偵察
1. `curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/tools/ai-collab-portfolio/` → 確認 200
2. 用 Chrome MCP 開啟頁面，截圖確認 UI 渲染正常
3. 檢查頁面是否有 JavaScript 錯誤（Chrome console）

### 具體步驟
1. 確認頁面 HTTP 200 且內容非空白
2. 確認五個維度（Command / Delivery / Leverage / Quality / Influence）的表單或互動元素都能正常顯示
3. 如果有 GitHub 授權功能，確認 OAuth flow 的按鈕存在（不需要實際授權）
4. 確認行動呼籲（CTA）連結與文章內的 `→ 試試看工具` 連結一致
5. 如果有問題，記錄具體錯誤並回報 Paul

### 驗證方式
- 頁面截圖 + HTTP status 200
- 無 JS console error

---

## Task 2：修復辯論引擎結構化摘要 JSON 解析 bug

### 目標
修復 `debate_engine.py` 的 `save_dialogue()` 函式中 dead code 導致 JSON 摘要檔未存檔的問題，以及結構化摘要 JSON 解析失敗（`Unterminated string starting at: line 34 column 5`）。

### 檔案位置
`/Users/apple/Desktop/01_專案進行中/multi-agent-debate-engine/debate_engine.py`

### Step 0 偵察
1. 搜尋 `save_dialogue` 函式，找到 `return` 語句後的 dead code
2. 搜尋 `generate_structured_summary` 函式，檢查 JSON 解析邏輯
3. `grep -n "return str(filepath)" debate_engine.py` → 確認 dead code 位置

### 已知問題

**問題 1：Dead code in save_dialogue()**
```python
    filepath.write_text(content, encoding="utf-8")
    print(f"💾 已存檔：{filepath}")
    return str(filepath)          # ← 函式在這裡就 return 了

    # 以下永遠不會執行
    if structured_summary:
        save_summary_json(structured_summary, filepath)
```
修法：把 `save_summary_json` 移到 `return` 之前。

**問題 2：JSON 解析 Unterminated string**
`generate_structured_summary()` 讓模型回傳 JSON，但 GPT-5.4/Gemini 的回覆可能包含未轉義的換行或引號。需要加強 JSON 清洗邏輯（例如嘗試 `json.loads` 失敗後用 regex 修復常見問題）。

### 具體步驟
1. 把 `save_summary_json()` 呼叫移到 `return` 之前（save_dialogue 和 save_debate 都要檢查）
2. 在 `generate_structured_summary()` 的 JSON 解析加入 fallback：
   - 移除可能的 trailing comma
   - 替換未轉義的換行符
   - 如果仍然失敗，截短 raw output 存入 parse_error 欄位（目前已有，只是觸發條件可以更精準）
3. 跑一次 `python3 debate_engine.py "測試主題" --mode dialogue --depth quick` 驗證修復

### 驗證方式
- 辯論跑完後終端機顯示 `✅ 結構化摘要生成完成`
- `~/Desktop/02_參考資料/debates/` 下出現對應的 `_summary.json` 檔案
- JSON 檔案可被 `python3 -m json.tool` 正常解析

### 注意事項
- 修改在 Paul 本機的 `~/Desktop/01_專案進行中/multi-agent-debate-engine/debate_engine.py`，不是 paulkuo.tw repo
- 跑辯論會消耗 API 費用（上次 adversarial deep 約 NT$6.4），用 `--depth quick` 測試即可
- Perplexity Sonar Pro 價格已漲（$3/$15），測試時可加 `--no-fact-check` 省錢

---

## Task 3（中優先）：同步其他語言版本

### 目標
beyond-man-days 的局限段落已更新中文版，en/ja/zh-cn 三個版本尚未同步。

### 檔案
- `/src/content/articles/en/beyond-man-days.md`
- `/src/content/articles/ja/beyond-man-days.md`
- `/src/content/articles/zh-cn/beyond-man-days.md`

### 注意
- 翻譯規則見 paulkuo-writing skill
- 新增的三個段落（B2B報價、標準化難度、隱私邊界）需要翻譯
- 翻完後一次 commit + push

---

## 回報格式

完成後更新 worklog：
```
- {HH:MM} Portfolio 工具頁面驗證 {通過/有問題} Cowork
- {HH:MM} 辯論引擎 JSON bug 修復 ({驗證結果}) Cowork
- {HH:MM} beyond-man-days 多語言同步 ({commit hash}) Cowork
```
