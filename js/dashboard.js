(function () {
  const chartRefs = {};

  const els = {
    distance: document.getElementById('dashboardDistance'),
    longest: document.getElementById('dashboardLongest'),
    pain: document.getElementById('dashboardPain'),
    fatigue: document.getElementById('dashboardFatigue'),
    recordsBody: document.getElementById('recordsBody'),
    refreshButton: document.getElementById('refreshButton'),
    message: document.getElementById('dashboardMessage'),
  };

  async function init() {
    els.refreshButton.addEventListener('click', loadDashboard);
    await loadDashboard();
  }

  async function loadDashboard() {
    try {
      els.message.classList.remove('error');
      els.message.textContent = '正在讀取 Apps Script 資料...';
      const response = await window.CaminoApi.jsonp('dashboard', {});
      if (!response || response.ok === false) {
        throw new Error(response && response.error ? response.error : '儀表板資料回傳格式不正確。');
      }
      renderDashboard(response);
    } catch (error) {
      els.message.classList.add('error');
      els.message.textContent = `讀取失敗：${error.message}`;
      els.recordsBody.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
  }

  function renderDashboard(data) {
    const summary = data.summary || {};
    const missionTitleById = buildMissionTitleMap(data.missions || []);
    els.distance.textContent = formatNumber(summary.totalDistanceKm);
    els.longest.textContent = formatNumber(summary.longestWalkKm);
    els.pain.textContent = formatNumber(summary.averagePain);
    els.fatigue.textContent = formatNumber(summary.averageFatigue);

    renderDistanceChart(data.series.cumulativeDistance || []);
    renderPainFatigueChart(data.series.painAndFatigue || []);
    renderLongestWalkChart(data.series.weeklyLongestWalk || []);
    renderMissionTypeChart(data.series.missionTypeDistribution || []);
    renderRecords(data.records || [], missionTitleById);

    const count = data.records ? data.records.length : 0;
    els.message.classList.remove('error');
    els.message.textContent = count > 0
      ? `已讀取 ${count} 筆完成紀錄。`
      : '資料讀取成功，但目前訓練資料表的完成紀錄是 0 筆。請先在任務頁完成一個任務。';
  }

  function renderDistanceChart(rows) {
    drawChart('distanceChart', {
      type: 'line',
      data: {
        labels: rows.map((row) => row.date),
        datasets: [{
          label: '累積距離 km',
          data: rows.map((row) => row.value),
          borderColor: '#2f7a5f',
          backgroundColor: 'rgba(47, 122, 95, 0.14)',
          fill: true,
          tension: 0.25,
        }],
      },
    });
  }

  function renderPainFatigueChart(rows) {
    drawChart('painFatigueChart', {
      type: 'line',
      data: {
        labels: rows.map((row) => row.date),
        datasets: [
          {
            label: '疼痛',
            data: rows.map((row) => row.pain),
            borderColor: '#b75d4a',
            tension: 0.25,
          },
          {
            label: '疲勞',
            data: rows.map((row) => row.fatigue),
            borderColor: '#3a6f96',
            tension: 0.25,
          },
        ],
      },
      options: {
        scales: {
          y: {
            min: 0,
            max: 10,
          },
        },
      },
    });
  }

  function renderLongestWalkChart(rows) {
    drawChart('longestWalkChart', {
      type: 'bar',
      data: {
        labels: rows.map((row) => `第 ${row.weekNumber} 週`),
        datasets: [{
          label: '最長健走 km',
          data: rows.map((row) => row.value),
          backgroundColor: '#c47a2c',
        }],
      },
    });
  }

  function renderMissionTypeChart(rows) {
    const labels = {
      walk: '健走',
      run: '跑步',
      cycling: '騎車',
      swim: '游泳',
      strength: '肌力',
      recovery: '恢復',
      mobility: '伸展活動',
      knowledge: '知識',
      boss: '關卡挑戰',
      bonus: '加碼',
      other: '其他',
    };

    drawChart('missionTypeChart', {
      type: 'doughnut',
      data: {
        labels: rows.map((row) => labels[row.type] || row.type),
        datasets: [{
          data: rows.map((row) => row.value),
          backgroundColor: ['#2f7a5f', '#3a6f96', '#b75d4a', '#c47a2c', '#26322f'],
        }],
      },
      options: {
        cutout: '62%',
      },
    });
  }

  function renderRecords(records, missionTitleById) {
    if (!records.length) {
      els.recordsBody.innerHTML = '<tr><td colspan="7">還沒有完成紀錄，先去完成第一個任務吧。</td></tr>';
      return;
    }

    els.recordsBody.innerHTML = records.slice().reverse().map((row) => `
      <tr>
        <td>${escapeHtml(formatDateTime(row.completedAt))}</td>
        <td>${escapeHtml(getMissionTitle(row.missionId, missionTitleById))}</td>
        <td>${escapeHtml(getMissionTypeLabel(row.missionType))}</td>
        <td>${formatNumber(row.actualDistanceKm)} km</td>
        <td>${formatNumber(row.actualMinutes)} 分</td>
        <td>${formatNumber(row.fatigueScore)}</td>
        <td>${formatNumber(row.painScore)}</td>
      </tr>
    `).join('');
  }

  function drawChart(id, config) {
    const ctx = document.getElementById(id);
    if (chartRefs[id]) {
      chartRefs[id].destroy();
    }

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#26322f',
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#68736d' },
          grid: { color: 'rgba(104, 115, 109, 0.12)' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#68736d' },
          grid: { color: 'rgba(104, 115, 109, 0.12)' },
        },
      },
    };
    const customOptions = config.options || {};

    chartRefs[id] = new Chart(ctx, Object.assign({}, config, {
      options: {
        ...baseOptions,
        ...customOptions,
        plugins: { ...baseOptions.plugins, ...(customOptions.plugins || {}) },
        scales: { ...baseOptions.scales, ...(customOptions.scales || {}) },
      },
    }));
  }

  function formatNumber(value) {
    if (value === undefined || value === null || value === '') return '-';
    return Number(value).toLocaleString('zh-TW', { maximumFractionDigits: 2 });
  }

  function formatDateTime(value) {
    const text = String(value || '');
    if (!text) return '-';
    const normalized = text.includes('T')
      ? formatIsoAsTaiwanTime(text)
      : text.replace('T', ' ').slice(0, 16);
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s?(\d{2}):(\d{2})/);
    if (!match) return normalized;
    return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
  }

  function formatIsoAsTaiwanTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(0, 16);
    const parts = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const map = {};
    parts.forEach((part) => {
      map[part.type] = part.value;
    });
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`;
  }

  function getMissionTypeLabel(type) {
    const labels = {
      walk: '健走',
      run: '跑步',
      cycling: '騎車',
      swim: '游泳',
      strength: '肌力',
      recovery: '恢復',
      mobility: '伸展活動',
      knowledge: '知識',
      boss: '關卡挑戰',
      bonus: '加碼',
      other: '其他',
    };
    return labels[type] || type || '-';
  }

  function buildMissionTitleMap(missions) {
    const map = {};
    missions.forEach((mission) => {
      map[mission.missionId] = getDisplayTitle(mission.title);
    });
    return map;
  }

  function getMissionTitle(missionId, missionTitleById) {
    if (missionTitleById && missionTitleById[missionId]) {
      return missionTitleById[missionId];
    }

    const match = String(missionId || '').match(/^W(\d{2})-([A-Z]+)-(\d{2})$/);
    if (!match) return missionId || '-';

    const week = Number(match[1]);
    const type = match[2];
    const order = match[3];
    const titles = {
      WALK: {
        '10': '忙碌日也前進',
        '20': '黃昏健走',
        '30': '穩定步伐練習',
      },
      STRENGTH: {
        '40': '下肢補給站',
        '50': '核心穩定符文',
      },
      RECOVERY: {
        '60': '足底與小腿修復',
        '70': '補給日誌',
      },
      KNOWLEDGE: {
        '80': '知識與裝備任務',
      },
      BOSS: {
        '90': `第 ${week} 週關卡挑戰`,
      },
    };

    return titles[type] && titles[type][order]
      ? titles[type][order]
      : `第 ${week} 週任務`;
  }

  function getDisplayTitle(title) {
    return String(title || '').replace(/\bBoss\b/g, '關卡挑戰');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]));
  }

  init();
})();
