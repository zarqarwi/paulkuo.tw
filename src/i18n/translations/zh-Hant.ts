/**
 * 繁體中文 (zh-Hant) — Source of Truth
 * 所有其他語言檔的 key 結構必須與此檔一致。
 */
export const zhHant = {

  // ─── 系統名稱 & 品牌 ─────────────────────────────
  brand: {
    systemName: '白沙屯媽祖 ESG 進香追蹤系統',
    activityName: '白沙屯媽祖進香',
    shortName: '白沙屯媽祖 ESG 進香 2026',
    org: '環球境地 x 1.5度科學減碳協會',
    tagline: '每一步都算數，一起為地球走一程',
  },

  // ─── 導覽列 & 底部選單 ──────────────────────────
  nav: {
    checkin: '打卡',
    footprint: '足跡',
    guide: '說明',
    more: '更多',
    expandAll: '展開全部',
  },

  // ─── 頁面標題 ─────────────────────────────────
  page: {
    tracker: '打卡頁面',
    my: '個人足跡',
    viewOther: '查看別人的足跡',
    dashboard: '管理儀表板',
    data: '資料與方法論',
    guide: '香客使用說明書',
    adminGuide: '管理者使用說明書',
    privacy: '隱私權聲明',
    feedback: '問題回報',
  },

  // ─── 認證 & LINE 登入 ────────────────────────────
  auth: {
    lineLogin: 'LINE 登入',
    clickLoginBtn: '按下登入按鈕',
    scanQR: '掃 QR Code',
    searchFriend: '搜尋好友「@539fkwjd」',
    addFriend: '加入好友',
    tapMenuLink: '點選選單中的連結',
  },

  // ─── 隱私權 & 同意 ──────────────────────────────
  privacy: {
    title: '隱私權聲明',
    agree: '我同意',
    disagree: '不同意',
    fullText: '隱私權聲明全文',
    mustAgree: '需要同意才能使用打卡功能',
    dataCollected: '主要蒐集的資料包括：LINE 帳號資訊、GPS 定位軌跡、問卷回答、每日善足跡回報。手機號碼和照片座標是選填的。',
    photoNotUploaded: '照片本身不會上傳到伺服器',
    onlyGPS: '系統只讀取裡面的 GPS 座標',
    gpsStopsOnClose: '你關掉頁面之後，GPS 追蹤也會停止',
  },

  // ─── 位置權限 ─────────────────────────────────
  location: {
    allowAccess: '是否允許取用你的位置？',
    pleaseAllow: '請按「允許」',
    allow: '允許',
    deny: '不允許',
  },

  // ─── 打卡 & 追蹤 ─────────────────────────────
  tracker: {
    checkin: '打卡',
    photoCheckin: '拍照打卡',
    pause: '暫離',
    finish: '完成進香',
    share: '分享',
    locating: '正在定位中',
    checkinCount: '打卡次數',
    walkingKm: '步行公里數',
    carbonFootprint: '碳足跡',
    carbonSaved: '碳節省量',
    distanceToNext: '距離下一級還差多少',
    blessing: '祝福',
  },

  // ─── 等級系統（9 級）──────────────────────────
  levels: {
    title: '等級系統',
    level: '等級',
    levelTitle: '稱號',
    km: '公里數',
    blessingCount: '祝福次數',
    approx: '大約對應',
    upgradeNotice: '升級時會跳出通知',
    tipText: '每天送出 7 次祝福可以最快升級，但只要每天 5 次以上就能跟上進度。升級時會跳出通知。',
    fullJourney: '全程走完',
    mascot: '香客公仔',
    mascotDesc: '每個等級都有專屬的粉紅頭巾香客公仔',
    '1': { name: '煉氣香客', req: '0 km ・ 1 次祝福', approxDays: '第一次祝福' },
    '2': { name: '築基香客', req: '15 km ・ 5 次祝福', approxDays: '≈ 1 天' },
    '3': { name: '金丹香客', req: '45 km ・ 10 次祝福', approxDays: '≈ 2 天' },
    '4': { name: '元嬰香客', req: '90 km ・ 15 次祝福', approxDays: '≈ 3 天' },
    '5': { name: '化神香客', req: '135 km ・ 20 次祝福', approxDays: '≈ 4 天' },
    '6': { name: '煉虛香客', req: '180 km ・ 25 次祝福', approxDays: '≈ 5 天' },
    '7': { name: '合體香客', req: '225 km ・ 30 次祝福', approxDays: '≈ 6 天' },
    '8': { name: '大乘香客', req: '270 km ・ 35 次祝福', approxDays: '≈ 7 天' },
    '9': { name: '飛升香客', req: '300 km ・ 40 次祝福', approxDays: '全程走完 ✨' },
  },

  // ─── 每日善足跡回報 ──────────────────────────
  dailyReport: {
    title: '今日善足跡回報',
    transport: '到場交通',
    drove: '開車',
    hsr: '搭高鐵',
    train: '搭火車',
    envImpact: '環境影響',
    waterBottles: '喝了幾瓶瓶裝水？',
    recycled: '回收了幾瓶？',
    stayed: '有沒有住宿？',
    autoCalcNote: '交通方式不用手動填！系統會根據 GPS 軌跡的移動速度，自動把你的移動分成「零排放」（步行、腳踏車）和「搭乘交通工具」兩種情境來估算碳足跡。',
  },

  // ─── 問卷（13 題）──────────────────────────────
  survey: {
    confirm: '確認送出',
    q1: {
      question: '參與了哪些善行活動？',
    },
    q2: {
      question: '進香途中被什麼事情感動？',
    },
    q3: {
      question: '想分享感動故事的話，可以自由填寫',
    },
    q4: {
      question: '是否加深對「行善」的理解？',
    },
    q5: {
      question: '日常生活中會延續行善嗎？',
    },
    q6: {
      question: '未來計畫做哪些善行？',
    },
    q7: {
      question: '你的企業或組織是否會轉化為 CSR 行動？',
    },
    q8: {
      question: '你的參與身分',
      organizer: '主辦方',
      participant: '參與人',
    },
    q9: {
      question: '上傳照片',
      note: '系統會自動讀取照片中的 GPS 座標，照片本身不會上傳到伺服器',
    },
    q10: {
      question: '手機號碼',
      note: '選填，用於抽獎通知',
    },
  },

  // ─── 成就卡 ──────────────────────────────────
  achievement: {
    title: '進香成就卡',
    finalTitle: '最終成就卡',
    conditions: {
      checkins: '打卡至少 3 次',
      survey: '完成問卷',
      phone: '有留下電話號碼',
      allRequired: '三個都要達標，缺一不可',
    },
  },

  // ─── 分享功能 ──────────────────────────────────
  share: {
    share: '分享',
    copyLink: '複製連結',
    shareToFriends: '分享給親朋好友',
    personalPreview: '個人化預覽圖',
    postPreview: '貼文預覽',
    friendsCanSee: '朋友一看就知道你的進度',
  },

  // ─── 個人頁 ───────────────────────────────────
  myPage: {
    title: '個人進香足跡頁',
    currentLevel: '目前等級和公仔圖',
    stats: '打卡次數、步行公里數、碳足跡與碳節省量',
    zeroVsTransit: '零排放移動和搭乘交通工具各幾公里',
    routeMap: '你走過的路線地圖',
    distToNext: '距離下一級還差多少',
    permanentNote: '個人頁面會永久保留，之後隨時可以回來看自己的紀錄',
  },

  // ─── 地圖 ────────────────────────────────────
  map: {
    heatmap: '熱力圖',
    heatmapDesc: '顏色越深代表越多人在那邊打卡',
    markers: '標記點',
    markersDesc: '每個打卡的地方都會標一個點',
    cluster: '聚類模式',
    clusterDesc: '把附近的點合成一團顯示',
    frontRunner: '前鋒',
    frontRunnerDesc: '走最前面的人在哪',
    rearGuard: '尾巴',
    rearGuardDesc: '走最後面的人在哪',
    route: '白沙屯→北港',
    progress: '進度百分比',
    spread: '前鋒跟尾巴之間的距離',
  },

  // ─── 後台 Dashboard ───────────────────────────
  dashboard: {
    totalParticipants: '總參與人數',
    todayActive: '今日活躍',
    totalCheckins: '總打卡次數',
    totalWalkingKm: '總步行公里',
    carbonFootprint: '碳足跡',
    carbonSaved: '碳節省量',
    mapPanel: '地圖',
    analyticsPanel: '分析面板',
    carbonPanel: '碳足跡面板',
    levelDistribution: '等級分布',
    surveyInsights: '問卷洞察',
    timeline: '活動時間軸',
    peakTimes: '什麼時間打卡最多',
  },

  // ─── 推播 ────────────────────────────────────
  push: {
    title: '推播通知',
    sendManual: '手動發推播',
    selectTarget: '選推播對象',
    all: '全部',
    pilgrims: '香客',
    volunteers: '志工',
    admins: '管理者',
    writeContent: '寫標題跟內容',
    send: '發送推播',
    noConfirmWarning: '沒有「確認」按鈕，所以發之前請再看一次',
    pausedSkipped: '「暫離中」跟「已完成」的人不會收到',
    autoTitle: '自動推播',
    autoSchedule: '每天會在 6:00、9:00、12:00、15:00、18:00 自動推播',
    autoContent: '進度更新、鼓勵、安全提醒',
  },

  // ─── 參與者管理 ───────────────────────────────
  users: {
    title: '參與者管理',
    list: '使用者列表',
    name: '名稱',
    checkins: '打卡次數',
    carbonData: '碳排數據',
    lastActive: '最後活躍時間',
    role: '角色',
    search: '搜尋',
    sort: '排序',
  },

  // ─── 角色 ────────────────────────────────────
  roles: {
    pilgrim: '香客',
    pilgrimDesc: '一般使用者，可以打卡、填問卷、分享成就',
    volunteer: '志工',
    volunteerDesc: '目前功能跟香客一樣，推播可以單獨發給志工',
    admin: '管理者',
    adminDesc: '可以進後台',
  },

  // ─── 使用者狀態 ───────────────────────────────
  status: {
    active: '活躍中',
    activeDesc: '正在參與進香，會收到推播',
    paused: '暫離中',
    pausedDesc: '香客按了「暫離」，推播暫停、定位停止',
    pausedResume: '重新打開頁面就會自動恢復',
    completed: '已完成',
    completedDesc: '香客按了「完成進香」，成就卡定版，不再收到推播',
  },

  // ─── 活動控制 ────────────────────────────────
  eventControl: {
    title: '活動控制',
    inProgress: '進行中',
    inProgressDesc: '一切正常運作',
    paused: '暫停',
    pausedDesc: '香客端的打卡等功能暫時關閉',
    ended: '結束',
    endedDesc: '活動結束，所有功能關閉',
    whenToPause: '什麼時候用暫停',
    pauseExamples: '颱風天、系統維護、突發狀況',
    whenToEnd: '什麼時候用結束',
    endExamples: '活動正式結束',
  },

  // ─── 碳足跡計算 ───────────────────────────────
  carbon: {
    howCalculated: '碳足跡怎麼算的',
    rule1: '時速 15 以下 = 零排放',
    rule1Desc: '走路、慢跑、腳踏車都算在這',
    rule2: '時速超過 15 = 搭車',
    rule2Desc: '不管是搭公車、騎機車還是開車，統一用公車的碳排係數（0.47515 kg/km）來估',
    autoSpeed: '這個速度是系統從 GPS 打卡的軌跡自動算出來的',
    noManualInput: '香客不需要自己填',
    accommodation: '住宿（12.5 kg/晚）',
    water: '瓶裝水（0.10974 kg/瓶）',
    recycling: '回收（-0.00265 kg/瓶）',
    savingsExplain: '如果你走的這些路程全部改成搭車，大約會排放多少碳？扣掉實際的碳排，差額就是省下來的',
    savingsSimple: '系統幫你算出你用雙腳「省下」了多少二氧化碳',
  },

  // ─── FAQ ────────────────────────────────────
  faq: {
    q_password: '我需要輸入什麼密碼嗎？',
    a_password: '不用。香客只要用 LINE 登入就好，不需要任何通行碼。',
    q_noGreenDot: '手機一直沒有出現綠色閃爍的點？',
    a_noGreenDot: '可能是按到「不允許」定位了。關掉網頁重新打開，這次記得按「允許」。',
    q_closePhone: '中途關掉手機了，紀錄會不見嗎？',
    a_closePhone: '不會。之前走的紀錄都存在系統裡，重新打開會接著記。',
    q_photoUpload: '拍的照片會被上傳嗎？',
    a_photoUpload: '不會。系統只會讀取照片中的 GPS 座標來記錄位置，照片本身留在你手機裡。',
    q_noLevelUp: '走了很多但等級沒升？',
    a_noLevelUp: '等級要同時看公里數和打卡次數。記得沿途多按幾次「打卡」按鈕。',
    q_dailyReport: '每日善足跡回報一定要填嗎？',
    a_dailyReport: '交通方式不用填，系統會從 GPS 自動估算。但住宿和瓶裝水的部分如果有填，碳足跡會更完整。',
    q_carbonCalc: '碳足跡是怎麼算的？',
    a_carbonCalc: '系統會根據你移動的速度，簡化成兩種情境來估算：慢速移動（步行、騎腳踏車）算零排放，快速移動（搭車）統一用大眾交通工具的碳排係數估算。',
    q_carbonSaved: '碳節省量是什麼意思？',
    a_carbonSaved: '如果你走的這些路程全部改成搭車，大約會排放多少碳。系統幫你算出你用雙腳「省下」了多少二氧化碳。',
    q_noSmartphone: '我沒有智慧型手機怎麼辦？',
    a_noSmartphone: '可以跟同行的朋友共用一支手機，或找現場志工幫忙。',
    q_changeSurvey: '問卷可以改答案嗎？',
    a_changeSurvey: '問卷送出後就固定了。每日善足跡回報則可以每天重新填寫。',
  },

  // ─── 通用 UI ─────────────────────────────────
  ui: {
    loading: '正在加載',
    error: '出錯了',
    retry: '重試',
    back: '返回',
    close: '關閉',
    confirm: '確認',
    cancel: '取消',
    today: '今天',
    thisWeek: '本週',
    thisMonth: '本月',
    date: '日期',
    timePeriod: '時段',
    statistics: '統計',
    version: '版本',
    updateDate: '更新日期',
    readPlan: '閱讀計畫書',
    phone: '手機號碼',
    uploadPhoto: '上傳照片',
  },

  // ─── 頁尾 ────────────────────────────────────
  footer: {
    lastUpdated: '最後更新',
    contact: '聯絡方式',
  },

  // ─── 安全 & 資料保護 ──────────────────────────
  security: {
    dataProtection: '個人資料保護',
    encryption: 'HTTPS 加密傳輸',
    authentication: '身份驗證',
    rateLimit: '頻率限制',
    rateLimitDesc: '每人每 60 秒最多 5 次打卡',
    dataRetention: '個資保留 6 個月後匿名化或刪除',
    backup: '多層備份機制',
  },
} as const;

/** TypeScript type for all translation keys */
export type TranslationKeys = typeof zhHant;
