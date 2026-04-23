#!/usr/bin/env python3
"""
localize-en-tags.py

Translate Chinese tags in src/content/articles/en/ frontmatter to English.
Idempotent: already-English tags are left untouched.
"""
import os
import re
import sys

EN_DIR = "src/content/articles/en"

# Comprehensive Chinese→English tag mapping
TAG_MAP = {
    # AI / Technology
    "AI趨勢": "AI Trends",
    "AI 趨勢": "AI Trends",
    "AI協作": "AI Collaboration",
    "AI 協作": "AI Collaboration",
    "AI治理": "AI Governance",
    "AI 治理": "AI Governance",
    "AI協作開發": "AI-Assisted Development",
    "AI 協作開發": "AI-Assisted Development",
    "AI基礎設施": "AI Infrastructure",
    "AI 基礎設施": "AI Infrastructure",
    "AI學習": "AI Learning",
    "AI 學習": "AI Learning",
    "AI教育": "AI Education",
    "AI 教育": "AI Education",
    "AI決策": "AI Decision Making",
    "AI 決策": "AI Decision Making",
    "AI生產力": "AI Productivity",
    "AI 生產力": "AI Productivity",
    "AI能力": "AI Capability",
    "AI 能力": "AI Capability",
    "AI代理": "AI Agent",
    "AI倫理": "AI Ethics",
    "AI安全": "AI Safety",
    "AI對話": "AI Dialogue",
    "AI就業衝擊": "AI Employment Impact",
    "AI意識": "AI Consciousness",
    "AI應用": "AI Applications",
    "AI時代": "AI Era",
    "AI架構": "AI Architecture",
    "AI 架構": "AI Architecture",
    "AI素養": "AI Literacy",
    "AI經濟": "AI Economy",
    "AI 經濟": "AI Economy",
    "AI經濟衝擊": "AI Economic Impact",
    "AI與信仰": "AI and Faith",
    "AI訓練": "AI Training",
    "AI輔助開發": "AI-Assisted Development",
    "AI 輔助開發": "AI-Assisted Development",
    "AI轉型": "AI Transformation",
    "AI 轉型": "AI Transformation",
    "AI暴露度": "AI Exposure",
    "生成式AI": "Generative AI",
    "主權 AI": "Sovereign AI",
    "通用人工智慧": "AGI",
    "多代理系統": "Multi-Agent Systems",
    "能動智能體": "Agentic AI",
    "後程式碼時代": "Post-Code Era",
    "可解釋性": "Explainability",
    "鋸齒狀智慧": "Jagged Intelligence",
    "演算力": "Computational Power",
    "量子計算": "Quantum Computing",

    # Human-AI Collaboration / Work
    "人機協作": "Human-AI Collaboration",
    "超級個體": "Super Individual",
    "半人馬模式": "Centaur Model",
    "具身智慧": "Embodied Intelligence",
    "建構者": "Builder",
    "角色軍團": "Role Legion",
    "角色定位": "Role Positioning",
    "五維框架": "Five-Dimension Framework",
    "基準測試": "Benchmark Testing",
    "評分系統": "Scoring System",

    # Business / Work
    "創業心態": "Entrepreneurial Mindset",
    "業務開發": "Business Development",
    "專案管理": "Project Management",
    "企業管理": "Enterprise Management",
    "企業人才評估": "Talent Assessment",
    "個人品牌": "Personal Brand",
    "個人品牌網站": "Personal Brand Website",
    "個人定位": "Personal Positioning",
    "個人戰略": "Personal Strategy",
    "商業企劃": "Business Planning",
    "商業反思": "Business Reflection",
    "商業轉型": "Business Transformation",
    "勞動市場": "Labor Market",
    "組織轉型": "Organizational Transformation",
    "組織協作": "Organizational Collaboration",
    "組織行為": "Organizational Behavior",
    "組織變革": "Organizational Change",
    "組織重構": "Organizational Restructuring",
    "組織僵化": "Organizational Rigidity",
    "平台勞動": "Platform Labor",
    "平台設計": "Platform Design",
    "平台霸權": "Platform Hegemony",
    "平台依賴": "Platform Dependency",
    "平台經濟": "Platform Economy",
    "知識工作變革": "Knowledge Work Transformation",
    "工作流設計": "Workflow Design",
    "工作趨勢指數": "Work Trend Index",
    "管線思維": "Pipeline Thinking",
    "績效衡量": "Performance Measurement",
    "案例研究": "Case Study",
    "模組化": "Modularization",
    "程式開發": "Software Development",
    "開發紀實": "Development Log",
    "開發紀錄": "Development Record",
    "流程設計": "Process Design",
    "前沿公司": "Frontier Company",
    "創新阻力": "Innovation Resistance",
    "危機意識": "Crisis Awareness",
    "斜槓": "Slash Career",
    "斜槓青年": "Slash Generation",
    "職場轉型": "Workplace Transformation",

    # Personal Development
    "風險管理": "Risk Management",
    "自動化": "Automation",
    "時間管理": "Time Management",
    "紀律": "Discipline",
    "謙卑": "Humility",
    "自律": "Self-Discipline",
    "自主管理": "Self-Management",
    "自我修煉": "Self-Cultivation",
    "自我剝削": "Self-Exploitation",
    "自我反思": "Self-Reflection",
    "自我管理": "Self-Management",
    "批判思維": "Critical Thinking",
    "思維訓練": "Mental Training",
    "人性判斷": "Human Judgment",
    "人性考驗": "Test of Character",
    "情緒教育": "Emotional Education",
    "同理心": "Empathy",
    "感恩": "Gratitude",
    "提問力": "Questioning Ability",
    "提問能力": "Questioning Ability",
    "篩選思維": "Filter Thinking",
    "判斷力": "Judgment",
    "識人": "Character Assessment",
    "品味": "Aesthetic Sensibility",
    "成長系統": "Growth Systems",
    "最小可行循環": "Minimum Viable Loop",
    "持續優化迴圈": "Continuous Optimization Loop",
    "動力三角": "Motivation Triangle",
    "節奏權": "Pace Control",
    "恐懼": "Fear",
    "成功的反思": "Reflections on Success",

    # Geopolitics / Society
    "地緣政治": "Geopolitics",
    "地緣策略": "Geostrategy",
    "台灣 ESG": "Taiwan ESG",
    "台灣企業": "Taiwan Business",
    "台灣教會": "Taiwan Church",
    "台灣文化策略": "Taiwan Cultural Strategy",
    "台灣法律": "Taiwan Law",
    "台灣產業": "Taiwan Industry",
    "台日合作": "Taiwan-Japan Cooperation",
    "台日半導體合作": "Taiwan-Japan Semiconductor Cooperation",
    "半導體": "Semiconductor",
    "中美博弈": "US-China Competition",
    "中國品牌": "Chinese Brands",
    "數位主權": "Digital Sovereignty",
    "技術主權": "Technological Sovereignty",
    "技術自主": "Technological Autonomy",
    "語言主權": "Linguistic Sovereignty",
    "能量主權": "Energy Sovereignty",
    "身體主權": "Bodily Sovereignty",
    "文化話語權": "Cultural Discourse Power",
    "民主決策": "Democratic Decision-Making",
    "公民慢審": "Deliberative Democracy",
    "制度設計": "Institutional Design",
    "社會信用系統": "Social Credit System",

    # Philosophy / Theology
    "存在主義": "Existentialism",
    "哲學": "Philosophy",
    "神學": "Theology",
    "神學反思": "Theological Reflection",
    "神學思考": "Theological Thinking",
    "否定神學": "Apophatic Theology",
    "宗教批判": "Religious Critique",
    "宗教改革": "Reformation",
    "宗教群聚": "Religious Community",
    "恩典": "Grace",
    "信仰": "Faith",
    "信仰反思": "Faith Reflection",
    "信仰邊界": "Faith Boundaries",
    "苦難": "Suffering",
    "生死": "Life and Death",
    "道成肉身": "Incarnation",
    "結構性的罪": "Structural Sin",
    "聖經詮釋": "Biblical Interpretation",
    "功德論": "Merit Theory",
    "基要主義": "Fundamentalism",
    "科學主義": "Scientism",
    "理性主義": "Rationalism",
    "否證主義": "Falsificationism",
    "否證論": "Falsificationism",
    "公共神學": "Public Theology",
    "生活哲學": "Life Philosophy",
    "敬畏": "Reverence",
    "典範轉移": "Paradigm Shift",
    "主體性": "Subjectivity",
    "人工主體性": "Artificial Subjectivity",
    "去神話化": "Demystification",
    "同婚": "Same-Sex Marriage",

    # Economy / Finance
    "循環經濟": "Circular Economy",
    "成癮經濟": "Addiction Economy",
    "注意力經濟": "Attention Economy",
    "流量變現": "Traffic Monetization",
    "信任經濟": "Trust Economy",
    "知識經濟": "Knowledge Economy",
    "總體經濟": "Macroeconomics",
    "經濟結構": "Economic Structure",
    "金融海嘯": "Financial Crisis",
    "金融危機": "Financial Crisis",
    "量化寬鬆": "Quantitative Easing",
    "敘事經濟學": "Narrative Economics",
    "比特幣": "Bitcoin",
    "數位貨幣": "Digital Currency",
    "金本位制度": "Gold Standard",
    "市場崩盤": "Market Crash",
    "市場觀察": "Market Observation",
    "投資心理": "Investment Psychology",
    "投資思維": "Investment Thinking",
    "資產輕量化": "Asset Optimization",
    "消費主義": "Consumerism",
    "菁英主義": "Elitism",

    # Education
    "教育反思": "Education Reflection",
    "教育哲學": "Educational Philosophy",
    "教育實踐": "Educational Practice",
    "教育資源": "Educational Resources",
    "教育轉型": "Educational Transformation",
    "自學教育": "Self-Directed Learning",
    "非學校型態實驗教育": "Alternative Education",
    "遠距教學": "Remote Teaching",
    "停課不停學": "Continuous Learning",
    "群育": "Social Education",
    "人文素養": "Humanistic Education",
    "人文負熵": "Humanistic Negentropy",

    # Digital / Media
    "演算法": "Algorithm",
    "演算法崇拜": "Algorithm Worship",
    "演算法治理": "Algorithm Governance",
    "演算法調整": "Algorithm Adjustment",
    "演算法偏好": "Algorithm Preference",
    "數位人格": "Digital Identity",
    "數位協作": "Digital Collaboration",
    "數位孿生": "Digital Twin",
    "數位殖民": "Digital Colonization",
    "數位監控": "Digital Surveillance",
    "數位行銷": "Digital Marketing",
    "數位記憶": "Digital Memory",
    "數位轉型": "Digital Transformation",
    "數位落差": "Digital Divide",
    "數位足跡": "Digital Footprint",
    "數位軌跡": "Digital Footprint",
    "數位分身": "Digital Avatar",
    "數據監控": "Data Surveillance",
    "GPS 追蹤": "GPS Tracking",
    "結構化資料": "Structured Data",
    "網站優化": "Website Optimization",
    "網站流量分析": "Website Analytics",
    "網路爬蟲": "Web Scraping",
    "網路生態": "Web Ecosystem",
    "遊戲化設計": "Gamification",
    "資訊不對稱": "Information Asymmetry",
    "資訊消費": "Information Consumption",
    "資訊通透": "Information Transparency",
    "隱私邊界": "Privacy Boundaries",
    "社群比較": "Social Media Comparison",
    "社群演算法": "Social Media Algorithm",
    "社群觀察": "Social Media Observation",
    "媒體素養": "Media Literacy",
    "媒體識讀": "Media Literacy",
    "媒體議程": "Media Agenda",
    "語言哲學": "Philosophy of Language",
    "語言的局限": "Limits of Language",
    "敘事框架": "Narrative Framework",
    "第三次資訊革命": "Third Information Revolution",
    "鏡像世界": "Mirror World",

    # Environment / Sustainability
    "氣候韌性": "Climate Resilience",
    "永續生活": "Sustainable Living",
    "永續行動": "Sustainable Action",
    "碳足跡": "Carbon Footprint",
    "供應鏈碳足跡": "Supply Chain Carbon Footprint",
    "範疇三": "Scope 3",
    "加州碳揭露法": "California Carbon Disclosure Law",
    "能源": "Energy",
    "能源本位": "Energy Standard",
    "台灣著作權法": "Taiwan Copyright Law",
    "著作權": "Copyright",
    "文本與資料探勘": "Text and Data Mining",
    "轉化性合理使用": "Transformative Fair Use",

    # Society / Culture
    "世代差異": "Generational Differences",
    "世代觀察": "Generational Observation",
    "孤獨世代": "Lonely Generation",
    "倦怠社會": "Burnout Society",
    "功績主義": "Meritocracy",
    "功績社會": "Achievement Society",
    "效率主義": "Efficiency Obsession",
    "液態現代性": "Liquid Modernity",
    "積極性暴力": "Achievement Violence",
    "全天候經濟": "Always-On Economy",
    "全天候運作": "Always-On Operations",
    "社會倫理": "Social Ethics",
    "社會影響力": "Social Impact",
    "社會智能": "Social Intelligence",
    "社會正義": "Social Justice",
    "社會流動": "Social Mobility",
    "社會理性": "Social Rationality",
    "社會觀察": "Social Observation",
    "溫和對抗": "Gentle Resistance",
    "溫和的對抗": "Gentle Resistance",
    "公平": "Fairness",
    "集體焦慮": "Collective Anxiety",
    "集體人類意識": "Collective Human Consciousness",
    "群體心理": "Group Psychology",
    "青年": "Youth",
    "白領失業": "White-Collar Unemployment",
    "平台設計": "Platform Design",

    # Intellectual / Academic
    "認知科學": "Cognitive Science",
    "認知謙卑": "Cognitive Humility",
    "知識管理": "Knowledge Management",
    "知識焦慮": "Knowledge Anxiety",
    "知識邊界": "Knowledge Boundaries",
    "閱讀筆記": "Reading Notes",
    "生命軌跡": "Life Trajectory",
    "歷史脈絡": "Historical Context",
    "歷史轉折": "Historical Turning Point",
    "文明指標": "Civilization Indicators",
    "文明紅利": "Civilization Dividend",
    "文明轉折": "Civilization Turning Point",
    "文明的邏輯": "Logic of Civilization",
    "系統思維": "Systems Thinking",
    "系統思考": "Systems Thinking",
    "跨域思考": "Cross-Domain Thinking",
    "跨界溝通": "Cross-Boundary Communication",
    "人月神話": "Mythical Man-Month",
    "人類智慧": "Human Intelligence",
    "人類學": "Anthropology",
    "人際關係": "Interpersonal Relationships",
    "意義建構": "Sense-Making",
    "熵增": "Entropy Increase",
    "負熵": "Negentropy",
    "熵與負熵": "Entropy and Negentropy",
    "雙系統理論": "Dual Process Theory",
    "遷移學習": "Transfer Learning",
    "遷移思維": "Transfer Thinking",
    "不確定性": "Uncertainty",
    "矛盾": "Contradiction",
    "真實": "Authenticity",
    "秩序設計": "Order Design",
    "秩序選擇": "Order Selection",
    "秩序重建": "Order Reconstruction",
    "穀倉效應": "Silo Effect",
    "時代浪潮": "Tide of the Times",
    "未來預測": "Future Prediction",
    "人的量化": "Quantifying People",

    # Personal / Family
    "家庭關係": "Family Relationships",
    "家長角色": "Parenting Role",
    "母親": "Motherhood",
    "心理學": "Psychology",
    "心理寄託": "Psychological Anchor",
    "心理素質": "Psychological Resilience",
    "愛與失去": "Love and Loss",
    "疫情反思": "Pandemic Reflection",
    "疫情啟示": "Pandemic Insights",
    "疫情衝擊": "Pandemic Impact",
    "幸福定義": "Definition of Happiness",
    "生命哲學": "Philosophy of Life",
    "精神獨立": "Spiritual Independence",
    "在絕望之巔": "At the Peak of Despair",

    # Brand / People Names (use standard English)
    "黃仁勳": "Jensen Huang",
    "凱文凱利": "Kevin Kelly",
    "韓炳哲": "Byung-Chul Han",
    "齊奧朗": "Cioran",
    "齊格蒙·包曼": "Zygmunt Bauman",
    "包曼": "Bauman",
    "萊茵霍爾德·尼布爾": "Reinhold Niebuhr",
    "尼布爾": "Niebuhr",
    "卡爾·波普爾": "Karl Popper",
    "桑德爾": "Michael Sandel",
    "傅柯": "Foucault",
    "羅伯特·希勒": "Robert Shiller",
    "納西姆·塔勒布": "Nassim Taleb",
    "陳志武": "Chen Zhiwu",
    "薛丁格": "Schrödinger",
    "腓特烈三世": "Frederick III",
    "詹姆斯·范·吉倫": "James K.A. Smith",
    "偽丟尼修": "Pseudo-Dionysius",
    "邁斯特·艾克哈特": "Meister Eckhart",
    "鄭浪平": "Zheng Langping",
    "教宗良十三世": "Pope Leo XIII",
    "教宗良十四世": "Pope Leo XIV",
    "使徒保羅": "Apostle Paul",
    "微軟": "Microsoft",
    "大疆": "DJI",
    "李子柒": "Li Ziqi",
    "資生堂": "Shiseido",
    "蜜雪冰城": "Mixue",
    "故宮文創": "National Palace Museum Creative",
    "白沙屯媽祖": "Baishatun Mazu",
    "阿哥拉廣場": "Agora",

    # Tech/Tools
    "辯論引擎": "Debate Engine",
    "提示工程": "Prompt Engineering",
    "遠距工作": "Remote Work",
    "2030展望": "2030 Outlook",
    "黑天鵝": "Black Swan",
    "黑天鵝事件": "Black Swan Event",
    "鐵人三項": "Triathlon",

    # Industry
    "產業分析": "Industry Analysis",
    "產業聚落": "Industrial Cluster",
    "產業角色": "Industry Role",
    "日本企業": "Japanese Business",
    "史丹佛研究": "Stanford Research",
    "品牌價值": "Brand Value",
    "品牌哲學": "Brand Philosophy",
    "品牌國際化": "Brand Internationalization",
    "品牌定調": "Brand Positioning",
    "流量變現": "Traffic Monetization",
    "業務開發": "Business Development",
    "個人品牌": "Personal Brand",

    # Additional tags
    "價值判斷": "Value Judgment",
    "價值重定義": "Redefining Value",
    "團隊合作": "Teamwork",
    "教會倫理": "Church Ethics",
    "權力結構": "Power Structures",
    "產品評估": "Product Evaluation",
    "科技倫理": "Technology Ethics",
    "科技批判": "Technology Critique",
    "科技推力": "Technology Push",
    "行動力": "Agency",
    "裸露語言": "Raw Language",
    "講道": "Preaching",
    "資源依賴": "Resource Dependency",
    "資源再配置": "Resource Reallocation",
    "風格": "Style",

    # Misc
    "台灣": "Taiwan",
    "推背圖": "Tuibei Prophecy",
    "1995 閏八月預言": "1995 Leap Month Prophecy",
    "在絕望之巔": "At the Peak of Despair",
    "五維框架": "Five-Dimension Framework",
    "能源本位": "Energy Standard",
    "數位行銷": "Digital Marketing",
    "資訊通透": "Information Transparency",
    "穀倉效應": "Silo Effect",
}


