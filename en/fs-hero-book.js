/* fs-hero-book.js — 首屏「Book Now」预约栏原生兜底
 * 背景：镜像站为静态导出，React 未水合，原站首屏预约栏的提交逻辑（校验 + 提交 + 弹窗）不会触发，
 *       导致「Book Now」点击无反应。此脚本用原生 JS 复刻原站行为，交互与原站保持一致：
 *       1) 按原站顺序校验：姓名 → 通讯方式+ID → 手术类型 → 同意接收短信 → 同意收集使用个人信息
 *       2) 校验失败弹出「Please check your input」提示（文案与原站一致）
 *       3) 校验通过后提交预约，成功弹出「Thank you!」、失败弹出「Oops!」
 * 说明：镜像站无法访问原站接口 /api/v1/consultations/quick，这里改投 Web3Forms，页面交互与原站一致。
 */
(function () {
  'use strict';

  var WEB3FORMS_KEY = '51d963eb-9294-4b37-b736-184a307f60a8';

  var MESSENGER_LABELS = { 'Messenger': 1, 'KakaoTalk': 1, 'WhatsApp': 1, 'LINE': 1, '客服 id': 1 };
  var SURGERY_LABELS = {
    'List of Surgeries': 1, '面部轮廓': 1, 'Face Contouring': 1, 'Nose': 1, 'Eye': 1,
    'Anti-aging': 1, 'Breast Surgery': 1, 'Body Contouring': 1, 'Orthognathic Surgery': 1,
    'ENT': 1, 'Middle Age Eye': 1, 'Male Plastic Surgery': 1
  };
  var SURGERY_VALUE_LABEL = {
    'face-contouring': 'Face Contouring', 'nose': 'Nose', 'eye': 'Eye', 'anti-aging': 'Anti-aging',
    'breast': 'Breast Surgery', 'body-contouring': 'Body Contouring',
    'orthognathic-surgery': 'Orthognathic Surgery', 'ent-nose': 'ENT',
    'middle-age-eye': 'Middle Age Eye', 'male-plastic-surgery': 'Male Plastic Surgery'
  };

  var MSG = {
    name: 'Please enter your name.',
    messenger: 'Please select a messenger and enter your ID.',
    surgery: 'Please select a surgery type.',
    sms: 'Please agree to receive SMS notifications.',
    privacy: 'Please agree to the collection and use of personal information.',
    fail: 'Submission failed. Please try again.',
    ok: 'Your inquiry has been received. Our team will contact you shortly via your messenger.',
    captcha: 'Please complete the human verification ("I am human") before submitting.'
  };

  var CAPTCHA_SELECTOR = '.h-captcha[data-captcha="true"]';

  function txt(el) { return (el ? el.textContent : '').replace(/\s+/g, ' ').trim(); }

  /* 读取 hCaptcha 令牌：Web3Forms 开启垃圾防护后，提交必须携带该令牌 */
  function readCaptcha() {
    var el = document.querySelector(CAPTCHA_SELECTOR);
    if (!el) return { present: false, token: '' };
    var token = '';
    if (window.hcaptcha && typeof window.hcaptcha.getResponse === 'function') {
      try { token = window.hcaptcha.getResponse() || ''; } catch (e) { token = ''; }
    }
    return { present: true, token: token };
  }

  function focusCaptcha() {
    var el = document.querySelector(CAPTCHA_SELECTOR);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* 找到按钮所属的预约表单区域（含 Name 输入框的最近祖先） */
  function scopeOf(btn) {
    var el = btn;
    while (el && el !== document.body) {
      if (el.querySelector && el.querySelector('input[placeholder="Name"]')) return el;
      el = el.parentElement;
    }
    return document.body;
  }

  function pickDropdown(scope, labels) {
    var ds = scope.querySelectorAll('button[aria-haspopup="dialog"]');
    for (var i = 0; i < ds.length; i++) {
      if (labels[txt(ds[i].querySelector('span'))]) return ds[i];
    }
    return null;
  }

  function checkboxByLabel(scope, label) {
    var spans = scope.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
      if (txt(spans[i]) === label) {
        var w = spans[i].parentElement;
        if (w) return w.querySelector('[role="checkbox"]');
      }
    }
    return null;
  }

  function checked(box) { return !!(box && box.getAttribute('aria-checked') === 'true'); }

  /* ---------- 弹窗（复刻原站 Dialog 样式） ---------- */
  var overlay = null;
  function closeModal() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }
  function showModal(title, body, btnLabel, danger) {
    closeModal();
    overlay = document.createElement('div');
    overlay.setAttribute('data-fs-book-modal', '1');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px';

    var panel = document.createElement('div');
    panel.style.cssText = 'position:relative;background:#fff;border-radius:12px;max-width:24rem;width:100%;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25)';

    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.style.cssText = 'position:absolute;right:14px;top:14px;width:24px;height:24px;border:0;background:transparent;font-size:20px;line-height:1;color:#9aa0a6;cursor:pointer';
    close.textContent = '\u00d7';
    close.addEventListener('click', closeModal);

    var h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:20px;font-weight:600;line-height:1.25;' + (danger ? 'color:#ef4444;' : 'color:#1c1c1c');

    var p = document.createElement('p');
    p.textContent = body;
    p.style.cssText = 'font-size:14px;line-height:1.5;color:#5f6368;margin:8px 0 0';

    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = btnLabel;
    b.style.cssText = 'margin-top:16px;width:100%;height:44px;border:0;border-radius:6px;background:#003984;color:#fff;font-size:15px;font-weight:500;cursor:pointer;font-family:inherit';
    b.addEventListener('click', closeModal);

    panel.appendChild(close); panel.appendChild(h); panel.appendChild(p); panel.appendChild(b);
    overlay.appendChild(panel);
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closeModal(); });
    document.body.appendChild(overlay);
    b.focus();
  }

  /* ---------- 读取 / 重置表单 ---------- */
  function readForm(scope) {
    var nameEl = scope.querySelector('input[placeholder="Name"]');
    var idEl = scope.querySelector('input[placeholder="Messenger id"]');
    var mBtn = pickDropdown(scope, MESSENGER_LABELS);
    var sBtn = pickDropdown(scope, SURGERY_LABELS);
    return {
      name: nameEl ? nameEl.value : '',
      messengerId: idEl ? idEl.value : '',
      messenger: mBtn ? (mBtn.getAttribute('data-value') || '') : '',
      surgery: sBtn ? (sBtn.getAttribute('data-value') || '') : '',
      consentSms: checked(checkboxByLabel(scope, 'Consent to Receive SMS')),
      consentPrivacy: checked(checkboxByLabel(scope, 'Consent to Collect and Use of Personal Information')),
      nameEl: nameEl, idEl: idEl, mBtn: mBtn, sBtn: sBtn
    };
  }

  function resetDropdown(btn, placeholder) {
    if (!btn) return;
    btn.removeAttribute('data-value');
    var s = btn.querySelector('span');
    if (s) { s.textContent = placeholder; s.classList.remove('text-idh-gray-800'); s.classList.add('text-idh-gray-500'); }
  }

  function resetForm(f, scope) {
    if (f.nameEl) f.nameEl.value = '';
    if (f.idEl) f.idEl.value = '';
    resetDropdown(f.mBtn, 'Messenger');
    resetDropdown(f.sBtn, 'List of Surgeries');
    var boxes = scope.querySelectorAll('[role="checkbox"]');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].setAttribute('aria-checked', 'false');
      var ic = boxes[i].querySelector('[data-fs-cb-icon]');
      if (ic && ic.parentNode) ic.parentNode.removeChild(ic);
    }
  }

  /* ---------- 提交 ---------- */
  function submit(f, captchaToken, done) {
    var payload = {
      access_key: WEB3FORMS_KEY,
      subject: 'New Booking — FANSHI (Quick Consultation)',
      from_name: 'FANSHI Website',
      name: f.name.trim(),
      phone: f.messengerId.trim(),
      messenger_type: f.messenger || 'n/a',
      message: 'Surgery interest: ' + (SURGERY_VALUE_LABEL[f.surgery] || f.surgery || '-'),
      privacy_agreed: f.consentPrivacy,
      sms_agreed: f.consentSms
    };
    if (captchaToken) payload['h-captcha-response'] = captchaToken;
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); })
      .then(function (j) { done(!!(j && j.success)); })
      .catch(function () { done(false); });
  }

  function onSubmit(btn) {
    var scope = scopeOf(btn);
    var f = readForm(scope);
    var msg = '';
    if (!f.name.trim()) msg = MSG.name;
    else if (!(f.messenger && f.messengerId.trim())) msg = MSG.messenger;
    else if (!f.surgery) msg = MSG.surgery;
    else if (!f.consentSms) msg = MSG.sms;
    else if (!f.consentPrivacy) msg = MSG.privacy;

    if (msg) { showModal('Please check your input', msg, 'OK', false); return; }

    /* hCaptcha 垃圾防护：令牌缺失时先提示完成人机验证，不发出请求 */
    var cap = readCaptcha();
    if (cap.present && !cap.token) {
      focusCaptcha();
      showModal('Verification required', MSG.captcha, 'OK', false);
      return;
    }

    btn.disabled = true;
    btn.style.opacity = '0.7';
    submit(f, cap.token, function (ok) {
      btn.disabled = false;
      btn.style.opacity = '';
      if (ok) {
        resetForm(f, scope);
        if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
          try { window.hcaptcha.reset(); } catch (e) { /* ignore */ }
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'form_submit_booking' });
        showModal('Thank you!', MSG.ok, 'Close', false);
      } else {
        showModal('Oops!', MSG.fail, 'Close', true);
      }
    });
  }

  function bind() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.getAttribute('data-fs-book') === '1') continue;
      if (txt(b) !== 'Book Now') continue;
      if (scopeOf(b) === document.body) continue;
      b.setAttribute('data-fs-book', '1');
      b.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); onSubmit(this); });
    }
  }

  var busy = false;
  function init() {
    bind();
    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function () {
      if (busy) return;
      busy = true;
      requestAnimationFrame(function () { busy = false; bind(); });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();