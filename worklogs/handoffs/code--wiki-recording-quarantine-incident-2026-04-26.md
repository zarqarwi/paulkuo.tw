建議模型: Opus（這是 incident response，要穩；批次操作不能出錯）
Task Size: M（預估 30-45 分鐘）
優先級: 🚨 P0 — 商務會議錄音含公司名/人名/合作條件正在公開 wiki 上對外曝光

---

# [WIKI] 🚨 INCIDENT RESPONSE — 44 筆錄音內容批次隔離

## 為什麼是 incident，不是 bug fix

過去數週至數月，**44 筆錄音內容**（含商務會議、合作對象、財務細節、Paul 私人感觸）被 scanner bug 誤分為 public 並 ingest 進 wiki，目前可能仍在 paulkuo.tw/wiki/ 對外曝光。

含敏感資訊的代表性筆記：
- 「日本CET公司台湾再生医疗合作项目洽谈」
- 「新医美学集团业务与系统介绍及海外市场拓展讨论」
- 「佳龙科技与赛事平台公司的合作沟通」
- 「与理事长合作及资源盘点讨论」
- 「商业合作与项目推进会议讨论」
- 「庞牧师离世对我的影响与思考」（Paul 私人情緒）

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
```

確認在 `origin/main`，**沒有並行 Code session 開在這個 repo**（同 repo 不開並行的紀律）。

---

## 完整事件診斷

### Root cause（已修復）
`scripts/build_wiki_ingest_report.py` 的 `has_recording_tag()` 用精確字串 `"录音卡笔记"` 比對 system tag，但 get_筆記中存在三種變體：
- `录音卡笔记` 215 筆
- `录音笔记` 75 筆 ← **被誤判**
- `录音测试` 1 筆 ← **被誤判**

scanner 漏掉後兩種變體，**76 筆錄音被當成普通 public 內容**算進 ingest 候選清單。

Code session 已於 commit `b0931a4`（2026-04-26）修復 scanner 邏輯（改 contains `"录音"`）。

### 歷史污染範圍（本 handoff 處理對象）
Cowork 反查 src/content/wiki/sources/ 內所有 raw_note_id 對應到 get_筆記 的 system tag，發現 **44 筆 source 是錄音內容**。完整列表見本檔 §「44 筆隔離清單」。

### 當前狀態
- ✅ Scanner bug root cause 修復完成
- ❌ 已 ingest 的 44 筆仍在 src/content/wiki/sources/，可能仍在線上 KV、可能對外可訪問
- ❌ 4 篇本日新 ingest（commit `2fdd571`，196368/149520/366608/711952）**不在這 44 筆清單內**，是真正的 public AI 链接笔记，不需處理

---

## Step 0 偵察

執行 quarantine 前先確認三件事：

### 0.1 確認 visibility filter 實作位置

```bash
# wiki 前端如何排除非 public？
grep -rn "visibility" src/content/config.* src/pages/wiki/ src/components/wiki/ astro.config.* 2>/dev/null | head -30

# Worker API 怎麼 filter？
grep -rn "visibility" workers/ functions/ src/lib/wiki* 2>/dev/null | head -30

# wiki-kv-seed.cjs 是 seed 全部還是只 seed public？
grep -n "visibility" scripts/wiki-kv-seed.cjs
```

**預期發現之一**：
- 前端 Astro getCollection() 用 visibility filter
- KV seed 可能 seed 全部（這樣 worker API 還能查到 internal/private）
- 或 KV 只 seed public（這樣改 visibility 就要重 seed）

**如果偵察結果與你預期不符，停下來在 commit message 解釋原因再繼續。**

### 0.2 確認 44 筆當前 visibility 真的是 public

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 把本 handoff §「44 筆隔離清單」的 raw_note_id 存成檔案
cat > /tmp/quarantine-ids.txt <<'EOF'
1899065664472756056
1900378267681216800
1900387995782123160
1900429853459558096
1900430189540859688
1900437610173749536
1900440528602454304
1900443996787498792
1900474137793714464
1900480149674188584
1900800880652066168
1900822048398808040
1900890547758048304
1900945511528107776
1900976653262270152
1901006869430898432
1901270027447435960
1901285092044178104
1901355621849661768
1901366025334174608
1901441776745593912
1901454140883221560
1901454756136780904
1901466154980006336
1901473991147782928
1901627674741896520
1901630702693315912
1901723571698458136
1901841819663161976
1901958434467699320
1902744723794268104
1902744775333850688
1902890675374035296
1903106513586171536
1903118704850406952
1903118811150847528
1903163290907389584
1903301313976504720
1903329278507519528
1903762369050584104
1904033043258630888
1904378657129009912
1905623247384379840
1905623892703216736
EOF

# 對每個 raw_note_id 找對應的 source 檔，列出當前 visibility
for id in $(cat /tmp/quarantine-ids.txt); do
  file=$(grep -lE "raw_note_id: *\"$id\"" src/content/wiki/sources/*.md)
  vis=$(grep "^visibility:" "$file" 2>/dev/null | head -1)
  echo "$id  $vis  $(basename $file)"
done | tee /tmp/pre-quarantine-state.txt
```

