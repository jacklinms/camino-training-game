(function () {
  const els = {
    mapProgressTitle: document.getElementById('mapProgressTitle'),
    mapProgressText: document.getElementById('mapProgressText'),
    routeKmValue: document.getElementById('routeKmValue'),
    routeLineFill: document.getElementById('routeLineFill'),
    routeNodes: document.getElementById('routeNodes'),
    nextNodeText: document.getElementById('nextNodeText'),
  };

  async function init() {
    try {
      const summary = await window.CaminoApi.jsonp('summary', {});
      renderMap(summary);
    } catch (error) {
      els.mapProgressTitle.textContent = '旅程讀取失敗';
      els.mapProgressText.textContent = error.message;
      els.nextNodeText.textContent = '請確認訓練資料服務是否已部署。';
    }
  }

  function renderMap(summary) {
    const totals = summary.totals || {};
    const totalRouteKm = Number(totals.totalRouteKm || 0);
    const nodes = getRouteNodes(summary);
    const nextNode = nodes.find((node) => Number(node.requiredRouteKm) > totalRouteKm);
    const lastNode = nodes[nodes.length - 1] || { requiredRouteKm: 1 };
    const progressPercent = Math.min(100, Math.round((totalRouteKm / Number(lastNode.requiredRouteKm || 1)) * 100));

    els.routeKmValue.textContent = formatNumber(totalRouteKm);
    els.routeLineFill.style.width = `${progressPercent}%`;

    if (nextNode) {
      const remainKm = Math.max(0, Number(nextNode.requiredRouteKm) - totalRouteKm);
      els.mapProgressTitle.textContent = `已前進 ${formatNumber(totalRouteKm)} 公里`;
      els.mapProgressText.textContent = `下一站是「${nextNode.name}」，還差 ${formatNumber(remainKm)} 地圖公里。`;
      els.nextNodeText.textContent = `繼續完成本週任務池，就能解鎖「${nextNode.name}」。`;
    } else {
      els.mapProgressTitle.textContent = '聖地牙哥已解鎖';
      els.mapProgressText.textContent = '這段訓練旅程已經走到終點，接下來就是帶著身體的底氣出發。';
      els.nextNodeText.textContent = '全部路線節點都已解鎖。';
    }

    els.routeNodes.innerHTML = nodes.map((node, index) => {
      const unlocked = Number(node.requiredRouteKm) <= totalRouteKm;
      const current = nextNode && node.nodeId === nextNode.nodeId;

      return `
        <article class="route-node${unlocked ? ' unlocked' : ''}${current ? ' current' : ''}">
          <div class="route-node-marker">${unlocked ? '✓' : index + 1}</div>
          <h3>${escapeHtml(node.name)}</h3>
          <p>${escapeHtml(node.description || '')}</p>
          <small>${formatNumber(node.requiredRouteKm)} 地圖公里解鎖</small>
        </article>
      `;
    }).join('');
  }

  function getRouteNodes(summary) {
    const defaultNodes = [
      { nodeId: 'NODE-001', name: '聖讓皮耶德波爾', requiredRouteKm: 0, description: '旅程開始的地方。' },
      { nodeId: 'NODE-002', name: '龍塞斯瓦耶斯', requiredRouteKm: 35, description: '越過第一段山路。' },
      { nodeId: 'NODE-003', name: '潘普洛納', requiredRouteKm: 75, description: '穩定步伐開始成形。' },
      { nodeId: 'NODE-004', name: '布爾戈斯', requiredRouteKm: 150, description: '耐力已經累積起來。' },
      { nodeId: 'NODE-005', name: '萊昂', requiredRouteKm: 230, description: '進入長距離模擬。' },
      { nodeId: 'NODE-006', name: '聖地牙哥-德孔波斯特拉', requiredRouteKm: 330, description: '準備出發，身體和心都更有底氣。' },
    ];

    const nodes = summary.unlockedNodes && summary.unlockedNodes.length
      ? mergeNodeNames(defaultNodes, summary.unlockedNodes)
      : defaultNodes;

    return nodes.slice().sort((a, b) => Number(a.requiredRouteKm) - Number(b.requiredRouteKm));
  }

  function mergeNodeNames(defaultNodes, unlockedNodes) {
    const byId = {};
    defaultNodes.forEach((node) => {
      byId[node.nodeId] = node;
    });
    unlockedNodes.forEach((node) => {
      if (byId[node.nodeId]) {
        byId[node.nodeId] = Object.assign({}, byId[node.nodeId], {
          requiredRouteKm: node.requiredRouteKm,
          description: byId[node.nodeId].description || node.description,
        });
      }
    });
    return defaultNodes.map((node) => byId[node.nodeId]);
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
