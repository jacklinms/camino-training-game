(function () {
  const state = {
    weekNumber: Number(window.CAMINO_CONFIG.DEFAULT_WEEK || 1),
    missions: [],
    summary: null,
    completions: [],
    selectedMission: null,
  };

  const els = {
    levelValue: document.getElementById('levelValue'),
    distanceValue: document.getElementById('distanceValue'),
    xpValue: document.getElementById('xpValue'),
    longestWalkValue: document.getElementById('longestWalkValue'),
    weekNumberLabel: document.getElementById('weekNumberLabel'),
    chapterName: document.getElementById('chapterName'),
    passTitle: document.getElementById('passTitle'),
    passDescription: document.getElementById('passDescription'),
    requirementGrid: document.getElementById('requirementGrid'),
    weekProgressBar: document.getElementById('weekProgressBar'),
    missionGrid: document.getElementById('missionGrid'),
    previousWeekButton: document.getElementById('previousWeekButton'),
    nextWeekButton: document.getElementById('nextWeekButton'),
    addMissionButton: document.getElementById('addMissionButton'),
    dialog: document.getElementById('completionDialog'),
    form: document.getElementById('completionForm'),
    formHint: document.getElementById('formHint'),
    closeDialogButton: document.getElementById('closeDialogButton'),
    cancelButton: document.getElementById('cancelButton'),
    dialogMissionTitle: document.getElementById('dialogMissionTitle'),
    missionIdInput: document.getElementById('missionIdInput'),
    completedAtInput: document.getElementById('completedAtInput'),
    actualDistanceInput: document.getElementById('actualDistanceInput'),
    actualMinutesInput: document.getElementById('actualMinutesInput'),
    actualBackpackInput: document.getElementById('actualBackpackInput'),
    customMissionDialog: document.getElementById('customMissionDialog'),
    customMissionForm: document.getElementById('customMissionForm'),
    closeCustomMissionButton: document.getElementById('closeCustomMissionButton'),
    cancelCustomMissionButton: document.getElementById('cancelCustomMissionButton'),
    customMissionHint: document.getElementById('customMissionHint'),
    customTitleInput: document.getElementById('customTitleInput'),
    rewardToast: document.getElementById('rewardToast'),
    rewardToastTitle: document.getElementById('rewardToastTitle'),
    rewardToastText: document.getElementById('rewardToastText'),
  };

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
    mini: '短任務',
    normal: '一般',
    long: '長任務',
  };

  async function init() {
    bindEvents();
    await loadWeek();
  }

  function bindEvents() {
    els.previousWeekButton.addEventListener('click', async () => {
      state.weekNumber = Math.max(1, state.weekNumber - 1);
      await loadWeek();
    });

    els.nextWeekButton.addEventListener('click', async () => {
      state.weekNumber = Math.min(12, state.weekNumber + 1);
      await loadWeek();
    });

    els.closeDialogButton.addEventListener('click', closeDialog);
    els.cancelButton.addEventListener('click', closeDialog);
    els.form.addEventListener('submit', submitCompletion);
    els.addMissionButton.addEventListener('click', openCustomMissionDialog);
    els.closeCustomMissionButton.addEventListener('click', closeCustomMissionDialog);
    els.cancelCustomMissionButton.addEventListener('click', closeCustomMissionDialog);
    els.customMissionForm.addEventListener('submit', submitCustomMission);
  }

  async function loadWeek() {
    showLoading();
    try {
      const [missionResponse, summaryResponse, completionsResponse] = await Promise.all([
        window.CaminoApi.jsonp('missions', { weekNumber: state.weekNumber }),
        window.CaminoApi.jsonp('summary', {}),
        window.CaminoApi.jsonp('completions', {}),
      ]);
      state.missions = missionResponse.missions || [];
      state.summary = summaryResponse || null;
      state.completions = Array.isArray(completionsResponse) ? completionsResponse : [];
      render();
    } catch (error) {
      els.missionGrid.innerHTML = `<p class="status-card">${escapeHtml(error.message)}</p>`;
    }
  }

  function showLoading() {
    els.weekNumberLabel.textContent = state.weekNumber;
    els.chapterName.textContent = '讀取任務中';
    els.missionGrid.innerHTML = '<p class="status-card">正在讀取訓練資料...</p>';
  }

  function render() {
    renderSummary();
    renderWeekStatus();
    renderMissions();
  }

  function renderSummary() {
    const totals = state.summary && state.summary.totals ? state.summary.totals : {};
    els.levelValue.textContent = totals.level || '-';
    els.distanceValue.textContent = formatNumber(totals.totalDistanceKm);
    els.xpValue.textContent = formatNumber(totals.totalXp);
    els.longestWalkValue.textContent = formatNumber(totals.longestWalkKm);
  }

  function renderWeekStatus() {
    const firstMission = state.missions[0] || {};
    const status = getCurrentWeekStatus();
    const requiredCount = status.requiredMissionCount || 6;
    const completedCount = status.completedCount || 0;
    const percent = Math.min(100, Math.round((completedCount / requiredCount) * 100));

    els.weekNumberLabel.textContent = state.weekNumber;
    els.chapterName.textContent = firstMission.chapterName || `第 ${state.weekNumber} 週`;
    els.weekProgressBar.style.width = `${percent}%`;

    if (status.passed) {
      els.passTitle.textContent = status.perfect ? '完美通關' : '本週通關';
      els.passDescription.textContent = `已完成 ${completedCount} / ${requiredCount}，關卡挑戰${status.bossDone ? '已完成' : '未完成'}。`;
    } else {
      els.passTitle.textContent = '通關條件';
      els.passDescription.textContent = `完成 ${completedCount} / ${requiredCount}，至少 2 個健走、1 個肌力、1 個恢復，並完成關卡挑戰。`;
    }

    renderRequirements(status);
  }

  function renderRequirements(status) {
    const items = [
      {
        label: '健走',
        value: `${status.walkCount || 0} / 2`,
        done: Number(status.walkCount || 0) >= 2,
      },
      {
        label: '肌力',
        value: `${status.strengthCount || 0} / 1`,
        done: Number(status.strengthCount || 0) >= 1,
      },
      {
        label: '恢復',
        value: `${status.recoveryCount || 0} / 1`,
        done: Number(status.recoveryCount || 0) >= 1,
      },
      {
        label: '關卡挑戰',
        value: status.bossDone ? '已完成' : '未完成',
        done: Boolean(status.bossDone),
      },
    ];

    els.requirementGrid.innerHTML = items.map((item) => `
      <div class="requirement-item${item.done ? ' done' : ''}">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
      </div>
    `).join('');
  }

  function renderMissions() {
    const completedIds = getCompletedMissionIds();
    const template = document.getElementById('missionCardTemplate');
    els.missionGrid.innerHTML = '';

    state.missions.forEach((mission) => {
      const node = template.content.firstElementChild.cloneNode(true);
      const completed = completedIds.has(mission.missionId);
      const typePill = node.querySelector('.type-pill');
      const sizePill = node.querySelector('.size-pill');
      const button = node.querySelector('button');

      node.classList.toggle('boss', mission.missionType === 'boss');
      node.classList.toggle('completed', completed);
      typePill.textContent = labels[mission.missionType] || mission.missionType;
      typePill.classList.add(mission.missionType);
      sizePill.textContent = labels[mission.missionSize] || mission.missionSize;
      node.querySelector('h3').textContent = getDisplayTitle(mission.title);
      node.querySelector('p').textContent = mission.description;
      node.querySelector('[data-field="distance"]').textContent = mission.targetDistanceKm ? `${mission.targetDistanceKm} km` : '-';
      node.querySelector('[data-field="minutes"]').textContent = mission.targetMinutes ? `${mission.targetMinutes} 分` : '-';
      node.querySelector('[data-field="backpack"]').textContent = mission.targetBackpackKg ? `${mission.targetBackpackKg} kg` : '0 kg';
      button.textContent = completed ? '再記錄一次' : '完成任務';
      button.addEventListener('click', () => openDialog(mission));
      els.missionGrid.appendChild(node);
    });
  }

  function getCurrentWeekStatus() {
    const statuses = state.summary && state.summary.weeklyStatus ? state.summary.weeklyStatus : [];
    return statuses.find((item) => Number(item.weekNumber) === state.weekNumber) || {};
  }

  function getCompletedMissionIds() {
    return new Set(
      state.completions
        .filter((row) => Number(row.weekNumber) === state.weekNumber)
        .map((row) => row.missionId)
    );
  }

  async function openDialog(mission) {
    state.selectedMission = mission;
    els.form.reset();
    els.formHint.textContent = '送出後會寫入訓練資料表。';
    els.dialogMissionTitle.textContent = mission.title;
    els.missionIdInput.value = mission.missionId;
    els.actualDistanceInput.value = mission.targetDistanceKm || '';
    els.actualMinutesInput.value = mission.targetMinutes || '';
    els.actualBackpackInput.value = mission.targetBackpackKg || 0;
    els.dialog.showModal();
  }

  function closeDialog() {
    els.dialog.close();
  }

  function openCustomMissionDialog() {
    els.customMissionForm.reset();
    els.customMissionHint.textContent = '新增後會出現在本週任務池。';
    els.customMissionDialog.showModal();
    window.setTimeout(() => els.customTitleInput.focus(), 50);
  }

  function closeCustomMissionDialog() {
    els.customMissionDialog.close();
  }

  async function submitCustomMission(event) {
    event.preventDefault();
    const formData = new FormData(els.customMissionForm);
    const payload = {
      weekNumber: state.weekNumber,
      title: formData.get('title') || '',
      missionType: formData.get('missionType') || 'bonus',
      missionSize: formData.get('missionSize') || 'normal',
      description: formData.get('description') || '',
      targetDistanceKm: formData.get('targetDistanceKm') || '',
      targetMinutes: formData.get('targetMinutes') || '',
      targetBackpackKg: formData.get('targetBackpackKg') || '',
    };

    els.customMissionHint.textContent = '正在建立任務卡片...';
    await window.CaminoApi.post('addMission', payload);
    closeCustomMissionDialog();
    await wait(1300);
    await loadWeek();

    if (hasMissionTitle(payload.title)) {
      showGenericToast('任務卡片已建立', `「${payload.title}」已加入第 ${state.weekNumber} 週任務池。`);
    } else {
      showGenericToast('尚未看到新卡片', '請先確認 Apps Script 已重新部署新版，或稍等幾秒後重新整理頁面。');
    }
  }

  async function submitCompletion(event) {
    event.preventDefault();
    if (!state.selectedMission) return;

    const formData = new FormData(els.form);
    const payload = {
      userId: window.CAMINO_CONFIG.USER_ID || 'USER-001',
      missionId: state.selectedMission.missionId,
      completedAt: formatDateTimeForApi(formData.get('completedAt')),
      actualDistanceKm: formData.get('actualDistanceKm') || '',
      actualMinutes: formData.get('actualMinutes') || '',
      actualBackpackKg: formData.get('actualBackpackKg') || '',
      fatigueScore: formData.get('fatigueScore') || '',
      painScore: formData.get('painScore') || '',
      painArea: formData.get('painArea') || '',
      mood: formData.get('mood') || '',
      notes: formData.get('notes') || '',
    };

    els.formHint.textContent = '正在寫入訓練資料表...';
    await window.CaminoApi.post('completeMission', payload);
    els.formHint.textContent = '已送出，正在重新整理。';
    closeDialog();
    showRewardToast(state.selectedMission);
    await loadWeek();
  }

  function showRewardToast(mission) {
    els.rewardToastTitle.textContent = '今天又更靠近西班牙一點';
    els.rewardToastText.textContent = `完成「${getDisplayTitle(mission.title)}」，獲得 ${mission.xpReward} 經驗值，地圖前進 ${mission.routeKmReward} 公里。`;
    showToast();
  }

  function showGenericToast(title, text) {
    els.rewardToastTitle.textContent = title;
    els.rewardToastText.textContent = text;
    showToast();
  }

  function showToast() {
    els.rewardToast.classList.add('show');

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      els.rewardToast.classList.remove('show');
    }, 4200);
  }

  function getDisplayTitle(title) {
    return String(title || '').replace(/\bBoss\b/g, '關卡挑戰');
  }

  function hasMissionTitle(title) {
    const normalizedTitle = String(title || '').trim();
    return state.missions.some((mission) => String(mission.title || '').trim() === normalizedTitle);
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function formatDateTimeForApi(value) {
    if (!value) return '';
    return String(value).replace('T', ' ') + ':00';
  }

  function formatNumber(value) {
    if (value === undefined || value === null || value === '') return '-';
    return Number(value).toLocaleString('zh-TW', { maximumFractionDigits: 2 });
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