**預期**：
- 44 筆全部 `visibility: public`（如果不是，記下例外案例）
- 確認檔案路徑齊全（不應有「找不到檔案」）
- 如果某 raw_note_id 找不到對應檔，說明 ID 可能漂移，先停下來。

### 0.3 確認 sources 總數（後續對帳用）

```bash
ls src/content/wiki/sources/*.md | wc -l
# 預期 ≥ 44，記下實際數字 N
# quarantine 完成後，剩餘 public 應為 N - 44 + 4（4 是本日新 ingest 沒被污染）
```

---

## 具體步驟

### 步驟 1：批次 quarantine（改 visibility + 加標記）

對 44 筆 source 檔做 frontmatter 改寫：
- `visibility: public` → `visibility: private`
- 新增 `quarantine` 區塊保留審查脈絡

寫一個 Python script `scripts/wiki-quarantine-recordings.py`：

```python
#!/usr/bin/env python3
"""
Incident response: quarantine 44 recording notes that were misclassified
as public due to scanner bug (fixed in commit b0931a4).

Modifies frontmatter:
- visibility: public -> visibility: private
- adds quarantine block for audit trail

Idempotent: re-running on already-quarantined files is safe (no-op).
"""

import re
import sys
from pathlib import Path
from datetime import datetime

QUARANTINE_IDS = """
1899065664472756056
1900378267681216800
1900387995782123160
1900429853459558096
1900430189540859688
1900437610173749536
1900440528602454304
1900443996787498792
1900474137793714464
1900480149674188584
1900800880652066168
1900822048398808040
1900890547758048304
1900945511528107776
1900976653262270152
1901006869430898432
1901270027447435960
1901285092044178104
1901355621849661768
1901366025334174608
1901441776745593912
1901454140883221560
1901454756136780904
1901466154980006336
1901473991147782928
1901627674741896520
1901630702693315912
1901723571698458136
1901841819663161976
1901958434467699320
1902744723794268104
1902744775333850688
1902890675374035296
1903106513586171536
1903118704850406952
1903118811150847528
1903163290907389584
1903301313976504720
1903329278507519528
1903762369050584104
1904033043258630888
1904378657129009912
1905623247384379840
1905623892703216736
""".strip().split()

QUARANTINE_BLOCK = """quarantine:
  reason: "scanner_bug_2026_04_26_录音_tag_misdetection"
  original_visibility: public
  quarantined_at: "{date}"
  needs_review: true
  review_outcome: pending  # set by Cowork during phase-2 audit
"""

SOURCES_DIR = Path("src/content/wiki/sources")
TODAY = datetime.now().strftime("%Y-%m-%d")

processed = []
skipped_already_quarantined = []
not_found = []

for note_id in QUARANTINE_IDS:
    matches = list(SOURCES_DIR.glob("*.md"))
    target = None
    for f in matches:
        with open(f) as fh:
            content = fh.read()
        if re.search(rf'raw_note_id:\s*"{note_id}"', content):
            target = f
            break

    if not target:
        not_found.append(note_id)
        continue

    with open(target) as fh:
        content = fh.read()

    # Skip if already quarantined
    if "quarantine:" in content and "scanner_bug_2026_04_26" in content:
        skipped_already_quarantined.append(target.name)
        continue

    # Replace visibility line and inject quarantine block
    new_content = re.sub(
        r'^visibility:\s*public\s*$',
        f'visibility: private\n{QUARANTINE_BLOCK.format(date=TODAY).rstrip()}',
        content,
        count=1,
        flags=re.MULTILINE,
    )

    # Safety check: if visibility wasn't public, abort
    if new_content == content:
        print(f"⚠️  {target.name} visibility not 'public', skipping (manual review)")
        continue

    with open(target, "w") as fh:
        fh.write(new_content)
    processed.append(target.name)

# Report
print(f"\n=== Quarantine Report ===")
print(f"✅ Quarantined: {len(processed)}")
print(f"⏭  Already quarantined (skipped): {len(skipped_already_quarantined)}")
print(f"❓ Not found: {len(not_found)}")

if not_found:
    print(f"\nNot found IDs (investigate):")
    for nid in not_found:
        print(f"  - {nid}")

# Write detailed audit log
audit_path = Path("worklogs/incidents/recording-quarantine-2026-04-26.md")
audit_path.parent.mkdir(parents=True, exist_ok=True)

with open(audit_path, "w") as fh:
    fh.write(f"""# Recording Content Quarantine — {TODAY}

## Summary
- Quarantined: {len(processed)}
- Already quarantined (idempotent re-run): {len(skipped_already_quarantined)}
- Not found: {len(not_found)}

## Root Cause
Scanner bug in `scripts/build_wiki_ingest_report.py` matched only `"录音卡笔记"`,
missing `"录音笔记"` (75 cases) and `"录音测试"` (1 case).
Fixed in commit b0931a4.

## Action Taken
All 44 raw_note_ids listed below had visibility changed from `public` to `private`,
with quarantine block added for audit trail.

## Quarantined Files
""")
    for fname in sorted(processed):
        fh.write(f"- `{fname}`\n")

    if skipped_already_quarantined:
        fh.write(f"\n## Already Quarantined (skipped)\n")
        for fname in sorted(skipped_already_quarantined):
            fh.write(f"- `{fname}`\n")

    if not_found:
        fh.write(f"\n## Not Found (investigate)\n")
        for nid in not_found:
            fh.write(f"- `{nid}`\n")

    fh.write(f"""
## Phase 2 — Manual Review Pending (Cowork)
Each quarantined file needs Paul/Cowork to set `quarantine.review_outcome`:
- `restore_public`: 公開內容轉錄（馬斯克、辛頓、芒格...），可恢復 public
- `keep_private_internal`: Paul 私人會議或感觸，永久保持 private/internal
- `delete`: 商務會議錄音含敏感資訊，從 sources/ 移除（保留 raw_note_id 入 quarantine list 防 re-ingest）
- `redact_and_restore`: 去識別化後恢復 public

直到 phase-2 完成，所有 quarantine block 的 `needs_review: true` 維持不變。
""")

print(f"\n✅ Audit log written to {audit_path}")
```

