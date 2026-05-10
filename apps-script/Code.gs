/**
 * Camino Quest Apps Script backend.
 *
 * Usage:
 * 1. Create a Google Sheet.
 * 2. Open Extensions > Apps Script.
 * 3. Paste this file into Code.gs.
 * 4. Run setupCaminoTrainingApp once.
 * 5. Deploy as Web App.
 */

const APP = {
  timezone: 'Asia/Taipei',
  sheets: {
    settings: '設定_Settings',
    users: '使用者_Users',
    missions: '任務_Missions',
    weeklyRules: '每週規則_WeeklyRules',
    completions: '完成紀錄_Completions',
    badges: '徽章_Badges',
    userBadges: '使用者徽章_UserBadges',
    routeNodes: '路線節點_RouteNodes',
    rewards: '獎勵_Rewards',
    dictionary: '資料字典_DataDictionary',
  },
};

const SCHEMAS = {
  settings: [
    ['key', '設定鍵值', 'text', 'targetDate', '系統設定使用的 key'],
    ['value', '設定內容', 'text', '2026-08-01', '系統設定使用的值'],
    ['description', '中文說明', 'text', '預計出發日期', '方便閱讀'],
  ],
  users: [
    ['userId', '使用者編號', 'text', 'USER-001', '單人版先固定一位使用者'],
    ['name', '使用者名稱', 'text', 'Pilgrim', '可改成女友暱稱'],
    ['startDate', '訓練開始日期', 'date', '2026-05-05', '用來計算目前週數'],
    ['targetDate', '預計出發日期', 'date', '2026-08-01', '朝聖之路出發時間'],
    ['baselineDistanceKm', '目前極限距離公里', 'number', '7.33', '初始跑步或步行能力'],
    ['baselineMinutes', '目前極限時間分鐘', 'number', '59.92', '59:55 約等於 59.92 分鐘'],
    ['baselinePaceMinPerKm', '目前配速分鐘/公里', 'number', '8.17', '8:10/km 約等於 8.17'],
    ['fitnessNote', '體能備註', 'text', '7.33km 接近極限，後段腳抬不起來', '教練判斷用'],
  ],
  missions: [
    ['missionId', '任務唯一編號', 'text', 'W01-WALK-01', '不重複'],
    ['weekNumber', '第幾週', 'number', '1', '1-12'],
    ['chapterName', '章節名稱', 'text', '啟程之村', '遊戲章節'],
    ['missionType', '任務類型', 'text', 'walk', 'walk/strength/recovery/knowledge/boss'],
    ['missionSize', '任務大小', 'text', 'normal', 'mini/normal/long'],
    ['title', '任務標題', 'text', '黃昏健走', '顯示在任務卡'],
    ['description', '任務描述', 'text', '下班後輕鬆健走 30 分鐘', '任務內容'],
    ['targetDistanceKm', '目標距離公里', 'number', '3', '沒有距離目標可留空'],
    ['targetMinutes', '目標時間分鐘', 'number', '30', '沒有時間目標可留空'],
    ['targetBackpackKg', '目標背包重量公斤', 'number', '0', '負重訓練用'],
    ['xpReward', '完成可獲得 XP', 'number', '40', '遊戲經驗值'],
    ['routeKmReward', '地圖推進公里數', 'number', '8', '朝聖地圖進度'],
    ['isBoss', '是否 Boss 任務', 'boolean', 'FALSE', '每週長距離挑戰'],
    ['requiredForPass', '是否通關必要任務', 'boolean', 'FALSE', '通常 Boss 為 TRUE'],
    ['unlockWeek', '解鎖週數', 'number', '1', '到第幾週可見'],
    ['active', '是否啟用', 'boolean', 'TRUE', '可用來暫停任務'],
    ['sortOrder', '顯示排序', 'number', '10', '前端排序用'],
  ],
  weeklyRules: [
    ['weekNumber', '第幾週', 'number', '1', '1-12'],
    ['chapterName', '章節名稱', 'text', '啟程之村', '遊戲章節'],
    ['requiredMissionCount', '通關需要完成任務數', 'number', '6', '任務池完成幾個才通關'],
    ['requiredWalkCount', '至少完成健走任務數', 'number', '2', 'walk 或 boss 可計入'],
    ['requiredStrengthCount', '至少完成肌力任務數', 'number', '1', 'strength 任務'],
    ['requiredRecoveryCount', '至少完成恢復任務數', 'number', '1', 'recovery 任務'],
    ['bossRequired', '是否必須完成 Boss', 'boolean', 'TRUE', 'Boss 是否為通關必要'],
    ['perfectMissionCount', '完美通關任務數', 'number', '8', '完成幾個算完美'],
    ['maxPainScoreForPerfect', '完美通關最高疼痛分數', 'number', '5', '疼痛太高不鼓勵硬拚'],
    ['weeklyRewardTitle', '每週獎勵標題', 'text', '啟程補給包', '通關寶箱名稱'],
    ['weeklyRewardDescription', '每週獎勵內容', 'text', '解鎖第一枚徽章', '寶箱內容'],
  ],
  completions: [
    ['completionId', '完成紀錄唯一編號', 'text', 'C-20260505-001', '自動產生'],
    ['userId', '使用者編號', 'text', 'USER-001', '單人版固定 USER-001'],
    ['missionId', '任務編號', 'text', 'W01-WALK-01', '對應任務_Missions'],
    ['completedAt', '完成時間', 'datetime', '2026-05-05 21:30:00', '自動或前端傳入'],
    ['weekNumber', '第幾週', 'number', '1', '冗餘欄位，方便分析'],
    ['missionType', '任務類型', 'text', 'walk', '冗餘欄位，方便分析'],
    ['actualDistanceKm', '實際距離公里', 'number', '5.2', '使用者填寫'],
    ['actualMinutes', '實際時間分鐘', 'number', '58', '使用者填寫'],
    ['actualBackpackKg', '實際背包公斤', 'number', '0', '使用者填寫'],
    ['fatigueScore', '疲勞分數', 'number', '6', '1-10'],
    ['painScore', '疼痛分數', 'number', '3', '1-10'],
    ['painArea', '疼痛部位', 'text', '小腿', '腳底/膝蓋/小腿/臀部/肩頸等'],
    ['mood', '心情', 'text', '開心', '心情紀錄'],
    ['notes', '備註', 'text', '後半段有點累', '自由文字'],
    ['xpEarned', '獲得 XP', 'number', '40', '由任務帶入'],
    ['routeKmEarned', '地圖推進公里', 'number', '8', '由任務帶入'],
  ],
  badges: [
    ['badgeId', '徽章編號', 'text', 'B-WEEK-01', '不重複'],
    ['name', '徽章名稱', 'text', '第一步', '顯示名稱'],
    ['description', '徽章說明', 'text', '完成第一週任務', '解鎖條件說明'],
    ['unlockType', '解鎖類型', 'text', 'weekPassed', 'weekPassed/totalDistance/bossCount'],
    ['unlockValue', '解鎖門檻', 'number', '1', '依 unlockType 解釋'],
    ['icon', '圖示文字', 'text', 'boot', '前端 icon key'],
  ],
  userBadges: [
    ['userId', '使用者編號', 'text', 'USER-001', '使用者'],
    ['badgeId', '徽章編號', 'text', 'B-WEEK-01', '徽章'],
    ['unlockedAt', '解鎖時間', 'datetime', '2026-05-05 21:30:00', '解鎖時間'],
  ],
  routeNodes: [
    ['nodeId', '節點編號', 'text', 'NODE-001', '路線節點'],
    ['name', '節點名稱', 'text', 'Saint-Jean-Pied-de-Port', '朝聖路線城市'],
    ['sortOrder', '排序', 'number', '1', '地圖順序'],
    ['requiredRouteKm', '需要地圖公里數', 'number', '0', '累積 routeKm 達成解鎖'],
    ['description', '節點說明', 'text', '旅程開始的地方', '顯示在地圖'],
  ],
  rewards: [
    ['rewardId', '獎勵編號', 'text', 'R-WEEK-04', '不重複'],
    ['weekNumber', '第幾週', 'number', '4', '對應週數'],
    ['title', '獎勵標題', 'text', '健走襪補給', '現實獎勵'],
    ['description', '獎勵說明', 'text', '完成第一章後買一雙好襪子', '獎勵內容'],
    ['claimed', '是否已領取', 'boolean', 'FALSE', '前端可更新'],
  ],
};

