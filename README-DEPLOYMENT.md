# Discord 排隊系統部署指南

## 完整部署流程

### Phase 1: Supabase 資料庫設置

#### 1.1 創建 Supabase 專案
1. 前往 [supabase.com](https://supabase.com)
2. 註冊/登入帳戶
3. 點擊 "New project"
4. 填入以下資訊：
   - **專案名稱**: `discord-queue-system`
   - **資料庫密碼**: 設定強密碼（記住這個密碼！）
   - **地區**: Singapore 或 Tokyo（較低延遲）
5. 點擊 "Create new project"
6. 等待專案建立完成（約2分鐘）

#### 1.2 取得資料庫連線字串
1. 專案建立完成後，前往 **Settings** → **Database**
2. 在 "Connection string" 區域選擇 **"Nodejs"**
3. 複製連線字串，格式如下：
```
postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
4. 將 `[YOUR-PASSWORD]` 替換成您剛才設定的密碼

#### 1.3 更新本地環境變數
1. 在專案根目錄建立 `.env` 文件：
```bash
DATABASE_URL="postgresql://postgres:your-actual-password@your-project-ref.supabase.co:5432/postgres"
```

#### 1.4 測試資料庫連線並同步結構
```bash
# 安裝依賴（如果還沒有）
npm install

# 生成 Prisma 客戶端
npx prisma generate

# 同步資料庫結構到 Supabase
npx prisma db push

# 測試本地運行
npm run dev
```

### Phase 2: GitHub 準備

#### 2.1 如果還沒有 GitHub Repository
```bash
# 初始化 Git（如果需要）
git init
git add .
git commit -m "Initial commit: Discord queue system ready for deployment"
git branch -M main

# 在 GitHub 上創建新 Repository，然後：
git remote add origin https://github.com/YOUR-USERNAME/discord-queue-system.git
git push -u origin main
```

#### 2.2 如果已有 Repository
```bash
# 確保所有變更都已提交
git add .
git commit -m "Update: Ready for Supabase + Vercel deployment"
git push
```

### Phase 3: Vercel 部署

#### 3.1 連接 Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 帳戶登入
3. 點擊 **"New Project"**
4. 選擇您的 `discord-queue-system` Repository
5. 點擊 **"Import"**

#### 3.2 配置專案設置
1. **Framework Preset**: Next.js（自動偵測）
2. **Root Directory**: `.` （保持預設）
3. **Build Command**: `npm run build` （自動設定）
4. **Install Command**: `npm install` （自動設定）

#### 3.3 設置環境變數
1. 在部署前，點擊 **"Environment Variables"** 展開區域
2. 添加以下變數：
   - **Name**: `DATABASE_URL`
   - **Value**: 您的 Supabase 連線字串
   - **Environment**: Production, Preview, Development（全選）

#### 3.4 開始部署
1. 點擊 **"Deploy"**
2. 等待建置完成（約2-3分鐘）
3. 部署成功後會得到專案 URL（例如：`https://discord-queue-system.vercel.app`）

### Phase 4: 測試部署結果

#### 4.1 功能測試清單
1. ✅ 訪問首頁，測試活動創建
2. ✅ 測試主持人頁面（QR Code、排隊管理、計時器）
3. ✅ 測試觀眾加入頁面
4. ✅ 測試拖曳功能（第一輪和第二輪排隊）
5. ✅ 測試音效提醒功能

#### 4.2 常見問題排解
- **500 錯誤**: 檢查 DATABASE_URL 環境變數是否正確
- **資料庫連線失敗**: 確認 Supabase 專案狀態正常
- **建置失敗**: 檢查 GitHub 程式碼是否完整推送

## 環境變數完整清單

### 本地開發 (`.env`)
```bash
DATABASE_URL="postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres"
```

### Vercel 生產環境
| 變數名稱 | 值 | 環境 |
|---------|----|----|
| `DATABASE_URL` | Supabase 連線字串 | Production, Preview, Development |

## 常見問題

### 1. Prisma 連線錯誤
確認 DATABASE_URL 格式正確，密碼中特殊字符需要 URL 編碼。

### 2. Vercel 部署失敗
檢查環境變數是否正確設置，確保 `npx prisma generate` 在建置時執行。

### 3. 資料庫權限問題
Supabase 預設用戶有完整權限，無需額外設置。