def has_chinese(s):
    return any('\u4e00' <= c <= '\u9fff' for c in s)


def translate_tag(tag):
    """Return English translation or original if already English / unmapped."""
    if not has_chinese(tag):
        return tag
    return TAG_MAP.get(tag, tag)  # keep original if unmapped


def process_file(path, dry_run=False):
    with open(path, encoding='utf-8') as f:
        content = f.read()

    if not content.startswith('---'):
        return False

    end_fm = content.index('---', 3)
    fm = content[3:end_fm]
    body = content[end_fm:]

    in_tags = False
    lines = fm.split('\n')
    new_lines = []
    changed = False
    seen_tags = set()

    for line in lines:
        if re.match(r'^tags:', line):
            in_tags = True
            seen_tags = set()
            new_lines.append(line)
            continue

        if in_tags:
            m = re.match(r'^(\s+-\s+)(.*)', line)
            if m:
                prefix, tag = m.group(1), m.group(2).strip()
                translated = translate_tag(tag)
                # Deduplicate after translation
                if translated.lower() in seen_tags:
                    changed = True  # removing a line counts as change
                    continue
                seen_tags.add(translated.lower())
                if translated != tag:
                    # Quote if contains special YAML chars
                    if any(c in translated for c in ':[]{}#&*!|>\'"%@`'):
                        translated = f'"{translated}"'
                    new_line = f'{prefix}{translated}'
                    new_lines.append(new_line)
                    changed = True
                    continue
            elif line and not line.startswith(' '):
                in_tags = False

        new_lines.append(line)

    if not changed:
        return False

    new_fm = '\n'.join(new_lines)
    new_content = '---' + new_fm + body

    if not dry_run:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)

    return True