function setupCaminoTrainingApp() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  createSheetWithSchema_(ss, APP.sheets.settings, SCHEMAS.settings, getSettingsRows_());
  createSheetWithSchema_(ss, APP.sheets.users, SCHEMAS.users, getUserRows_());
  createSheetWithSchema_(ss, APP.sheets.missions, SCHEMAS.missions, getMissionRows_());
  createSheetWithSchema_(ss, APP.sheets.weeklyRules, SCHEMAS.weeklyRules, getWeeklyRuleRows_());
  createSheetWithSchema_(ss, APP.sheets.completions, SCHEMAS.completions, []);
  createSheetWithSchema_(ss, APP.sheets.badges, SCHEMAS.badges, getBadgeRows_());
  createSheetWithSchema_(ss, APP.sheets.userBadges, SCHEMAS.userBadges, []);
  createSheetWithSchema_(ss, APP.sheets.routeNodes, SCHEMAS.routeNodes, getRouteNodeRows_());
  createSheetWithSchema_(ss, APP.sheets.rewards, SCHEMAS.rewards, getRewardRows_());
  createDataDictionary_(ss);
  return 'Camino Quest setup completed.';
}

function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || 'health';
    let result;

    if (action === 'health') result = { ok: true, app: 'Camino Quest', now: now_() };
    else if (action === 'missions') result = getMissions_(params);
    else if (action === 'weeklyRules') result = getRows_(APP.sheets.weeklyRules);
    else if (action === 'completions') result = getRows_(APP.sheets.completions);
    else if (action === 'summary') result = getSummary_();
    else if (action === 'dashboard') result = getDashboardData_();
    else throw new Error('Unknown action: ' + action);

    return json_(result, params.callback);
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) }, e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const action = payload.action || 'completeMission';
    let result;

    if (action === 'completeMission') result = completeMission_(payload);
    else if (action === 'addMission') result = addMission_(payload);
    else if (action === 'claimReward') result = claimReward_(payload);
    else throw new Error('Unknown action: ' + action);

    return json_(result);
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function completeMission_(payload) {
  const missionId = String(payload.missionId || '').trim();
  if (!missionId) throw new Error('missionId is required.');

  const mission = getRows_(APP.sheets.missions).find((row) => row.missionId === missionId);
  if (!mission) throw new Error('Mission not found: ' + missionId);

  const row = {
    completionId: 'C-' + Utilities.formatDate(new Date(), APP.timezone, 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 1000),
    userId: payload.userId || 'USER-001',
    missionId,
    completedAt: payload.completedAt || now_(),
    weekNumber: mission.weekNumber,
    missionType: mission.missionType,
    actualDistanceKm: toNumber_(payload.actualDistanceKm),
    actualMinutes: toNumber_(payload.actualMinutes),
    actualBackpackKg: toNumber_(payload.actualBackpackKg),
    fatigueScore: toNumber_(payload.fatigueScore),
    painScore: toNumber_(payload.painScore),
    painArea: payload.painArea || '',
    mood: payload.mood || '',
    notes: payload.notes || '',
    xpEarned: Number(mission.xpReward || 0),
    routeKmEarned: Number(mission.routeKmReward || 0),
  };

  appendObject_(APP.sheets.completions, row);
  unlockBadges_();

  return { ok: true, completion: row, summary: getSummary_() };
}

