# Discord 排隊系統部署指南

## Supabase 設置

### 1. 創建 Supabase 專案
1. 前往 [supabase.com](https://supabase.com)
2. 創建新專案：`discord-queue-system`
3. 記錄資料庫密碼

### 2. 取得資料庫連線字串
在 Settings > Database 找到 "Connection string" > "Nodejs"：
```
postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 3. 更新本地環境變數
創建 `.env` 文件：
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 4. 同步資料庫結構
```bash
npx prisma db push
```

## Vercel 部署

### 1. 推送到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [YOUR-GITHUB-REPO-URL]
git push -u origin main
```

### 2. 連接 Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 導入 GitHub 專案
3. 設置環境變數：
   - `DATABASE_URL`: Supabase 連線字串

### 3. 部署
Vercel 會自動部署，完成後取得生產環境 URL。

## 環境變數設置

### 本地開發 (.env)
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

### Vercel 生產環境
在 Vercel Dashboard > Settings > Environment Variables 添加：
- `DATABASE_URL`: Supabase 連線字串

## 常見問題

### 1. Prisma 連線錯誤
確認 DATABASE_URL 格式正確，密碼中特殊字符需要 URL 編碼。

### 2. Vercel 部署失敗
檢查環境變數是否正確設置，確保 `npx prisma generate` 在建置時執行。

### 3. 資料庫權限問題
Supabase 預設用戶有完整權限，無需額外設置。