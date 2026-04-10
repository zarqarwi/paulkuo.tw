/**
 * Formosa LINE Bot — i18n 訊息字典
 *
 * 只包含 Bot 回覆 + 推播需要的文字。
 * 前端翻譯在 src/i18n/translations/，這裡是 Worker 端獨立一份。
 *
 * placeholder 語法：{varName}，由 botMsg() 替換。
 */

// ── BCP 47 → 系統 locale 映射 ──

export function mapLineLanguageToLocale(lang) {
  if (!lang) return 'zh-Hant';
  const l = lang.toLowerCase();
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('en')) return 'en';
  if (l === 'zh-cn' || l === 'zh-hans' || l.startsWith('zh-hans')) return 'zh-Hans';
  // zh-TW, zh-Hant, zh, 或任何其他語言 → 預設繁中
  return 'zh-Hant';
}

// ── URL helper：根據 locale 加前綴 ──

const LOCALE_PREFIX = {
  'zh-Hant': '',
  'en': '/en',
  'ja': '/ja',
  'zh-Hans': '/zh-cn',
};

export function localizeUrl(baseUrl, locale) {
  if (!locale || locale === 'zh-Hant') return baseUrl;
  const prefix = LOCALE_PREFIX[locale] || '';
  if (!prefix) return baseUrl;
  // https://mazu.today/tracker/ → https://mazu.today/en/tracker/
  try {
    const url = new URL(baseUrl);
    url.pathname = prefix + url.pathname;
    return url.toString();
  } catch {
    return baseUrl;
  }
}

// ── 訊息字典 ──

