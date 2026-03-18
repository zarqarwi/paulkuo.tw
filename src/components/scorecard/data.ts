import type { Dimension, GateQuestion, VetoCondition, BuilderSignal, StageInfo, VerdictInfo, Lang } from './types';

export const STAGES: StageInfo[] = [
  { id: 'concept', label: { 'zh-TW': '概念期', en: 'Concept' }, desc: { 'zh-TW': '還在構想或做 MVP，尚未公開', en: 'Still ideating or building MVP, not yet public' } },
  { id: 'launched', label: { 'zh-TW': '已上線', en: 'Launched' }, desc: { 'zh-TW': '已公開可用，但還沒有穩定用戶', en: 'Publicly available but no stable user base yet' } },
  { id: 'users', label: { 'zh-TW': '有用戶', en: 'Has Users' }, desc: { 'zh-TW': '有外部用戶持續使用', en: 'External users actively using the product' } },
  { id: 'revenue', label: { 'zh-TW': '有收入', en: 'Has Revenue' }, desc: { 'zh-TW': '已開始產生收入', en: 'Generating revenue' } },
];

export const BUILDER_SIGNALS: BuilderSignal[] = [
  { id: 'bp1', label: { 'zh-TW': 'AI 工具槓桿率', en: 'AI Leverage' }, desc: { 'zh-TW': '你用 AI 能做到幾人份的產出？', en: 'How many people\'s worth of output can you achieve with AI?' } },
  { id: 'bp2', label: { 'zh-TW': '技術棧掌控度', en: 'Tech Stack Mastery' }, desc: { 'zh-TW': '核心環節能否獨立除錯？', en: 'Can you independently debug core components?' } },
  { id: 'bp3', label: { 'zh-TW': '時間可持續性', en: 'Time Sustainability' }, desc: { 'zh-TW': '這個產品每週佔多少時間？會不會擠壓其他收入？', en: 'How much weekly time does this take? Does it squeeze other income?' } },
];

