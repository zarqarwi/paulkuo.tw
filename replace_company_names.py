#!/usr/bin/env python3
"""Replace SDTI/CircleFlow mentions with deidentified expressions across all languages."""

import os
import re
import glob

BASE = "src/content/articles"

# === ZH-TW REPLACEMENTS (ordered from most specific to least) ===
ZH_TW_REPLACEMENTS = [
    # Headings
    ("## 我在 SDTI 學到的一課", "## 我在經營公司時學到的一課"),
    ("## 從 SDTI 看到的轉型困境", "## 從經營公司看到的轉型困境"),
    ("## 在 SDTI 的一個小觀察", "## 在公司裡的一個小觀察"),
    ("## 在 SDTI 看到的", "## 在公司裡看到的"),
    
    # Abstract / FM patterns (SDTI + CircleFlow combos)
    ("經營 SDTI、在 CircleFlow 實際導入 AI 工作流程的經驗出發", "經營公司、實際導入 AI 工作流程的經驗出發"),
    ("我自己在 SDTI 和 CircleFlow 的經營過程中", "我自己在經營公司的過程中"),
    ("經營 SDTI、讀神學院、寫部落格、做諮詢", "經營公司、讀神學院、寫部落格、做諮詢"),
    ("從 SDTI 的品牌顧問經驗出發", "從品牌顧問經驗出發"),
    ("從 SDTI 服務客戶的經驗中", "從服務客戶的顧問經驗中"),
    ("SDTI 在疫情中的生存經驗印證了這一點", "我們團隊在疫情中的生存經驗印證了這一點"),
    ("SDTI 被迫全面遠端化的經驗出發", "團隊被迫全面遠端化的經驗出發"),
    ("疫情期間 SDTI 被迫全面遠端化", "疫情期間團隊被迫全面遠端化"),
    
    # Body patterns
    ("在我同時經營 SDTI、在神學院上課", "在我同時經營公司、在神學院上課"),
    ("我在經營 SDTI 的過程中", "我在經營公司的過程中"),
    ("在經營 SDTI 的過程中", "在經營公司的過程中"),
    ("我經營 SDTI 的過程中", "我經營公司的過程中"),
    ("我自己經營 SDTI 的那些年", "我自己經營公司的那些年"),
    ("我在 SDTI 工作的那些年", "我在公司工作的那些年"),
    ("在 SDTI 做數位轉型顧問的那些年", "做數位轉型顧問的那些年"),
    ("在 SDTI 做品牌顧問時的經驗", "做品牌顧問時的經驗"),
    ("在 SDTI 做策略顧問時反覆觀察到", "做策略顧問時反覆觀察到"),
    ("一個在 SDTI 做策略顧問時反覆觀察到的現象", "做策略顧問時反覆觀察到的一個現象"),
    ("這讓我想到一個在 SDTI 做策略顧問時反覆觀察到的現象", "這讓我想到做策略顧問時反覆觀察到的一個現象"),
    ("這讓我想到在 SDTI 做品牌顧問時的經驗", "這讓我想到做品牌顧問時的經驗"),
    ("我在 SDTI 的經驗非常具體", "我當時經營的公司，經驗非常具體"),
    ("SDTI 在疫情初期的經驗", "我們在疫情初期的經驗"),
    ("疫情後期，SDTI 逐漸找到了", "疫情後期，團隊逐漸找到了"),
    ("我在經營 SDTI 和 CircleFlow 的過程中", "我在經營公司的過程中"),
    
    # Remaining generic SDTI catches
    ("在 SDTI 的", "在公司的"),
    ("經營 SDTI", "經營公司"),
    ("SDTI的", "公司的"),
    ("SDTI 的", "公司的"),
    ("SDTI", "公司"),
    ("CircleFlow", "我們的 AI 平台"),
]

# === EN REPLACEMENTS ===
EN_REPLACEMENTS = [
    # Headings
    ("## A Lesson I Learned at SDTI", "## A Lesson I Learned Running My Company"),
    ("## The Transformation Dilemma Seen Through SDTI", "## The Transformation Dilemma I Saw Running a Company"),
    ("## A Small Observation at SDTI", "## A Small Observation at My Company"),
    ("## What I Saw at SDTI", "## What I Saw at My Company"),
    
    # Abstract patterns
    ("running SDTI and implementing AI workflows in CircleFlow", "running my company and implementing AI workflows"),
    ("running SDTI, attending seminary, blogging, and consulting", "running my company, attending seminary, blogging, and consulting"),
    ("brand consulting experience at SDTI", "brand consulting experience"),
    ("serving clients at SDTI", "serving clients in my consulting work"),
    ("watching SDTI shift entirely remote", "watching my team shift entirely remote"),
    ("SDTI's survival experience during the pandemic confirmed this point", "Our team's survival experience during the pandemic confirmed this point"),
    ("SDTI shift entirely remote during the pandemic", "my team shift entirely remote during the pandemic"),
    
    # Body patterns
    ("Running SDTI gave me", "Running my company gave me"),
    ("During my time managing SDTI", "During my time managing the company"),
    ("During my time running SDTI", "During my time running the company"),
    ("During my years doing digital transformation consulting at SDTI", "During my years doing digital transformation consulting"),
    ("In running SDTI", "In running my company"),
    ("In managing SDTI", "In managing my company"),
    ("During the years I ran SDTI", "During the years I ran my company"),
    ("During the period when I was simultaneously running SDTI", "During the period when I was simultaneously running my company"),
    ("working as a strategy consultant at SDTI", "working as a strategy consultant"),
    ("doing brand consulting at SDTI", "doing brand consulting"),
    ("During my years working at SDTI", "During my years running my company"),
    ("My experience at SDTI was very concrete", "My experience at the company I was running was very concrete"),
    ("SDTI's experience in the early pandemic", "Our experience in the early pandemic"),
    ("In the later stages of the pandemic, SDTI gradually found", "In the later stages of the pandemic, our team gradually found"),
    ("I deeply felt how", "I deeply felt how"),
    ("SDTI and CircleFlow", "my company"),
    
    # Generic catches
    ("at SDTI", "at my company"),
    ("SDTI", "my company"),
    ("CircleFlow", "our AI platform"),
]

