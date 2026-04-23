# chat--paulkuo-tw-insert-comparison-table-2026-03-22.md

## 背景

文章 `ai-ready-continuous-optimization` 已上線（commit `92d82f2`）。Paul 要求在「把 autoresearch 的精神搬到網站上」段落加入一張 Karpathy autoresearch vs 我的系統 的比較表格。

**Table CSS 已加好**，在本機 repo 的 `public/styles/global.css` 裡（未 commit，跟表格一起推）。

**Repo 路徑**：`~/Desktop/paulkuo.tw`

---

## 任務

1. 四語言文章各插入對應語言的比較表格
2. 連同 `public/styles/global.css`（table CSS）一起 commit + push

---

## 插入位置（四語言都一樣的邏輯位置）

在這句之後：
> Karpathy 的 autoresearch 目前專注在小型語言模型的訓練實驗上，我這裡是把「自動實驗迴圈」這個概念搬到網站優化領域。

在這句之前：
> 我不是把 autoresearch 原封不動搬過來。

中間插入表格（含導言）。

---

## zh-TW 表格內容

```markdown

下面整理我這次實作與 Karpathy autoresearch 的範圍差異，兩者精神相近但領域不同，不是同一種系統：

| 面向 | Karpathy autoresearch | 我的 AI-Ready Continuous Optimization System |
| --- | --- | --- |
| 主要目標 | 自動化「模型訓練研究實驗」，在固定資源內找到更好的訓練設定與架構 | 自動化「網站與 AI 介面品質」的持續優化，讓網站更容易被各家 AI 正確理解與引用 |
| 領域與對象 | 小型語言模型訓練（例如 nanochat / nanoGPT 類任務） | 個人網站 paulkuo.tw 的結構、llms.txt、JSON-LD、agent 協議等 |
| 環境型態 | 封閉實驗室環境：單一 codebase、單一資料集、單 GPU，離線訓練實驗 | 接近 production：修改直接作用在網站 repo / production，並接受外部 AI 的實測 |
| 自動化單位 | 針對 train.py 的程式碼修改、超參數與訓練策略實驗 | 針對網站內容結構、metadata、llms.txt、FAQ 區塊、協議設定等進行修改 |
| Pipeline 結構 | 研究 loop：program.md → agent 改 train.py → 跑實驗 → 讀驗證指標 → 決定保留或丟棄 | 實務 workflow：GitHub Actions 觸發 → mutation agent 修改 → file guard 檢查 → 部署 → eval worker 四層評分 → decision engine keep/revert → experiments.json |
| 評估指標性質 | 單一任務內部指標（例如 validation loss），完全在實驗環境內產生與使用 | 多維指標：llms.txt 結構、JSON-LD 完整度、MCP/A2A 支援、AI 理解度，再加外部 Perplexity benchmark 分數 |
| 外部驗證 | 幾乎沒有直接外部世界驗證，重點是相對改進和實驗效率 | 額外設計 Perplexity 問答 benchmark + 多次 calibration，測量噪音、建立 temporal baseline，逐步評估改動是否真的提升外部 AI 的理解 |
| 回滾與決策策略 | 以驗證集指標為主，較差設定不採用，設計較簡單 | 分層 gate：內部四層 eval 主導 keep/revert，外部 Layer 5a 先 observe-only，累積足夠輪數後才考慮升級為 soft gate 或 full gate |
| 對象身分 | 「AI 幫 AI 做研究」：LLM agent 充當 junior researcher | 「AI 幫人維護數位存在」：LLM agent 幫我調整個人網站，讓它對 AI 更可讀 |
| 典型使用者門檻 | 需要深度學習工程背景、GPU 環境與程式碼操作能力 | 需要 DevOps / Web / GitHub Actions 能力，但更貼近實際內容營運與個人品牌 |

```

---

## 翻譯指示

en / ja / zh-cn 版本：
- 導言翻譯成對應語言
- 表格左欄（面向）翻譯
- Karpathy 欄和我的系統欄都翻譯
- 專有名詞不翻（autoresearch, train.py, program.md, GitHub Actions, JSON-LD, llms.txt, MCP/A2A, Perplexity, validation loss, experiments.json）
- 各語言的插入位置用 grep 確認（搜尋對應語言的「autoresearch currently focuses」/「現在、小規模言語モデル」/「目前专注在小型语言模型」那句之後）

---

## Commit

```bash
cd ~/Desktop/paulkuo.tw && git add \
  src/content/articles/ai-ready-continuous-optimization.md \
  src/content/articles/en/ai-ready-continuous-optimization.md \
  src/content/articles/ja/ai-ready-continuous-optimization.md \
  src/content/articles/zh-cn/ai-ready-continuous-optimization.md \
  public/styles/global.css \
&& git commit -m 'feat(article): add comparison table + table CSS for ai-ready-continuous-optimization (4 langs) [skip-translate]' \
&& git push origin main
```

---

## 注意事項

- ⚠️ `global.css` 已有 table 樣式（未 commit），一起推
- ⚠️ commit + push 用 `&&` 串聯（cron stash/pop 風險）
- ⚠️ 如果 push 被拒，`git stash && git pull --rebase origin main && git push && git stash pop`
- ⚠️ 用 osascript 插入時注意中文引號跳脫問題——建議用 Python 腳本寫檔
