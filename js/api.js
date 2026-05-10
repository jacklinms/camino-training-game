(function () {
  const config = window.CAMINO_CONFIG || {};

  function getApiUrl() {
    if (!config.API_URL || config.API_URL.indexOf('PASTE_YOUR') >= 0) {
      throw new Error('請先在 js/config.js 貼上 Apps Script Web App URL。');
    }
    return config.API_URL;
  }

  function buildUrl(action, params) {
    const url = new URL(getApiUrl());
    url.searchParams.set('action', action);
    Object.keys(params || {}).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.set(key, params[key]);
      }
    });
    return url;
  }

  function jsonp(action, params) {
    return new Promise((resolve, reject) => {
      const callbackName = `caminoCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const script = document.createElement('script');
      const url = buildUrl(action, params);

      url.searchParams.set('callback', callbackName);
      script.src = url.toString();
      script.async = true;

      window[callbackName] = (response) => {
        cleanup();
        resolve(response);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('讀取訓練資料失敗。'));
      };

      function cleanup() {
        delete window[callbackName];
        script.remove();
      }

      document.body.appendChild(script);
    });
  }

  async function post(action, payload) {
    return postWithHiddenForm(action, payload);
  }

  function postWithHiddenForm(action, payload) {
    return new Promise((resolve) => {
      const iframeName = `caminoPostFrame_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      const iframe = document.createElement('iframe');
      const form = document.createElement('form');

      iframe.name = iframeName;
      iframe.style.display = 'none';

      form.method = 'POST';
      form.action = getApiUrl();
      form.target = iframeName;
      form.style.display = 'none';

      appendHiddenInput(form, 'action', action);
      Object.keys(payload || {}).forEach((key) => {
        appendHiddenInput(form, key, payload[key]);
      });

      let submitted = false;
      iframe.addEventListener('load', () => {
        if (!submitted) return;
        setTimeout(() => {
          form.remove();
          iframe.remove();
          resolve({ ok: true });
        }, 800);
      });

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      submitted = true;
      form.submit();
    });
  }

  function appendHiddenInput(form, name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value === undefined || value === null ? '' : value;
    form.appendChild(input);
  }

  async function postWithFetch(action, payload) {
    const form = new FormData();
    form.append('action', action);
    Object.keys(payload || {}).forEach((key) => {
      form.append(key, payload[key]);
    });

    await fetch(getApiUrl(), {
      method: 'POST',
      mode: 'no-cors',
      body: form,
    });

    return { ok: true };
  }

  window.CaminoApi = {
    jsonp,
    post,
    postWithFetch,
  };
})();