# === JA REPLACEMENTS ===
JA_REPLACEMENTS = [
    # Headings
    ("## SDTI で学んだ一課", "## 会社経営で学んだ一課"),
    ("## SDTIの経営から見える転型困難", "## 会社経営から見える転型困難"),
    ("## SDTIでの小さな観察", "## 会社での小さな観察"),
    ("## SDTIで見たもの", "## 会社で見たもの"),
    
    # Abstract patterns
    ("SDTI の運営と CircleFlow への実際の AI ワークフロー導入経験から", "会社の運営と実際の AI ワークフロー導入経験から"),
    ("SDTI と CircleFlow の経営を通じて", "会社の経営を通じて"),
    ("SDTIの経営、神学校への通学、ブログ執筆、コンサルティング", "会社の経営、神学校への通学、ブログ執筆、コンサルティング"),
    ("SDTIでのブランドコンサルタント経験から", "ブランドコンサルタント経験から"),
    ("SDTIで顧客に仕えた経験から", "顧客に仕えたコンサルタント経験から"),
    ("パンデミック中のSDTIの生存経験はこの点を証明している", "パンデミック中の私たちのチームの生存経験はこの点を証明している"),
    ("SDTIが強制的に完全リモート化した経験から", "チームが強制的に完全リモート化した経験から"),
    
    # Body patterns
    ("SDTIの管理時代", "会社を経営していた時代"),
    ("SDTIでデジタル変革コンサルティングをしていた年間", "デジタル変革コンサルティングをしていた年間"),
    ("SDTIを経営する過程で", "会社を経営する過程で"),
    ("SDTIを経営する中で", "会社を経営する中で"),
    ("SDTIの経営と神学校の授業と定期的な執筆を同時にこなしていた時期", "会社の経営と神学校の授業と定期的な執筆を同時にこなしていた時期"),
    ("私がSDTIを運営していた年間", "私が会社を運営していた年間"),
    ("SDTIの経営プロセスで", "会社の経営プロセスで"),
    ("SDTIを運営していた時", "会社を運営していた時"),
    ("SDTIでの私の経験は非常に具体的だった", "当時経営していた会社での経験は非常に具体的だった"),
    ("SDTIは徐々に新しい仕事のリズムを見つけた", "チームは徐々に新しい仕事のリズムを見つけた"),
    ("パンデミック初期のSDTIの経験は", "パンデミック初期の私たちの経験は"),
    ("SDTIで戦略コンサルタントとして働いていた時代に", "戦略コンサルタントとして働いていた時代に"),
    ("SDTIでのブランドコンサルタント経験を思い出させた", "ブランドコンサルタント経験を思い出させた"),
    ("私がSDTIで働いていた年の間に", "私が会社で働いていた年の間に"),
    
    # Generic catches
    ("SDTIの", "会社の"),
    ("SDTIで", "会社で"),
    ("SDTIを", "会社を"),
    ("SDTI", "会社"),
    ("CircleFlow", "AIプラットフォーム"),
]

