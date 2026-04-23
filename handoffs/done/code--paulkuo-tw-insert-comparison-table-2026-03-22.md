# code--paulkuo-tw-insert-comparison-table-2026-03-22.md

## 背景

文章 `ai-ready-continuous-optimization` 已上線（HEAD `c311508`）。Paul 要在「把 autoresearch 的精神搬到網站上」段落加入一張 Karpathy autoresearch vs 我的系統 的比較表格，四語言版本。

**前置狀態**：`global.css`（table CSS）、`experiments.json`、`dashboard.astro` 三個檔案已有 uncommitted 修改在 working tree。表格插入後一起 commit。

---

## Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 0-1 確認目前 branch 和 working tree 狀態
git status
git stash list

# 0-2 確認 global.css 有 table 樣式（未 commit）
git diff public/styles/global.css | head -60

# 0-3 確認四個檔案存在
ls -la \
  src/content/articles/ai-ready-continuous-optimization.md \
  src/content/articles/en/ai-ready-continuous-optimization.md \
  src/content/articles/ja/ai-ready-continuous-optimization.md \
  src/content/articles/zh-cn/ai-ready-continuous-optimization.md

# 0-4 找到各語言的插入位置（表格插在這句之後）
grep -n "autoresearch 目前專注在小型語言模型" src/content/articles/ai-ready-continuous-optimization.md
grep -n "autoresearch currently focuses" src/content/articles/en/ai-ready-continuous-optimization.md
grep -n "小規模言語モデル" src/content/articles/ja/ai-ready-continuous-optimization.md
grep -n "目前专注在小型语言模型" src/content/articles/zh-cn/ai-ready-continuous-optimization.md

# 0-5 找到各語言「我不是把 autoresearch 原封不動搬過來」對應句（確認表格插入終點）
grep -n "不是把 autoresearch 原封不動" src/content/articles/ai-ready-continuous-optimization.md
grep -n "didn't just copy" src/content/articles/en/ai-ready-continuous-optimization.md
grep -n "そのまま持ってきた" src/content/articles/ja/ai-ready-continuous-optimization.md
grep -n "不是把 autoresearch 原封不动" src/content/articles/zh-cn/ai-ready-continuous-optimization.md
```

---

## 步驟 1：用 Python 腳本插入表格（四語言）

> ⚠️ 用 Python 寫檔，避免 osascript 中文引號跳脫問題

在 repo 根目錄建立 `_insert_table.py`，執行完後刪除。

腳本邏輯：
- 讀取各檔案
- 找到錨點句（grep 出的那行）
- 在錨點句所在行之後，插入一個空行 + 導言 + 表格 + 空行
- 寫回檔案

### zh-TW 插入內容

錨點句包含：`autoresearch 目前專注在小型語言模型的訓練實驗上，我這裡是把「自動實驗迴圈」這個概念搬到網站優化領域。`

插入：

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

### en 插入內容

錨點句包含：`autoresearch currently focuses`

```markdown

Here's a comparison of the scope differences between my implementation and Karpathy's autoresearch. They share the same spirit but operate in different domains — they're not the same system:

| Aspect | Karpathy autoresearch | My AI-Ready Continuous Optimization System |
| --- | --- | --- |
| Primary Goal | Automate "model training research experiments" to find better training configurations and architectures within fixed resources | Automate continuous optimization of "website and AI interface quality," making the site easier for various AI systems to correctly understand and cite |
| Domain & Target | Small language model training (e.g., nanochat / nanoGPT-class tasks) | Personal website paulkuo.tw's structure, llms.txt, JSON-LD, agent protocols, etc. |
| Environment Type | Closed lab environment: single codebase, single dataset, single GPU, offline training experiments | Near-production: modifications directly affect the website repo / production, and are tested by external AI systems |
| Unit of Automation | Code modifications to train.py, hyperparameter and training strategy experiments | Modifications to website content structure, metadata, llms.txt, FAQ sections, protocol configurations, etc. |
| Pipeline Structure | Research loop: program.md → agent modifies train.py → run experiment → read validation metrics → decide keep or discard | Production workflow: GitHub Actions trigger → mutation agent modifies → file guard checks → deploy → eval worker scores across 4 layers → decision engine keep/revert → experiments.json |
| Evaluation Metric Nature | Single-task internal metrics (e.g., validation loss), generated and consumed entirely within the experiment environment | Multi-dimensional metrics: llms.txt structure, JSON-LD completeness, MCP/A2A support, AI comprehension score, plus external Perplexity benchmark scores |
| External Validation | Almost no direct real-world validation; focus is on relative improvement and experiment efficiency | Specifically designed Perplexity Q&A benchmark + multiple calibration rounds, measuring noise, establishing temporal baseline, progressively evaluating whether changes genuinely improve external AI understanding |
| Rollback & Decision Strategy | Primarily based on validation set metrics; worse configurations are simply not adopted; relatively simple design | Layered gates: internal 4-layer eval drives keep/revert, external Layer 5a starts as observe-only, and only after accumulating sufficient rounds considers upgrading to soft gate or full gate |
| Identity of Subject | "AI helping AI do research": LLM agent acts as junior researcher | "AI helping a person maintain their digital presence": LLM agent helps me tune my personal website to be more AI-readable |
| Typical User Threshold | Requires deep learning engineering background, GPU environment, and code-level proficiency | Requires DevOps / Web / GitHub Actions skills, but is closer to real-world content operations and personal branding |
```

### ja 插入內容

錨点句包含：`小規模言語モデル`

```markdown

ここで、今回の実装と Karpathy autoresearch のスコープの違いを整理します。両者は同じ精神を共有していますが、領域が異なります——同一のシステムではありません：

| 観点 | Karpathy autoresearch | 私の AI-Ready Continuous Optimization System |
| --- | --- | --- |
| 主な目標 | 「モデル訓練の研究実験」を自動化し、限られたリソース内でより良い訓練設定とアーキテクチャを発見する | 「ウェブサイトと AI インターフェースの品質」の継続的最適化を自動化し、各 AI システムが正確に理解・引用できるサイトにする |
| 領域と対象 | 小規模言語モデルの訓練（nanochat / nanoGPT 系タスクなど） | 個人サイト paulkuo.tw の構造、llms.txt、JSON-LD、agent プロトコルなど |
| 環境タイプ | 閉じた実験室環境：単一 codebase、単一データセット、単一 GPU、オフライン訓練実験 | production に近い環境：変更がウェブサイトの repo / production に直接反映され、外部 AI による実テストを受ける |
| 自動化の単位 | train.py のコード変更、ハイパーパラメータと訓練戦略の実験 | ウェブサイトのコンテンツ構造、metadata、llms.txt、FAQ セクション、プロトコル設定などの変更 |
| Pipeline 構造 | 研究ループ：program.md → agent が train.py を変更 → 実験実行 → 検証指標を読む → 保持か破棄かを決定 | 実務ワークフロー：GitHub Actions トリガー → mutation agent が変更 → file guard チェック → デプロイ → eval worker が 4 層スコアリング → decision engine が keep/revert → experiments.json |
| 評価指標の性質 | 単一タスクの内部指標（validation loss など）、実験環境内で完結 | 多次元指標：llms.txt 構造、JSON-LD の完全性、MCP/A2A サポート、AI 理解度スコア、さらに外部 Perplexity benchmark スコア |
| 外部検証 | 直接的な外部検証はほぼなし。相対的改善と実験効率が重点 | Perplexity Q&A benchmark を専用設計 + 複数回の calibration、ノイズ測定、temporal baseline の構築、変更が外部 AI の理解を本当に向上させたか段階的に評価 |
| ロールバックと意思決定戦略 | 検証セット指標が中心。劣った設定は不採用。比較的シンプルな設計 | 階層型 gate：内部 4 層 eval が keep/revert を主導、外部 Layer 5a はまず observe-only、十分なラウンドを蓄積してから soft gate または full gate への昇格を検討 |
| 対象のアイデンティティ | 「AI が AI の研究を手伝う」：LLM agent がジュニアリサーチャーとして機能 | 「AI が人のデジタルプレゼンスの維持を手伝う」：LLM agent が私の個人サイトを AI にとってより読みやすく調整 |
| 典型的なユーザーの敷居 | 深層学習エンジニアリングの背景、GPU 環境、コードレベルの操作能力が必要 | DevOps / Web / GitHub Actions のスキルが必要だが、実際のコンテンツ運営やパーソナルブランディングにより近い |
```

### zh-CN 插入內容

錨点句包含：`目前专注在小型语言模型`

```markdown

