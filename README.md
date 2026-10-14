# 露營助手・跨裝置同步

手機 PWA 與 Chrome 側邊欄使用相同的 v8 同步核心。首次切換會先顯示 Supabase 舊資料的唯讀預覽並建立備份；確認遷移後才開始跨裝置同步，不會以空白畫面取代既有資料。

## 安裝與啟用

以 HTTPS 開啟此網站，選擇「加入主畫面」或「安裝應用程式」，並在設定登入同步帳號。離線操作會留在這台裝置，恢復連線後再安全送出。

同步不會改變目前頁面、捲動位置或正在輸入的欄位。綠燈只在登入有效、最近同步成功且沒有待送資料時亮起。

## Supabase Free 保活

Supabase Free 專案若七天沒有足夠活動可能暫停。此專案已包含每日保活工作流程 `.github/workflows/supabase-keepalive.yml`；它只寫入一筆系統維護時間，不會讀取或變更任何使用者資料。

首次設定（只需一次）：

1. 在 Supabase Dashboard 的 **SQL Editor** 執行根目錄的 `supabase-keepalive.sql`。
2. 在此 GitHub repository 的 **Settings → Secrets and variables → Actions** 建立兩個 repository secrets：
   - `SUPABASE_URL`：`https://waiiphtzxlknmgnztfsg.supabase.co`
   - `SUPABASE_KEEPALIVE_KEY`：Supabase **service_role / secret key**。不可使用網站中的 publishable key，也不可將此金鑰提交到 Git。
3. 到 GitHub **Actions → Supabase keepalive** 選擇 **Run workflow** 先手動驗證一次；之後每天 11:17（台灣時間，GitHub 排程可能略有延遲）自動執行。