# === ZH-CN REPLACEMENTS ===
ZH_CN_REPLACEMENTS = [
    # Headings
    ("## 我在 SDTI 学到的一课", "## 我在经营公司时学到的一课"),
    ("## 从 SDTI 看到的转型困境", "## 从经营公司看到的转型困境"),
    ("## 在SDTI的一个小观察", "## 在公司里的一个小观察"),
    ("## 在SDTI看到的", "## 在公司里看到的"),
    
    # Abstract patterns
    ("经营 SDTI、在 CircleFlow 实际导入 AI 工作流程的经验出发", "经营公司、实际导入 AI 工作流程的经验出发"),
    ("我自己在 SDTI 和 CircleFlow 的经营过程中", "我自己在经营公司的过程中"),
    ("经营 SDTI、读神学院、写博客、做咨询", "经营公司、读神学院、写博客、做咨询"),
    ("从SDTI的品牌顾问经验出发", "从品牌顾问经验出发"),
    ("从SDTI服务客户的经验中", "从服务客户的顾问经验中"),
    ("SDTI在疫情中的生存经验印证了这一点", "我们团队在疫情中的生存经验印证了这一点"),
    ("SDTI被迫全面远端化的经验出发", "团队被迫全面远端化的经验出发"),
    ("疫情期间SDTI被迫全面远端化", "疫情期间团队被迫全面远端化"),
    
    # Body patterns
    ("在我同时经营 SDTI、在神学院上课", "在我同时经营公司、在神学院上课"),
    ("我在经营 SDTI 的过程中", "我在经营公司的过程中"),
    ("我在经营SDTI的过程中", "我在经营公司的过程中"),
    ("在经营 SDTI 的过程中", "在经营公司的过程中"),
    ("在经营SDTI的过程中", "在经营公司的过程中"),
    ("我经营 SDTI 的过程中", "我经营公司的过程中"),
    ("我经营SDTI的过程中", "我经营公司的过程中"),
    ("我自己经营SDTI的那些年", "我自己经营公司的那些年"),
    ("我在 SDTI 工作的那些年", "我在公司工作的那些年"),
    ("我在SDTI工作的那些年", "我在公司工作的那些年"),
    ("在SDTI做数字转型顾问的那些年", "做数字转型顾问的那些年"),
    ("在SDTI做品牌顾问时的经验", "做品牌顾问时的经验"),
    ("在SDTI做策略顾问时反覆观察到", "做策略顾问时反覆观察到"),
    ("这让我想到一个在SDTI做策略顾问时反覆观察到的现象", "这让我想到做策略顾问时反覆观察到的一个现象"),
    ("这让我想到在SDTI做品牌顾问时的经验", "这让我想到做品牌顾问时的经验"),
    ("我在SDTI的经验非常具体", "我当时经营的公司，经验非常具体"),
    ("SDTI在疫情初期的经验", "我们在疫情初期的经验"),
    ("疫情后期，SDTI逐渐找到了", "疫情后期，团队逐渐找到了"),
    
    # Generic catches
    ("在SDTI的", "在公司的"),
    ("在 SDTI 的", "在公司的"),
    ("经营 SDTI", "经营公司"),
    ("经营SDTI", "经营公司"),
    ("SDTI的", "公司的"),
    ("SDTI 的", "公司的"),
    ("SDTI", "公司"),
    ("CircleFlow", "我们的 AI 平台"),
]


def process_file(filepath, replacements):
    """Apply replacements to a file. Returns (changed, count)."""
    if not os.path.exists(filepath):
        return False, 0
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    count = 0
    
    for old, new in replacements:
        if old in content:
            occurrences = content.count(old)
            content = content.replace(old, new)
            count += occurrences
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, count
    
    return False, 0


def main():
    total_files = 0
    total_replacements = 0
    
    # Process zh-tw (root level .md files)
    print("=== Processing zh-tw ===")
    for f in sorted(glob.glob(os.path.join(BASE, "*.md"))):
        changed, count = process_file(f, ZH_TW_REPLACEMENTS)
        if changed:
            print(f"  ✅ {os.path.basename(f)} ({count} replacements)")
            total_files += 1
            total_replacements += count
    
    # Process en
    print("\n=== Processing en ===")
    for f in sorted(glob.glob(os.path.join(BASE, "en", "*.md"))):
        changed, count = process_file(f, EN_REPLACEMENTS)
        if changed:
            print(f"  ✅ {os.path.basename(f)} ({count} replacements)")
            total_files += 1
            total_replacements += count
    
    # Process ja
    print("\n=== Processing ja ===")
    for f in sorted(glob.glob(os.path.join(BASE, "ja", "*.md"))):
        changed, count = process_file(f, JA_REPLACEMENTS)
        if changed:
            print(f"  ✅ {os.path.basename(f)} ({count} replacements)")
            total_files += 1
            total_replacements += count
    
    # Process zh-cn
    print("\n=== Processing zh-cn ===")
    for f in sorted(glob.glob(os.path.join(BASE, "zh-cn", "*.md"))):
        changed, count = process_file(f, ZH_CN_REPLACEMENTS)
        if changed:
            print(f"  ✅ {os.path.basename(f)} ({count} replacements)")
            total_files += 1
            total_replacements += count
    
    print(f"\n=== DONE: {total_files} files, {total_replacements} replacements ===")
    
    # Verify no remaining mentions
    print("\n=== Verification: remaining SDTI/CircleFlow mentions ===")
    remaining = 0
    for root, dirs, files in os.walk(BASE):
        for fname in files:
            if fname.endswith('.md'):
                fpath = os.path.join(root, fname)
                with open(fpath, 'r', encoding='utf-8') as fh:
                    lines = fh.readlines()
                for i, line in enumerate(lines, 1):
                    if 'SDTI' in line or 'CircleFlow' in line:
                        relpath = os.path.relpath(fpath, BASE)
                        print(f"  ⚠️  {relpath}:{i}: {line.strip()[:100]}")
                        remaining += 1
    
    if remaining == 0:
        print("  ✅ Zero remaining mentions!")
    else:
        print(f"  ⚠️  {remaining} mentions still remaining")


if __name__ == "__main__":
    main()
