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

  var MESSENGER_LABELS = { 'Messenger': 1, 'KakaoTalk': 1, 'WhatsApp': 1, 'LINE': 1, '客服 id': 1, '在线咨询': 1 };
  var SURGERY_LABELS = {
    'List of Surgeries': 1, '手术项目': 1, '面部轮廓': 1, 'Face Contouring': 1, 'Nose': 1, 'Eye': 1,
    'Anti-aging': 1, 'Breast Surgery': 1, 'Body Contouring': 1, 'Orthognathic Surgery': 1,
    'Middle Age Eye': 1, 'Male Plastic Surgery': 1
  };
  var SURGERY_VALUE_LABEL = {
    'face-contouring': 'Face Contouring', 'nose': 'Nose', 'eye': 'Eye', 'anti-aging': 'Anti-aging',
    'breast': 'Breast Surgery', 'body-contouring': 'Body Contouring',
    'orthognathic-surgery': 'Orthognathic Surgery',
    'middle-age-eye': 'Middle Age Eye', 'male-plastic-surgery': 'Male Plastic Surgery'
  };

  var MSG = {
    name: '请输入您的姓名。',
    messenger: '请选择咨询方式并填写客服账号。',
    surgery: '请选择手术项目。',
    sms: '请同意接收短信通知。',
    privacy: '请同意个人信息收集与使用。',
    fail: '提交失败，请稍后重试。',
    ok: '您的咨询已收到，我们将通过您选择的咨询方式尽快与您联系。',
    captcha: '人机验证未通过，请重试。'
  };

  var CAPTCHA_SELECTOR = '.h-captcha[data-captcha="true"]';

  function txt(el) { return (el ? el.textContent : '').replace(/\s+/g, ' ').trim(); }

  /* 读取 hCaptcha 令牌：Web3Forms 开启垃圾防护后，提交必须携带该令牌。
     验证框已改为 invisible（不可见）模式，不再常驻遮挡首屏 banner。 */
  function readToken() {
    if (window.hcaptcha && typeof window.hcaptcha.getResponse === 'function') {
      try { var t = window.hcaptcha.getResponse(); if (t) return t; } catch (e) { /* ignore */ }
    }
    var hidden = document.querySelector('textarea[name="h-captcha-response"], input[name="h-captcha-response"]');
    return hidden && hidden.value ? hidden.value : '';
  }

  /* invisible 模式没有可点击的勾选框，需在提交时主动调用 hcaptcha.execute() 取令牌；
     若风控判定需要挑战，只会临时弹出一次验证浮层，完成后即消失，不会永久遮住页面。 */
  function ensureToken(cb) {
    var el = document.querySelector(CAPTCHA_SELECTOR);
    if (!el || !window.hcaptcha) { cb(''); return; }
    var cur = readToken();
    if (cur) { cb(cur); return; }
    var p;
    try { p = window.hcaptcha.execute(null, { async: true }); } catch (e) { p = null; }
    if (p && typeof p.then === 'function') {
      var settled = false;
      var finish = function (t) { if (settled) return; settled = true; cb(t || readToken() || ''); };
      /* 兜底：若 hCaptcha 因网络等原因长时间不返回，10 秒后按「验证未通过」处理，避免按钮一直卡在禁用态 */
      var to = setTimeout(function () { finish(''); }, 10000);
      p.then(function (d) { clearTimeout(to); finish((d && d.response) || ''); })
        .catch(function () { clearTimeout(to); finish(''); });
      return;
    }
    var n = 0, iv = setInterval(function () {
      n++;
      var t = readToken();
      if (t || n >= 40) { clearInterval(iv); cb(t || ''); }
    }, 150);
  }

  /* 找到按钮所属的预约表单区域（含 Name 输入框的最近祖先） */
  function scopeOf(btn) {
    var el = btn;
    while (el && el !== document.body) {
      if (el.querySelector && (el.querySelector('input[placeholder="Name"]') || el.querySelector('input[placeholder="姓名"]'))) return el;
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
    close.setAttribute('aria-label', '关闭');
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
    var nameEl = scope.querySelector('input[placeholder="Name"]') || scope.querySelector('input[placeholder="姓名"]');
    var idEl = scope.querySelector('input[placeholder="Messenger id"]') || scope.querySelector('input[placeholder="客服 id"]') || scope.querySelector('input[placeholder="客服账号"]');
    var mBtn = pickDropdown(scope, MESSENGER_LABELS);
    var sBtn = pickDropdown(scope, SURGERY_LABELS);
    return {
      name: nameEl ? nameEl.value : '',
      messengerId: idEl ? idEl.value : '',
      messenger: mBtn ? (mBtn.getAttribute('data-value') || '') : '',
      surgery: sBtn ? (sBtn.getAttribute('data-value') || '') : '',
      consentSms: checked(checkboxByLabel(scope, 'Consent to Receive SMS') || checkboxByLabel(scope, '同意接收短信')),
      consentPrivacy: checked(checkboxByLabel(scope, 'Consent to Collect and Use of Personal Information') || checkboxByLabel(scope, '个人信息收集与使用同意书')),
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
    var cn = !!(scope.querySelector && (scope.querySelector('input[placeholder="姓名"]') || scope.querySelector('input[placeholder="客服账号"]')));
    resetDropdown(f.mBtn, cn ? '在线咨询' : 'Messenger');
    resetDropdown(f.sBtn, cn ? '手术项目' : 'List of Surgeries');
    var boxes = scope.querySelectorAll('[role="checkbox"]');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].setAttribute('aria-checked', 'false');
      boxes[i].style.background = '';
      boxes[i].style.borderColor = '';
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

    if (msg) { showModal('请检查填写内容', msg, '确定', false); return; }

    btn.disabled = true;
    btn.style.opacity = '0.7';

    /* hCaptcha 垃圾防护（invisible 模式）：提交前先取令牌，取不到则不发送请求 */
    ensureToken(function (token) {
      if (!token) {
        btn.disabled = false;
        btn.style.opacity = '';
        showModal('需要完成验证', MSG.captcha, '确定', false);
        return;
      }
      submit(f, token, function (ok) {
        btn.disabled = false;
        btn.style.opacity = '';
        if (ok) {
          resetForm(f, scope);
          if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
            try { window.hcaptcha.reset(); } catch (e) { /* ignore */ }
          }
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'form_submit_booking' });
          showModal('预约成功！', MSG.ok, '关闭', false);
        } else {
          showModal('提交失败', MSG.fail, '关闭', true);
        }
      });
    });
  }

  /* ---------- 中文预约栏（分类页）原生兜底 ----------
     分类页 React 未水合，Radix 的下拉/勾选框点不动，这里用原生 JS 复刻：
     1) 「在线咨询」下拉：弹出 Messenger/KakaoTalk/WhatsApp/LINE，选中后写入 data-value 并更新文案
     2) 「手术项目」下拉：弹出各分类，同上
     3) 两个同意勾选框：点击切换 aria-checked 并显示勾选标记
     4) 「立即预约」提交：复用上面同一套校验 + 提交 + 弹窗逻辑
     仅在中文栏（含「姓名」占位）内生效，不影响首页英文 Book Now 栏。 */
  var CN_OPT = {
    messenger: [['Messenger', 'messenger'], ['KakaoTalk', 'kakao'], ['WhatsApp', 'whatsapp'], ['LINE', 'line']],
    surgery: [
      ['面部轮廓', 'face-contouring'], ['Nose', 'nose'], ['Eye', 'eye'], ['Anti-aging', 'anti-aging'],
      ['Breast Surgery', 'breast'], ['Body Contouring', 'body-contouring'],
      ['Orthognathic Surgery', 'orthognathic-surgery'], ['Middle Age Eye', 'middle-age-eye'],
      ['Male Plastic Surgery', 'male-plastic-surgery']
    ]
  };
  var CN_MSG_DEFAULT = '在线咨询';
  var CN_SUR_DEFAULT = '手术项目';

  var popup = null;
  function closePopup() {
    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
    popup = null;
  }
  function outsideClose() { closePopup(); }

  function openPopup(btn, options, onPick) {
    closePopup();
    var r = btn.getBoundingClientRect();
    var p = document.createElement('div');
    p.setAttribute('data-fs-dd-popup', '1');
    p.style.cssText = 'position:fixed;z-index:90;min-width:' + Math.max(140, r.width) + 'px;left:' + Math.round(r.left) + 'px;top:' + Math.round(r.bottom + 4) + 'px;max-height:280px;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 32px rgba(0,0,0,.18);padding:4px';
    options.forEach(function (o) {
      var it = document.createElement('div');
      it.textContent = o[0];
      it.style.cssText = 'padding:8px 12px;font-size:14px;line-height:1.3;color:#333;border-radius:6px;cursor:pointer;white-space:nowrap';
      it.addEventListener('mouseenter', function () { it.style.background = '#f3f4f6'; });
      it.addEventListener('mouseleave', function () { it.style.background = ''; });
      it.addEventListener('click', function (ev) { ev.stopPropagation(); onPick(o[0], o[1]); closePopup(); });
      p.appendChild(it);
    });
    document.body.appendChild(p);
    popup = p;
    setTimeout(function () { document.addEventListener('click', outsideClose, { once: true }); }, 0);
    window.addEventListener('resize', closePopup, { passive: true });
  }

  function isCNScope(scope) {
    return !!(scope.querySelector && (scope.querySelector('input[placeholder="姓名"]') || scope.querySelector('input[placeholder="客服账号"]')));
  }

  function bindDropdown(b, kind) {
    b.setAttribute('data-fs-dd', kind);
    b.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      openPopup(this, CN_OPT[kind], function (lbl, val) {
        this.setAttribute('data-value', val);
        var s = this.querySelector('span');
        if (s) { s.textContent = lbl; s.classList.remove('text-idh-gray-500'); s.classList.add('text-idh-gray-800'); }
      }.bind(this));
    });
  }

  function bindCheckbox(box) {
    box.setAttribute('data-fs-cb', '1');
    var toggle = function (ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      var on = box.getAttribute('aria-checked') === 'true';
      if (on) {
        box.setAttribute('aria-checked', 'false');
        box.style.background = ''; box.style.borderColor = '';
        var ic = box.querySelector('[data-fs-cb-icon]');
        if (ic && ic.parentNode) ic.parentNode.removeChild(ic);
      } else {
        box.setAttribute('aria-checked', 'true');
        box.style.background = '#0097A4'; box.style.borderColor = '#0097A4';
        if (!box.querySelector('[data-fs-cb-icon]')) {
          var sp = document.createElement('span');
          sp.setAttribute('data-fs-cb-icon', '1');
          sp.textContent = '\u2713';
          sp.style.cssText = 'color:#fff;font-size:12px;font-weight:700;line-height:1;pointer-events:none';
          box.appendChild(sp);
        }
      }
    };
    box.addEventListener('click', toggle);
    var wrap = box.parentElement;
    var lbl = wrap ? wrap.querySelector('span') : null;
    if (lbl) lbl.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); toggle(); });
  }

  function setupCN() {
    var btns = document.querySelectorAll('button[aria-haspopup="dialog"]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.getAttribute('data-fs-dd')) continue;
      var label = txt(b.querySelector('span'));
      var kind = label === CN_MSG_DEFAULT ? 'messenger' : (label === CN_SUR_DEFAULT ? 'surgery' : null);
      if (!kind) continue;
      if (!isCNScope(scopeOf(b))) continue;
      bindDropdown(b, kind);
    }
    var boxes = document.querySelectorAll('[role="checkbox"]');
    for (var k = 0; k < boxes.length; k++) {
      var box = boxes[k];
      if (box.getAttribute('data-fs-cb')) continue;
      var wrap = box.parentElement;
      var sp = wrap ? wrap.querySelector('span') : null;
      if (!sp) continue;
      var t = txt(sp);
      if (t !== '同意接收短信' && t !== '个人信息收集与使用同意书') continue;
      bindCheckbox(box);
    }
  }

  function bind() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.getAttribute('data-fs-book') === '1') continue;
      var label = txt(b);
      if (label !== 'Book Now' && label !== '立即预约') continue;
      if (scopeOf(b) === document.body) continue;
      b.setAttribute('data-fs-book', '1');
      b.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); onSubmit(this); });
    }
    setupCN();
  }

  /* 把共享的 hCaptcha 组件移入当前可见的预约条内（桌面 / 移动两条预约条共用同一个验证组件） */
  function placeCaptcha() {
    var wrap = document.querySelector('[data-fs-hero-captcha]');
    if (!wrap) return;
    var slots = document.querySelectorAll('[data-fs-captcha-slot]');
    if (!slots.length) return;
    var target = null;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].getClientRects().length) { target = slots[i]; break; }
    }
    if (!target) target = slots[0];
    if (wrap.parentNode !== target) target.appendChild(wrap);
  }

  var placeTimer = null;
  function schedulePlace() {
    if (placeTimer) clearTimeout(placeTimer);
    placeTimer = setTimeout(placeCaptcha, 120);
  }

  var busy = false;
  function init() {
    bind();
    placeCaptcha();
    setTimeout(placeCaptcha, 300);
    setTimeout(placeCaptcha, 1200);
    window.addEventListener('load', placeCaptcha);
    window.addEventListener('resize', schedulePlace, { passive: true });
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