export const BOT_MESSAGES = {
  'zh-Hant': {
    checkin: '📍 立即打卡記錄足跡：\n{url}',
    help: '📖 使用指南請看這裡：\n{url}',
    bug: '📝 回報問題請到這裡：\n{feedbackUrl}\n\n也可以直接在這裡打字描述，我們會看到！',
    share: '📤 分享你的進香足跡給朋友：\n{url}\n\n打開後點「📸 分享我的進香足跡」按鈕，就能分享到 LINE、Facebook 等平台！',
    about: '🌱 2026 白沙屯媽祖 ESG 永續進香\n\n台灣首份進香永續數據計畫，記錄參與者的足跡、碳足跡與善行故事。\n\n📖 了解更多：\n{url}',
    carbon: '🌱 碳足跡小知識\n\n進香途中我們用兩種方式估算你的碳足跡：\n🚶 步行/腳踏車 → 零排放 ✨\n🚌 搭乘交通工具 → 約 0.12013 kg CO₂e/km\n\n走越多、搭越少，碳足跡越低！\n🌿 鼓勵大家多走路、多共乘，一起愛護地球 🌍\n\n📍 前往記錄：\n{url}',
    menu: '🙏 媽祖 Bot 為您服務\n\n輸入以下關鍵字：\n📍「打卡」→ 記錄足跡\n📖「說明」→ 使用指南\n📊「等級」→ 我的紀錄\n🌱「碳足跡」→ 碳排資訊\n💡「關於」→ 專案介紹\n\n💡 輸入「說明」查看使用指南',
    welcome_alt: '🙏 歡迎加入白沙屯媽祖 ESG 永續進香！',
    welcome_header_title: '🙏 白沙屯媽祖',
    welcome_header_subtitle: 'ESG 永續進香 2026',
    welcome_thanks: '感謝加入！',
    welcome_intro: '這是台灣首份進香永續數據計畫。\n進香期間，您可以：',
    welcome_feat_gps: '📍 GPS 打卡記錄足跡',
    welcome_feat_photo: '📷 上傳照片定位路徑',
    welcome_feat_carbon: '🌱 計算個人碳足跡',
    welcome_feat_level: '📊 解鎖 9 級香客等級',
    welcome_keyword_hint: '輸入關鍵字快速操作：',
    welcome_keywords: '「打卡」「說明」「等級」「碳足跡」「分享」「回報」',
    welcome_btn_checkin: '📍 開始打卡',
    welcome_btn_guide: '📖 使用說明',
    stats_error: '暫時無法讀取資料，請稍後再試。',
    stats_no_account: '請先透過 LINE 登入 tracker 建立帳號。',
    stats_checkins: '📍 打卡次數：{count}',
    stats_km: '📊 總公里數：{km} km',
    stats_carbon: '🌱 碳足跡：{carbon} kg CO₂e',
    stats_survey_done: '📋 問卷：已完成',
    stats_survey_pending: '📋 問卷：尚未填寫',
    push: [
      { title: '📍 早安打卡', text: '媽祖保佑 🙏 新的一天，記錄您的進香足跡！' },
      { title: '📍 午間打卡', text: '走了好多路！打個卡記錄一下 🚶' },
      { title: '📍 下午打卡', text: '繼續前進！打卡累積您的香客等級 ✨' },
      { title: '📍 傍晚打卡', text: '今天辛苦了 🙏 打卡記錄今日行程' },
    ],
  },
  'en': {
    checkin: '📍 Check in now and record your journey:\n{url}',
    help: '📖 User guide:\n{url}',
    bug: '📝 Report an issue here:\n{feedbackUrl}\n\nOr just type your feedback here — we will see it!',
    share: '📤 Share your pilgrimage journey with friends:\n{url}\n\nTap the "📸 Share My Pilgrimage" button to share on LINE, Facebook, and more!',
    about: '🌱 2026 Baishatun Mazu ESG Pilgrimage\n\nTaiwan\'s first sustainable pilgrimage data project — tracking footprint, carbon emissions, and stories of kindness.\n\n📖 Learn more:\n{url}',
    carbon: '🌱 Carbon Footprint Facts\n\nWe estimate your carbon footprint two ways:\n🚶 Walking/cycling → Zero emissions ✨\n🚌 Motor transport → ~0.12013 kg CO₂e/km\n\nWalk more, ride less — lower your footprint!\n🌿 Let\'s protect the Earth together 🌍\n\n📍 Record now:\n{url}',
    menu: '🙏 Mazu Bot at your service\n\nType a keyword:\n📍 "checkin" → Record footprint\n📖 "help" → User guide\n📊 "level" → My stats\n🌱 "carbon" → Carbon info\n💡 "about" → About this project\n\n💡 Type "help" for the user guide',
    welcome_alt: '🙏 Welcome to Baishatun Mazu ESG Pilgrimage!',
    welcome_header_title: '🙏 Baishatun Mazu',
    welcome_header_subtitle: 'ESG Pilgrimage 2026',
    welcome_thanks: 'Thanks for joining!',
    welcome_intro: 'Taiwan\'s first sustainable pilgrimage data project.\nDuring the pilgrimage, you can:',
    welcome_feat_gps: '📍 GPS check-in to record your journey',
    welcome_feat_photo: '📷 Upload photos to map your route',
    welcome_feat_carbon: '🌱 Calculate your carbon footprint',
    welcome_feat_level: '📊 Unlock 9 pilgrim levels',
    welcome_keyword_hint: 'Type a keyword for quick actions:',
    welcome_keywords: '"checkin" "help" "level" "carbon" "share" "report"',
    welcome_btn_checkin: '📍 Start Check-in',
    welcome_btn_guide: '📖 User Guide',
    stats_error: 'Unable to load data. Please try again later.',
    stats_no_account: 'Please log in via the LINE tracker first to create an account.',
    stats_checkins: '📍 Check-ins: {count}',
    stats_km: '📊 Total distance: {km} km',
    stats_carbon: '🌱 Carbon footprint: {carbon} kg CO₂e',
    stats_survey_done: '📋 Survey: Completed',
    stats_survey_pending: '📋 Survey: Not yet completed',
    push: [
      { title: '📍 Morning Check-in', text: 'Mazu blesses you 🙏 Start a new day — record your pilgrimage!' },
      { title: '📍 Midday Check-in', text: 'You\'ve walked so far! Check in to record your journey 🚶' },
      { title: '📍 Afternoon Check-in', text: 'Keep going! Check in to level up ✨' },
      { title: '📍 Evening Check-in', text: 'Great effort today 🙏 Check in to record your day' },
    ],
  },
  'ja': {
    checkin: '📍 今すぐチェックインして巡礼を記録：\n{url}',
    help: '📖 使い方ガイド：\n{url}',
    bug: '📝 問題の報告はこちら：\n{feedbackUrl}\n\nここに直接入力してもOKです！',
    share: '📤 巡礼の記録を友達にシェア：\n{url}\n\n「📸 巡礼をシェア」をタップしてLINE・Facebookなどで共有！',
    about: '🌱 2026 白沙屯媽祖 ESG 巡礼\n\n台湾初の巡礼サステナビリティデータ計画 — 足跡、CO₂、善行の記録。\n\n📖 詳しく見る：\n{url}',
    carbon: '🌱 CO₂豆知識\n\n巡礼中のCO₂排出を2つの方法で推定：\n🚶 徒歩/自転車 → ゼロ排出 ✨\n🚌 車両移動 → 約 0.12013 kg CO₂e/km\n\n歩くほどCO₂が減ります！\n🌿 一緒に地球を守りましょう 🌍\n\n📍 記録する：\n{url}',
    menu: '🙏 媽祖 Bot がお手伝い\n\nキーワードを入力：\n📍「checkin」→ 足跡を記録\n📖「help」→ 使い方ガイド\n📊「level」→ マイ記録\n🌱「carbon」→ CO₂情報\n💡「about」→ プロジェクト紹介\n\n💡「help」でガイドを表示',
    welcome_alt: '🙏 白沙屯媽祖 ESG 巡礼へようこそ！',
    welcome_header_title: '🙏 白沙屯媽祖',
    welcome_header_subtitle: 'ESG 巡礼 2026',
    welcome_thanks: 'ご参加ありがとうございます！',
    welcome_intro: '台湾初の巡礼サステナビリティデータ計画。\n巡礼中にできること：',
    welcome_feat_gps: '📍 GPSチェックインで足跡を記録',
    welcome_feat_photo: '📷 写真アップロードでルートを記録',
    welcome_feat_carbon: '🌱 個人のCO₂排出量を計算',
    welcome_feat_level: '📊 9段階の巡礼レベルを解除',
    welcome_keyword_hint: 'キーワードを入力してクイック操作：',
    welcome_keywords: '「checkin」「help」「level」「carbon」「share」「report」',
    welcome_btn_checkin: '📍 チェックイン開始',
    welcome_btn_guide: '📖 使い方ガイド',
    stats_error: 'データを読み込めません。後でもう一度お試しください。',
    stats_no_account: 'まずLINEトラッカーからログインしてアカウントを作成してください。',
    stats_checkins: '📍 チェックイン回数：{count}',
    stats_km: '📊 総距離：{km} km',
    stats_carbon: '🌱 CO₂排出量：{carbon} kg CO₂e',
    stats_survey_done: '📋 アンケート：完了',
    stats_survey_pending: '📋 アンケート：未回答',
    push: [
      { title: '📍 おはようチェックイン', text: '媽祖のご加護を 🙏 新しい一日、巡礼を記録しましょう！' },
      { title: '📍 お昼のチェックイン', text: 'たくさん歩きましたね！チェックインしましょう 🚶' },
      { title: '📍 午後のチェックイン', text: '前進あるのみ！チェックインでレベルアップ ✨' },
      { title: '📍 夕方のチェックイン', text: 'お疲れ様でした 🙏 今日の行程を記録しましょう' },
    ],
  },
  'zh-Hans': {
    checkin: '📍 立即打卡记录足迹：\n{url}',
    help: '📖 使用指南：\n{url}',
    bug: '📝 回报问题请到这里：\n{feedbackUrl}\n\n也可以直接在这里打字描述，我们会看到！',
    share: '📤 分享你的进香足迹给朋友：\n{url}\n\n打开后点「📸 分享我的进香足迹」按钮，就能分享到 LINE、Facebook 等平台！',
    about: '🌱 2026 白沙屯妈祖 ESG 永续进香\n\n台湾首份进香永续数据计划，记录参与者的足迹、碳足迹与善行故事。\n\n📖 了解更多：\n{url}',
    carbon: '🌱 碳足迹小知识\n\n进香途中我们用两种方式估算你的碳足迹：\n🚶 步行/脚踏车 → 零排放 ✨\n🚌 搭乘交通工具 → 约 0.12013 kg CO₂e/km\n\n走越多、搭越少，碳足迹越低！\n🌿 鼓励大家多走路、多共乘，一起爱护地球 🌍\n\n📍 前往记录：\n{url}',
    menu: '🙏 妈祖 Bot 为您服务\n\n输入以下关键字：\n📍「打卡」→ 记录足迹\n📖「说明」→ 使用指南\n📊「等级」→ 我的记录\n🌱「碳足迹」→ 碳排信息\n💡「关于」→ 项目介绍\n\n💡 输入「说明」查看使用指南',
    welcome_alt: '🙏 欢迎加入白沙屯妈祖 ESG 永续进香！',
    welcome_header_title: '🙏 白沙屯妈祖',
    welcome_header_subtitle: 'ESG 永续进香 2026',
    welcome_thanks: '感谢加入！',
    welcome_intro: '这是台湾首份进香永续数据计划。\n进香期间，您可以：',
    welcome_feat_gps: '📍 GPS 打卡记录足迹',
    welcome_feat_photo: '📷 上传照片定位路径',
    welcome_feat_carbon: '🌱 计算个人碳足迹',
    welcome_feat_level: '📊 解锁 9 级香客等级',
    welcome_keyword_hint: '输入关键字快速操作：',
    welcome_keywords: '「打卡」「说明」「等级」「碳足迹」「分享」「回报」',
    welcome_btn_checkin: '📍 开始打卡',
    welcome_btn_guide: '📖 使用说明',
    stats_error: '暂时无法读取资料，请稍后再试。',
    stats_no_account: '请先通过 LINE 登入 tracker 建立账号。',
    stats_checkins: '📍 打卡次数：{count}',
    stats_km: '📊 总公里数：{km} km',
    stats_carbon: '🌱 碳足迹：{carbon} kg CO₂e',
    stats_survey_done: '📋 问卷：已完成',
    stats_survey_pending: '📋 问卷：尚未填写',
    push: [
      { title: '📍 早安打卡', text: '妈祖保佑 🙏 新的一天，记录您的进香足迹！' },
      { title: '📍 午间打卡', text: '走了好多路！打个卡记录一下 🚶' },
      { title: '📍 下午打卡', text: '继续前进！打卡累积您的香客等级 ✨' },
      { title: '📍 傍晚打卡', text: '今天辛苦了 🙏 打卡记录今日行程' },
    ],
  },
};

/**
 * 取得 bot 訊息（帶 placeholder 替換）
 * @param {string} locale - 'zh-Hant' | 'en' | 'ja' | 'zh-Hans'
 * @param {string} key - 訊息 key（如 'checkin', 'menu', 'about'）
 * @param {object} vars - placeholder 變數，如 { url, feedbackUrl, count, km, carbon }
 * @returns {string|object} - 替換後的字串，或原始物件（如 push array）
 */
export function botMsg(locale, key, vars = {}) {
  const dict = BOT_MESSAGES[locale] || BOT_MESSAGES['zh-Hant'];
  const msg = dict[key] ?? BOT_MESSAGES['zh-Hant'][key] ?? key;
  if (typeof msg !== 'string') return msg; // push array 等非字串直接回傳
  return msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