export const DIMENSIONS: Dimension[] = [
  {
    id: 'A', name: { 'zh-TW': '問題解決力', en: 'Problem-Solution Fit' }, nameEn: 'Problem-Solution Fit',
    weight: 25, color: '#2563eb', icon: '🎯',
    principle: { 'zh-TW': '你解決的問題夠痛嗎？你的解法夠好嗎？', en: 'Is the problem painful enough? Is your solution good enough?' },
    signals: [
      { id: 'a1', label: { 'zh-TW': '問題真實性', en: 'Problem Authenticity' }, desc: { 'zh-TW': '你解決的問題，是你自己假想的還是真的有人在痛？', en: 'Is the problem you\'re solving real, or just your assumption?' }, strong: { 'zh-TW': '≥5 人獨立描述過這個痛點', en: '≥5 people independently described this pain point' }, weak: { 'zh-TW': '只有你自己覺得需要', en: 'Only you think it\'s needed' } },
      { id: 'a2', label: { 'zh-TW': '現有替代方案', en: 'Existing Alternatives' }, desc: { 'zh-TW': '目標用戶現在怎麼解決這個問題？', en: 'How do target users currently solve this problem?' }, strong: { 'zh-TW': '現有方案極度痛苦或不存在', en: 'Existing solutions are extremely painful or nonexistent' }, weak: { 'zh-TW': '已有好用的免費方案', en: 'Good free solutions already exist' } },
      { id: 'a3', label: { 'zh-TW': '解法匹配度', en: 'Solution Fit' }, desc: { 'zh-TW': '你的產品是否真的解決了那個問題（而不是旁邊的問題）？', en: 'Does your product actually solve that problem (not a different one)?' }, strong: { 'zh-TW': '用戶說「這正是我需要的」', en: 'Users say "this is exactly what I need"' }, weak: { 'zh-TW': '功能很多但核心痛點沒解決', en: 'Many features but core pain unresolved' } },
      { id: 'a4', label: { 'zh-TW': '10x 改善', en: '10x Improvement' }, desc: { 'zh-TW': '比起現有方案，你的解法好多少？', en: 'How much better is your solution vs. existing ones?' }, strong: { 'zh-TW': '至少好 10 倍（可量化）', en: 'At least 10x better (quantifiable)' }, weak: { 'zh-TW': '略好，不值得用戶改變習慣', en: 'Slightly better, not worth switching' } },
      { id: 'a5', label: { 'zh-TW': '目標用戶清晰度', en: 'Target User Clarity' }, desc: { 'zh-TW': '你能用一句話說出「誰」會用這個產品嗎？', en: 'Can you describe "who" uses this in one sentence?' }, strong: { 'zh-TW': '精確到職業和場景', en: 'Precise to role and scenario' }, weak: { 'zh-TW': '「所有人都能用」＝沒有目標用戶', en: '"Everyone can use it" = no target user' } },
      { id: 'a6', label: { 'zh-TW': '問題頻率', en: 'Problem Frequency' }, desc: { 'zh-TW': '這個問題多久發生一次？', en: 'How often does this problem occur?' }, strong: { 'zh-TW': '每天或每週', en: 'Daily or weekly' }, weak: { 'zh-TW': '一年一兩次', en: 'Once or twice a year' } },
    ],
  },
  {
    id: 'B', name: { 'zh-TW': '市場驗證', en: 'Market Validation' }, nameEn: 'Market Validation',
    weight: 20, color: '#059669', icon: '📊',
    principle: { 'zh-TW': '市場有沒有用行動告訴你「我要這個」？', en: 'Has the market shown you "I want this" through actions?' },
    signals: [
      { id: 'b1', label: { 'zh-TW': '活躍使用者', en: 'Active Users' }, desc: { 'zh-TW': '過去 30 天實際使用產品的獨立用戶數', en: 'Unique users who actually used the product in the past 30 days' }, strong: { 'zh-TW': '≥50 人', en: '≥50 users' }, weak: { 'zh-TW': '只有你自己', en: 'Only yourself' } },
      { id: 'b2', label: { 'zh-TW': '回訪行為', en: 'Return Visits' }, desc: { 'zh-TW': '用過一次後再回來用的比例', en: 'Percentage of users who return after first use' }, strong: { 'zh-TW': '≥40% 在 7 天內回訪', en: '≥40% return within 7 days' }, weak: { 'zh-TW': '<10% 或無法追蹤', en: '<10% or untrackable' } },
      { id: 'b3', label: { 'zh-TW': '使用深度', en: 'Usage Depth' }, desc: { 'zh-TW': '每次使用的投入程度（時長、操作次數、完成率）', en: 'Engagement per session (duration, actions, completion rate)' }, strong: { 'zh-TW': '深度使用核心功能', en: 'Deep usage of core features' }, weak: { 'zh-TW': '打開首頁就離開', en: 'Bounces from homepage' } },
      { id: 'b4', label: { 'zh-TW': '口碑傳播', en: 'Word of Mouth' }, desc: { 'zh-TW': '用戶主動推薦或分享的可追蹤案例', en: 'Trackable cases of users recommending or sharing' }, strong: { 'zh-TW': '有具體推薦案例', en: 'Specific recommendation cases' }, weak: { 'zh-TW': '無', en: 'None' } },
      { id: 'b5', label: { 'zh-TW': '外部反饋品質', en: 'Feedback Quality' }, desc: { 'zh-TW': '你收到的回饋是具體建議還是禮貌性稱讚？', en: 'Is feedback you receive specific suggestions or polite praise?' }, strong: { 'zh-TW': '具體的功能建議和場景描述', en: 'Specific feature requests and use case descriptions' }, weak: { 'zh-TW': '只有「不錯」或沒有回饋', en: 'Just "nice" or no feedback at all' } },
      { id: 'b6', label: { 'zh-TW': '付費意願訊號', en: 'Willingness to Pay' }, desc: { 'zh-TW': '有人主動問「這要怎麼付費」或「有沒有進階版」？', en: 'Has anyone asked "how do I pay?" or "is there a premium version?"' }, strong: { 'zh-TW': '有人主動問付費', en: 'Unprompted payment inquiries' }, weak: { 'zh-TW': '沒有任何付費相關對話', en: 'No payment-related conversations' } },
    ],
  },
  {
    id: 'C', name: { 'zh-TW': '技術護城河', en: 'Technical Moat' }, nameEn: 'Technical Moat',
    weight: 20, color: '#d97706', icon: '🏰',
    principle: { 'zh-TW': '別人要花多少力氣才能做出一樣的東西？', en: 'How much effort would it take for someone to replicate this?' },
    signals: [
      { id: 'c1', label: { 'zh-TW': '技術層級', en: 'Tech Level' }, desc: { 'zh-TW': 'L1 新演算法 / L2 工程創新 / L3 整合差異化 / L4 無護城河', en: 'L1 Novel algorithm / L2 Engineering innovation / L3 Integration / L4 No moat' }, strong: { 'zh-TW': 'L1–L2', en: 'L1–L2' }, weak: { 'zh-TW': 'L4（一個週末就能複製）', en: 'L4 (replicable in a weekend)' } },
      { id: 'c2', label: { 'zh-TW': '可複製門檻', en: 'Replication Barrier' }, desc: { 'zh-TW': '一個同等能力的開發者要多久能做出來？', en: 'How long would an equally skilled developer take to build this?' }, strong: { 'zh-TW': '≥3 個月（需特定領域知識）', en: '≥3 months (requires domain expertise)' }, weak: { 'zh-TW': '幾天或一個週末', en: 'A few days or a weekend' } },
      { id: 'c3', label: { 'zh-TW': '數據／知識壁壘', en: 'Data/Knowledge Moat' }, desc: { 'zh-TW': '你是否累積了別人沒有的數據、語料、或領域知識？', en: 'Have you accumulated unique data, corpus, or domain knowledge?' }, strong: { 'zh-TW': '有獨家數據資產且有飛輪效應', en: 'Proprietary data asset with flywheel effect' }, weak: { 'zh-TW': '全靠公開資源', en: 'Entirely from public sources' } },
      { id: 'c4', label: { 'zh-TW': '量化驗證', en: 'Quantitative Validation' }, desc: { 'zh-TW': '有沒有 benchmark 或數據證明你比替代方案好？', en: 'Do you have benchmarks or data proving you\'re better?' }, strong: { 'zh-TW': '有可重現的 benchmark', en: 'Reproducible benchmarks' }, weak: { 'zh-TW': '只有直覺或主觀感受', en: 'Only intuition or subjective feel' } },
      { id: 'c5', label: { 'zh-TW': '敘事一致性', en: 'Narrative Consistency' }, desc: { 'zh-TW': '過去 12 個月核心價值主張變過幾次？', en: 'How many times has the core value proposition changed in 12 months?' }, strong: { 'zh-TW': '0–1 次', en: '0–1 times' }, weak: { 'zh-TW': '≥3 次（你自己都不確定）', en: '≥3 times (you\'re unsure yourself)' } },
      { id: 'c6', label: { 'zh-TW': '利基定位', en: 'Niche Positioning' }, desc: { 'zh-TW': '你鎖定的細分市場是否清楚且可防守？', en: 'Is your target niche clear and defensible?' }, strong: { 'zh-TW': '一句話說清楚，有天然屏障', en: 'One-sentence clear, with natural barriers' }, weak: { 'zh-TW': '「什麼都能做」或「目標＝全世界」', en: '"Can do everything" or "target = the world"' } },
    ],
  },
  {
    id: 'D', name: { 'zh-TW': '商業化路徑', en: 'Commercialisation Path' }, nameEn: 'Commercialisation Path',
    weight: 20, color: '#dc2626', icon: '💰',
    principle: { 'zh-TW': '這個產品能養活自己嗎？什麼時候？', en: 'Can this product sustain itself? When?' },
    stageSignals: {
      concept: [
        { id: 'd1c', label: { 'zh-TW': '商業模式假設', en: 'Business Model Hypothesis' }, desc: { 'zh-TW': '你有沒有想過這個產品怎麼賺錢？', en: 'Have you thought about how this product makes money?' }, strong: { 'zh-TW': '有具體模式假設且已驗證', en: 'Concrete hypothesis, validated' }, weak: { 'zh-TW': '完全沒想過', en: 'Never considered' } },
        { id: 'd2c', label: { 'zh-TW': '目標市場規模', en: 'Target Market Size' }, desc: { 'zh-TW': '潛在付費用戶有多少人？', en: 'How many potential paying users exist?' }, strong: { 'zh-TW': '可估算且 ≥1,000 人', en: 'Estimable and ≥1,000 users' }, weak: { 'zh-TW': '不知道', en: 'No idea' } },
        { id: 'd3c', label: { 'zh-TW': '付費意願初探', en: 'Willingness to Pay (Initial)' }, desc: { 'zh-TW': '你有沒有問過潛在用戶願不願意付費？', en: 'Have you asked potential users if they\'d pay?' }, strong: { 'zh-TW': '做過訪談或問卷，有數據', en: 'Conducted interviews/surveys with data' }, weak: { 'zh-TW': '純猜測', en: 'Pure speculation' } },
        { id: 'd4c', label: { 'zh-TW': '成本結構', en: 'Cost Structure' }, desc: { 'zh-TW': '你知道營運成本是多少嗎？', en: 'Do you know your operating costs?' }, strong: { 'zh-TW': '已估算各項成本', en: 'All costs estimated' }, weak: { 'zh-TW': '不清楚', en: 'Unclear' } },
      ],
      launched: [
        { id: 'd1l', label: { 'zh-TW': '定價策略', en: 'Pricing Strategy' }, desc: { 'zh-TW': '是否已定價或有定價計畫？', en: 'Have you set pricing or have a pricing plan?' }, strong: { 'zh-TW': '已公開定價且根據回饋調整過', en: 'Published pricing, adjusted by feedback' }, weak: { 'zh-TW': '完全沒有', en: 'None at all' } },
        { id: 'd2l', label: { 'zh-TW': '獲客管道', en: 'Acquisition Channels' }, desc: { 'zh-TW': '用戶怎麼找到你的產品？', en: 'How do users find your product?' }, strong: { 'zh-TW': '有明確且可追蹤的管道', en: 'Clear and trackable channels' }, weak: { 'zh-TW': '完全沒有——做了但沒人知道', en: 'None — built but nobody knows' } },
        { id: 'd3l', label: { 'zh-TW': '營運成本可控度', en: 'OpEx Controllability' }, desc: { 'zh-TW': '每月 API／基礎設施成本是否在預算內？', en: 'Are monthly API/infra costs within budget?' }, strong: { 'zh-TW': '成本透明可控', en: 'Transparent and controlled costs' }, weak: { 'zh-TW': '不知道花了多少', en: 'No idea how much is spent' } },
        { id: 'd4l', label: { 'zh-TW': '免費→付費路徑', en: 'Free-to-Paid Path' }, desc: { 'zh-TW': '從免費使用到付費有沒有清楚的升級路徑？', en: 'Is there a clear upgrade path from free to paid?' }, strong: { 'zh-TW': '路徑設計好了', en: 'Path designed and ready' }, weak: { 'zh-TW': '全部免費無限用', en: 'Everything free with no limits' } },
      ],
      users: [
        { id: 'd1u', label: { 'zh-TW': '收入模式', en: 'Revenue Model' }, desc: { 'zh-TW': '訂閱 > 按量 > 一次性 > 接案 > 免費', en: 'Subscription > Usage-based > One-time > Freelance > Free' }, strong: { 'zh-TW': '已有訂閱收入', en: 'Subscription revenue active' }, weak: { 'zh-TW': '免費，無收費計畫', en: 'Free, no monetization plan' } },
        { id: 'd2u', label: { 'zh-TW': '付費轉換率', en: 'Paid Conversion Rate' }, desc: { 'zh-TW': '免費用戶轉為付費的比例', en: 'Percentage of free users converting to paid' }, strong: { 'zh-TW': '≥5%', en: '≥5%' }, weak: { 'zh-TW': '0%', en: '0%' } },
        { id: 'd3u', label: { 'zh-TW': '獲客成本', en: 'Customer Acquisition Cost' }, desc: { 'zh-TW': '獲得一個用戶要花多少（時間或金錢）？', en: 'How much does it cost to acquire one user (time or money)?' }, strong: { 'zh-TW': '低且可預測（口碑為主）', en: 'Low and predictable (word-of-mouth driven)' }, weak: { 'zh-TW': '高且不確定', en: 'High and unpredictable' } },
        { id: 'd4u', label: { 'zh-TW': '成本回收', en: 'Cost Recovery' }, desc: { 'zh-TW': '收入能否覆蓋營運成本？', en: 'Does revenue cover operating costs?' }, strong: { 'zh-TW': '>150%', en: '>150%' }, weak: { 'zh-TW': '<80%', en: '<80%' } },
      ],
      revenue: [
        { id: 'd1r', label: { 'zh-TW': '月經常性收入', en: 'Monthly Recurring Revenue' }, desc: { 'zh-TW': 'MRR 或月均收入趨勢', en: 'MRR or monthly average revenue trend' }, strong: { 'zh-TW': '穩定成長 ≥10%/月', en: 'Stable growth ≥10%/month' }, weak: { 'zh-TW': '不穩定或下降', en: 'Unstable or declining' } },
        { id: 'd2r', label: { 'zh-TW': '客戶集中度', en: 'Customer Concentration' }, desc: { 'zh-TW': '最大客戶佔收入比例', en: 'Largest customer\'s share of revenue' }, strong: { 'zh-TW': '無單一客戶 >30%', en: 'No single customer >30%' }, weak: { 'zh-TW': '單一客戶 >50%', en: 'Single customer >50%' } },
        { id: 'd3r', label: { 'zh-TW': '毛利率', en: 'Gross Margin' }, desc: { 'zh-TW': '扣除直接成本後的利潤率', en: 'Profit margin after direct costs' }, strong: { 'zh-TW': '≥70%', en: '≥70%' }, weak: { 'zh-TW': '<50%', en: '<50%' } },
        { id: 'd4r', label: { 'zh-TW': '收入成長率', en: 'Revenue Growth Rate' }, desc: { 'zh-TW': '月或季度的成長趨勢', en: 'Monthly or quarterly growth trend' }, strong: { 'zh-TW': '穩定成長 ≥10%/月', en: 'Stable growth ≥10%/month' }, weak: { 'zh-TW': '持平或衰退', en: 'Flat or declining' } },
      ],
    },
  },
  {
    id: 'E', name: { 'zh-TW': '長線可持續性', en: 'Sustainability' }, nameEn: 'Sustainability',
    weight: 15, color: '#7c3aed', icon: '🔮',
    principle: { 'zh-TW': '一年後這個產品還活著嗎？三年後呢？', en: 'Will this product still be alive in one year? Three years?' },
    signals: [
      { id: 'e1', label: { 'zh-TW': '供應鏈韌性', en: 'Supply Chain Resilience' }, desc: { 'zh-TW': '核心依賴的第三方服務有備援方案嗎？', en: 'Do critical third-party dependencies have fallback options?' }, strong: { 'zh-TW': '每個關鍵依賴都有 fallback', en: 'Every critical dependency has a fallback' }, weak: { 'zh-TW': '核心功能完全依賴單一服務', en: 'Core features rely on a single service' } },
      { id: 'e2', label: { 'zh-TW': '大廠威脅', en: 'Big Tech Threat' }, desc: { 'zh-TW': '大公司直接做同樣功能的機率和影響', en: 'Probability and impact of big tech building the same feature' }, strong: { 'zh-TW': '差異化來自大廠不會做的事', en: 'Differentiation from what big tech won\'t do' }, weak: { 'zh-TW': '大廠已經在做或即將做', en: 'Big tech already doing it or about to' } },
      { id: 'e3', label: { 'zh-TW': '維運負擔', en: 'Maintenance Burden' }, desc: { 'zh-TW': '維持產品運作每週需要多少時間？', en: 'Weekly time needed to keep the product running?' }, strong: { 'zh-TW': '<2 小時/週（高度自動化）', en: '<2 hours/week (highly automated)' }, weak: { 'zh-TW': '>10 小時/週', en: '>10 hours/week' } },
      { id: 'e4', label: { 'zh-TW': '文件化程度', en: 'Documentation Level' }, desc: { 'zh-TW': '產品的架構、部署、設定是否有文件？', en: 'Is the architecture, deployment, and config documented?' }, strong: { 'zh-TW': '完整可交接，別人拿到能跑', en: 'Complete and transferable, others can run it' }, weak: { 'zh-TW': '全在你的腦子裡', en: 'All in your head' } },
      { id: 'e5', label: { 'zh-TW': '演化路徑', en: 'Evolution Path' }, desc: { 'zh-TW': '這個產品未來能往哪個方向長？', en: 'Where can this product grow in the future?' }, strong: { 'zh-TW': '有 2-3 個明確的延伸方向', en: '2-3 clear extension directions' }, weak: { 'zh-TW': '做完就這樣', en: 'No growth path beyond current state' } },
      { id: 'e6', label: { 'zh-TW': '法規／合規', en: 'Regulatory Compliance' }, desc: { 'zh-TW': '目標市場有沒有潛在的法規風險？', en: 'Are there potential regulatory risks in your target market?' }, strong: { 'zh-TW': '已確認合規，有隱私政策', en: 'Confirmed compliant, privacy policy in place' }, weak: { 'zh-TW': '不確定', en: 'Uncertain' } },
    ],
  },
];