function addMission_(payload) {
  const weekNumber = Number(payload.weekNumber || 1);
  const title = String(payload.title || '').trim();
  if (!title) throw new Error('title is required.');
  if (weekNumber < 1 || weekNumber > 12) throw new Error('weekNumber must be between 1 and 12.');

  const missionType = sanitizeMissionType_(payload.missionType || 'bonus');
  const missionSize = sanitizeMissionSize_(payload.missionSize || 'normal');
  const targetMinutes = toNumber_(payload.targetMinutes);
  const targetDistanceKm = toNumber_(payload.targetDistanceKm);
  const targetBackpackKg = toNumber_(payload.targetBackpackKg);
  const xpReward = toNumber_(payload.xpReward) || estimateXp_(missionSize, targetMinutes, targetDistanceKm);
  const routeKmReward = toNumber_(payload.routeKmReward) || estimateRouteKm_(missionType, targetMinutes, targetDistanceKm);
  const timestamp = Utilities.formatDate(new Date(), APP.timezone, 'yyyyMMddHHmmss');

  const row = {
    missionId: `W${String(weekNumber).padStart(2, '0')}-CUSTOM-${timestamp}`,
    weekNumber,
    chapterName: getChapterName_(weekNumber),
    missionType,
    missionSize,
    title,
    description: payload.description || '自己新增的加碼任務。',
    targetDistanceKm,
    targetMinutes,
    targetBackpackKg,
    xpReward,
    routeKmReward,
    isBoss: false,
    requiredForPass: false,
    unlockWeek: weekNumber,
    active: true,
    sortOrder: 95,
  };

  appendObject_(APP.sheets.missions, row);
  return { ok: true, mission: row };
}