下面整理我这次实作与 Karpathy autoresearch 的范围差异，两者精神相近但领域不同，不是同一种系统：

| 面向 | Karpathy autoresearch | 我的 AI-Ready Continuous Optimization System |
| --- | --- | --- |
| 主要目标 | 自动化「模型训练研究实验」，在固定资源内找到更好的训练设定与架构 | 自动化「网站与 AI 接口质量」的持续优化，让网站更容易被各家 AI 正确理解与引用 |
| 领域与对象 | 小型语言模型训练（例如 nanochat / nanoGPT 类任务） | 个人网站 paulkuo.tw 的结构、llms.txt、JSON-LD、agent 协议等 |
| 环境类型 | 封闭实验室环境：单一 codebase、单一数据集、单 GPU，离线训练实验 | 接近 production：修改直接作用在网站 repo / production，并接受外部 AI 的实测 |
| 自动化单位 | 针对 train.py 的代码修改、超参数与训练策略实验 | 针对网站内容结构、metadata、llms.txt、FAQ 区块、协议设定等进行修改 |
| Pipeline 结构 | 研究 loop：program.md → agent 改 train.py → 跑实验 → 读验证指标 → 决定保留或丢弃 | 实务 workflow：GitHub Actions 触发 → mutation agent 修改 → file guard 检查 → 部署 → eval worker 四层评分 → decision engine keep/revert → experiments.json |
| 评估指标性质 | 单一任务内部指标（例如 validation loss），完全在实验环境内产生与使用 | 多维指标：llms.txt 结构、JSON-LD 完整度、MCP/A2A 支持、AI 理解度，再加外部 Perplexity benchmark 分数 |
| 外部验证 | 几乎没有直接外部世界验证，重点是相对改进和实验效率 | 额外设计 Perplexity 问答 benchmark + 多次 calibration，测量噪音、建立 temporal baseline，逐步评估改动是否真的提升外部 AI 的理解 |
| 回滚与决策策略 | 以验证集指标为主，较差设定不采用，设计较简单 | 分层 gate：内部四层 eval 主导 keep/revert，外部 Layer 5a 先 observe-only，累积足够轮数后才考虑升级为 soft gate 或 full gate |
| 对象身份 | 「AI 帮 AI 做研究」：LLM agent 充当 junior researcher | 「AI 帮人维护数字存在」：LLM agent 帮我调整个人网站，让它对 AI 更可读 |
| 典型用户门槛 | 需要深度学习工程背景、GPU 环境与代码操作能力 | 需要 DevOps / Web / GitHub Actions 能力，但更贴近实际内容运营与个人品牌 |
```

---

## 步驟 2：Python 腳本範例

```python
#!/usr/bin/env python3
"""Insert comparison tables into 4 language versions of ai-ready-continuous-optimization."""
import re

BASE = "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/src/content/articles"

