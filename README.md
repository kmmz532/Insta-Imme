# Insta-Imme

Insta-Imme（インスタ・イメ）は、PWA対応のカメラ・Instagram投稿自動化アプリケーションです。撮影した写真をその場でシームレスに加工・キャプション生成し、自動でInstagramへ投稿することができます。

---

## 1. 概要

Insta-Imme は、投稿の手間を極限まで減らすための「撮影者向け投稿自動化ツール」です。スマートフォンのPWA環境で動作し、以下の機能を提供します。

### 主な機能
- **カメラ撮影と即投稿**: 撮影後プレビューを挟まず、バックグラウンドで即時に連携アカウントへ自動投稿する「即投稿モード」を搭載。
- **テンプレート＆プリセット**: キャプションのひな形やハッシュタグ、透かし文字の位置・サイズ・内容を「プリセット」として管理。
- **曜日・時間帯自動プリセット適用**: 投稿する時間帯（朝・昼・夜・深夜）や曜日（平日・休日）に応じて、最適なプリセットを自動判別して適用。
- **GPS位置情報の自動挿入**: 撮影時の位置情報 (GPS) から、キャプションや透かし内の変数（`${lat}`, `${lng}`, `${loc}`）へ、緯度経度や市区町村名（OpenStreetMap Nominatim APIで逆引き）を自動展開。
- **複数Instagramアカウント管理**: 複数のInstagramアカウントを安全に登録・切り替え可能。
- **投稿履歴と再試行**: 失敗した投稿履歴から、ワンタップで同じ内容・画像での再投稿を実行。
- **過去投稿の一括ダウンロード**: 連携されたアカウントの過去のInstagram投稿画像をZIP形式でまとめてダウンロード可能。

---

## 2. システム構成・アーキテクチャ

モノレポ構成となっており、以下のテクノロジースタックで動作します。

- **フロントエンド (`/frontend`)**
  - React (TypeScript) + Vite
  - MUI v6 (UI コンポーネント)
  - Vite PWA Plugin (PWA化・オフラインキャッシュ)
- **バックエンド (`/backend`)**
  - FastAPI (Python)
  - SQLAlchemy (SQLiteデータベース)
  - instagrapi (Instagram個人アカウント連携ライブラリ)
  - Pillow (透かし合成処理)

---

## 3. ローカル開発環境の起動方法

### バックエンド (FastAPI) の起動

1. Python仮想環境を作成し、依存ライブラリをインストールします。
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windowsの場合
   # source .venv/bin/activate # Mac/Linuxの場合
   pip install -r requirements.txt
   ```

2. `.env` ファイルを作成し、環境変数を設定します（詳細は後述）。

3. 開発サーバーを起動します。
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   バックエンドAPIは `http://localhost:8000` で稼働します。

### フロントエンド (React) の起動

1. 依存ライブラリをインストールします。
   ```bash
   cd frontend
   npm install
   ```

2. 開発用環境変数（`.env` または `.env.local`）を作成し、API接続先を設定します。
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. 開発サーバーを起動します。
   ```bash
   npm run dev
   ```
   フロントエンドアプリは `http://localhost:5173` で稼働します。

---

## 4. 環境変数設定

### バックエンド (`backend/.env`)
以下の項目を設定します。
```env
DATABASE_URL=sqlite:///./insta_imme.db
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY   # JWT暗号化およびセッションデータ暗号化に使用する任意のキー
```

### フロントエンド (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

---

## 5. テンプレート変数仕様

キャプションおよび透かしのテキスト内では、以下の変数が自動展開されます。
- `${date}`: 日付 (YYYY/MM/DD)
- `${time}`: 時刻 (HH:MM)
- `${datetime}`: 日時 (YYYY/MM/DD HH:MM)
- `${account}`: 投稿するInstagramのユーザー名
- `${lat}`: 撮影地の緯度
- `${lng}`: 撮影地の経度
- `${loc}`: 撮影地の市区町村名等（GPSがONの場合のみ自動逆引き）
- `${app}`: アプリ名 ("Insta-Imme")

---

## 6. デプロイ設定 (Render & Cloudflare)

### バックエンド: Render (FastAPI)
Render.com上に **Web Service** としてPython/FastAPIバックエンドをデプロイします。

1. **基本設定**:
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. **データベースの永続化 (Cloudflare R2 同期)**:
   - Cloudflare R2 と SQLite の自動同期ロジックが組み込まれています。
   - アプリ起動時に R2 から `insta_imme.db` が自動ダウンロードされ、データの書き込みが発生するAPI完了時にバックグラウンドで R2 へアップロード（上書き）されます。
3. **環境変数 (Environment Variables)**:
   - `DATABASE_URL`: `sqlite:///./insta_imme.db`
   - `JWT_SECRET`: `任意の強力なランダム文字列` (JWT生成およびセッションデータ暗号化キー)
   - `R2_ENDPOINT_URL`: Cloudflare R2 の S3 互換 API エンドポイント URL (例: `https://<account_id>.r2.cloudflarestorage.com`)
   - `R2_ACCESS_KEY_ID`: R2 の API アクセスキー ID
   - `R2_SECRET_ACCESS_KEY`: R2 の API シークレットアクセスキー
   - `R2_BUCKET_NAME`: データベースファイルを保管する R2 バケット名 (例: `insta-imme-db`)
   - `INSTAGRAM_PROXY` (任意): Instagram が Render のデータセンター IP を制限して `BadPassword` 等を返す場合に使用するプロキシ URL (例: `http://user:pass@host:port`)。未設定なら直接接続します。

### フロントエンド: Cloudflare Pages (React)
フロントエンドを **Cloudflare Pages** にデプロイします。

1. **基本設定**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
2. **環境変数 (Environment Variables)**:
   - **Production & Preview**:
     - `VITE_API_URL`: Renderで作成したバックエンドのWeb Service URL (例: `https://insta-imme-api.onrender.com`)

