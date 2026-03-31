/**
 * English (en) — Formosa ESG 2026
 *
 * Level names use a Western pilgrimage / sacred journey theme:
 *   Novice Pilgrim → Steadfast Walker → Trail Blazer → Road Warrior →
 *   Sacred Wanderer → Spirit Walker → Path Guardian → Enlightened Pilgrim → The Ascended
 *
 * Translation notes:
 * - "進香" is translated as "pilgrimage" (religious context, not just a walk)
 * - "祝福" is translated as "blessing" (the check-in / prayer action)
 * - "香客" is translated as "pilgrim" (religious participant)
 * - "媽祖" is kept as "Mazu" (proper noun, widely recognized goddess of the sea)
 * - "善足跡" is translated as "eco-footprint" (combines virtue + environmental tracking)
 * - Carbon terms follow ISO 14064 / GHG Protocol conventions where applicable
 */
export const en = {

  // ─── Brand & System ────────────────────────────
  brand: {
    systemName: 'Baishatun Mazu ESG Pilgrimage Tracker',
    activityName: 'Baishatun Mazu Pilgrimage',
    shortName: 'Baishatun Mazu ESG Pilgrimage 2026',
    org: 'Formosa ESG x 1.5°C Science-Based Carbon Reduction Association',
    tagline: 'Every step counts — walk the Earth together',
  },

  // ─── Navigation & Bottom Tab ───────────────────
  nav: {
    checkin: 'Check-in',
    footprint: 'My Track',
    guide: 'Guide',
    more: 'More',
    expandAll: 'Show all',
  },

  // ─── Page Titles ───────────────────────────────
  page: {
    tracker: 'Check-in',
    my: 'My Footprint',
    viewOther: "View Someone's Footprint",
    dashboard: 'Admin Dashboard',
    data: 'Data & Methodology',
    guide: 'Pilgrim Guide',
    adminGuide: 'Admin Guide',
    privacy: 'Privacy Policy',
    feedback: 'Report an Issue',
  },

  // ─── Authentication & LINE Login ───────────────
  auth: {
    lineLogin: 'Sign in with LINE',
    lineLoginBtn: 'Sign in with LINE',
    lineLoginDesc: 'Sign in with your LINE account to record your pilgrimage footprint',
    clickLoginBtn: 'Tap the login button',
    scanQR: 'Scan the QR code',
    searchFriend: 'Search for friend "@539fkwjd"',
    addFriend: 'Add as friend',
    tapMenuLink: 'Tap the link in the menu',
    privacyConsentText: 'By entering, you agree to our {link} for recording your pilgrimage footprint and carbon footprint calculation.',
    privacyCheckboxLabel: 'I have read and agree to the Privacy Policy',
    enterEvent: 'Enter Event',
    privacyRequired: 'You must agree to the Privacy Policy to use the check-in feature',
    networkError: 'Network error. If you cannot enter, please {link}.',
    adminLogin: 'Admin Login',
    adminPassword: 'Admin password',
    verify: 'Verify',
    verifying: 'Verifying…',
    invalidPassword: 'Invalid password',
    cancel: 'Cancel',
    adminOnly: 'Admin access only',
    password: 'Admin password',
    enter: 'Enter',
    adminNote: 'This is the admin dashboard. Pilgrims please go to {link}.',
    processing: 'Processing…',
    loggingIn: 'Signing in…',
  },

  // ─── Privacy & Consent ─────────────────────────
  privacy: {
    title: 'Privacy Policy',
    agree: 'I agree',
    disagree: 'I disagree',
    fullText: 'Read full privacy policy',
    mustAgree: 'You must agree to the privacy policy before using the check-in feature',
    dataCollected: 'We collect: LINE account info, GPS location data, survey responses, and daily eco-footprint reports. Phone number and photo coordinates are optional.',
    photoNotUploaded: 'Your photos are never uploaded to our servers',
    onlyGPS: 'We only read the GPS coordinates embedded in the photo',
    gpsStopsOnClose: 'GPS tracking stops when you close the page',
  },

  // ─── Location Permission ───────────────────────
  location: {
    allowAccess: 'Allow location access?',
    pleaseAllow: 'Please tap "Allow"',
    allow: 'Allow',
    deny: 'Deny',
  },

  // ─── Check-in & Tracking ──────────────────────
  tracker: {
    checkin: 'Check in',
    photoCheckin: 'Photo check-in',
    pause: 'Take a break',
    finish: 'Complete pilgrimage',
    share: 'Share',
    locating: 'Finding your location…',
    checkinCount: 'Check-ins',
    walkingKm: 'Distance walked',
    carbonFootprint: 'Carbon footprint',
    carbonSaved: 'Carbon saved',
    distanceToNext: 'Distance to next level',
    blessing: 'Blessing',
  },

  // ─── Level System (9 Levels — Western Pilgrimage Theme) ──
  levels: {
    title: 'Pilgrim Ranks',
    level: 'Level',
    levelTitle: 'Title',
    km: 'Distance (km)',
    blessingCount: 'Blessings',
    approx: 'Approx. time',
    upgradeNotice: "You'll be notified when you level up",
    tipText: 'Sending 7 blessings a day levels you up fastest, but 5 or more per day keeps you on track. A notification pops up each time you rank up.',
    fullJourney: 'Full journey complete',
    mascot: 'Pilgrim mascot',
    mascotDesc: 'Each rank has its own pink-headscarf pilgrim mascot',
    '1': { name: 'Novice Pilgrim', req: '0 km · 1 blessing', approxDays: 'First blessing' },
    '2': { name: 'Steadfast Walker', req: '15 km · 5 blessings', approxDays: '≈ Day 1' },
    '3': { name: 'Trail Blazer', req: '45 km · 10 blessings', approxDays: '≈ Day 2' },
    '4': { name: 'Road Warrior', req: '90 km · 15 blessings', approxDays: '≈ Day 3' },
    '5': { name: 'Sacred Wanderer', req: '135 km · 20 blessings', approxDays: '≈ Day 4' },
    '6': { name: 'Spirit Walker', req: '180 km · 25 blessings', approxDays: '≈ Day 5' },
    '7': { name: 'Path Guardian', req: '225 km · 30 blessings', approxDays: '≈ Day 6' },
    '8': { name: 'Enlightened Pilgrim', req: '270 km · 35 blessings', approxDays: '≈ Day 7' },
    '9': { name: 'The Ascended', req: '300 km · 40 blessings', approxDays: 'Full journey ✨' },
  },

  // ─── Daily Eco-Footprint Report ────────────────
  dailyReport: {
    title: "Today's Eco-Footprint",
    transport: 'How did you get here?',
    drove: 'Drove',
    hsr: 'High-speed rail',
    train: 'Train',
    envImpact: 'Environmental impact',
    waterBottles: 'Bottled water consumed',
    recycled: 'Bottles recycled',
    stayed: 'Did you stay overnight?',
    autoCalcNote: "No need to enter your travel mode! The system automatically classifies your movement as \"zero-emission\" (walking, cycling) or \"transit\" based on your GPS speed, then estimates your carbon footprint accordingly.",
  },

  // ─── Survey (13 Questions) ─────────────────────
  survey: {
    confirm: 'Submit',
    q1: {
      question: 'Which charitable activities did you participate in?',
    },
    q2: {
      question: 'What moved you during the pilgrimage?',
    },
    q3: {
      question: 'Feel free to share a touching story (optional)',
    },
    q4: {
      question: 'Has this experience deepened your understanding of doing good?',
    },
    q5: {
      question: 'Will you continue doing good in everyday life?',
    },
    q6: {
      question: 'What acts of good do you plan to do in the future?',
    },
    q7: {
      question: 'Will your company or organization turn this into CSR action?',
    },
    q8: {
      question: 'Your role in this event',
      organizer: 'Organizer',
      participant: 'Participant',
    },
    q9: {
      question: 'Upload a photo',
      note: 'The system reads GPS coordinates from the photo; the photo itself is never uploaded',
    },
    q10: {
      question: 'Phone number',
      note: 'Optional — used for prize draw notifications',
    },
  },

  // ─── Achievement Card ──────────────────────────
  achievement: {
    title: 'Pilgrimage Achievement Card',
    finalTitle: 'Final Achievement Card',
    conditions: {
      checkins: 'At least 3 check-ins',
      survey: 'Survey completed',
      phone: 'Phone number provided',
      allRequired: 'All three conditions must be met',
    },
  },

  // ─── Sharing ───────────────────────────────────
  share: {
    share: 'Share',
    copyLink: 'Copy link',
    shareToFriends: 'Share with friends & family',
    personalPreview: 'Personalized preview',
    postPreview: 'Post preview',
    friendsCanSee: 'Friends can see your progress at a glance',
  },

  // ─── My Page ───────────────────────────────────
  myPage: {
    title: 'My Pilgrimage Footprint',
    currentLevel: 'Current rank & mascot',
    stats: 'Check-ins, distance, carbon footprint & savings',
    zeroVsTransit: 'Zero-emission vs. transit distance',
    routeMap: 'Your route map',
    distToNext: 'Distance to next rank',
    permanentNote: 'Your personal page is kept permanently — come back anytime to review your record',
  },

  // ─── Map ───────────────────────────────────────
  map: {
    heatmap: 'Heatmap',
    heatmapDesc: 'Darker areas = more check-ins',
    markers: 'Markers',
    markersDesc: 'Each check-in is marked with a pin',
    cluster: 'Cluster view',
    clusterDesc: 'Nearby pins are grouped together',
    frontRunner: 'Front runner',
    frontRunnerDesc: 'Where the leading pilgrim is',
    rearGuard: 'Rear guard',
    rearGuardDesc: 'Where the last pilgrim is',
    route: 'Baishatun → Beigang',
    progress: 'Progress',
    spread: 'Distance between front and rear',
  },

  // ─── Admin Dashboard ───────────────────────────
  dashboard: {
    totalParticipants: 'Total participants',
    todayActive: 'Active today',
    totalCheckins: 'Total check-ins',
    totalWalkingKm: 'Total distance walked',
    carbonFootprint: 'Carbon footprint',
    carbonSaved: 'Carbon saved',
    mapPanel: 'Map',
    analyticsPanel: 'Analytics',
    carbonPanel: 'Carbon panel',
    levelDistribution: 'Rank distribution',
    surveyInsights: 'Survey insights',
    timeline: 'Activity timeline',
    peakTimes: 'Peak check-in times',
  },

  // ─── Push Notifications ────────────────────────
  push: {
    title: 'Push notifications',
    sendManual: 'Send manual push',
    selectTarget: 'Select recipients',
    all: 'Everyone',
    pilgrims: 'Pilgrims',
    volunteers: 'Volunteers',
    admins: 'Admins',
    writeContent: 'Write title & message',
    send: 'Send push',
    noConfirmWarning: 'There is no confirmation step — please review before sending',
    pausedSkipped: 'Users on break or who have finished will not receive it',
    autoTitle: 'Auto push',
    autoSchedule: 'Sent daily at 6 AM, 9 AM, 12 PM, 3 PM, 6 PM',
    autoContent: 'Progress updates, encouragement, safety reminders',
  },

  // ─── User Management ───────────────────────────
  users: {
    title: 'Participant management',
    list: 'User list',
    name: 'Name',
    checkins: 'Check-ins',
    carbonData: 'Carbon data',
    lastActive: 'Last active',
    role: 'Role',
    search: 'Search',
    sort: 'Sort',
  },

  // ─── Roles ─────────────────────────────────────
  roles: {
    pilgrim: 'Pilgrim',
    pilgrimDesc: 'Regular user — can check in, fill surveys, share achievements',
    volunteer: 'Volunteer',
    volunteerDesc: 'Same features as pilgrim; can receive volunteer-specific push notifications',
    admin: 'Admin',
    adminDesc: 'Has access to the dashboard',
  },

  // ─── User Status ───────────────────────────────
  status: {
    active: 'Active',
    activeDesc: 'Currently on the pilgrimage; receives push notifications',
    paused: 'On break',
    pausedDesc: 'Notifications paused; GPS tracking stopped',
    pausedResume: 'Reopening the page automatically resumes tracking',
    completed: 'Completed',
    completedDesc: 'Achievement card finalized; no further notifications',
  },

  // ─── Event Control ─────────────────────────────
  eventControl: {
    title: 'Event control',
    inProgress: 'In progress',
    inProgressDesc: 'Everything running normally',
    paused: 'Paused',
    pausedDesc: 'Check-in and other features temporarily disabled',
    ended: 'Ended',
    endedDesc: 'Event over — all features closed',
    whenToPause: 'When to pause',
    pauseExamples: 'Typhoon, system maintenance, emergencies',
    whenToEnd: 'When to end',
    endExamples: 'Event officially over',
  },

  // ─── Carbon Footprint Calculation ──────────────
  carbon: {
    howCalculated: 'How is carbon footprint calculated?',
    rule1: 'Speed ≤ 15 km/h = zero emission',
    rule1Desc: 'Includes walking, jogging, and cycling',
    rule2: 'Speed > 15 km/h = transit',
    rule2Desc: 'All motorized travel is estimated using the public transit emission factor (0.47515 kg CO₂/km)',
    autoSpeed: 'Speed is calculated automatically from your GPS data',
    noManualInput: 'No manual input required',
    accommodation: 'Accommodation (12.5 kg CO₂/night)',
    water: 'Bottled water (0.10974 kg CO₂/bottle)',
    recycling: 'Recycling credit (−0.00265 kg CO₂/bottle)',
    savingsExplain: 'Carbon saved = the CO₂ that would have been emitted if you had taken transit instead of walking, minus your actual emissions',
    savingsSimple: 'See how much CO₂ your feet saved',
  },

  // ─── FAQ ───────────────────────────────────────
  faq: {
    q_password: 'Do I need a password?',
    a_password: 'No. Pilgrims just sign in with LINE — no password needed.',
    q_noGreenDot: "I don't see a green blinking dot on my phone?",
    a_noGreenDot: 'You may have denied location access. Close the page, reopen it, and tap "Allow" this time.',
    q_closePhone: 'Will my records disappear if I close my phone?',
    a_closePhone: 'No. All your data is saved on the server. When you reopen the page, it picks up where you left off.',
    q_photoUpload: 'Will my photos be uploaded?',
    a_photoUpload: 'No. The system only reads GPS coordinates from the photo metadata. The photo itself stays on your phone.',
    q_noLevelUp: "I've walked a lot but my rank hasn't gone up?",
    a_noLevelUp: 'Ranking requires both distance and check-ins. Make sure to tap "Check in" regularly along the way.',
    q_dailyReport: 'Do I have to fill out the daily eco-footprint report?',
    a_dailyReport: "Transport mode is auto-detected — no need to enter it. But if you add accommodation and water data, your footprint calculation will be more complete.",
    q_carbonCalc: 'How is my carbon footprint calculated?',
    a_carbonCalc: 'The system classifies your movement into two categories based on speed: slow (walking, cycling) = zero emission; fast (transit) = estimated using the public transit CO₂ factor.',
    q_carbonSaved: 'What does "carbon saved" mean?',
    a_carbonSaved: "It's the CO₂ that would have been emitted if you had taken motorized transit for the same distance. The system shows how much your feet saved.",
    q_noSmartphone: "What if I don't have a smartphone?",
    a_noSmartphone: 'You can share a phone with a friend, or ask an on-site volunteer for help.',
    q_changeSurvey: 'Can I change my survey answers?',
    a_changeSurvey: 'The survey is final once submitted. However, the daily eco-footprint report can be re-submitted each day.',
  },

  // ─── Common UI ─────────────────────────────────
  ui: {
    loading: 'Loading',
    error: 'Something went wrong',
    retry: 'Retry',
    back: 'Back',
    close: 'Close',
    confirm: 'Confirm',
    cancel: 'Cancel',
    today: 'Today',
    thisWeek: 'This week',
    thisMonth: 'This month',
    date: 'Date',
    timePeriod: 'Time period',
    statistics: 'Statistics',
    version: 'Version',
    updateDate: 'Last updated',
    readPlan: 'Read the plan',
    phone: 'Phone number',
    uploadPhoto: 'Upload photo',
  },

  // ─── Footer ────────────────────────────────────
  footer: {
    lastUpdated: 'Last updated',
    contact: 'Contact',
  },

  // ─── Security & Data Protection ────────────────
  security: {
    dataProtection: 'Personal data protection',
    encryption: 'HTTPS encrypted transmission',
    authentication: 'Authentication',
    rateLimit: 'Rate limiting',
    rateLimitDesc: 'Max 5 check-ins per person per 60 seconds',
    dataRetention: 'Personal data anonymized or deleted after 6 months',
    backup: 'Multi-layer backup system',
  },

  // ─── Tracker UI Strings (front-end integration) ──
  tracker_ui: {
    testBanner: '🔧 Test Mode — Data may be cleared anytime, event starts 4/12',
    backToProject: 'Back to project',
    eventDateRange: '4/12 – 4/20 Event Log',
    locatingAuto: 'Locating (auto-recording route)',
    progressText: 'Q {current} / {total}',
    sectionGoodDeeds: 'Part 1: Good Deeds',
    sectionPostChange: 'Part 2: Post-Event Reflections',
    sectionBasicInfo: 'Part 3: Basic Info & Environmental Impact',
    sectionPhotoUpload: 'Part 4: Photo Upload & Location',
    multipleChoiceHint: '(Multiple choice, tap Next when done)',
    optionalHint: '(Optional, skip if you like)',
    optional: '(Optional)',
    other: 'Other',
    pleaseExplain: 'Please describe...',
    nextQuestion: 'Next →',
    prevQuestion: '← Previous',
    submitConfirmTitle: 'Confirm Submission',
    submitConfirmBody: 'You have completed all questions. Tap the button below to submit.',
    submitButton: 'Submit ✓',
    thankYou: 'Thank you for participating!',
    submitSuccess: 'Your record has been submitted. May Mazu bless you.',
    nextLevelPrompt: 'Keep checking in to level up to',
    shareToFriends: 'Share with friends',
    copiedToClipboard: 'Copied to clipboard!',
    viewMyFootprint: 'View my pilgrimage footprint',
    welcomeBack: 'Welcome back!',
    surveyDone: 'Survey completed. Continue checking in to record your journey.',
    checkinNow: 'Check In Now',
    orTakePhoto: 'or take a photo to log location',
    photoPrivacyNote: 'Photos are not uploaded — only GPS coordinates are extracted',
    takePhoto: 'Photo',
    savePhoto: 'Save Photo',
    dailyReportHint: '30 seconds a day for more accurate carbon data',
    transportAutoNote: 'Transport carbon is auto-calculated from GPS — no input needed',
    waterBottle: 'Bottled Water',
    recycleBottle: 'Recycled Bottles',
    bottleUnit: 'bottles',
    hotelToday: 'Stayed at hotel today',
    hotelYes: 'Yes',
    todayCarbon: "Today's Carbon Footprint",
    submitDailyReport: 'Submit Daily Report',
    cumulativeCarbon: 'Cumulative Carbon',
    inviteFriends: 'Invite friends to join',
    pauseBtn: 'Pause',
    completeBtn: 'Complete Pilgrimage',
    pauseCompleteHint: 'Pause resumes on re-entry; completion is permanent.',
    completedTitle: 'Pilgrimage Complete!',
    completedMessage: 'Thank you for participating. May Mazu bless you.',
    geoNotSupported: 'Geolocation not supported on this device',
    trackingWaiting: 'Tracking — waiting for movement...',
    tracking: 'Tracking',
    gpsRecords: ' GPS records',
    locationDenied: 'Location permission denied. Please enable in settings.',
    gpsSearching: 'GPS searching...',
    locating: 'Locating...',
    manualCheckinLabel: 'Manual check-in',
    checkinDone: 'Checked in',
    permissionAlert: 'Location permission denied. Please enable location in device settings.',
    weakSignal: 'GPS signal weak — try an open area',
    locationTimeout: 'Cannot locate — please try again later',
    selectAtLeastOne: 'Please select at least one option',
    loginRequired: 'Please log in with LINE first',
    sending: 'Sending...',
    dailySaved: 'Report saved',
    saveFailed: 'Save failed',
    networkError: 'Network error — please try again',
    processing: 'Processing…',
    paused: 'Paused',
    pausedStatus: 'Paused (resumes on re-entry)',
    completeConfirm: 'Complete pilgrimage? This cannot be undone.',
    tooFrequent: 'Too many check-ins — please wait',
    recordedLocal: 'Recorded (offline)',
    kmUnit: 'km',
    checkinCount: 'Check-ins',
    expandToggle: 'Expand ▼',
    collapseToggle: 'Collapse ▲',
    photosRecorded: 'photos recorded',
    photoSaved: 'Photo saved',
    readingGPS: 'Reading GPS...',
    readFailed: 'Read failed — please retry',
    notLoggedIn: 'Not logged in — records saved locally only',
    maxLevel: 'Congratulations! Maximum level reached!',
    shareMessage: "I joined the Baishatun Mazu ESG Pilgrimage — join me and record your journey 🙏",
    days: 'days',
    gpsPoints: 'GPS Points',
    goodDeedParticipation: 'Good Deeds',
    joinedDate: 'Joined',
    zeroEmission: 'Zero-emission travel',
    transitEmission: 'Transit',
    carbonDisclaimer: 'Carbon data is a simplified estimate',
    uploadParsingPhotos: 'Parsing photo EXIF data...',
    uploadParseComplete: 'Parsing complete',
    altitude: 'Altitude',
    longPressHint: 'Long press photo → Save image',
    linePhotoHint: 'Tap "📥 Save Photo" and long press to save',
  },
} as const;