# (file_path, anchor_pattern, insert_block)
tasks = [
    (
        f"{BASE}/ai-ready-continuous-optimization.md",
        r"autoresearch 目前專注在小型語言模型的訓練實驗上",
        ZH_TW_TABLE,  # 上方 zh-TW 表格內容（含導言）
    ),
    (
        f"{BASE}/en/ai-ready-continuous-optimization.md",
        r"autoresearch currently focuses",
        EN_TABLE,
    ),
    (
        f"{BASE}/ja/ai-ready-continuous-optimization.md",
        r"小規模言語モデル",
        JA_TABLE,
    ),
    (
        f"{BASE}/zh-cn/ai-ready-continuous-optimization.md",
        r"目前专注在小型语言模型",
        ZH_CN_TABLE,
    ),
]

for filepath, anchor, table_block in tasks:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    lines = content.split("\n")
    insert_after = None
    for i, line in enumerate(lines):
        if re.search(anchor, line):
            insert_after = i
            break
    
    if insert_after is None:
        print(f"⚠️ Anchor not found in {filepath}")
        continue
    
    new_lines = lines[:insert_after + 1] + ["", table_block.strip(), ""] + lines[insert_after + 1:]
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(new_lines))
    
    print(f"✅ Inserted table in {filepath} after line {insert_after + 1}")

print("Done. Review with git diff before committing.")
```

> ⚠️ 把上方四個語言的表格內容（含導言）分別賦值給 `ZH_TW_TABLE`, `EN_TABLE`, `JA_TABLE`, `ZH_CN_TABLE` 變數。每個變數是一個多行字串。

---

## 步驟 3：驗證

```bash
# 確認四個檔案都有表格
grep -c "面向.*Karpathy" src/content/articles/ai-ready-continuous-optimization.md
grep -c "Aspect.*Karpathy" src/content/articles/en/ai-ready-continuous-optimization.md
grep -c "観点.*Karpathy" src/content/articles/ja/ai-ready-continuous-optimization.md
grep -c "面向.*Karpathy" src/content/articles/zh-cn/ai-ready-continuous-optimization.md
# 每個都應該回傳 1

# 確認 global.css 有 table 樣式
grep -c "table" public/styles/global.css

# git diff 看一下
git diff --stat
```

---

## 步驟 4：Commit + Push（原子操作）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git add \
  src/content/articles/ai-ready-continuous-optimization.md \
  src/content/articles/en/ai-ready-continuous-optimization.md \
  src/content/articles/ja/ai-ready-continuous-optimization.md \
  src/content/articles/zh-cn/ai-ready-continuous-optimization.md \
  public/styles/global.css \
  ai-ready-opt/experiments.json \
  src/pages/tools/ai-ready-dashboard.astro \
&& git commit -m 'feat(article): add comparison table + table CSS + dashboard update for ai-ready-continuous-optimization (4 langs) [skip-translate]' \
&& git push origin main
```

> ⚠️ 如果 push 被拒：`git stash && git pull --rebase origin main && git push && git stash pop`
> ⚠️ 完成後刪除 `_insert_table.py`

---

## 步驟 5：清理

```bash
rm _insert_table.py
```

---

## 注意事項

- ⚠️ Repo 路徑是 `~/Desktop/01_專案進行中/paulkuo.tw`（不是 `~/Desktop/paulkuo.tw`）
- ⚠️ `global.css`（table CSS）、`experiments.json`、`dashboard.astro` 三個已在 working tree 有修改，一起 commit
- ⚠️ commit + push 用 `&&` 串聯（cron stash/pop 風險）
- ⚠️ 用 Python 腳本寫檔，不要用 osascript（中文引號跳脫問題）
- ⚠️ 專有名詞不翻：autoresearch, train.py, program.md, GitHub Actions, JSON-LD, llms.txt, MCP/A2A, Perplexity, validation loss, experiments.json, nanochat, nanoGPT
- ⚠️ 每個語言版本的 grep 錨點不同，Step 0 偵察要逐一確認行號

---

## 回報格式

完成後回報：
1. 四個檔案的 `grep -c` 結果（確認表格存在）
2. `git diff --stat` 輸出
3. commit hash
4. push 結果
