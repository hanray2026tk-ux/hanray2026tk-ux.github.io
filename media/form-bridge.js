(function () {
  'use strict';
  if (window.__fsBridgeLoaded) return;
  window.__fsBridgeLoaded = true;

  var API_HOST = 'api-en.idh-global.com';
  var WA_LINK = 'https://wa.me/qr/X2OA3W2QKKMIB1';
  var WECHAT_ID = 'Fsym202681';

  var SURGERY = {
    'face-contouring': 'Face Contouring',
    'nose': 'Nose',
    'orthognathic-surgery': 'Orthognathic Surgery',
    'eye': 'Eye',
    'middle-age-eye': 'Middle Age Eye',
    'anti-aging': 'Anti-Aging',
    'breast': 'Breast Surgery',
    'body-contouring': 'Body Contouring',
    'male-plastic-surgery': 'Male Plastic Surgery'
  };

  function surgeryName(code) {
    if (!code) return '';
    return code.split(',').map(function (c) {
      c = String(c).trim();
      return SURGERY[c] || c;
    }).filter(Boolean).join(', ');
  }

  function buildMessage(data, url) {
    var lines = ['New booking request from fanshiaesthetics.com', ''];
    if (data.name) lines.push('Name: ' + data.name);
    var contact = data.messenger_id || data.phone || data.email || '';
    var channel = data.messenger_type || data.contact_method || '';
    if (contact || channel) lines.push('Contact: ' + contact + (channel ? ' (' + channel + ')' : ''));
    if (data.age_range) lines.push('Age: ' + data.age_range);
    var surgery = surgeryName(data.surgery_codes || data.surgery || '');
    if (surgery) lines.push('Procedure: ' + surgery);
    var note = data.message || data.inquiry_text || data.title || '';
    if (note) lines.push('Notes: ' + note);
    if (data.picture_front_url || data.attachment_paths) lines.push('Photos: sent separately');
    lines.push('', 'Page: ' + String(url || '').split('?')[0]);
    return lines.join('\n');
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)['catch'](function () { fallbackCopy(text); });
        return;
      }
    } catch (e) {}
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
  }

  function showModal(text) {
    var old = document.getElementById('fs-bridge-modal');
    if (old) old.parentNode.removeChild(old);

    var wrap = document.createElement('div');
    wrap.id = 'fs-bridge-modal';
    wrap.setAttribute('role', 'dialog');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(7,28,31,.45);display:flex;align-items:center;justify-content:center;padding:16px;';

    var card = document.createElement('div');
    card.style.cssText = 'width:100%;max-width:460px;background:#fff;border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(7,28,31,.25);font-family:inherit;color:#071C1F;max-height:90vh;overflow:auto;';

    var title = document.createElement('h3');
    title.textContent = 'Your request is ready to send';
    title.style.cssText = 'margin:0 0 8px;font-size:18px;line-height:1.4;font-weight:600;';

    var desc = document.createElement('p');
    desc.textContent = 'Your details have been copied. Tap WhatsApp to send them to us, or add our WeChat ID and paste the message.';
    desc.style.cssText = 'margin:0 0 16px;font-size:14px;line-height:1.6;color:#57686B;';

    var box = document.createElement('pre');
    box.textContent = text;
    box.style.cssText = 'margin:0 0 16px;padding:12px;background:#F4F5F5;border-radius:10px;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:#3C4B4E;max-height:180px;overflow:auto;';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    var wa = document.createElement('a');
    wa.href = WA_LINK;
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.textContent = 'Send on WhatsApp';
    wa.style.cssText = 'display:block;text-align:center;padding:13px 16px;background:#25D366;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;';
    wa.addEventListener('click', function () { copyText(text); });

    var wx = document.createElement('button');
    wx.type = 'button';
    wx.textContent = 'Copy WeChat ID: ' + WECHAT_ID;
    wx.style.cssText = 'display:block;width:100%;padding:13px 16px;background:#FAE100;color:#071C1F;border:0;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;';
    wx.addEventListener('click', function () {
      copyText(WECHAT_ID + '\n\n' + text);
      wx.textContent = 'WeChat ID and message copied';
    });

    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.style.cssText = 'display:block;width:100%;padding:11px 16px;background:transparent;color:#57686B;border:1px solid #E4E7E7;border-radius:10px;font-size:14px;cursor:pointer;';
    close.addEventListener('click', function () {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    });

    row.appendChild(wa);
    row.appendChild(wx);
    row.appendChild(close);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(box);
    card.appendChild(row);
    wrap.appendChild(card);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    });
    document.body.appendChild(wrap);
  }

  function fakeResponse(xhr, payload) {
    var text = JSON.stringify(payload);
    try {
      Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true });
      Object.defineProperty(xhr, 'status', { value: 200, configurable: true });
      Object.defineProperty(xhr, 'statusText', { value: 'OK', configurable: true });
      Object.defineProperty(xhr, 'responseText', { value: text, configurable: true });
      Object.defineProperty(xhr, 'response', {
        value: xhr.responseType === 'json' ? payload : text,
        configurable: true
      });
    } catch (e) {}
    try {
      if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
    } catch (e) {}
    try {
      xhr.dispatchEvent(new Event('load'));
      xhr.dispatchEvent(new Event('loadend'));
    } catch (e) {}
  }

  var rawOpen = XMLHttpRequest.prototype.open;
  var rawSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__fsReq = { method: String(method || 'GET').toUpperCase(), url: String(url || '') };
    return rawOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var req = this.__fsReq || {};
    if (req.url.indexOf(API_HOST) !== -1 && req.method === 'POST') {
      var isUpload = req.url.indexOf('/uploads/') !== -1;
      var payload = {};
      try { payload = JSON.parse(body || '{}'); } catch (e) {}
      if (isUpload) {
        fakeResponse(this, { data: { url: '', path: '' } });
        return;
      }
      var message = buildMessage(payload, req.url);
      copyText(message);
      showModal(message);
      var isOnline = req.url.indexOf('/consultations/online') !== -1;
      fakeResponse(this, isOnline ? { data: { id: null } } : { data: {} });
      return;
    }
    return rawSend.apply(this, arguments);
  };
})();