function claimReward_(payload) {
  const rewardId = String(payload.rewardId || '').trim();
  if (!rewardId) throw new Error('rewardId is required.');

  const sheet = getSheet_(APP.sheets.rewards);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('rewardId');
  const claimedIndex = headers.indexOf('claimed');

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][idIndex] === rewardId) {
      sheet.getRange(i + 1, claimedIndex + 1).setValue(true);
      return { ok: true, rewardId };
    }
  }

  throw new Error('Reward not found: ' + rewardId);
}

function getMissions_(params) {
  let missions = getRows_(APP.sheets.missions).filter((row) => row.active === true || row.active === 'TRUE');
  if (params.weekNumber) {
    missions = missions.filter((row) => Number(row.weekNumber) === Number(params.weekNumber));
  }
  return { ok: true, missions };
}

function getSummary_() {
  const completions = getRows_(APP.sheets.completions);
  const rules = getRows_(APP.sheets.weeklyRules);
  const missions = getRows_(APP.sheets.missions);
  const walkTypes = ['walk', 'boss'];

  const totalDistanceKm = sum_(completions, 'actualDistanceKm');
  const totalXp = sum_(completions, 'xpEarned');
  const totalRouteKm = sum_(completions, 'routeKmEarned');
  const walkRecords = completions.filter((row) => walkTypes.indexOf(row.missionType) >= 0);
  const longestWalkKm = max_(walkRecords, 'actualDistanceKm');
  const averagePain = average_(completions, 'painScore');
  const averageFatigue = average_(completions, 'fatigueScore');
  const maxBackpackKg = max_(completions, 'actualBackpackKg');
  const level = Math.floor(totalXp / 250) + 1;

  return {
    ok: true,
    totals: {
      totalDistanceKm,
      totalXp,
      totalRouteKm,
      level,
      longestWalkKm,
      averagePain,
      averageFatigue,
      maxBackpackKg,
      completionCount: completions.length,
    },
    weeklyStatus: rules.map((rule) => buildWeeklyStatus_(rule, completions, missions)),
    unlockedNodes: getRows_(APP.sheets.routeNodes).filter((node) => Number(node.requiredRouteKm) <= totalRouteKm),
    badges: getRows_(APP.sheets.userBadges),
  };
}

function getDashboardData_() {
  const completions = getRows_(APP.sheets.completions);
  const missions = getRows_(APP.sheets.missions);
  const summary = getSummary_();
  const byDate = groupByDate_(completions);
  const byWeek = groupByWeek_(completions);

  return {
    ok: true,
    summary: summary.totals,
    weeklyStatus: summary.weeklyStatus,
    series: {
      cumulativeDistance: buildCumulativeDistance_(byDate),
      painAndFatigue: buildPainFatigueSeries_(byDate),
      weeklyLongestWalk: buildWeeklyLongestWalk_(byWeek),
      weeklyMissionCount: buildWeeklyMissionCount_(byWeek),
      backpackProgress: buildBackpackProgress_(byDate),
      missionTypeDistribution: buildMissionTypeDistribution_(completions),
    },
    missions,
    records: completions,
  };
}

function buildWeeklyStatus_(rule, completions, missions) {
  const week = Number(rule.weekNumber);
  const records = completions.filter((row) => Number(row.weekNumber) === week);
  const missionById = {};
  missions.forEach((mission) => {
    missionById[mission.missionId] = mission;
  });
  const uniqueMissionIds = {};
  records.forEach((row) => {
    uniqueMissionIds[row.missionId] = true;
  });
  const completedMissions = Object.keys(uniqueMissionIds).map((id) => missionById[id]).filter(Boolean);
  const walkCount = completedMissions.filter((m) => m.missionType === 'walk' || m.missionType === 'boss').length;
  const strengthCount = completedMissions.filter((m) => m.missionType === 'strength').length;
  const recoveryCount = completedMissions.filter((m) => m.missionType === 'recovery').length;
  const bossDone = completedMissions.some((m) => m.isBoss === true || m.isBoss === 'TRUE');
  const completedCount = completedMissions.length;
  const maxPain = max_(records, 'painScore');

  const passed =
    completedCount >= Number(rule.requiredMissionCount) &&
    walkCount >= Number(rule.requiredWalkCount) &&
    strengthCount >= Number(rule.requiredStrengthCount) &&
    recoveryCount >= Number(rule.requiredRecoveryCount) &&
    (!toBoolean_(rule.bossRequired) || bossDone);

  const perfect =
    passed &&
    completedCount >= Number(rule.perfectMissionCount) &&
    maxPain <= Number(rule.maxPainScoreForPerfect || 10);

  return {
    weekNumber: week,
    chapterName: rule.chapterName,
    completedCount,
    requiredMissionCount: Number(rule.requiredMissionCount),
    walkCount,
    strengthCount,
    recoveryCount,
    bossDone,
    maxPain,
    passed,
    perfect,
  };
}

