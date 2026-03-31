/**
 * 日本語 (ja) — Formosa ESG 2026
 *
 * 等級名は「修行・巡礼」テーマで統一：
 *   初心の巡礼者 → 精進の歩者 → 行脚の修行者 → 信念の道者 →
 *   神通の巡者 → 無我の行者 → 悟道の旅人 → 菩薩の巡者 → 天上の巡礼
 *
 * 翻訳方針：
 * - 「進香」→「巡礼」（日本の巡礼文化と対応）
 * - 「祝福」→「祈り」（チェックインの宗教的意味を保持）
 * - 「香客」→「巡礼者」
 * - 「媽祖」→「媽祖（マソ）」（固有名詞、初出時にフリガナ）
 * - 「善足跡」→「エコ・フットプリント」
 * - 敬体（です・ます調）で統一
 */
export const ja = {

  // ─── ブランド & システム ──────────────────────────
  brand: {
    systemName: '白沙屯媽祖 ESG 巡礼トラッカー',
    activityName: '白沙屯媽祖巡礼',
    shortName: '白沙屯媽祖 ESG 巡礼 2026',
    org: 'Formosa ESG × 1.5°C 科学的炭素削減協会',
    tagline: '一歩一歩が地球のために',
  },

  // ─── ナビゲーション ─────────────────────────────
  nav: {
    checkin: 'チェックイン',
    footprint: '足跡',
    guide: 'ガイド',
    more: 'その他',
    expandAll: 'すべて表示',
  },

  // ─── ページタイトル ─────────────────────────────
  page: {
    tracker: 'チェックイン',
    my: 'マイ足跡',
    viewOther: '他の人の足跡を見る',
    dashboard: '管理ダッシュボード',
    data: 'データと方法論',
    guide: '巡礼者ガイド',
    adminGuide: '管理者ガイド',
    privacy: 'プライバシーポリシー',
    feedback: '問題を報告',
  },

  // ─── 認証 & LINE ログイン ────────────────────────
  auth: {
    lineLogin: 'LINEでログイン',
    clickLoginBtn: 'ログインボタンをタップ',
    scanQR: 'QRコードをスキャン',
    searchFriend: '「@539fkwjd」を友だち検索',
    addFriend: '友だちに追加',
    tapMenuLink: 'メニューのリンクをタップ',
  },

  // ─── プライバシー & 同意 ─────────────────────────
  privacy: {
    title: 'プライバシーポリシー',
    agree: '同意する',
    disagree: '同意しない',
    fullText: 'プライバシーポリシー全文を読む',
    mustAgree: 'チェックイン機能を使用するには同意が必要です',
    dataCollected: '収集するデータ：LINEアカウント情報、GPS位置データ、アンケート回答、毎日のエコ・フットプリント報告。電話番号と写真の座標は任意です。',
    photoNotUploaded: '写真はサーバーにアップロードされません',
    onlyGPS: '写真に埋め込まれたGPS座標のみ読み取ります',
    gpsStopsOnClose: 'ページを閉じるとGPS追跡は停止します',
  },

  // ─── 位置情報の許可 ─────────────────────────────
  location: {
    allowAccess: '位置情報へのアクセスを許可しますか？',
    pleaseAllow: '「許可」をタップしてください',
    allow: '許可',
    deny: '許可しない',
  },

  // ─── チェックイン & トラッキング ────────────────────
  tracker: {
    checkin: 'チェックイン',
    photoCheckin: '写真でチェックイン',
    pause: '一時休憩',
    finish: '巡礼を完了する',
    share: 'シェア',
    locating: '位置を取得中…',
    checkinCount: 'チェックイン回数',
    walkingKm: '歩行距離',
    carbonFootprint: 'カーボンフットプリント',
    carbonSaved: 'CO₂削減量',
    distanceToNext: '次のランクまで',
    blessing: '祈り',
  },

  // ─── 等級システム（9段階 — 修行・巡礼テーマ）──────
  levels: {
    title: '巡礼者ランク',
    level: 'ランク',
    levelTitle: '称号',
    km: '距離（km）',
    blessingCount: '祈りの回数',
    approx: '目安の日数',
    upgradeNotice: 'ランクアップ時に通知が届きます',
    tipText: '1日7回の祈りで最速でランクアップできますが、1日5回以上でも十分ペースを保てます。ランクアップ時に通知が届きます。',
    fullJourney: '全行程踏破',
    mascot: '巡礼マスコット',
    mascotDesc: 'ランクごとにピンクの頭巾をかぶった巡礼マスコットがあります',
    '1': { name: '初心の巡礼者', req: '0 km・祈り1回', approxDays: '初めての祈り' },
    '2': { name: '精進の歩者', req: '15 km・祈り5回', approxDays: '≈ 1日目' },
    '3': { name: '行脚の修行者', req: '45 km・祈り10回', approxDays: '≈ 2日目' },
    '4': { name: '信念の道者', req: '90 km・祈り15回', approxDays: '≈ 3日目' },
    '5': { name: '神通の巡者', req: '135 km・祈り20回', approxDays: '≈ 4日目' },
    '6': { name: '無我の行者', req: '180 km・祈り25回', approxDays: '≈ 5日目' },
    '7': { name: '悟道の旅人', req: '225 km・祈り30回', approxDays: '≈ 6日目' },
    '8': { name: '菩薩の巡者', req: '270 km・祈り35回', approxDays: '≈ 7日目' },
    '9': { name: '天上の巡礼', req: '300 km・祈り40回', approxDays: '全行程踏破 ✨' },
  },

  // ─── 毎日のエコ・フットプリント報告 ──────────────
  dailyReport: {
    title: '今日のエコ・フットプリント',
    transport: '会場までの交通手段',
    drove: '自動車',
    hsr: '高速鉄道',
    train: '電車',
    envImpact: '環境への影響',
    waterBottles: 'ペットボトルの水は何本飲みましたか？',
    recycled: '何本リサイクルしましたか？',
    stayed: '宿泊しましたか？',
    autoCalcNote: '交通手段の入力は不要です！GPSの移動速度から「ゼロエミッション」（徒歩・自転車）と「交通機関利用」を自動判別し、カーボンフットプリントを推定します。',
  },

  // ─── アンケート（13問）──────────────────────────
  survey: {
    confirm: '送信する',
    q1: {
      question: 'どのような善行活動に参加しましたか？',
    },
    q2: {
      question: '巡礼中、何に感動しましたか？',
    },
    q3: {
      question: '感動したエピソードがあればご自由にお書きください',
    },
    q4: {
      question: 'この体験で「善行」への理解は深まりましたか？',
    },
    q5: {
      question: '日常生活でも善行を続けますか？',
    },
    q6: {
      question: '今後どのような善行を計画していますか？',
    },
    q7: {
      question: 'お勤め先や所属団体でCSR活動に転換する予定はありますか？',
    },
    q8: {
      question: '参加者としての立場',
      organizer: '主催者',
      participant: '参加者',
    },
    q9: {
      question: '写真をアップロード',
      note: '写真からGPS座標のみ読み取ります。写真自体はアップロードされません',
    },
    q10: {
      question: '電話番号',
      note: '任意 — 抽選の通知に使用します',
    },
  },

  // ─── 達成カード ────────────────────────────────
  achievement: {
    title: '巡礼達成カード',
    finalTitle: '最終達成カード',
    conditions: {
      checkins: 'チェックイン3回以上',
      survey: 'アンケート完了',
      phone: '電話番号の登録',
      allRequired: '3つすべての条件を満たす必要があります',
    },
  },

  // ─── シェア機能 ────────────────────────────────
  share: {
    share: 'シェア',
    copyLink: 'リンクをコピー',
    shareToFriends: '友達や家族にシェア',
    personalPreview: 'パーソナライズされたプレビュー',
    postPreview: '投稿プレビュー',
    friendsCanSee: '友達があなたの進捗をひと目で確認できます',
  },

  // ─── マイページ ────────────────────────────────
  myPage: {
    title: 'マイ巡礼フットプリント',
    currentLevel: '現在のランクとマスコット',
    stats: 'チェックイン回数、歩行距離、カーボンフットプリントと削減量',
    zeroVsTransit: 'ゼロエミッション移動と交通機関利用の距離',
    routeMap: 'あなたのルートマップ',
    distToNext: '次のランクまでの距離',
    permanentNote: '個人ページは永久に保存されます。いつでも記録を確認できます',
  },

  // ─── マップ ───────────────────────────────────
  map: {
    heatmap: 'ヒートマップ',
    heatmapDesc: '色が濃いほどチェックインが多い場所です',
    markers: 'マーカー',
    markersDesc: 'チェックインごとにピンが表示されます',
    cluster: 'クラスター表示',
    clusterDesc: '近くのピンをまとめて表示します',
    frontRunner: '先頭',
    frontRunnerDesc: '最も先を歩いている巡礼者の位置',
    rearGuard: '最後尾',
    rearGuardDesc: '最も後ろを歩いている巡礼者の位置',
    route: '白沙屯→北港',
    progress: '進捗率',
    spread: '先頭と最後尾の距離',
  },

  // ─── 管理ダッシュボード ──────────────────────────
  dashboard: {
    totalParticipants: '総参加者数',
    todayActive: '本日のアクティブ',
    totalCheckins: '総チェックイン数',
    totalWalkingKm: '総歩行距離',
    carbonFootprint: 'カーボンフットプリント',
    carbonSaved: 'CO₂削減量',
    mapPanel: 'マップ',
    analyticsPanel: '分析パネル',
    carbonPanel: 'カーボンパネル',
    levelDistribution: 'ランク分布',
    surveyInsights: 'アンケート結果',
    timeline: 'アクティビティタイムライン',
    peakTimes: 'チェックインのピーク時間帯',
  },

  // ─── プッシュ通知 ──────────────────────────────
  push: {
    title: 'プッシュ通知',
    sendManual: '手動でプッシュ送信',
    selectTarget: '送信先を選択',
    all: '全員',
    pilgrims: '巡礼者',
    volunteers: 'ボランティア',
    admins: '管理者',
    writeContent: 'タイトルと本文を入力',
    send: 'プッシュを送信',
    noConfirmWarning: '確認画面はありません。送信前に内容をもう一度ご確認ください',
    pausedSkipped: '休憩中・完了済みのユーザーには送信されません',
    autoTitle: '自動プッシュ',
    autoSchedule: '毎日 6:00、9:00、12:00、15:00、18:00 に自動送信',
    autoContent: '進捗の更新、励まし、安全に関するお知らせ',
  },

  // ─── 参加者管理 ────────────────────────────────
  users: {
    title: '参加者管理',
    list: 'ユーザー一覧',
    name: '名前',
    checkins: 'チェックイン数',
    carbonData: 'カーボンデータ',
    lastActive: '最終アクティブ',
    role: '役割',
    search: '検索',
    sort: '並べ替え',
  },

  // ─── 役割 ─────────────────────────────────────
  roles: {
    pilgrim: '巡礼者',
    pilgrimDesc: '一般ユーザー — チェックイン、アンケート回答、達成シェアが可能',
    volunteer: 'ボランティア',
    volunteerDesc: '巡礼者と同じ機能に加え、ボランティア向けプッシュ通知を受信可能',
    admin: '管理者',
    adminDesc: 'ダッシュボードにアクセス可能',
  },

  // ─── ユーザーステータス ──────────────────────────
  status: {
    active: 'アクティブ',
    activeDesc: '巡礼に参加中。プッシュ通知を受信します',
    paused: '休憩中',
    pausedDesc: '通知一時停止、GPS追跡停止',
    pausedResume: 'ページを再度開くと自動的に再開します',
    completed: '完了',
    completedDesc: '達成カード確定。以降の通知はありません',
  },

  // ─── イベント制御 ──────────────────────────────
  eventControl: {
    title: 'イベント制御',
    inProgress: '開催中',
    inProgressDesc: 'すべて正常に稼働中',
    paused: '一時停止',
    pausedDesc: 'チェックインなどの機能を一時的に停止',
    ended: '終了',
    endedDesc: 'イベント終了 — すべての機能を停止',
    whenToPause: '一時停止するタイミング',
    pauseExamples: '台風、システムメンテナンス、緊急事態',
    whenToEnd: '終了するタイミング',
    endExamples: 'イベント正式終了時',
  },

  // ─── カーボンフットプリント計算 ──────────────────
  carbon: {
    howCalculated: 'カーボンフットプリントの計算方法',
    rule1: '時速15km以下 = ゼロエミッション',
    rule1Desc: '徒歩、ジョギング、自転車が含まれます',
    rule2: '時速15km超 = 交通機関利用',
    rule2Desc: 'すべての動力移動は公共交通機関の排出係数（0.47515 kg CO₂/km）で推定します',
    autoSpeed: '速度はGPSデータから自動計算されます',
    noManualInput: '手動入力は不要です',
    accommodation: '宿泊（12.5 kg CO₂/泊）',
    water: 'ペットボトル水（0.10974 kg CO₂/本）',
    recycling: 'リサイクル控除（−0.00265 kg CO₂/本）',
    savingsExplain: 'CO₂削減量 = 徒歩の代わりに交通機関を利用した場合の排出量と、実際の排出量の差分です',
    savingsSimple: 'あなたの足がどれだけCO₂を削減したか確認しましょう',
  },

  // ─── よくある質問 ──────────────────────────────
  faq: {
    q_password: 'パスワードは必要ですか？',
    a_password: 'いいえ。LINEでログインするだけで、パスワードは不要です。',
    q_noGreenDot: '緑色の点滅が表示されません',
    a_noGreenDot: '位置情報を「許可しない」にした可能性があります。ページを閉じて再度開き、今度は「許可」をタップしてください。',
    q_closePhone: 'スマホを閉じたら記録は消えますか？',
    a_closePhone: 'いいえ。データはサーバーに保存されています。ページを再度開くと続きから記録されます。',
    q_photoUpload: '写真はアップロードされますか？',
    a_photoUpload: 'いいえ。写真のメタデータからGPS座標のみ読み取ります。写真自体はスマホに残ります。',
    q_noLevelUp: 'たくさん歩いたのにランクが上がりません',
    a_noLevelUp: 'ランクアップには距離とチェックイン回数の両方が必要です。道中で「チェックイン」ボタンをこまめにタップしてください。',
    q_dailyReport: '毎日のエコ・フットプリント報告は必須ですか？',
    a_dailyReport: '交通手段は自動検出されるため入力不要です。ただし、宿泊やペットボトル水のデータを入力すると、フットプリントの計算がより正確になります。',
    q_carbonCalc: 'カーボンフットプリントはどう計算されますか？',
    a_carbonCalc: '移動速度に基づいて2種類に分類します：低速（徒歩・自転車）= ゼロエミッション、高速（交通機関）= 公共交通のCO₂係数で推定。',
    q_carbonSaved: '「CO₂削減量」とは何ですか？',
    a_carbonSaved: '同じ距離を交通機関で移動した場合に排出されるCO₂量との差分です。あなたの足がどれだけ地球に貢献したかを示します。',
    q_noSmartphone: 'スマートフォンを持っていない場合は？',
    a_noSmartphone: '同行の方とスマホを共有するか、現場のボランティアにお声がけください。',
    q_changeSurvey: 'アンケートの回答を変更できますか？',
    a_changeSurvey: 'アンケートは送信後に変更できません。ただし、毎日のエコ・フットプリント報告は毎日再送信可能です。',
  },

  // ─── 共通 UI ──────────────────────────────────
  ui: {
    loading: '読み込み中',
    error: 'エラーが発生しました',
    retry: 'やり直す',
    back: '戻る',
    close: '閉じる',
    confirm: '確認',
    cancel: 'キャンセル',
    today: '今日',
    thisWeek: '今週',
    thisMonth: '今月',
    date: '日付',
    timePeriod: '期間',
    statistics: '統計',
    version: 'バージョン',
    updateDate: '最終更新',
    readPlan: '計画書を読む',
    phone: '電話番号',
    uploadPhoto: '写真をアップロード',
  },

  // ─── フッター ─────────────────────────────────
  footer: {
    lastUpdated: '最終更新',
    contact: 'お問い合わせ',
  },

  // ─── セキュリティ & データ保護 ──────────────────
  security: {
    dataProtection: '個人データの保護',
    encryption: 'HTTPS暗号化通信',
    authentication: '認証',
    rateLimit: 'レート制限',
    rateLimitDesc: '1人あたり60秒間に最大5回のチェックイン',
    dataRetention: '個人データは6か月後に匿名化または削除されます',
    backup: '多層バックアップシステム',
  },
} as const;