執行：

```bash
python3 scripts/wiki-quarantine-recordings.py
```

### 步驟 2：同步 wiki KV（依 Step 0.1 偵察結果決定）

**情境 A：KV seed 只 seed visibility=public**
- 跑 `node scripts/wiki-kv-seed.cjs`
- 被 quarantine 的 44 筆會自動從 KV 移除

**情境 B：KV seed 全部都 seed**
- 必須改 wiki-kv-seed.cjs 加 visibility filter（**只 seed public**），跑一次後 push
- 或新增 `scripts/wiki-kv-purge.cjs` 只刪除 quarantine 清單那 44 筆的 KV key

**情境 C：Cowork 已知限制（feedback memory）**：
> Cowork CF MCP 沒有 KV key 操作——只到 namespace 層級，KV key get/put/delete 必須走本機 wrangler 或自建 Worker endpoint

所以 KV 操作走本機 wrangler，不要試圖用 MCP。

### 步驟 3：重 deploy（Pages build）

依 paulkuo.tw 的 deploy 流程：
- 如果是 Cloudflare Pages 自動 build：commit + push 後會自動觸發
- 如果是手動 deploy：跑對應指令（看 README 或 package.json scripts）

確認新 build 完成後，**用無痕視窗**訪問前端：
- `https://paulkuo.tw/wiki/` 不應再出現 quarantine 的標題（如「日本CET公司」「庞牧师」）
- 隨機抽 3 個 quarantine 檔對應的 wiki 頁面，應 404 或 redirect

### 步驟 4：commit + push（分兩個 commit 比較清楚）

**Commit A — 隔離操作本身**：
```bash
git add scripts/wiki-quarantine-recordings.py src/content/wiki/sources/*.md worklogs/incidents/
git commit -m "fix(wiki): quarantine 44 recording notes misclassified as public

INCIDENT: Scanner bug (fixed in b0931a4) matched only '录音卡笔记' string,
missing '录音笔记' variant. 44 recording notes (business meetings, personal
recordings, public talk transcripts) were ingested as public and may have
been publicly accessible.

Action:
- All 44 source files visibility: public -> private
- quarantine{} block added for audit trail
- worklogs/incidents/recording-quarantine-2026-04-26.md logs all actions

Phase 2 review pending: Cowork/Paul will set review_outcome per file."

git push
```