function unlockBadges_() {
  const summary = getSummary_();
  const badges = getRows_(APP.sheets.badges);
  const userBadges = getRows_(APP.sheets.userBadges);
  const owned = {};
  userBadges.forEach((row) => {
    owned[row.badgeId] = true;
  });

  badges.forEach((badge) => {
    if (owned[badge.badgeId]) return;
    let unlocked = false;
    const value = Number(badge.unlockValue);

    if (badge.unlockType === 'weekPassed') {
      unlocked = summary.weeklyStatus.filter((row) => row.passed).length >= value;
    } else if (badge.unlockType === 'totalDistance') {
      unlocked = summary.totals.totalDistanceKm >= value;
    } else if (badge.unlockType === 'bossCount') {
      unlocked = summary.weeklyStatus.filter((row) => row.bossDone).length >= value;
    }

    if (unlocked) {
      appendObject_(APP.sheets.userBadges, {
        userId: 'USER-001',
        badgeId: badge.badgeId,
        unlockedAt: now_(),
      });
    }
  });
}

function createSheetWithSchema_(ss, sheetName, schema, rows) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();

  const headers = schema.map((field) => field[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f4efe6');

  schema.forEach((field, index) => {
    sheet.getRange(1, index + 1).setNote(`${field[1]}\n型態：${field[2]}\n範例：${field[3]}\n備註：${field[4]}`);
  });

  if (rows.length > 0) {
    const values = rows.map((row) => headers.map((header) => row[header] === undefined ? '' : row[header]));
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function createDataDictionary_(ss) {
  let sheet = ss.getSheetByName(APP.sheets.dictionary);
  if (!sheet) sheet = ss.insertSheet(APP.sheets.dictionary);
  sheet.clear();
  const headers = ['sheetName', 'fieldName', '中文說明', '資料型態', '範例', '備註'];
  const rows = [];

  Object.keys(SCHEMAS).forEach((schemaKey) => {
    const sheetName = APP.sheets[schemaKey];
    SCHEMAS[schemaKey].forEach((field) => {
      rows.push([sheetName, field[0], field[1], field[2], field[3], field[4]]);
    });
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#f4efe6');
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function getRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];

  return values.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = normalizeCellValue_(row[index]);
    });
    return obj;
  });
}

function appendObject_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map((header) => obj[header] === undefined ? '' : obj[header]));
}

function getSheet_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  return sheet;
}

function json_(data, callback) {
  const text = callback ? `${callback}(${JSON.stringify(data)})` : JSON.stringify(data);
  const mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
  return ContentService.createTextOutput(text).setMimeType(mime);
}

function parsePayload_(e) {
  if (!e || !e.postData) return {};
  if (e.postData.type && e.postData.type.indexOf('application/json') >= 0) {
    return JSON.parse(e.postData.contents || '{}');
  }
  const params = e.parameter || {};
  if (params.payload) return JSON.parse(params.payload);
  return params;
}

function now_() {
  return Utilities.formatDate(new Date(), APP.timezone, 'yyyy-MM-dd HH:mm:ss');
}

