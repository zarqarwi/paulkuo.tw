# Worklog 2026-04-05 — LLM Wiki Phase 0：目錄結構 + Schema

## Session 類型
Cowork（接續 cowork--karpathy-llm-wiki-research-2026-04-05 研究 session）

## 完成日誌（最新在上）
- 22:xx 更新架構文件 Phase 0 checklist（wiki 位置改為 src/content/wiki/） Cowork
- 22:xx 建立 wiki-ingest skill（.claude/skills/wiki-ingest/SKILL.md） Cowork
- 22:xx 撰寫 wiki CLAUDE.md Schema（命名慣例 + frontmatter 規格 + 頁面模板 + 語言規範 + 隱私規範 + ingest SOP + 連結規則 + graph 資料格式） Cowork
- 22:xx 建立 wiki 初始檔案（index.md, log.md, overview.md, graph.json, stats.json, pillar-mapping.json） Cowork
- 22:xx 建立 wiki 目錄結構 src/content/wiki/（concepts/entities/topics/sources/comparisons/meta） Cowork
- 22:xx 確認 paulkuo.tw repo 結構、content.config.ts 慣例、worklogs 格式 Cowork

## 關鍵設計決策
1. **wiki 位置**：`src/content/wiki/`（而非 get_筆記/ 下）。理由：wiki 是跨所有來源的知識層，放在 src/content/ 與 articles collection 平行，Phase 2 接 Astro 只需加一個 collection
2. **Phase 2 之前不動 content.config.ts**：Astro build 不會碰到 wiki 目錄，零干擾
3. **翻譯結構**：沿用文章系統的子資料夾模式（en/, ja/, zh-cn/），Phase 4 才啟用

## 產出檔案清單

### 新建目錄
```
src/content/wiki/
├── concepts/
├── entities/
├── topics/
├── sources/
├── comparisons/
└── meta/
```

### 新建檔案
| 檔案 | 用途 |
|------|------|
| `src/content/wiki/CLAUDE.md` | Wiki Schema（LLM 操作手冊） |
| `src/content/wiki/index.md` | 總索引 |
| `src/content/wiki/log.md` | 操作日誌 |
| `src/content/wiki/overview.md` | 全局概覽 |
| `src/content/wiki/meta/graph.json` | Graph View 資料 |
| `src/content/wiki/meta/stats.json` | Wiki 統計 |
| `src/content/wiki/meta/pillar-mapping.json` | 五大支柱映射 |
| `.claude/skills/wiki-ingest/SKILL.md` | Ingest 操作 skill |

### 修改檔案
| 檔案 | 修改內容 |
|------|---------|
| `architecture--paulkuo-llm-wiki-2026-04-05.md` | Phase 0 checklist 更新位置 + 標記已完成項目 |

## CLAUDE.md Schema 涵蓋範圍
- 目錄結構定義
- 頁面命名慣例（slug 格式 + 禁止規則）
- Frontmatter 完整規格（type/pillar/visibility/confidence 等）
- 五種頁面模板（concept/entity/topic/source/comparison）
- 語言規範（簡轉繁用語對照表 25+ 條目）
- 隱私三級規範（public/internal/private 操作行為）
- 完整 Ingest SOP（6 步驟 + 批次流程 + 門檻規則）
- 連結規則（wiki 內部 + 與 PK 文章的連結）
- Graph View 資料格式（節點 + 邊）
- Lint / Publish 規則骨架（Phase 3 啟用）

## Phase 0 試跑完成（同一 session 接續執行）
- [x] 試跑：拿「AI龍蝦十日談」10 篇做第一批 ingest
- [x] 驗證 wiki 品質，檢查 Schema

### Ingest 結果
- 10 篇 source 摘要頁（全部 public）
- 7 個概念頁新建：ai-agent-economy, human-ai-collaboration, one-person-team, skill-development, human-judgment-in-ai-era, ai-education, enterprise-ai-adoption
- 1 個人物頁新建：kuaidao-qingyi（10/10 篇提及）
- 9 位嘉賓各 1 篇，未達 3 篇門檻暫不建獨立頁
- graph.json：8 節點 + 15 條邊
- 總計 18 頁面

### Schema 驗證結果
- ✅ 命名慣例運作順暢
- ✅ 簡轉繁 + 台灣用語轉換流暢
- ✅ 概念頁「矛盾與爭議」區塊有實質內容
- ✅ 門檻規則運作正常
- ⚠️ source slug 用 note_id 後六碼不太直覺，但不影響操作，暫不改

## 自動化機制建立（同一 session 接續）
- [x] 建立 `wiki-ingest-scanner` scheduled task（每天 10:00 掃描 get_筆記新增內容）
- [x] 建立 Web Clipper 流程（raw/clips/ 資料夾 + README.md 使用說明）
- [x] 更新 wiki CLAUDE.md 補充自動化機制區塊

### wiki-ingest-scanner 排程任務
- 排程：每天 10:00
- 功能：掃描 get_筆記 notes/ vs wiki/sources/ 差集，產出待 ingest 清單
- 產出：worklogs/wiki-ingest-pending.md
- Paul 需先手動跑一次「Run now」核准工具權限

### Web Clipper
- 資料夾：src/content/wiki/raw/clips/
- 最快方式：直接在 Cowork 貼網址說「把這篇 ingest 進 wiki」
- 也可手動存 markdown 到 clips/ 再觸發

## Phase 1 新增設計決策（2026-04-05 同 session 接續）

朋友分享了他用 Cowork 實現 Karpathy LLM Wiki 的心得，對照後我們覆蓋率高，主要差兩塊：
1. Web 自動蒐集（朋友排程自動搜新聞，我們的 Web Clipper 目前是半自動）
2. 定期產出知識摘要（朋友每週一產簡報，我們沒有這個輸出端）

Paul 決定兩個都排進 Phase 1：

- [x] 更新 CLAUDE.md Schema 加入「Web 自動蒐集」+「知識摘要排程」兩個區塊
- [x] 建立 `wiki-knowledge-digest` 排程任務（每 2 天 10:00 產出摘要至 worklogs/wiki-digest-*.md）
- Paul 需先手動「Run now」一次來核准工具權限

## 下一步（Phase 1 待執行）
- [ ] 分批 ingest 其他 get_筆記 資料夾（從 04_AI與科技 開始）
- [ ] Ingest paulkuo.tw 現有文章（反向連結）
- [ ] scheduled task 跑穩後改為全自動 ingest
- [ ] Web 自動蒐集：建立關鍵字追蹤清單 + 排程任務
- [ ] 知識摘要排程跑穩後調整格式與頻率

## 技術備忘
- Filesystem MCP 允許路徑：/Users/apple/Desktop（macOS username = apple）
- get_筆記路徑：/Users/apple/Desktop/01_專案進行中/get_筆記/notes/（9 個分類資料夾）
- paulkuo.tw 目前 ~90 篇文章（src/content/articles/），四語翻譯在 en/ja/zh-cn 子資料夾
- content.config.ts 每個語言定義獨立 collection（articles, articles_en, articles_ja, articles_zhcn）
- wiki collection 定義等 Phase 2 再加
