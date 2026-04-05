# Wiki Raw Sources — 外部素材暫存區

> 這個資料夾存放手動擷取的外部素材，作為 wiki ingest 的原始輸入。
> 不會進 Astro build，不會出現在網站上。

## clips/ — Web Clipper 擷取

存放從網路擷取的文章 markdown。

### 使用方式

**方式一：直接在 Cowork 裡說**
最快的方式。直接貼網址給 Claude：
```
把這篇 ingest 進 wiki：https://example.com/article
```
Claude 會用 WebFetch 讀取內容，產出 source 摘要頁，不需要先存檔。

**方式二：手動存 markdown 再 ingest**
如果你想留存原始擷取內容：
1. 用 Obsidian Web Clipper 或任何工具把網頁存成 markdown
2. 放進這個 `clips/` 資料夾
3. 在 Cowork 裡說「ingest clips/ 裡的新檔案」

### 檔名慣例

`{YYYY-MM-DD}-{關鍵詞}.md`，例如：
- `2026-04-05-karpathy-llm-wiki.md`
- `2026-04-06-anthropic-claude-code.md`

### Frontmatter（可選）

如果手動存檔，建議加上：
```yaml
---
title: "文章標題"
url: "https://原始網址"
clipped: 2026-04-05
visibility: public
---
```

沒有 frontmatter 也行，ingest 時 Claude 會自動處理。
