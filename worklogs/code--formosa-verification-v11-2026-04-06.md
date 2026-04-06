# Handoff: Issue #116 驗收清單 v1.1 最終更新

## 背景

/verification/ 頁面 v1.0（4/07）上線後，多項工作已完成（#113 志工說明書、#115 隱私聲明 v0.3）。
需更新 i18n 反映最新狀態：34 項中 31 通過、3 進行中/建議。
這是 4/12 起駕前的最後一次更新，4/11 進入凍結期。

## Step 0 偵察

```bash
# 確認目前版本
grep -n 'v1.0' src/i18n/translations/zh-Hant.ts | grep verification
# 確認排定中 / 進行中 Note
grep -n '排定中' src/i18n/translations/zh-Hant.ts
grep -n \"item4_4Note\\|item7_3Note\" src/i18n/translations/zh-Hant.ts
# 確認結論數字
grep -n '29 項通過' src/i18n/translations/zh-Hant.ts
```

## 修改清單（9 個 key × 4 語系 = 36 處）

### zh-Hant（Source of Truth）— 其他三語系同步修改

| # | Key | 現狀 | 修改為 |
|---|-----|------|--------|
| 1 | `verificationPage.version` | `'版本 v1.0'` | `'版本 v1.1'` |
| 2 | `verificationPage.assessDate` | `'評估日期：2026-04-07'` | `'評估日期：2026-04-10'` |
| 3 | `verificationPage.item7_3` | `'志工版說明書\|預計 4/08 完成。涵蓋志工在活動現場的系統使用方式與協助流程。'` | `'志工版說明書\|已完成（Issue #113）。13 章節完整指引，含志工角色定位、LINE 登入、打卡協助、善足跡查看、協助香客 QA 等。密碼保護頁面已上線。'` |
| 4 | `verificationPage.item7_3Note` | `'排定中'` | `''`（空字串） |
| 5 | `verificationPage.item7_4` | `'LINE OA 訊息方案\|已升級至 Medium 方案（每月 3,000 則），可依需求再升級高級版。'` | `'LINE OA 訊息方案\|目前 Medium 方案（每月 3,000 則）。活動期間規劃升級至進階版（6,000 則，超額 NT$0.2/則），升級時機由管理者決定。'` |
| 6 | `verificationPage.item4_4` | `'隱私權聲明頁面更新\|現有隱私聲明涵蓋基本個資保護條款，建議於活動前依最終功能範圍更新文字內容。'` | `'隱私權聲明頁面更新\|已完成 v0.3 更新（Issue #115）。移除未確定合作商家具名，涵蓋基本個資保護條款、資料蒐集範圍與用途。'` |
| 7 | `verificationPage.item4_4Note` | `'進行中'` | `''`（空字串） |
| 8 | `verificationPage.conclusionP2` | `'34 項檢查中有 29 項通過、5 項為進行中或建議項目（志工說明書、隱私聲明更新、短網址跳轉、緊急修復流程確認、活動結束演練），均不影響系統正常運作，可於活動前陸續完善。'` | `'34 項檢查中有 31 項通過、3 項為建議項目（短網址跳轉、緊急修復流程確認、活動結束演練），均不影響系統正常運作，可於活動前陸續完善。'` |
| 9 | `verificationPage.footnote` | `'本報告基於 2026 年 4 月 7 日的系統狀態評估。...'` | `'本報告基於 2026 年 4 月 10 日的系統狀態評估。活動期間（4/11-4/13）為程式碼凍結期，不進行非緊急更新。活動結束後將進行結案檢討，內容涵蓋系統表現、參與數據、碳足跡統計與改善建議。'` |

### 三語系翻譯對照

**en.ts:**
| Key | 修改為 |
|-----|--------|
| version | `'Version v1.1'` |
| assessDate | `'Assessment Date: 2026-04-10'` |
| item7_3 | `'Volunteer Guide\|Completed (Issue #113). 13-section guide covering volunteer roles, LINE login, check-in assistance, footprint viewing, pilgrim Q&A support, and more. Password-protected page is live.'` |
| item7_3Note | `''` |
| item7_4 | `'LINE OA Messaging Plan\|Currently on Medium plan (3,000 messages/month). Planned upgrade to Advanced plan (6,000 messages, NT$0.2/extra) for event period, timing decided by admin.'` |
| item4_4 | `'Privacy Policy Page Update\|Completed v0.3 update (Issue #115). Removed unconfirmed partner merchant names. Covers basic personal data protection terms, data collection scope, and purposes.'` |
| item4_4Note | `''` |
| conclusionP2 | `'Of the 34 checklist items, 31 have passed and 3 are advisory items (short URL redirect, emergency fix workflow confirmation, event-end rehearsal). None affect normal system operation and can be addressed before launch.'` |
| footnote | `'This report is based on the system status assessment as of April 10, 2026. During the event period (April 11-13), a code freeze is in effect — no non-emergency updates will be deployed. A post-event review will cover system performance, participation data, carbon footprint statistics, and improvement recommendations.'` |