export const GATE_QUESTIONS: GateQuestion[] = [
  { id: 'g1', label: { 'zh-TW': '機會窗口', en: 'Opportunity Window' }, question: { 'zh-TW': '這個領域還沒有被單一產品壟斷？或者你正在成為那個壟斷者？', en: 'Is this space not yet dominated by a single product? Or are you becoming the dominant one?' } },
  { id: 'g2', label: { 'zh-TW': '結構優勢', en: 'Structural Advantage' }, question: { 'zh-TW': '你選擇的技術路線是否帶來替代方案做不到的優勢？', en: 'Does your chosen tech stack provide advantages alternatives can\'t match?' } },
  { id: 'g3', label: { 'zh-TW': '可持續性', en: 'Sustainability' }, question: { 'zh-TW': '以你目前的資源，能持續維運並迭代這個產品至少 6 個月嗎？', en: 'With your current resources, can you maintain and iterate for at least 6 months?' } },
];

export const VETOES: VetoCondition[] = [
  { id: 'v1', label: { 'zh-TW': '零用戶', en: 'Zero Users' }, desc: { 'zh-TW': '上線超過 60 天但沒有任何外部用戶實際使用', en: 'Live for 60+ days with no external users actually using it' }, stages: ['launched', 'users', 'revenue'] },
  { id: 'v2', label: { 'zh-TW': '零差異化', en: 'Zero Differentiation' }, desc: { 'zh-TW': '跟免費替代方案相比無法說出任何具體優勢', en: 'Cannot name any specific advantage over free alternatives' }, stages: ['concept', 'launched', 'users', 'revenue'] },
  { id: 'v3', label: { 'zh-TW': '成本失控', en: 'Cost Out of Control' }, desc: { 'zh-TW': '月營運成本 >$100 但收入 = $0 且無收費計畫', en: 'Monthly costs >$100 but revenue = $0 with no pricing plan' }, stages: ['launched', 'users'] },
  { id: 'v4', label: { 'zh-TW': '單點故障', en: 'Single Point of Failure' }, desc: { 'zh-TW': '核心功能 100% 依賴單一第三方服務，無任何 fallback', en: 'Core functionality 100% depends on a single third-party, no fallback' }, stages: ['concept', 'launched', 'users', 'revenue'] },
  { id: 'v5', label: { 'zh-TW': '三次轉向', en: 'Three Pivots' }, desc: { 'zh-TW': '核心定位在 12 個月內改變 ≥3 次', en: 'Core positioning changed ≥3 times in 12 months' }, stages: ['concept', 'launched', 'users', 'revenue'] },
];