def main():
    dry_run = '--dry-run' in sys.argv
    files = sorted(f for f in os.listdir(EN_DIR) if f.endswith('.md'))
    updated = []
    skipped_unmapped = []

    for fname in files:
        path = os.path.join(EN_DIR, fname)
        result = process_file(path, dry_run=dry_run)
        if result:
            updated.append(fname)

    # Report truly unmapped Chinese tags (not in TAG_MAP)
    all_unmapped = set()
    for fname in files:
        path = os.path.join(EN_DIR, fname)
        with open(path, encoding='utf-8') as f:
            content = f.read()
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not fm_match:
            continue
        fm = fm_match.group(1)
        in_tags = False
        for line in fm.split('\n'):
            if line.startswith('tags:'):
                in_tags = True
                continue
            if in_tags:
                if re.match(r'^\s+-\s+', line):
                    tag = re.match(r'^\s+-\s+(.*)', line).group(1).strip()
                    if has_chinese(tag) and tag not in TAG_MAP:
                        all_unmapped.add(tag)
                elif line and not line.startswith(' '):
                    in_tags = False

    mode = '[DRY RUN] ' if dry_run else ''
    print(f'{mode}Updated: {len(updated)} files')
    if updated:
        for f in updated:
            print(f'  ✅ {f}')
    if all_unmapped:
        print(f'\n⚠️  {len(all_unmapped)} unmapped Chinese tags (still in files):')
        for t in sorted(all_unmapped):
            print(f'  - {t}')
    else:
        print('\n✅ All Chinese tags translated.')


if __name__ == '__main__':
    main()