function toNumber_(value) {
  if (value === '' || value === undefined || value === null) return '';
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

function toBoolean_(value) {
  return value === true || value === 'TRUE' || value === 'true';
}

function sanitizeMissionType_(value) {
  const allowed = ['walk', 'run', 'cycling', 'swim', 'strength', 'recovery', 'mobility', 'knowledge', 'bonus', 'other'];
  return allowed.indexOf(String(value)) >= 0 ? String(value) : 'bonus';
}

function sanitizeMissionSize_(value) {
  const allowed = ['mini', 'normal', 'long'];
  return allowed.indexOf(String(value)) >= 0 ? String(value) : 'normal';
}

function estimateXp_(missionSize, minutes, distanceKm) {
  if (missionSize === 'long') return 70;
  if (missionSize === 'mini') return 20;
  if (Number(distanceKm) >= 5 || Number(minutes) >= 45) return 45;
  return 35;
}

function estimateRouteKm_(missionType, minutes, distanceKm) {
  if (missionType === 'recovery' || missionType === 'mobility') return 3;
  if (missionType === 'strength') return 4;
  if (Number(distanceKm) > 0) return Math.max(3, Math.round(Number(distanceKm) * 1.5));
  if (Number(minutes) >= 60) return 8;
  if (Number(minutes) >= 30) return 5;
  return 3;
}

function sum_(rows, key) {
  return round2_(rows.reduce((sum, row) => sum + Number(row[key] || 0), 0));
}

function max_(rows, key) {
  if (!rows.length) return 0;
  return round2_(Math.max.apply(null, rows.map((row) => Number(row[key] || 0))));
}

function average_(rows, key) {
  const values = rows.map((row) => Number(row[key] || 0)).filter((value) => value > 0);
  if (!values.length) return 0;
  return round2_(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round2_(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function groupByDate_(records) {
  const grouped = {};
  records.forEach((row) => {
    const date = formatDateOnly_(row.completedAt);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(row);
  });
  return grouped;
}

function groupByWeek_(records) {
  const grouped = {};
  records.forEach((row) => {
    const week = String(row.weekNumber || '');
    if (!grouped[week]) grouped[week] = [];
    grouped[week].push(row);
  });
  return grouped;
}

function formatDateOnly_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP.timezone, 'yyyy-MM-dd');
  }
  return String(value || '').slice(0, 10);
}

function normalizeCellValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP.timezone, 'yyyy-MM-dd HH:mm:ss');
  }
  return value;
}

function buildCumulativeDistance_(byDate) {
  let total = 0;
  return Object.keys(byDate).sort().map((date) => {
    total += sum_(byDate[date], 'actualDistanceKm');
    return { date, value: round2_(total) };
  });
}

function buildPainFatigueSeries_(byDate) {
  return Object.keys(byDate).sort().map((date) => ({
    date,
    pain: average_(byDate[date], 'painScore'),
    fatigue: average_(byDate[date], 'fatigueScore'),
  }));
}

function buildWeeklyLongestWalk_(byWeek) {
  return Object.keys(byWeek).sort((a, b) => Number(a) - Number(b)).map((weekNumber) => ({
    weekNumber: Number(weekNumber),
    value: max_(byWeek[weekNumber].filter((row) => row.missionType === 'walk' || row.missionType === 'boss'), 'actualDistanceKm'),
  }));
}

function buildWeeklyMissionCount_(byWeek) {
  return Object.keys(byWeek).sort((a, b) => Number(a) - Number(b)).map((weekNumber) => ({
    weekNumber: Number(weekNumber),
    value: byWeek[weekNumber].length,
  }));
}

function buildBackpackProgress_(byDate) {
  return Object.keys(byDate).sort().map((date) => ({
    date,
    value: max_(byDate[date], 'actualBackpackKg'),
  }));
}

