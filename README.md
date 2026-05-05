# Camino Quest 朝聖訓練遊戲

免費資源版本：

- 前端：GitHub Pages
- 後端：Google Apps Script Web App
- 資料庫：Google Sheets

目前已先建立 Apps Script 後端骨架，位置在 `apps-script/Code.gs`。

## 1. 建立 Google Sheets 後端

1. 到 Google Drive 建立一份新的 Google Sheets。
2. 建議命名為 `Camino Quest Database`。
3. 在 Google Sheets 上方選單打開 `擴充功能 > Apps Script`。
4. 將 `apps-script/Code.gs` 的內容貼到 Apps Script 編輯器的 `Code.gs`。
5. 儲存專案，建議命名為 `Camino Quest API`。
6. 在 Apps Script 編輯器上方選擇 `setupCaminoTrainingApp`，按下執行。
7. 第一次執行會要求授權，請用這份 Google Sheets 的擁有者帳號授權。

執行成功後，Google Sheets 會自動建立這些工作表：

- `設定_Settings`
- `使用者_Users`
- `任務_Missions`
- `每週規則_WeeklyRules`
- `完成紀錄_Completions`
- `徽章_Badges`
- `使用者徽章_UserBadges`
- `路線節點_RouteNodes`
- `獎勵_Rewards`
- `資料字典_DataDictionary`

欄位名稱使用英文，欄位註解與資料字典使用中文，這樣前端程式好串接，你在 Sheets 裡也看得懂資料。

## 2. 部署 Apps Script Web App

1. 在 Apps Script 編輯器右上角按 `部署 > 新增部署作業`。
2. 類型選擇 `網頁應用程式`。
3. 執行身分選擇 `我`。
4. 存取權限先選 `任何人`。
5. 部署後複製 Web App URL。

URL 會長得像：

```text
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
```

之後 GitHub Pages 前端會把這個 URL 放進 `js/config.js`。

## 3. 測試 API

把你的 Web App URL 代入下面網址：

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health
```

成功時會看到類似：

```json
{"ok":true,"app":"Camino Quest","now":"2026-05-05 21:30:00"}
```

讀取第 1 週任務：

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=missions&weekNumber=1
```

讀取 dashboard 統計資料：

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=dashboard
```

## 4. GitHub Pages 串接注意事項

GitHub Pages 和 Apps Script 是不同網域，瀏覽器會有 CORS 限制。

建議第一版採用這個策略：

- 讀取資料：用 JSONP，也就是 API 加上 `callback` 參數。
- 寫入資料：用表單 POST 或 `fetch(..., { mode: "no-cors" })`，前端先做樂觀更新，再重新讀取資料。

讀取任務的 JSONP 範例：

```html
<script>
  function handleMissions(response) {
    console.log(response.missions);
  }

  const script = document.createElement('script');
  script.src = 'YOUR_WEB_APP_URL?action=missions&weekNumber=1&callback=handleMissions';
  document.body.appendChild(script);
</script>
```

寫入完成紀錄的資料欄位：

```text
action=completeMission
userId=USER-001
missionId=W01-WALK-20
actualDistanceKm=5.2
actualMinutes=58
actualBackpackKg=0
fatigueScore=6
painScore=3
painArea=小腿
mood=開心
notes=後半段有點累
```

## 5. API 動作

### `GET action=health`

檢查 API 是否可用。

### `GET action=missions`

讀取任務。可加 `weekNumber` 篩選。

```text
?action=missions&weekNumber=1
```

### `GET action=weeklyRules`

讀取每週通關規則。

### `GET action=completions`

讀取所有完成紀錄。

### `GET action=summary`

讀取總結資料，包含 XP、總距離、通關狀態、徽章、路線節點。

### `GET action=dashboard`

讀取後台儀表板資料，包含：

- 累積距離曲線
- 疲勞與疼痛趨勢
- 每週最長健走
- 每週任務完成數
- 背包重量進展
- 任務類型比例

### `POST action=completeMission`

新增一筆完成紀錄。

### `POST action=claimReward`

標記現實獎勵已領取。

## 6. 後台 Dashboard 建議圖表

第一版前端可以用 Chart.js：

- KPI 卡：累積距離、累積 XP、等級、最長健走、平均疲勞、平均疼痛
- 折線圖：累積距離
- 折線圖：疲勞與疼痛
- 長條圖：每週最長健走
- 長條圖：每週任務完成數
- 折線圖：背包重量適應
- 圓餅圖：任務類型比例

這些資料都可以從 `GET action=dashboard` 取得。

## 7. 啟動前端 MVP

前端是純靜態檔案，不需要安裝套件。

先打開：

```text
js/config.js
```

把 `API_URL` 改成你的 Apps Script Web App URL：

```js
window.CAMINO_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  DEFAULT_WEEK: 1,
  USER_ID: 'USER-001',
};
```

接著直接用瀏覽器打開：

```text
index.html
```

你應該會看到本週任務池。

再打開：

```text
dashboard.html
```

你會看到訓練成長儀表板。剛開始沒有完成紀錄時，圖表會是空的；完成任務後再重新整理就會出現資料。

## 8. 部署到 GitHub Pages

1. 建立 GitHub repository。
2. 將整個專案推上 GitHub。
3. 到 repository 的 `Settings > Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`。
6. 儲存後等待 GitHub Pages 產生網址。

之後女友用手機打開 GitHub Pages 網址，就能看到任務池與儀表板。