export function getVerdict(score: number, vetoed: boolean): VerdictInfo {
  if (vetoed) return { emoji: '🔴', label: { 'zh-TW': '暫停或轉向', en: 'Pause or Pivot' }, color: '#dc2626', desc: { 'zh-TW': '觸發一票否決——不論總分多高都建議暫停', en: 'Veto triggered — pause recommended regardless of total score' } };
  if (score >= 8.5) return { emoji: '🟢', label: { 'zh-TW': '全力推進', en: 'Full Speed Ahead' }, color: '#059669', desc: { 'zh-TW': '各維度表現優秀，值得全力投入', en: 'All dimensions strong — worth full commitment' } };
  if (score >= 7.0) return { emoji: '🟡', label: { 'zh-TW': '有條件推進', en: 'Conditional Go' }, color: '#d97706', desc: { 'zh-TW': '核心面向強勁，1-2 個缺口需要補強', en: 'Core aspects strong, 1-2 gaps need attention' } };
  if (score >= 5.5) return { emoji: '🟠', label: { 'zh-TW': '觀望補強', en: 'Watch & Strengthen' }, color: '#ea580c', desc: { 'zh-TW': '有潛力但不成熟，先補最弱的維度', en: 'Potential but immature — strengthen the weakest dimension first' } };
  return { emoji: '🔴', label: { 'zh-TW': '暫停或轉向', en: 'Pause or Pivot' }, color: '#dc2626', desc: { 'zh-TW': '多個維度有根本問題，建議重新評估', en: 'Fundamental issues in multiple dimensions — reassess' } };
}

