# Formosa ESG 2026 Worker API — エンドポイントリファレンス

**バージョン:** v1.0
**日付:** 2026-04-04
**言語:** 日本語
**対象読者:** 開発者、QA テスター、インテグレーション パートナー

---

## 目次

1. [ベース URL とアクセス](#ベース-url-とアクセス)
2. [パブリック エンドポイント](#パブリック-エンドポイント)
3. [管理者向けエンドポイント](#管理者向けエンドポイント)
4. [Cron ジョブ](#cron-ジョブ)
5. [グローバル エンドポイント](#グローバル-エンドポイント)
6. [認証](#認証)
7. [レート制限](#レート制限)
8. [レスポンス形式](#レスポンス形式)
9. [定数リファレンス](#定数リファレンス)
10. [レベルシステム](#レベルシステム)
11. [カーボンコエフィシェント](#カーボンコエフィシェント)
12. [三階層認可](#三階層認可)

## ベース URL とアクセス

### 本番環境
- **主要:** `https://api.paulkuo.tw`
- **代替:** `https://mazu.today` (リバースプロキシ)

すべての API リクエストは HTTPS を使用する必要があります。HTTP エンドポイントへのリクエストは失敗します。

## パブリック エンドポイント

これらのエンドポイントは認証を必要としません。

| メソッド | パス | ハンドラ | 目的 |
|---------|------|---------|------|
| POST | `/api/formosa/webhook` | handleFormosaWebhook | LINE Bot webhook（フォロー、アンフォロー、メッセージ、ポストバック） |
| POST | `/api/formosa/submit` | handleFormosaSubmit | アンケート回答を送信（Q1–Q10） |
| POST | `/api/formosa/checkin` | handleFormosaCheckin | GPS チェックイン（KV バッファ付き） |
| POST | `/api/formosa/track/sync` | handleFormosaTrackSync | バッチ GPS トラック同期 |
| POST | `/api/formosa/user/sync` | handleFormosaUserSync | ユーザープロファイルデータ同期 |
| GET | `/api/formosa/photos/count` | handleFormosaPhotoCount | ユーザーあたりの写真数を取得 |
| POST | `/api/formosa/user/phone` | handleFormosaPhoneUpdate | ユーザー電話番号を更新 |
| POST | `/api/formosa/og-image` | handleFormosaOgImage | OG シェアカード画像を生成 |
| GET | `/api/formosa/og/{userId}.png` | handleFormosaOgServe | キャッシュされた OG 画像を配信 |
| GET | `/api/formosa/data` | handleFormosaData | ダッシュボード用最新 GPS ポイントを取得 |
| GET | `/api/formosa/user/{userId}` | handleFormosaUser | ユーザープロファイル + アクティビティ統計を取得 |
| POST | `/api/formosa/privacy` | handleFormosaPrivacyAgree | プライバシー同意を記録 |
| POST | `/api/formosa/participant-status` | handleFormosaParticipantStatus | 参加者ステータスを更新（アクティブ/完了/退出） |
| POST | `/api/formosa/feedback` | handleFormosaFeedback | ユーザーフィードバックを送信 |
| GET | `/api/formosa/feedback` | handleFormosaFeedbackList | フィードバックエントリを一覧表示（管理者コンテキスト） |
| POST | `/api/formosa/feedback-upload` | handleFormosaFeedbackUpload | フィードバック スクリーンショットをアップロード |
| GET | `/api/formosa/feedback/status` | handleFormosaFeedbackPublicStatus | パブリック フィードバックステータスを取得 |
| PATCH | `/api/formosa/feedback/{id}` | handleFormosaFeedbackUpdate | フィードバック項目を更新 |
| GET | `/api/formosa/feedback-image/{filename}.png` | handleFormosaFeedbackImageServe | フィードバック スクリーンショット画像を配信 |

### ペイロード制限
すべての POST `/api/formosa/*` リクエストは最大コンテンツ長 **102,400 バイト（100 KB）** を受け入れます。この制限を超えるリクエストは **HTTP 413 Payload Too Large** を返します。

## 管理者向けエンドポイント

有効な管理者、マネージャー、またはオーナートークンを持つ `X-Admin-Token` ヘッダーが必要です。

| メソッド | パス | ハンドラ | 目的 |
|---------|------|---------|------|
| GET | `/api/formosa/auth/role` | handleFormosaAuthRole | 呼び出し元の認可ロールを確認 |
| GET | `/api/formosa/admin/surveys` | handleFormosaAdminSurveys | すべてのアンケート回答を一覧表示 |
| GET | `/api/formosa/admin/carbon` | handleFormosaAdminCarbon | カーボン フットプリント集計を取得 |
| GET | `/api/formosa/admin/timeline` | handleFormosaAdminTimeline | イベント タイムラインを取得 |
| GET | `/api/formosa/admin/users` | handleFormosaAdminUsers | すべてのユーザーを統計情報付きで取得 |
| GET | `/api/formosa/admin/clusters` | handleFormosaAdminClusters | サーバー側グリッド クラスタリング データ |
| GET | `/api/formosa/admin/status` | handleFormosaAdminStatus | アクティビティ ステータスを取得 |
| PUT | `/api/formosa/admin/status` | handleFormosaAdminStatus | アクティビティ ステータスを設定 |
| GET | `/api/formosa/admin/roles` | handleFormosaAdminRoles | すべてのロール割り当てを取得 |
| POST | `/api/formosa/admin/roles` | handleFormosaAdminRoles | ユーザー ロールを割り当てまたは更新 |
| POST | `/api/formosa/admin/richmenu` | handleFormosaRichMenu | LINE リッチメニューをデプロイ |
| POST | `/api/formosa/push` | handleFormosaPush | LINE プッシュ通知を送信 |
| POST | `/api/formosa/admin/end-activity` | handleFormosaAdminEndActivity | アクティビティ セッションを終了 |
| GET | `/api/formosa/line-usage` | handleFormosaLineUsage | LINE メッセージ クォータ使用状況を取得 |

## Cron ジョブ

内部スケジュール タスク（HTTP エンドポイント非公開）。

| スケジュール | ハンドラ | 目的 | ソース |
|----------|---------|------|--------|
| 5分ごと（`*/5 * * * *`） | handleFormosaFlushBuffer | KV バッファ → D1 データベースへのバッチ フラッシュ | formosa.js:528 |
| 1時間ごと | handleFormosaScheduledPush | スケジュール済み LINE 通知を配信 | formosa.js |

## グローバル エンドポイント

### システム ヘルスチェック
```
GET /health
```
Formosa サブシステムの詳細を含むシステム ヘルスステータスを返します：D1 データベース ステータス、KV ストア ステータス、保留中の KV キー数、最後のフラッシュ タイムスタンプ。

## 認証

### ヘッダー形式
```
X-Admin-Token: <token_value>
```
すべての管理者向けエンドポイントはこのヘッダーを必須とします。有効な認証がないリクエストは **HTTP 401 Unauthorized** を返します。

### トークン タイプ
3 つの認可レベルがサポートされています：

| 階層 | 環境変数 | ROLE_LEVEL | 権限 |
|------|--------|-----------|------|
| オーナー | `FORMOSA_ADMIN_TOKEN` | 3 | すべての管理操作 + 設定管理 |
| マネージャー | `FORMOSA_MANAGER_TOKEN` | 2 | 管理読み取り + フィードバック/プッシュ操作 |
| ボランティア | `FORMOSA_VOLUNTEER_TOKEN` | 1 | 限定読み取り専用アクセス |

**ソース:** formosa.js:19–44

## レート制限

すべてのレート制限は KV ストアを介して `userId` または管理者トークンごとに適用されます。

| エンドポイント | 制限 | ウィンドウ | ステータスコード |
|----------|------|---------|------------|
| `/api/formosa/checkin` | 5 リクエスト | 60 秒 | 超過時 429 |
| `/api/formosa/submit` | 2 リクエスト | 600 秒 | 超過時 429 |
| `/api/formosa/track/sync` | 10 リクエスト | 60 秒 | 超過時 429 |
| 管理者向けエンドポイント | 30 リクエスト | 60 秒 | 超過時 429 |

## レスポンス形式

### 成功レスポンス
```json
{
  "ok": true,
  "data": { /* エンドポイント固有のデータ */ }
}
```

### エラー レスポンス
```json
{
  "error": "人間が読める形式のエラーメッセージ"
}
```

HTTP ステータスコード：
- **200 OK** — 標準的な成功レスポンス
- **202 Accepted** — 非同期操作がキューに入った状態（例：KV バッファ経由のチェックイン）
- **204 No Content** — OPTIONS CORS プリフライト
- **400 Bad Request** — リクエスト ペイロードが無効
- **401 Unauthorized** — 認証トークンが欠落または無効
- **413 Payload Too Large** — リクエスト本体が 100 KB を超過
- **429 Too Many Requests** — レート制限を超過

### 非同期操作
チェックイン リクエストは **HTTP 202 Accepted** を返し、`ctx.waitUntil()` を経由した非同期 KV 書き込みの 8 秒タイムアウトがあります。呼び出し元はユーザーに応答する前に完了を待つべきではありません。

## 定数リファレンス

### KV ストア TTL（有効期限）

| 定数 | 値 | 期間 | 行 | 目的 |
|------|-----|------|-----|------|
| GPS バッファデータ | 259200 | 3 日 | L402, L416, L497, L584 | バッチ フラッシュ前に生 GPS ポイントを保存 |
| GPS 数キャッシュ | 2592000 | 30 日 | L424, L505, L604 | ユーザーあたりの写真数をキャッシュ |
| フラッシュ ロック | 90 | 1.5 分 | L528 | 同時バッファ フラッシュ操作を防止 |
| 最後のフラッシュ タイムスタンプ | 86400 | 1 日 | L611 | D1 へのフラッシュ成功を追跡 |
| 統計キャッシュ | 60 | 1 分 | L838 | ユーザー統計（レベル、距離、チェックイン）をキャッシュ |
| 重複排除キー | 60 | 1 分 | L427 | 重複 GPS 送信を防止 |

### 速度ベースの輸送モード推論

| 条件 | 分類 | GWP 係数 | 目的 |
|------|------|---------|------|
| ≤ 15 km/h | ゼロエミッション | 0 kg CO₂e/km | 歩行、サイクリング、停止中 |
| > 15 km/h | モータライズド | 0.47515 kg CO₂e/km | バス係数（デフォルト） |

## レベルシステム

### 成就タイトル（TITLES 配列）

ユーザーは累積距離（km）とチェックイン数の両方に基づいて 9 つのレベルで進行します。両方の閾値を同時に満たす必要があります。

| レベル | 中国名 | 日本語読み | 最小 km | 最小チェックイン | アイコン |
|--------|--------|---------|---------|------------|--------|
| 1 | 煉氣香客 | れんき | 0 | 1 | 🔥 |
| 2 | 築基香客 | ちくき | 15 | 5 | 🧱 |
| 3 | 金丹香客 | きんたん | 45 | 10 | 💛 |
| 4 | 元嬰香客 | げんえい | 90 | 15 | 👶 |
| 5 | 化神香客 | かしん | 135 | 20 | ✨ |
| 6 | 煉虛香客 | れんきょ | 180 | 25 | 🌀 |
| 7 | 合體香客 | がったい | 225 | 30 | 🤝 |
| 8 | 大乘香客 | だいじょう | 270 | 35 | 🏆 |
| 9 | 飛升香客 | ひしょう | 300 | 40 | 🚀 |

### ランク計算
computeRank(km, checkins) — TITLES 配列を最高から最低レベルへ反復処理します。両方の条件が真である最初のレベルを返します。

### 成就カード解除条件
以下の 3 つの条件をすべて満たす必要があります：
1. チェックイン ≥ 3
2. アンケート完了 = 1
3. 電話番号が NULL でない

## カーボンコエフィシェント

### GWP 係数（地球温暖化ポテンシャル）

| モード | 係数 | 単位 | 注釈 |
|--------|------|------|------|
| walk | 0 | kg CO₂e/km | ベースライン、ゼロエミッション |
| car | 0.30479 | kg CO₂e/km | Ecoinvent 3.10 LCA データベース |
| scooter | 0.13734 | kg CO₂e/km | 電動スクーター/個人用モビリティ |
| bike | 0.01220 | kg CO₂e/km | ペダル/電動自転車 |
| bus | 0.47515 | kg CO₂e/km | 公共交通（主要デフォルト） |
| mrt | 0.07575 | kg CO₂e/km | 大量高速輸送（地下鉄） |
| train | 0.07575 | kg CO₂e/km | 従来型鉄道 |
| hsr | 0.07487 | kg CO₂e/km | 高速鉄道（低エミッション） |
| water | 0.10974 | kg CO₂e/bottle | 500ml ボトルあたり |
| recycle | -0.00265 | kg CO₂e/bottle | リサイクル クレジット（負 = オフセット） |
| hotel | 8.85 | kg CO₂e/night | 1 泊あたりの宿泊 |

**推論：** 不明なモードはバス係数をデフォルトとして保守的な推定に使用されます。

## 三階層認可

### ロール レベルと権限

| ロール | レベル | トークン環境変数 | 管理データ読み取り可能 | データ変更可能 | 通知プッシュ可能 | アクティビティ終了可能 |
|--------|--------|---------------|-------------------|-----------|------------|------------|
| オーナー | 3 | FORMOSA_ADMIN_TOKEN | ✓ | ✓ | ✓ | ✓ |
| マネージャー | 2 | FORMOSA_MANAGER_TOKEN | ✓ | ✓（フィードバック） | ✓ | ✓ |
| ボランティア | 1 | FORMOSA_VOLUNTEER_TOKEN | ✓（限定） | — | — | — |

### 認可関数
requireAdmin() — ロール レベル ≥ 2（オーナーまたはマネージャー）を必須とします。機密操作に使用されます。
requireAnyRole() — 有効なトークンが必須（レベル ≥ 1）。読み取り専用ボランティア アクセスに使用されます。

---

**最終更新:** 2026-04-04 by Formosa Engineering Team
**次回レビュー:** 2026-05-04