**Commit B — KV/deploy 改動**（若 Step 2 有改 wiki-kv-seed.cjs）：
```bash
git add scripts/wiki-kv-seed.cjs scripts/wiki-kv-purge.cjs
git commit -m "fix(wiki): KV seed now respects visibility=public filter

Part of recording quarantine incident response (see commit X). KV was
previously seeding all sources regardless of visibility, exposing
quarantined content via Worker API even after frontmatter change."

git push
```

---

## 驗證方式

- [ ] Step 0.1 確認 visibility filter 實作位置（前端 + Worker API 都查清楚）
- [ ] Step 0.2 確認 44 筆 pre-quarantine state 全部 `visibility: public`，沒有「找不到檔案」
- [ ] Step 1 quarantine 腳本 idempotent 跑兩次結果相同（第二次全部 skip）
- [ ] Step 1 audit log 寫入 `worklogs/incidents/recording-quarantine-2026-04-26.md`
- [ ] Step 2 KV 不再含 quarantine 清單的 raw_note_id（用 `wrangler kv key list` 對帳）
- [ ] Step 3 無痕視窗訪問前端，quarantine 內容已下線
- [ ] Step 4 兩個 commit 都 push 到 origin/main
- [ ] sources/ 剩餘 public 數量 = 偵察階段 N - 44 + 4（4 是本日 ingest 未污染）

---

## 注意事項

- ⚠️ **不要刪檔**——只改 visibility 並加 quarantine 標記，保留檔案讓 phase-2 能審查脈絡。
- ⚠️ **不要動本日新 push 的 4 個檔**（`getnote-196368/149520/366608/711952`，commit `2fdd571`），它們是真正的 public AI 链接笔记，不在污染清單中。
- ⚠️ Quarantine block 用 `needs_review: true` 標記，**前端 UI 若沒有處理 visibility=private 的 fallback 會 404 是預期行為**，不要為了「看起來正常」改回 public。
- ⚠️ 如果 Step 0.2 發現任何 raw_note_id 找不到對應檔（例如 ID 漂移、檔案被改名），**先停下來找 Paul 確認**，不要硬跑完。
- ⚠️ 遵循 [feedback_no_parallel_code_sessions](Cowork memory)——這個 session 跑期間，paulkuo.tw 不要開第二個 Code session。
- ⚠️ 不要 force push、不要 amend 別人的 commit。

---

## 44 筆隔離清單（按資料夾分類）

### 02_醫療健康（18 筆，多為商務會議錄音）
1. `1901466154980006336` 干细胞与外泌体自动化培养技术介绍
2. `1900890547758048304` 照顾管家服务模式与AI工具在长照领域的应用探讨
3. `1900800880652066168` AI助力新药开发：解决药物探索危机的新革命
4. `1900945511528107776` 中年时期的个人成长与社交健康
5. `1900387995782123160` 子宫颈癌治疗探索与医疗数据合作探讨
6. `1901366025334174608` 企业员工健康与长照服务方案合作讨论
7. `1901285092044178104` 新医美学集团业务与系统介绍及海外市场拓展讨论
8. `1901454140883221560` 日本CET公司台湾再生医疗合作项目洽谈
9. `1900976653262270152` 佳龙科技与赛事平台公司的合作沟通
10. `1903118704850406952` 搭建个人网站与AI工具应用的学习总结
11. `1901355621849661768` 商业合作与项目推进会议讨论
12. `1900474137793714464` 与理事长合作及资源盘点讨论
13. `1900437610173749536` 与合作方的合作条件及项目规划
14. `1901454756136780904` 实验室设施与动物实验区域介绍
15. `1901473991147782928` 预防医学服务设计与AI药物开发的商业生态探讨
16. `1900822048398808040` AI技术在医疗领域的应用合作探讨
17. `1903118811150847528` 系统设计踩坑与学习反思
18. `1901006869430898432` AI药物设计与生命科学研究交流讨论

