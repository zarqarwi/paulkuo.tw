# v5.1 規劃源頭事實驗證 — 2026-04-18

## 驗證緣起

依 docs/governance/working-environment.md §2.6「源頭事實清單」規範，v5.1 規劃 rev1 前置驗證。

## §2.1 Skill 檔案現況

```
$ wc -l .claude/skills/session-handoff/SKILL.md
     553 .claude/skills/session-handoff/SKILL.md

$ awk '/^> \*\*v/{start=NR} start && /^---$/{print NR-start+1; exit}' .claude/skills/session-handoff/SKILL.md
4

$ ls -1 .claude/skills/ | grep -v "^\." | wc -l
       5

$ wc -l .claude/skills/*/SKILL.md 2>/dev/null | sort -rn
1046 total
     553 .claude/skills/session-handoff/SKILL.md
     154 .claude/skills/wiki-ingest/SKILL.md
     121 .claude/skills/cross-project-impact/SKILL.md
     113 .claude/skills/formosa-feedback-triage/SKILL.md
     105 .claude/skills/wiki-lint/SKILL.md
```

## §2.2 護欄引用散佈

```
$ grep -rnE "護欄\s*#[0-9]+|鐵律\s*#[0-9]+" worklogs/ handoffs/ docs/governance/ 2>/dev/null | wc -l
      42

$ grep -rhoE "#[0-9]+" <(grep -rE "護欄\s*#[0-9]+|鐵律\s*#[0-9]+" worklogs/ handoffs/ docs/governance/ 2>/dev/null) | sort -u
#1
#11
#12
#13
#14
#15
#16
#17
#170
#18
#3
#4

$ grep -cE "^#### #[0-9]+|^### #[0-9]+|^## #[0-9]+" .claude/skills/session-handoff/SKILL.md
0
```

## §2.3 Retro / Investigations 既有檔案

```
$ ls -la worklogs/investigations/ 2>/dev/null
total 8
drwxr-xr-x@   3 apple  staff    96 Apr 18 05:21 .
drwxr-xr-x  195 apple  staff  6240 Apr 18 05:52 ..
-rw-r--r--@   1 apple  staff  1978 Apr 18 00:38 2026-04-17-skill-schema-lint-baseline.md

$ ls -la docs/governance/ 2>/dev/null
total 56
drwxr-xr-x@  4 apple  staff    128 Apr 18 05:52 .
drwxr-xr-x@ 19 apple  staff    608 Apr 18 05:52 ..
-rw-r--r--@  1 apple  staff   2166 Apr 18 00:41 retrospective-2026-04-18-v5-split-reversal.md
-rw-------   1 apple  staff  21662 Apr 18 06:16 working-environment.md

$ grep -rlE "跨.?Cowork|撞車|cross.cowork|collision" worklogs/ docs/governance/ handoffs/ 2>/dev/null
worklogs/worklog-2026-04-18.md
worklogs/cowork--next-session-handoff-2026-04-10.md
worklogs/code--governance-framework-phase1-2026-04-09.md
worklogs/worklog-2026-04-17 2.md
worklogs/governance-framework-spec.md
handoffs/cowork--session-handoff-v5-1-planning-rev1-2026-04-18.md
handoffs/code--v5-1-source-verification-2026-04-18.md
handoffs/chat--session-handoff-v5-planning-2026-04-17.md
handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md
```

## §2.4 治理上界現況

```
$ wc -l CLAUDE.md
     245 CLAUDE.md

$ wc -l docs/governance/working-environment.md
     408 docs/governance/working-environment.md

$ for f in .claude/skills/*/SKILL.md; do
>   if head -1 "$f" | grep -q "^---$"; then
>     echo "OK: $f"
>   else
>     echo "MISSING: $f"
>   fi
> done
OK: .claude/skills/cross-project-impact/SKILL.md
OK: .claude/skills/formosa-feedback-triage/SKILL.md
OK: .claude/skills/session-handoff/SKILL.md
OK: .claude/skills/wiki-ingest/SKILL.md
OK: .claude/skills/wiki-lint/SKILL.md
```

## §2.5 Git 歷史參照

```
$ ls -1 handoffs/*.md 2>/dev/null | wc -l
      38

$ ls -1t handoffs/*.md 2>/dev/null | tail -1
handoffs/code--event-branding-mazu-today-2026-03-31.md

$ git log --all --format='%H %s' -- .claude/skills/session-handoff/SKILL.md | head -5
ec71e1799c60aee979b6291af7d9516f173888f8 chore(skills): add frontmatter to 3 skills [影響: skill governance only]
4487e8998ea09fb52e955a2be88543802dbf6153 docs: 更新 CLAUDE.md + session-handoff SKILL + launch.json
25813e03b850b944c96f9f37444eaaa374e586a8 fix: session-handoff v4.8 — 移除殘留 Apple Notes 引用，儀表板一律 GitHub Issue
6f0927ea9b3362ce4757782d11513f7307cb4a9c chore: session-handoff v4.7 worklog 三維度必填
7f65dd7b5219f257a3980f811cbc48e865fd92f2 chore: governance automation + session-handoff v4.6 [影響: 治理框架]

$ git log --all --format='%H' -- .claude/skills/session-handoff/SKILL.md | while read h; do
>   size=$(git show "$h:.claude/skills/session-handoff/SKILL.md" 2>/dev/null | wc -l)
>   echo "$h $size"
> done | sort -k2 -rn | head -3
ec71e1799c60aee979b6291af7d9516f173888f8      553
4487e8998ea09fb52e955a2be88543802dbf6153      522
25813e03b850b944c96f9f37444eaaa374e586a8      484
```

## 執行者備註

- §2.2a/b：背景指令延遲完成，初版報告誤記為 0。實際結果：42 筆引用，12 個唯一編號（#1, #3, #4, #11–#18, #170）。注意 #170 可能為「護欄 #17」的誤匹配（正文有「0」接在後面），Cowork 可自行判斷。
- §2.2c：grep 搜尋 SKILL.md 內 `^#### #N` / `^### #N` / `^## #N` 格式，輸出為 0。護欄目前非此 heading 格式標記，實際格式待 Cowork 核對 SKILL.md 內容確認。
- §2.3c：背景指令延遲完成，初版報告誤記為空。實際找到 9 個相關檔案（含本 handoff 自身與本 worklog，因內文提及「撞車」等關鍵字）。
- §2.5b 最舊 handoff 檔案：`handoffs/code--event-branding-mazu-today-2026-03-31.md`（依 ls -1t 排序，tail -1 取最舊）。