function buildMissionTypeDistribution_(records) {
  const counts = {};
  records.forEach((row) => {
    const type = row.missionType || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.keys(counts).map((type) => ({ type, value: counts[type] }));
}

function getSettingsRows_() {
  return [
    { key: 'appName', value: 'Camino Quest', description: '應用程式名稱' },
    { key: 'targetDate', value: '2026-08-01', description: '預計出發日期，請依實際日期調整' },
    { key: 'defaultUserId', value: 'USER-001', description: '單人版預設使用者' },
  ];
}

function getUserRows_() {
  return [
    {
      userId: 'USER-001',
      name: 'Pilgrim',
      startDate: '2026-05-05',
      targetDate: '2026-08-01',
      baselineDistanceKm: 7.33,
      baselineMinutes: 59.92,
      baselinePaceMinPerKm: 8.17,
      fitnessNote: '7.33km 接近極限，後段腳抬不起來；主線以健走耐力與恢復為主。',
    },
  ];
}

function getMissionRows_() {
  const bossDistances = [5, 6, 7, 8, 9, 10, 11, 13, 14, 16, 18, 9];
  const backpackKg = [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 2];
  const rows = [];

  for (let week = 1; week <= 12; week += 1) {
    const chapter = getChapterName_(week);
    const bossDistance = bossDistances[week - 1];
    const pack = backpackKg[week - 1];
    const prefix = `W${String(week).padStart(2, '0')}`;

    rows.push(
      mission_(prefix, week, chapter, 'walk', 'mini', '忙碌日也前進', '下班後或通勤多走一段，輕鬆走 15-20 分鐘。', '', 20, 0, 25, 4, false, false, 10),
      mission_(prefix, week, chapter, 'walk', 'normal', '黃昏健走', '用可以聊天的速度健走，不追配速。', Math.max(2, bossDistance - 3), 35 + week * 2, 0, 40, 8, false, false, 20),
      mission_(prefix, week, chapter, 'walk', 'normal', '穩定步伐練習', '專注步頻、姿勢與腳底感受；覺得拖腳就降速。', Math.max(3, bossDistance - 2), 40 + week * 2, pack > 0 ? Math.max(0, pack - 1) : 0, 45, 9, false, false, 30),
      mission_(prefix, week, chapter, 'strength', 'normal', '下肢補給站', '深蹲、臀橋、小腿 raises，各 2-3 組。', '', 25, 0, 35, 5, false, false, 40),
      mission_(prefix, week, chapter, 'strength', 'mini', '核心穩定符文', 'Dead bug、平板撐、側棒式，總共 12-18 分鐘。', '', 15, 0, 30, 4, false, false, 50),
      mission_(prefix, week, chapter, 'recovery', 'mini', '足底與小腿修復', '足底按摩、小腿伸展、髖部伸展，舒服就好。', '', 12, 0, 25, 4, false, false, 60),
      mission_(prefix, week, chapter, 'recovery', 'mini', '補給日誌', '記錄睡眠、疲勞、疼痛與心情；恢復也算前進。', '', 8, 0, 20, 3, false, false, 70),
      mission_(prefix, week, chapter, 'knowledge', 'mini', getKnowledgeTitle_(week), getKnowledgeDescription_(week), '', 10, 0, 20, 3, false, false, 80),
      mission_(prefix, week, chapter, 'boss', 'long', `第 ${week} 週 Boss：${bossDistance} km 朝聖模擬`, `完成 ${bossDistance} km 健走，背包 ${pack} kg；全程以穩定、不拖腳為優先。`, bossDistance, Math.round(bossDistance * 12), pack, 100 + week * 5, 15 + week, true, true, 90)
    );
  }

  return rows;
}

function mission_(prefix, week, chapter, type, size, title, description, distance, minutes, pack, xp, routeKm, isBoss, required, sortOrder) {
  const code = type === 'boss' ? 'BOSS' : type.toUpperCase();
  return {
    missionId: `${prefix}-${code}-${String(sortOrder).padStart(2, '0')}`,
    weekNumber: week,
    chapterName: chapter,
    missionType: type,
    missionSize: size,
    title,
    description,
    targetDistanceKm: distance,
    targetMinutes: minutes,
    targetBackpackKg: pack,
    xpReward: xp,
    routeKmReward: routeKm,
    isBoss,
    requiredForPass: required,
    unlockWeek: week,
    active: true,
    sortOrder,
  };
}

function getWeeklyRuleRows_() {
  const rows = [];
  for (let week = 1; week <= 12; week += 1) {
    rows.push({
      weekNumber: week,
      chapterName: getChapterName_(week),
      requiredMissionCount: 6,
      requiredWalkCount: 2,
      requiredStrengthCount: 1,
      requiredRecoveryCount: 1,
      bossRequired: true,
      perfectMissionCount: 8,
      maxPainScoreForPerfect: 5,
      weeklyRewardTitle: getWeeklyRewardTitle_(week),
      weeklyRewardDescription: getWeeklyRewardDescription_(week),
    });
  }
  return rows;
}

function getBadgeRows_() {
  return [
    { badgeId: 'B-WEEK-01', name: '第一步', description: '通過第 1 週', unlockType: 'weekPassed', unlockValue: 1, icon: 'boot' },
    { badgeId: 'B-WEEK-04', name: '啟程之章', description: '通過前 4 週', unlockType: 'weekPassed', unlockValue: 4, icon: 'map' },
    { badgeId: 'B-DIST-50', name: '五十公里的信', description: '累積 50 km', unlockType: 'totalDistance', unlockValue: 50, icon: 'route' },
    { badgeId: 'B-BOSS-06', name: '穩穩打王', description: '完成 6 次 Boss 任務', unlockType: 'bossCount', unlockValue: 6, icon: 'shield' },
    { badgeId: 'B-DIST-120', name: '朝聖者的腿', description: '累積 120 km', unlockType: 'totalDistance', unlockValue: 120, icon: 'mountain' },
  ];
}

function getRouteNodeRows_() {
  return [
    { nodeId: 'NODE-001', name: 'Saint-Jean-Pied-de-Port', sortOrder: 1, requiredRouteKm: 0, description: '旅程開始的地方。' },
    { nodeId: 'NODE-002', name: 'Roncesvalles', sortOrder: 2, requiredRouteKm: 35, description: '越過第一段山路。' },
    { nodeId: 'NODE-003', name: 'Pamplona', sortOrder: 3, requiredRouteKm: 75, description: '穩定步伐開始成形。' },
    { nodeId: 'NODE-004', name: 'Burgos', sortOrder: 4, requiredRouteKm: 150, description: '耐力已經累積起來。' },
    { nodeId: 'NODE-005', name: 'Leon', sortOrder: 5, requiredRouteKm: 230, description: '進入長距離模擬。' },
    { nodeId: 'NODE-006', name: 'Santiago de Compostela', sortOrder: 6, requiredRouteKm: 330, description: '準備出發，身體和心都更有底氣。' },
  ];
}

function getRewardRows_() {
  return [
    { rewardId: 'R-WEEK-01', weekNumber: 1, title: '恢復飲品', description: '完成第一週後，準備一杯喜歡的飲品。', claimed: false },
    { rewardId: 'R-WEEK-04', weekNumber: 4, title: '健走襪補給', description: '完成第一章後，買一雙適合長走的襪子。', claimed: false },
    { rewardId: 'R-WEEK-08', weekNumber: 8, title: '按摩或泡湯', description: '完成第二章後，安排一次恢復約會。', claimed: false },
    { rewardId: 'R-WEEK-11', weekNumber: 11, title: 'Camino 出發禮物', description: '完成最終 Boss 後，準備一個出發小禮物。', claimed: false },
  ];
}

function getChapterName_(week) {
  if (week <= 4) return '啟程之村';
  if (week <= 8) return '庇里牛斯山試煉';
  return '通往聖地牙哥';
}

function getKnowledgeTitle_(week) {
  const titles = ['鞋襪檢查', '水泡預防', '背包調整', '補給測試', '雨具測試', '坡路策略', '腳底照顧', '長走配速', '裝備減重', '連走恢復', '出發清單', '減量週儀式'];
  return titles[week - 1];
}

function getKnowledgeDescription_(week) {
  const descriptions = [
    '檢查鞋子、襪子、鞋帶鬆緊，記錄哪裡容易摩擦。',
    '學會水泡熱點處理，準備貼布或凡士林。',
    '調整肩帶、胸扣、腰帶，讓重量靠近身體。',
    '測試一種走路時吃得下的補給。',
    '穿雨具走 10 分鐘，確認不悶、不磨、不卡。',
    '練習坡路小步伐，不用硬拚速度。',
    '完成足底按摩並記錄壓痛點。',
    '找到可以長時間聊天的步行速度。',
    '檢查背包，移除不必要重量。',
    'Boss 後隔天安排恢復，不把疲勞帶太久。',
    '整理朝聖出發清單，缺什麼就補什麼。',
    '用輕鬆儀式收尾，讓身體帶著好狀態出發。',
  ];
  return descriptions[week - 1];
}

function getWeeklyRewardTitle_(week) {
  if (week === 4) return '第一章寶箱';
  if (week === 8) return '第二章寶箱';
  if (week === 11) return '最終遠征寶箱';
  if (week === 12) return '出發前祝福';
  return `第 ${week} 週補給包`;
}

function getWeeklyRewardDescription_(week) {
  if (week === 4) return '解鎖健走襪補給，慶祝第一章完成。';
  if (week === 8) return '解鎖按摩或泡湯恢復約會。';
  if (week === 11) return '解鎖 Camino 出發禮物。';
  if (week === 12) return '減量恢復完成，準備出發。';
  return '完成本週任務池，累積旅程進度。';
}
