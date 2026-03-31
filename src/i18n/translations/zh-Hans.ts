/**
 * 简体中文 (zh-Hans) — Formosa ESG 2026
 *
 * 等级名称保留修仙主题，使用简体字：
 *   炼气香客 → 筑基香客 → 金丹香客 → 元婴香客 →
 *   化神香客 → 炼虚香客 → 合体香客 → 大乘香客 → 飞升香客
 *
 * 翻译说明：
 * - 台湾用语转换为大陆用语（捷运→地铁、影片→视频 等，但本系统未涉及这些词汇）
 * - 保留台湾宗教文化特色词汇（妈祖、进香、香客）不做转换
 * - 「白沙屯」作为地名保持原样
 * - LINE 相关术语保持不变（大陆也有 LINE 用户）
 */
export const zhHans = {

  // ─── 品牌 & 系统 ──────────────────────────────
  brand: {
    systemName: '白沙屯妈祖 ESG 进香追踪系统',
    activityName: '白沙屯妈祖进香',
    shortName: '白沙屯妈祖 ESG 进香 2026',
    org: '环球境地 x 1.5度科学减碳协会',
    tagline: '每一步都算数，一起为地球走一程',
  },

  // ─── 导航 & 底部菜单 ──────────────────────────
  nav: {
    checkin: '打卡',
    footprint: '足迹',
    guide: '说明',
    more: '更多',
    expandAll: '展开全部',
  },

  // ─── 页面标题 ─────────────────────────────────
  page: {
    tracker: '打卡页面',
    my: '个人足迹',
    viewOther: '查看别人的足迹',
    dashboard: '管理仪表板',
    data: '数据与方法论',
    guide: '香客使用说明书',
    adminGuide: '管理者使用说明书',
    privacy: '隐私权声明',
    feedback: '问题反馈',
  },

  // ─── 认证 & LINE 登录 ──────────────────────────
  auth: {
    lineLogin: 'LINE 登录',
    lineLoginBtn: '用 LINE 登录',
    lineLoginDesc: '使用 LINE 帐号登录以记录您的进香足迹',
    clickLoginBtn: '点击登录按钮',
    scanQR: '扫描 QR Code',
    searchFriend: '搜索好友「@539fkwjd」',
    addFriend: '添加好友',
    tapMenuLink: '点击菜单中的链接',
    privacyConsentText: '进入活动即表示您同意我们依据{link}处理您的资料，用于进香足迹记录与碳足迹计算。',
    privacyCheckboxLabel: '我已阅读并同意隐私权声明',
    enterEvent: '进入活动',
    privacyRequired: '需要同意隐私权声明才能使用打卡功能',
    networkError: '网络连接异常，如无法进入请{link}。',
    adminLogin: '管理员登录',
    adminPassword: '管理员密码',
    verify: '验证',
    verifying: '验证中…',
    invalidPassword: '密码无效',
    cancel: '取消',
    adminOnly: '仅限管理团队访问',
    password: '管理密码',
    enter: '进入',
    adminNote: '这是管理团队的数据后台，香客请前往{link}。',
    processing: '处理中…',
    loggingIn: '登录中…',
  },

  // ─── 隐私 & 同意 ──────────────────────────────
  privacy: {
    title: '隐私权声明',
    agree: '我同意',
    disagree: '不同意',
    fullText: '隐私权声明全文',
    mustAgree: '需要同意才能使用打卡功能',
    dataCollected: '主要收集的数据包括：LINE 账号信息、GPS 定位轨迹、问卷回答、每日善足迹回报。手机号码和照片坐标是选填的。',
    photoNotUploaded: '照片不会上传到服务器',
    onlyGPS: '系统只读取照片中的 GPS 坐标',
    gpsStopsOnClose: '关闭页面后，GPS 追踪也会停止',
  },

  // ─── 位置权限 ─────────────────────────────────
  location: {
    allowAccess: '是否允许获取你的位置？',
    pleaseAllow: '请点击「允许」',
    allow: '允许',
    deny: '不允许',
  },

  // ─── 打卡 & 追踪 ─────────────────────────────
  tracker: {
    checkin: '打卡',
    photoCheckin: '拍照打卡',
    pause: '暂离',
    finish: '完成进香',
    share: '分享',
    locating: '正在定位中',
    checkinCount: '打卡次数',
    walkingKm: '步行公里数',
    carbonFootprint: '碳足迹',
    carbonSaved: '碳节省量',
    distanceToNext: '距离下一级还差多少',
    blessing: '祝福',
  },

  // ─── 等级系统（9 级 — 修仙简体版）──────────────
  levels: {
    title: '等级系统',
    level: '等级',
    levelTitle: '称号',
    km: '公里数',
    blessingCount: '祝福次数',
    approx: '大约对应',
    upgradeNotice: '升级时会弹出通知',
    tipText: '每天送出 7 次祝福可以最快升级，但只要每天 5 次以上就能跟上进度。升级时会弹出通知。',
    fullJourney: '全程走完',
    mascot: '香客公仔',
    mascotDesc: '每个等级都有专属的粉红头巾香客公仔',
    '1': { name: '炼气香客', req: '0 km・1 次祝福', approxDays: '第一次祝福' },
    '2': { name: '筑基香客', req: '15 km・5 次祝福', approxDays: '≈ 1 天' },
    '3': { name: '金丹香客', req: '45 km・10 次祝福', approxDays: '≈ 2 天' },
    '4': { name: '元婴香客', req: '90 km・15 次祝福', approxDays: '≈ 3 天' },
    '5': { name: '化神香客', req: '135 km・20 次祝福', approxDays: '≈ 4 天' },
    '6': { name: '炼虚香客', req: '180 km・25 次祝福', approxDays: '≈ 5 天' },
    '7': { name: '合体香客', req: '225 km・30 次祝福', approxDays: '≈ 6 天' },
    '8': { name: '大乘香客', req: '270 km・35 次祝福', approxDays: '≈ 7 天' },
    '9': { name: '飞升香客', req: '300 km・40 次祝福', approxDays: '全程走完 ✨' },
  },

  // ─── 每日善足迹回报 ──────────────────────────
  dailyReport: {
    title: '今日善足迹回报',
    transport: '到场交通',
    drove: '开车',
    hsr: '坐高铁',
    train: '坐火车',
    envImpact: '环境影响',
    waterBottles: '喝了几瓶瓶装水？',
    recycled: '回收了几瓶？',
    stayed: '有没有住宿？',
    autoCalcNote: '交通方式不用手动填！系统会根据 GPS 轨迹的移动速度，自动把你的移动分成「零排放」（步行、自行车）和「乘坐交通工具」两种情况来估算碳足迹。',
  },

  // ─── 问卷（13 题）──────────────────────────────
  survey: {
    confirm: '确认提交',
    q1: {
      question: '参与了哪些善行活动？',
    },
    q2: {
      question: '进香途中被什么事情感动？',
    },
    q3: {
      question: '想分享感动故事的话，可以自由填写',
    },
    q4: {
      question: '是否加深对「行善」的理解？',
    },
    q5: {
      question: '日常生活中会延续行善吗？',
    },
    q6: {
      question: '未来计划做哪些善行？',
    },
    q7: {
      question: '你的企业或组织是否会转化为 CSR 行动？',
    },
    q8: {
      question: '你的参与身份',
      organizer: '主办方',
      participant: '参与人',
    },
    q9: {
      question: '上传照片',
      note: '系统会自动读取照片中的 GPS 坐标，照片本身不会上传到服务器',
    },
    q10: {
      question: '手机号码',
      note: '选填，用于抽奖通知',
    },
  },

  // ─── 成就卡 ──────────────────────────────────
  achievement: {
    title: '进香成就卡',
    finalTitle: '最终成就卡',
    conditions: {
      checkins: '打卡至少 3 次',
      survey: '完成问卷',
      phone: '有留下电话号码',
      allRequired: '三个都要达标，缺一不可',
    },
  },

  // ─── 分享功能 ──────────────────────────────────
  share: {
    share: '分享',
    copyLink: '复制链接',
    shareToFriends: '分享给亲朋好友',
    personalPreview: '个性化预览图',
    postPreview: '帖子预览',
    friendsCanSee: '朋友一看就知道你的进度',
  },

  // ─── 个人页 ───────────────────────────────────
  myPage: {
    title: '个人进香足迹页',
    currentLevel: '当前等级和公仔图',
    stats: '打卡次数、步行公里数、碳足迹与碳节省量',
    zeroVsTransit: '零排放移动和乘坐交通工具各几公里',
    routeMap: '你走过的路线地图',
    distToNext: '距离下一级还差多少',
    permanentNote: '个人页面会永久保留，之后随时可以回来看自己的记录',
  },

  // ─── 地图 ────────────────────────────────────
  map: {
    heatmap: '热力图',
    heatmapDesc: '颜色越深代表越多人在那里打卡',
    markers: '标记点',
    markersDesc: '每个打卡的地方都会标一个点',
    cluster: '聚类模式',
    clusterDesc: '把附近的点合成一团显示',
    frontRunner: '前锋',
    frontRunnerDesc: '走最前面的人在哪',
    rearGuard: '尾巴',
    rearGuardDesc: '走最后面的人在哪',
    route: '白沙屯→北港',
    progress: '进度百分比',
    spread: '前锋跟尾巴之间的距离',
  },

  // ─── 后台 Dashboard ───────────────────────────
  dashboard: {
    totalParticipants: '总参与人数',
    todayActive: '今日活跃',
    totalCheckins: '总打卡次数',
    totalWalkingKm: '总步行公里',
    carbonFootprint: '碳足迹',
    carbonSaved: '碳节省量',
    mapPanel: '地图',
    analyticsPanel: '分析面板',
    carbonPanel: '碳足迹面板',
    levelDistribution: '等级分布',
    surveyInsights: '问卷洞察',
    timeline: '活动时间轴',
    peakTimes: '什么时间打卡最多',
  },

  // ─── 推送 ────────────────────────────────────
  push: {
    title: '推送通知',
    sendManual: '手动发推送',
    selectTarget: '选择推送对象',
    all: '全部',
    pilgrims: '香客',
    volunteers: '志愿者',
    admins: '管理者',
    writeContent: '写标题和内容',
    send: '发送推送',
    noConfirmWarning: '没有「确认」按钮，所以发之前请再看一次',
    pausedSkipped: '「暂离中」和「已完成」的人不会收到',
    autoTitle: '自动推送',
    autoSchedule: '每天会在 6:00、9:00、12:00、15:00、18:00 自动推送',
    autoContent: '进度更新、鼓励、安全提醒',
  },

  // ─── 参与者管理 ───────────────────────────────
  users: {
    title: '参与者管理',
    list: '用户列表',
    name: '名称',
    checkins: '打卡次数',
    carbonData: '碳排数据',
    lastActive: '最后活跃时间',
    role: '角色',
    search: '搜索',
    sort: '排序',
  },

  // ─── 角色 ────────────────────────────────────
  roles: {
    pilgrim: '香客',
    pilgrimDesc: '普通用户，可以打卡、填问卷、分享成就',
    volunteer: '志愿者',
    volunteerDesc: '目前功能跟香客一样，推送可以单独发给志愿者',
    admin: '管理者',
    adminDesc: '可以进后台',
  },

  // ─── 用户状态 ─────────────────────────────────
  status: {
    active: '活跃中',
    activeDesc: '正在参与进香，会收到推送',
    paused: '暂离中',
    pausedDesc: '香客点了「暂离」，推送暂停、定位停止',
    pausedResume: '重新打开页面就会自动恢复',
    completed: '已完成',
    completedDesc: '香客点了「完成进香」，成就卡定版，不再收到推送',
  },

  // ─── 活动控制 ────────────────────────────────
  eventControl: {
    title: '活动控制',
    inProgress: '进行中',
    inProgressDesc: '一切正常运作',
    paused: '暂停',
    pausedDesc: '香客端的打卡等功能暂时关闭',
    ended: '结束',
    endedDesc: '活动结束，所有功能关闭',
    whenToPause: '什么时候用暂停',
    pauseExamples: '台风天、系统维护、突发状况',
    whenToEnd: '什么时候用结束',
    endExamples: '活动正式结束',
  },

  // ─── 碳足迹计算 ───────────────────────────────
  carbon: {
    howCalculated: '碳足迹怎么算的',
    rule1: '时速 15 以下 = 零排放',
    rule1Desc: '走路、慢跑、自行车都算在这',
    rule2: '时速超过 15 = 乘车',
    rule2Desc: '不管是坐公交、骑摩托还是开车，统一用公交车的碳排系数（0.47515 kg/km）来估',
    autoSpeed: '这个速度是系统从 GPS 打卡的轨迹自动算出来的',
    noManualInput: '香客不需要自己填',
    accommodation: '住宿（12.5 kg/晚）',
    water: '瓶装水（0.10974 kg/瓶）',
    recycling: '回收（-0.00265 kg/瓶）',
    savingsExplain: '如果你走的这些路程全部改成坐车，大约会排放多少碳？扣掉实际的碳排，差额就是省下来的',
    savingsSimple: '系统帮你算出你用双脚「省下」了多少二氧化碳',
  },

  // ─── 常见问题 ──────────────────────────────────
  faq: {
    q_password: '我需要输入什么密码吗？',
    a_password: '不用。香客只要用 LINE 登录就好，不需要任何通行码。',
    q_noGreenDot: '手机一直没有出现绿色闪烁的点？',
    a_noGreenDot: '可能是点到「不允许」定位了。关掉网页重新打开，这次记得点「允许」。',
    q_closePhone: '中途关掉手机了，记录会不见吗？',
    a_closePhone: '不会。之前走的记录都存在系统里，重新打开会接着记。',
    q_photoUpload: '拍的照片会被上传吗？',
    a_photoUpload: '不会。系统只会读取照片中的 GPS 坐标来记录位置，照片本身留在你手机里。',
    q_noLevelUp: '走了很多但等级没升？',
    a_noLevelUp: '等级要同时看公里数和打卡次数。记得沿途多点几次「打卡」按钮。',
    q_dailyReport: '每日善足迹回报一定要填吗？',
    a_dailyReport: '交通方式不用填，系统会从 GPS 自动估算。但住宿和瓶装水的部分如果有填，碳足迹会更完整。',
    q_carbonCalc: '碳足迹是怎么算的？',
    a_carbonCalc: '系统会根据你移动的速度，简化成两种情况来估算：慢速移动（步行、骑自行车）算零排放，快速移动（乘车）统一用公共交通工具的碳排系数估算。',
    q_carbonSaved: '碳节省量是什么意思？',
    a_carbonSaved: '如果你走的这些路程全部改成坐车，大约会排放多少碳。系统帮你算出你用双脚「省下」了多少二氧化碳。',
    q_noSmartphone: '我没有智能手机怎么办？',
    a_noSmartphone: '可以跟同行的朋友共用一部手机，或找现场志愿者帮忙。',
    q_changeSurvey: '问卷可以改答案吗？',
    a_changeSurvey: '问卷提交后就固定了。每日善足迹回报则可以每天重新填写。',
  },

  // ─── 通用 UI ─────────────────────────────────
  ui: {
    loading: '正在加载',
    error: '出错了',
    retry: '重试',
    back: '返回',
    close: '关闭',
    confirm: '确认',
    cancel: '取消',
    today: '今天',
    thisWeek: '本周',
    thisMonth: '本月',
    date: '日期',
    timePeriod: '时段',
    statistics: '统计',
    version: '版本',
    updateDate: '更新日期',
    readPlan: '阅读计划书',
    phone: '手机号码',
    uploadPhoto: '上传照片',
  },

  // ─── 页脚 ────────────────────────────────────
  footer: {
    lastUpdated: '最后更新',
    contact: '联系方式',
  },

  // ─── 安全 & 数据保护 ──────────────────────────
  security: {
    dataProtection: '个人数据保护',
    encryption: 'HTTPS 加密传输',
    authentication: '身份验证',
    rateLimit: '频率限制',
    rateLimitDesc: '每人每 60 秒最多 5 次打卡',
    dataRetention: '个人数据保留 6 个月后匿名化或删除',
    backup: '多层备份机制',
  },

  // ─── 额外 UI 字串（前端整合用）─────────────────
  tracker_ui: {
    testBanner: '🔧 测试模式 — 数据可能随时清除，正式活动 4/12 开始',
    backToProject: '回到项目总览',
    eventDateRange: '4/12 – 4/20 活动记录',
    locatingAuto: '定位中（自动记录行走路线）',
    progressText: '第 {current} / {total} 题',
    sectionGoodDeeds: '第一部分：善行',
    sectionPostChange: '第二部分：活动后的改变',
    sectionBasicInfo: '第三部分：基本信息与环境影响',
    sectionPhotoUpload: '第四部分：照片上传与足迹定位',
    multipleChoiceHint: '（可多选，选完请按下一题）',
    optionalHint: '（选填，可跳过）',
    optional: '（选填）',
    other: '其他',
    pleaseExplain: '请说明...',
    nextQuestion: '下一题 →',
    prevQuestion: '← 回到上一题',
    submitConfirmTitle: '确认提交',
    submitConfirmBody: '您已完成所有问题。点击下方按钮提交您的活动记录。',
    submitButton: '完成提交 ✓',
    thankYou: '感谢您的参与！',
    submitSuccess: '您的活动记录已成功提交。愿妈祖保佑平安顺利。',
    nextLevelPrompt: '持续打卡，升级为',
    shareToFriends: '分享给朋友一起参与',
    copiedToClipboard: '已复制到剪贴板！',
    viewMyFootprint: '查看我的进香足迹',
    welcomeBack: '欢迎回来！',
    surveyDone: '问卷已完成。您可以继续打卡记录足迹。',
    checkinNow: '立即打卡',
    orTakePhoto: '或拍照记录位置',
    photoPrivacyNote: '照片不会上传到服务器，仅读取 GPS 定位信息作为路径记录',
    takePhoto: '拍照',
    savePhoto: '活动照存档',
    dailyReportHint: '每天花 30 秒记录，碳足迹更精确',
    transportAutoNote: '交通碳排由 GPS 轨迹自动推算，不需手动填写',
    waterBottle: '瓶装水',
    recycleBottle: '回收水瓶',
    bottleUnit: '瓶',
    hotelToday: '今天有住宿',
    hotelYes: '有',
    todayCarbon: '今日碳足迹',
    submitDailyReport: '送出今日报告',
    cumulativeCarbon: '累计碳足迹',
    inviteFriends: '邀请朋友一起参与',
    pauseBtn: '暂离',
    completeBtn: '完成进香',
    pauseCompleteHint: '暂离后重新进入即恢复；完成后不可恢复。',
    completedTitle: '进香圆满完成！',
    completedMessage: '感谢您的参与，愿妈祖保佑平安。',
    geoNotSupported: '此设备不支持定位',
    trackingWaiting: '追踪中 — 等待移动...',
    tracking: '追踪中',
    gpsRecords: '次 GPS 记录',
    locationDenied: '定位权限被拒绝，请到设置开启',
    gpsSearching: 'GPS 搜索中...',
    locating: '定位中...',
    manualCheckinLabel: '手动打卡',
    checkinDone: '已打卡',
    permissionAlert: '定位权限被拒绝，请到手机设置开启定位权限。',
    weakSignal: 'GPS 信号弱，请到空旷处再试',
    locationTimeout: '暂时无法定位，请稍后再试',
    selectAtLeastOne: '请至少选择一个选项',
    loginRequired: '请先完成 LINE 登录',
    sending: '送出中...',
    dailySaved: '已保存的报告',
    saveFailed: '保存失败',
    networkError: '网络错误，请稍后再试',
    processing: '处理中…',
    paused: '已暂离',
    pausedStatus: '已暂离（重新进入即恢复）',
    completeConfirm: '确定要完成进香吗？此操作无法恢复。',
    tooFrequent: '打卡太频繁，请稍后再试',
    recordedLocal: '已记录（本机）',
    kmUnit: '公里',
    checkinCount: '打卡次数',
    expandToggle: '展开 ▼',
    collapseToggle: '收合 ▲',
    photosRecorded: '已记录照片',
    photoSaved: '照片已保存',
    readingGPS: '读取 GPS 中...',
    readFailed: '读取失败，请重试',
    notLoggedIn: '未登录，记录仅保存在本机',
    maxLevel: '恭喜飞升！已达最高等级！',
    shareMessage: '我参加了白沙屯妈祖 ESG 进香，一起来记录你的进香足迹 🙏',
    days: '天',
    gpsPoints: 'GPS 坐标点',
    goodDeedParticipation: '善行参与',
    joinedDate: '加入时间',
    zeroEmission: '零排放移动',
    transitEmission: '交通工具',
    carbonDisclaimer: '碳排数据为简化估算',
    uploadParsingPhotos: '正在解析照片的 EXIF 数据...',
    uploadParseComplete: '解析完成',
    altitude: '海拔',
    longPressHint: '长按照片 → 保存图片',
    linePhotoHint: '点「📥 活动照存档」长按保存照片',
  },
} as const;