**ja.ts:**
| Key | 修改為 |
|-----|--------|
| version | `'バージョン v1.1'` |
| assessDate | `'評価日：2026-04-10'` |
| item7_3 | `'ボランティアガイド\|完成（Issue #113）。ボランティアの役割、LINEログイン、チェックイン支援、足跡閲覧、巡礼者Q&Aサポートなど13セクションの完全ガイド。パスワード保護ページ公開済み。'` |
| item7_3Note | `''` |
| item7_4 | `'LINE OA メッセージプラン\|現在ミディアムプラン（月3,000通）。イベント期間中にアドバンスプラン（6,000通、超過分NT$0.2/通）へのアップグレードを予定。タイミングは管理者が決定。'` |
| item4_4 | `'プライバシーポリシーページ更新\|v0.3更新完了（Issue #115）。未確定の提携店舗名を削除。基本的な個人情報保護条項、データ収集範囲および目的を記載。'` |
| item4_4Note | `''` |
| conclusionP2 | `'34項目中31項目が合格、3項目が推奨事項（短縮URL転送、緊急修正フロー確認、イベント終了リハーサル）です。いずれもシステムの正常動作に影響せず、ローンチ前に対応可能です。'` |
| footnote | `'本レポートは2026年4月10日時点のシステム状況に基づいています。イベント期間中（4/11-4/13）はコードフリーズ期間であり、緊急でない更新は行いません。イベント終了後、システムパフォーマンス、参加データ、カーボンフットプリント統計、改善提案を含む振り返りレビューを実施します。'` |

**zh-Hans.ts:**
| Key | 修改為 |
|-----|--------|
| version | `'版本 v1.1'` |
| assessDate | `'评估日期：2026-04-10'` |
| item7_3 | `'志工版说明书\|已完成（Issue #113）。13 章节完整指引，含志工角色定位、LINE 登录、打卡协助、善足迹查看、协助香客 QA 等。密码保护页面已上线。'` |
| item7_3Note | `''` |
| item7_4 | `'LINE OA 讯息方案\|目前 Medium 方案（每月 3,000 则）。活动期间规划升级至进阶版（6,000 则，超额 NT$0.2/则），升级时机由管理者决定。'` |
| item4_4 | `'隐私权声明页面更新\|已完成 v0.3 更新（Issue #115）。移除未确定合作商家具名，涵盖基本个资保护条款、数据收集范围与用途。'` |
| item4_4Note | `''` |
| conclusionP2 | `'34 项检查中有 31 项通过、3 项为建议项目（短网址跳转、紧急修复流程确认、活动结束演练），均不影响系统正常运作，可于活动前陆续完善。'` |
| footnote | `'本报告基于 2026 年 4 月 10 日的系统状态评估。活动期间（4/11-4/13）为代码冻结期，不进行非紧急更新。活动结束后将进行结案检讨，内容涵盖系统表现、参与数据、碳足迹统计与改善建议。'` |

## 驗證

```bash
# Build 確認
npm run build 2>&1 | tail -5

# 確認 v1.1
grep -n 'v1.1' src/i18n/translations/zh-Hant.ts | grep verification

# 確認 31 項通過
grep -n '31 項通過' src/i18n/translations/zh-Hant.ts

# 確認排定中和進行中已移除
grep -n '排定中' src/i18n/translations/zh-Hant.ts
grep -n '進行中' src/i18n/translations/zh-Hant.ts | grep verification
# 預期：0 matches

# 確認其他語系版本號
grep -n 'v1.1' src/i18n/translations/en.ts | grep verification
grep -n 'v1.1' src/i18n/translations/ja.ts | grep verification
grep -n 'v1.1' src/i18n/translations/zh-Hans.ts | grep verification
```

## 注意事項

- **只改 verificationPage namespace 的 key**，不動其他區塊
- zh-Hant.ts 是 Source of Truth（123KB 大檔），小心不要破壞其他 key
- 4 語系同步修改，確保 key 結構一致
- 風險等級 L0，git push 自動部署，不需 Worker deploy

## 回報格式

完成後回報：commit hash、build 結果、grep 驗證結果。
Issue #116 可以 close。

## 附帶：順手 close Issue #104

Issue #104（Dashboard LINE 推播功能）已被 #105 + #112 完全涵蓋並超越，可以 close。
"