### 04_AI與科技（12 筆，混合公開轉錄與個人會議）
19. `1902890675374035296` 无需人类参与的AI自训练研究：绝对零度训练法
20. `1901841819663161976` AI发展预测：从程序员替代到超级智能的时间线
21. `1903106513586171536` Intelligence is not wisdom: 高智能易产生妄想与错误决策
22. `1902744723794268104` 关于AI开发趋势与创业新项目的讨论
23. `1901630702693315912` AI教父杰弗里·辛顿2026年演讲：AI的欺骗性与人类生存危机
24. `1903163290907389584` 马斯克最新十大预言解读
25. `1901270027447435960` AI在制造业人力资源与教育训练中的应用交流
26. `1900440528602454304` AI时代1%超级人才的能力与机遇探讨
27. `1900443996787498792` Claude Skills功能解析与使用指南
28. `1903301313976504720` 基于神经可塑性的大脑开发方法
29. `1903329278507519528` Line Works企业办公功能测试与使用讨论
30. `1901958434467699320` 科技进步未必带来更多空闲时间

### 06_個人成長與學習（14 筆，個人感觸與公開內容轉錄）
31. `1904378657129009912` 2026年未来保命的修行忠告
32. `1900480149674188584` 对庞牧师的怀念与追思
33. `1905623892703216736` 尖毛草定律与厚积薄发的人生成长
34. `1900378267681216800` 销冠的催单封喉术：四招让客户停止犹豫快速成交
35. `1905623247384379840` 真正有本事的人会调成静音模式，大智若愚
36. `1900429853459558096` 艾罗访谈：外星生命对地球文明与宇宙的揭示
37. `1903762369050584104` 人生能量管理：从低电量到满格状态的指南
38. `1901441776745593912` 68条人性真相分享
39. `1904033043258630888` 记录是转运翻身最低成本的自我成长武器
40. `1899065664472756056` 庞牧师离世对我的影响与思考
41. `1902744775333850688` 摆脱恐惧，突破人生局限的终极密码
42. `1900430189540859688` 芒格的财富智慧：结构而非勤奋决定财富上限
43. `1901627674741896520` 现代政治中信任关系的崩塌与国家间承诺的讨论
44. `1901723571698458136` 宇宙全息理论解析：我们的世界可能是二维投影

---

## Phase 2 — Cowork 後續審查

不在本 handoff 範圍。Code 完成後 Cowork 接手做：

1. 對每筆 quarantine 設定 `quarantine.review_outcome`：
   - `restore_public`：公開內容轉錄（如馬斯克、辛頓、Claude Skills、芒格、宇宙全息）
   - `keep_private_internal`：Paul 私人感觸（如怀念庞牧师）
   - `delete`：商務會議錄音含公司名（02_醫療健康 大宗）
   - `redact_and_restore`：去識別化後恢復 public

2. 更新 Issue #157 incident 紀錄區段（Cowork 做）

3. 同步 memory（`project_llm_wiki_pipeline_fix_0423.md` 加 incident 結果）

---

## 回報格式（遵循護欄 #14，commit SHA 三態）

```
✅ Step 0.1 偵察 visibility filter: 實作位置 = {前端/Worker/兩者}
✅ Step 0.2 pre-quarantine state: 44/44 確認 public（或列出例外）
✅ Step 0.3 sources 總數: N pre, 預期 post = N - 44 + 4 = ?
✅ Step 1 quarantine: {processed} 已隔離 / {skipped} skip / {not_found} 未找到
✅ Step 1 audit log: worklogs/incidents/recording-quarantine-2026-04-26.md
✅ Step 2 KV 同步: {seed/purge/no-op}, 對帳結果
✅ Step 3 deploy: 新 build 確認生效（無痕視窗 spot-check 結果）
✅ Step 4 commit A: {SHA} pushed
✅ Step 4 commit B: {SHA} pushed (or n/a)

POST-QUARANTINE 對帳：
- src/content/wiki/sources/ 剩 X 個 public（原 N - 44 + 4 = ?，符合預期 / 不符）
- 前端 spot-check 3 隨機 quarantine URL: 全部 404/redirect ✓ / 異常 ✗
- KV 對帳: 不含 44 筆 raw_note_id ✓ / 異常 ✗

如有任何 Step 偏離預期，停下來在 commit message 解釋並等 Paul 回應。
```

---

## 本輪 metrics

INCIDENT response：1 個 quarantine script + 44 筆 frontmatter 改寫 + 1 份 audit log + 可能 1-2 個 KV/deploy 修正。預估改動範圍 ~50 個檔案（44 sources + 1 script + 1 audit + KV-related），但純逐筆 frontmatter 操作不動 schema、不動內容本體。