export function getSignalsForDim(dim: Dimension, stage: string): import('./types').Signal[] {
  if (dim.id === 'D') return dim.stageSignals?.[stage as import('./types').Stage] || [];
  return dim.signals || [];
}

export function calcDimScore(dim: Dimension, stage: string, scores: Record<string, number>): number {
  const sigs = getSignalsForDim(dim, stage);
  const filled = sigs.filter(s => scores[s.id] !== undefined);
  if (filled.length === 0) return 0;
  return filled.reduce((sum, s) => sum + scores[s.id], 0) / filled.length;
}

export function calcWeightedTotal(dimScores: Record<string, number>): number {
  return DIMENSIONS.reduce((sum, d) => sum + (dimScores[d.id] || 0) * d.weight / 100, 0);
}

// UI strings
export const UI: Record<string, { 'zh-TW': string; en: string }> = {
  title: { 'zh-TW': "Builder's Scorecard", en: "Builder's Scorecard" },
  subtitle: { 'zh-TW': '產品長線自評計分卡', en: 'Product Longevity Self-Assessment' },
  tagline: { 'zh-TW': '五個維度，一張體檢報告。', en: 'Five dimensions. One diagnostic report.' },
  quickTitle: { 'zh-TW': '快速評估', en: 'Quick Assessment' },
  quickPlaceholder: { 'zh-TW': '貼上產品描述、GitHub URL、或網站 URL⋯', en: 'Paste a product description, GitHub URL, or website URL...' },
  quickBtn: { 'zh-TW': '開始評估', en: 'Start Assessment' },
  quickNote: { 'zh-TW': '貼上產品描述或 README，AI 自動評估五個維度。', en: 'Paste a product description or README. AI will auto-assess all five dimensions.' },
  orFull: { 'zh-TW': '或直接進入完整模式 →', en: 'Or enter full mode directly →' },
  step0: { 'zh-TW': '基本資料', en: 'Basic Info' },
  step1: { 'zh-TW': '前提檢查', en: 'Gate Check' },
  step2: { 'zh-TW': '五維度', en: 'Five Dimensions' },
  step3: { 'zh-TW': '否決清單', en: 'Veto List' },
  step4: { 'zh-TW': '結果', en: 'Results' },
  projectName: { 'zh-TW': '產品名稱 *', en: 'Product Name *' },
  projectNamePh: { 'zh-TW': '例：Agora Plaza 即時翻譯器', en: 'e.g., Agora Plaza Real-time Translator' },
  projectDesc: { 'zh-TW': '一句話描述', en: 'One-line Description' },
  projectDescPh: { 'zh-TW': '例：多路 STT 驅動的即時會議翻譯工具', en: 'e.g., Multi-STT powered real-time meeting translator' },
  stageLabel: { 'zh-TW': '產品階段 *', en: 'Product Stage *' },
  builderProfile: { 'zh-TW': 'Builder Profile（不計入總分，影響 AI 建議）', en: 'Builder Profile (not scored, influences AI advice)' },
  next: { 'zh-TW': '下一步 →', en: 'Next →' },
  gateTitle: { 'zh-TW': '前提檢查', en: 'Gate Check' },
  gateDesc: { 'zh-TW': '三個問題，任何一個答「否」代表需要重新檢視方向。', en: 'Three questions. Any "No" means a structural issue needs addressing.' },
  yes: { 'zh-TW': '是', en: 'Yes' },
  no: { 'zh-TW': '否', en: 'No' },
  vetoTitle: { 'zh-TW': '一票否決清單', en: 'Veto Checklist' },
  vetoDesc: { 'zh-TW': '打勾＝強烈建議暫停。只顯示適用於目前階段的條件。', en: 'Check = strongly recommend pausing. Only shows conditions for current stage.' },
  viewResult: { 'zh-TW': '查看結果 →', en: 'View Results →' },
  modify: { 'zh-TW': '← 修改', en: '← Edit' },
  exportMd: { 'zh-TW': '匯出 Markdown ↓', en: 'Export Markdown ↓' },
  exportJson: { 'zh-TW': '匯出 JSON ↓', en: 'Export JSON ↓' },
  dimAnalysis: { 'zh-TW': '五維度分析', en: 'Five-Dimension Analysis' },
  vetoTriggered: { 'zh-TW': '觸發否決', en: 'Veto Triggered' },
  evidence: { 'zh-TW': '關鍵證據', en: 'Key Evidence' },
  evidencePh: { 'zh-TW': '這個維度你最有力的證據？', en: 'Your strongest evidence for this dimension?' },
  risk: { 'zh-TW': '主要風險', en: 'Key Risk' },
  riskPh: { 'zh-TW': '這個維度最大的弱點？', en: 'Biggest weakness in this dimension?' },
  notePh: { 'zh-TW': '備註（選填）', en: 'Note (optional)' },
  dimAvg: { 'zh-TW': '維度平均', en: 'Dimension Average' },
  weight: { 'zh-TW': '權重', en: 'Weight' },
  selectStageFirst: { 'zh-TW': '請先在基本資料中選擇產品階段。', en: 'Please select a product stage in Basic Info first.' },
  scoreInterpretTitle: { 'zh-TW': '如何解讀這個分數', en: 'How to Interpret This Score' },
  scoreInterpret1: { 'zh-TW': '⚠️ 這個分數不是考試成績。', en: '⚠️ This score is not a test grade.' },
  scoreInterpret2: { 'zh-TW': '低分不代表你的產品「不好」——它代表你的產品在五個維度中，有些準備好了，有些還沒開始。', en: 'A low score doesn\'t mean your product is "bad" — it means some dimensions are ready while others haven\'t started.' },
  scoreInterpret3: { 'zh-TW': '真正重要的不是總分，而是雷達圖的形狀。一個 6.0 分但五角均勻的產品，比一個 7.0 分但某個維度是 1 的產品更健康。', en: 'What truly matters is not the total score, but the shape of the radar chart. A 6.0 with even pentagon is healthier than a 7.0 with one dimension at 1.' },
  gapWarning: { 'zh-TW': '維度落差警告：最高與最低維度差距超過 4 分。極端不均勻比整體偏低更危險——優先補強最弱的維度。', en: 'Dimension Gap Warning: Difference between highest and lowest dimension exceeds 4 points. Extreme imbalance is more dangerous than overall low scores — prioritize strengthening the weakest dimension.' },
  credit: { 'zh-TW': '改編自', en: 'Adapted from' },
  switchToFull: { 'zh-TW': '想要更精確？切換到完整模式', en: 'Want more precision? Switch to full mode' },
  backToQuick: { 'zh-TW': '← 回到快速模式', en: '← Back to quick mode' },
};

export function t(key: string, lang: Lang): string {
  return UI[key]?.[lang] || key;
}
