/* FANSHI online-consultation write form interactions (native fallback) */
(function () {
  'use strict';

  /* ===== Web3Forms 配置：与价格咨询页共用同一个 access key（可在后台单独建表单后替换） ===== */
  var WEB3FORMS_KEY = '51d963eb-9294-4b37-b736-184a307f60a8';

  /* 顶级手术分类（来自原站 /api/v1/surgery-categories 中 depth=1 的项，按 sort_order 排序） */
  var CATEGORIES = [
    { value: 'face-contouring',      label: '面部轮廓' },
    { value: 'nose',                 label: '鼻部整形' },
    { value: 'orthognathic-surgery', label: '正颌手术' },
    { value: 'eye',                  label: '眼部整形' },
    { value: 'middle-age-eye',       label: '中年眼部整形' },
    { value: 'anti-aging',           label: '抗衰老' },
    { value: 'breast',               label: '胸部整形' },
    { value: 'body-contouring',      label: '身体塑形' },
    { value: 'male-plastic-surgery', label: '男性整形' }
  ];
  var CATEGORIES_EN = [
    { value: 'face-contouring',      label: 'Facial Contouring' },
    { value: 'nose',                 label: 'Nose' },
    { value: 'orthognathic-surgery', label: 'Orthognathic Surgery' },
    { value: 'eye',                  label: 'Eyes' },
    { value: 'middle-age-eye',       label: 'Middle-Age Eyes' },
    { value: 'anti-aging',           label: 'Anti-Aging' },
    { value: 'breast',               label: 'Breast Surgery' },
    { value: 'body-contouring',      label: 'Body Contouring' },
    { value: 'male-plastic-surgery', label: 'Male Plastic Surgery' }
  ];

  var IS_EN = /^\/en(\/|$)/.test(location.pathname) || /^en/i.test(document.documentElement.lang || '');
  var T = IS_EN ? {
    submit: 'Write', submitting: 'Submitting...', ok: 'OK',
    msgPlaceholder: 'Please enter your content',
    uploadHint: 'To send photos or documents, please contact us via <a href="https://wa.me/8618667872626" target="_blank" rel="noopener">WhatsApp</a>.',
    namePlaceholder: 'Enter your name',
    titlePlaceholder: 'Enter a title',
    errName: 'Please enter your name.',
    errCategory: 'Please choose a consultation category.',
    errTitle: 'Please enter a title.',
    errMessage: 'Please enter your message.',
    errPassword: 'Please enter a password.',
    errPasswordLen: 'Password must be at least 8 characters.',
    checkTitle: 'Please check your input',
    noticeTitle: 'Notice',
    noticeBody: 'This site is static and the form backend is not connected, so your message was not actually sent.',
    successTitle: 'Submitted',
    successBody: 'Your consultation has been submitted successfully. We will contact you soon.',
    failTitle: 'Submission failed',
    failBody: 'Submission failed. Please try again later.',
    failBody2: 'Submission failed. Please try again.',
    networkBody: 'Network error. Please check your connection and try again.'
  } : {
    submit: '撰写', submitting: '提交中...', ok: '确定',
    msgPlaceholder: '请输入内容',
    uploadHint: '如需发送照片或资料，请通过 <a href="https://wa.me/8618667872626" target="_blank" rel="noopener">WhatsApp</a> 联系我们。',
    namePlaceholder: '请输入姓名',
    titlePlaceholder: '请输入标题',
    errName: '请输入姓名。',
    errCategory: '请选择咨询分类。',
    errTitle: '请输入标题。',
    errMessage: '请输入咨询内容。',
    errPassword: '请输入密码。',
    errPasswordLen: '密码至少需要 8 个字符。',
    checkTitle: '请检查填写内容',
    noticeTitle: '提示',
    noticeBody: '当前为静态站点，表单后端尚未连接，您的留言未实际发送。',
    successTitle: '提交成功',
    successBody: '您的在线咨询已提交成功，我们会尽快与您联系。',
    failTitle: '提交失败',
    failBody: '提交失败，请稍后重试。',
    failBody2: '提交失败，请重试。',
    networkBody: '网络异常，请检查网络连接后重试。'
  };

  var css = ''
    + '.fx-hidden{display:none !important}'
    + '.fx-cat-wrap{position:relative}'
    + '.fx-cat-panel{position:absolute;left:0;top:calc(100% + 4px);z-index:90;width:100%;background:#fff;border:1px solid #e5e5e5;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.12);max-height:280px;overflow:auto}'
    + '.fx-cat-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 16px;font-size:14px;color:#333;cursor:pointer}'
    + '.fx-cat-item:hover{background:#f6f6f6}'
    + '.fx-cat-item .fx-ck{color:#003984;font-weight:700;visibility:hidden}'
    + '.fx-cat-item[aria-selected="true"] .fx-ck{visibility:visible}'
    + '.fx-checked{background-color:#000f24 !important;border-color:#000f24 !important}'
    + '.fx-check-mark{display:flex;align-items:center;justify-content:center;width:100%;height:100%}'
    + '.fx-editor{display:block;width:100%;min-height:240px;box-sizing:border-box;border:0;outline:0;padding:12px;background:transparent;color:#333;font:inherit;font-size:15px;line-height:1.7;resize:vertical}'
    + '.fx-editor::placeholder{color:#9a9a9a}'
    + '.fx-upload-hint{font-size:13px;color:#666;margin-top:8px;line-height:1.6}'
    + '.fx-upload-hint a{color:#003984;text-decoration:underline}'
    + '.fx-invalid{border-color:#f87171 !important;box-shadow:0 0 0 3px rgba(248,113,113,.35) !important}'
    + '.fx-err{color:#dc2626;font-size:13px;margin-top:6px}'
    + '.fx-modal-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.fx-modal{background:#fff;border-radius:12px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25)}'
    + '.fx-modal-title{font-size:18px;font-weight:700;color:#1c1c1c;margin-bottom:8px}'
    + '.fx-modal-body{font-size:15px;color:#444;line-height:1.7;margin-bottom:20px;word-break:break-word}'
    + '.fx-modal-btn{display:block;width:100%;height:48px;border-radius:8px;background:#003984;color:#fff;font-size:16px;font-weight:600;border:0;cursor:pointer}'
    + '.fx-modal-btn:hover{opacity:.92}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function mk(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function $(sel, root) { return (root || document).querySelector(sel); }

  function showModal(title, bodyHtml, okText) {
    var mask = mk('div', 'fx-modal-mask');
    var box = mk('div', 'fx-modal');
    box.innerHTML = '<div class="fx-modal-title"></div><div class="fx-modal-body"></div>';
    box.querySelector('.fx-modal-title').textContent = title;
    box.querySelector('.fx-modal-body').innerHTML = bodyHtml;
    var act = mk('div');
    var ok = mk('button', 'fx-modal-btn'); ok.type = 'button'; ok.textContent = okText || T.ok;
    ok.addEventListener('click', function () { mask.remove(); });
    act.appendChild(ok); box.appendChild(act); mask.appendChild(box);
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
    ok.focus();
  }

  /* ---------- 字段错误标记 ---------- */
  function fieldGroupOf(el) { var n = el; while (n && n.getAttribute) { if (n.getAttribute('data-slot') === 'field') return n; n = n.parentElement; } return null; }
  function markInvalid(el, msg) {
    var g = fieldGroupOf(el) || el.parentElement;
    if (g) {
      if (el && el.classList) el.classList.add('fx-invalid');
      if (!g.querySelector('.fx-err')) g.appendChild(mk('p', 'fx-err', msg));
    }
  }
  function clearErrors() {
    Array.prototype.forEach.call(document.querySelectorAll('.fx-invalid'), function (n) { n.classList.remove('fx-invalid'); });
    Array.prototype.forEach.call(document.querySelectorAll('.fx-err'), function (n) { n.remove(); });
  }

  /* ---------- 1) 「保密」复选框 ---------- */
  var privacyCb = $('[role="checkbox"]');
  (function () {
    if (!privacyCb) return;
    function setCb(on) {
      privacyCb.setAttribute('aria-checked', on ? 'true' : 'false');
      privacyCb.setAttribute('data-state', on ? 'checked' : 'unchecked');
      if (on) {
        privacyCb.classList.add('fx-checked');
        if (!privacyCb.querySelector('.fx-check-mark')) {
          privacyCb.insertAdjacentHTML('beforeend', '<span class="fx-check-mark"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>');
        }
      } else {
        privacyCb.classList.remove('fx-checked');
        var m = privacyCb.querySelector('.fx-check-mark'); if (m) m.remove();
      }
    }
    function toggle() { setCb(privacyCb.getAttribute('aria-checked') !== 'true'); }
    privacyCb.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    var lblId = privacyCb.getAttribute('aria-labelledby');
    var span = lblId ? document.getElementById(lblId) : null;
    if (span) span.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
  })();

  /* ---------- 2) 「选择分类」下拉 ---------- */
  var selectedCategory = null;
  var catBtn = $('button[aria-haspopup="dialog"][aria-controls^="radix-"]');
  (function () {
    if (!catBtn) return;
    var catLabel = catBtn.querySelector('span');
    var host = catBtn.parentElement;
    if (host) host.classList.add('fx-cat-wrap');
    var panel = mk('div', 'fx-cat-panel fx-hidden');
    panel.setAttribute('role', 'listbox');
    (IS_EN ? CATEGORIES_EN : CATEGORIES).forEach(function (c) {
      var it = mk('div', 'fx-cat-item');
      it.setAttribute('role', 'option');
      it.setAttribute('data-value', c.value);
      it.setAttribute('aria-selected', 'false');
      it.innerHTML = '<span>' + c.label + '</span><span class="fx-ck">&#10003;</span>';
      it.addEventListener('click', function () { selectCategory(c); });
      panel.appendChild(it);
    });
    if (host) host.appendChild(panel);

    function selectCategory(c) {
      selectedCategory = c;
      if (catLabel) catLabel.textContent = c.label;
      Array.prototype.forEach.call(panel.querySelectorAll('.fx-cat-item'), function (it) {
        it.setAttribute('aria-selected', it.getAttribute('data-value') === c.value ? 'true' : 'false');
      });
      closePanel(); clearErrors();
    }
    function openPanel() { panel.classList.remove('fx-hidden'); catBtn.setAttribute('aria-expanded', 'true'); }
    function closePanel() { panel.classList.add('fx-hidden'); catBtn.setAttribute('aria-expanded', 'false'); }
    catBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (panel.classList.contains('fx-hidden')) openPanel(); else closePanel();
    });
    document.addEventListener('click', function (e) { if (host && !host.contains(e.target)) closePanel(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
  })();

  /* ---------- 3) 内容编辑器（原为依赖 JS 的富文本，替换为原生文本域） ---------- */
  var msgArea = null;
  (function () {
    var box = $('div[style*="min-height:240px"]');
    if (!box) return;
    msgArea = mk('textarea', 'fx-editor');
    msgArea.setAttribute('placeholder', T.msgPlaceholder);
    box.appendChild(msgArea);
  })();

  /* ---------- 4) 附件上传入口：免费版 Web3Forms 不支持，隐藏并引导走 WhatsApp ---------- */
  var fileInputs = document.querySelectorAll('input[type="file"]');
  Array.prototype.forEach.call(fileInputs, function (inp) {
    var wrap = fieldGroupOf(inp) || inp.parentElement;
    if (!wrap || document.querySelector('.fx-upload-hint')) return;
    wrap.classList.add('fx-hidden');
    var hint = mk('p', 'fx-upload-hint', T.uploadHint);
    if (wrap.parentElement) wrap.parentElement.insertBefore(hint, wrap.nextSibling);
  });

  /* ---------- 5) 「撰写」提交 ---------- */
  (function () {
    var submitBtn = null, all = document.querySelectorAll('button');
    for (var i = 0; i < all.length; i++) { if (all[i].textContent.trim() === T.submit) { submitBtn = all[i]; break; } }
    if (!submitBtn) return;

    var nameEl = $('input[placeholder="' + T.namePlaceholder + '"]');
    var titleEl = $('input[placeholder="' + T.titlePlaceholder + '"]');
    var pwdEl = $('input[type="password"]');

    function setBusy(on) {
      submitBtn.disabled = !!on;
      submitBtn.style.opacity = on ? '.6' : '';
      submitBtn.textContent = on ? T.submitting : T.submit;
    }

    submitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearErrors();

      var name = nameEl ? nameEl.value.trim() : '';
      var title = titleEl ? titleEl.value.trim() : '';
      var msg = msgArea ? msgArea.value.trim() : '';
      var pwd = pwdEl ? pwdEl.value : '';
      var isPrivate = privacyCb ? (privacyCb.getAttribute('aria-checked') === 'true') : false;

      /* 校验顺序与原站一致，命中即提示并中止 */
      var err = null;
      if (!name) { err = T.errName; markInvalid(nameEl, err); }
      else if (!selectedCategory) { err = T.errCategory; markInvalid(catBtn, err); }
      else if (!title) { err = T.errTitle; markInvalid(titleEl, err); }
      else if (!msg) { err = T.errMessage; markInvalid(msgArea, err); }
      else if (!pwd) { err = T.errPassword; markInvalid(pwdEl, err); }
      else if (pwd.length < 8) { err = T.errPasswordLen; markInvalid(pwdEl, err); }
      if (err) { showModal(T.checkTitle, err, T.ok); return; }

      if (!WEB3FORMS_KEY) {
        showModal(T.noticeTitle, T.noticeBody, T.ok);
        return;
      }

      setBusy(true);
      var fd = new FormData();
      fd.append('access_key', WEB3FORMS_KEY);
      fd.append('subject', 'Online Consultation - ' + name);
      fd.append('from_name', 'FANSHI Website');
      fd.append('name', name);
      fd.append('category', selectedCategory.label + ' (' + selectedCategory.value + ')');
      fd.append('title', title);
      fd.append('message', msg);
      fd.append('is_private', isPrivate ? 'true' : 'false');

      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          setBusy(false);
          if (res && res.success) {
            showModal(T.successTitle, T.successBody, T.ok);
          } else {
            showModal(T.failTitle, (res && res.message) ? T.failBody : T.failBody2, T.ok);
          }
        })
        .catch(function () {
          setBusy(false);
          showModal(T.failTitle, T.networkBody, T.ok);
        });
    });
  })();

  /* ---------- 6) 浮动「咨询」菜单展开/收起 ---------- */
  (function () {
    var mMenu = document.getElementById('floating-inquiry-menu-mobile');
    if (mMenu) {
      var mBtn = mMenu.previousElementSibling;
      var open = function () { mMenu.classList.remove('hidden'); mMenu.classList.add('flex'); if (mBtn) mBtn.setAttribute('aria-expanded', 'true'); };
      var close = function () { mMenu.classList.add('hidden'); mMenu.classList.remove('flex'); if (mBtn) mBtn.setAttribute('aria-expanded', 'false'); };
      if (mBtn) mBtn.addEventListener('click', function (e) { e.preventDefault(); mMenu.classList.contains('hidden') ? open() : close(); });
      var cbtn = mMenu.querySelector('button[aria-label="关闭咨询菜单"], button[aria-label="Close consultation menu"]');
      if (cbtn) cbtn.addEventListener('click', function (e) { e.preventDefault(); close(); });
    }
    var dNav = document.querySelector('nav[aria-label="咨询菜单"], nav[aria-label="Consultation menu"]');
    if (dNav) {
      var dBtn = dNav.previousElementSibling;
      if (dBtn) dBtn.addEventListener('click', function (e) {
        e.preventDefault();
        dNav.style.display = (dNav.style.display === 'flex') ? 'none' : 'flex';
      });
      document.addEventListener('click', function (e) {
        if (dNav.style.display === 'flex' && !dNav.contains(e.target) && e.target !== dBtn) dNav.style.display = 'none';
      });
    }
  })();

  /* ---------- 8) 头部语言切换下拉（地球图标按钮） ---------- */
  (function () {
    var btns = document.querySelectorAll('button.global-btn');
    Array.prototype.forEach.call(btns, function (btn) {
      var panel = btn.nextElementSibling;
      if (!panel) return;
      var open = function () {
        panel.classList.remove('hidden');
        Array.prototype.forEach.call(btns, function (b) {
          if (b !== btn) { var p = b.nextElementSibling; if (p) p.classList.add('hidden'); }
        });
      };
      var close = function () { panel.classList.add('hidden'); };
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (panel.classList.contains('hidden')) open(); else close();
      });
      document.addEventListener('click', function (e) {
        if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== btn) close();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    });
  })();

  /* ---------- 7) 页脚地图分类标签（全部 / 凡是与美）选中态切换 ---------- */
  (function () {
    var ACTIVE = ['lg:bg-idh-primary-05', 'lg:text-white', 'font-semibold'];
    var INACTIVE = ['text-idh-gray-600', 'lg:bg-gray-100', 'lg:hover:bg-gray-50'];
    function setTab(btn, on) {
      ACTIVE.forEach(function (c) { btn.classList[on ? 'add' : 'remove'](c); });
      INACTIVE.forEach(function (c) { btn.classList[on ? 'remove' : 'add'](c); });
    }
    Array.prototype.forEach.call(document.querySelectorAll('button'), function (b) {
      var t = b.textContent.trim();
      if (t === '全部' || t === '凡是与美') {
        b.addEventListener('click', function (e) {
          e.preventDefault();
          var group = b.parentElement; if (!group) return;
          Array.prototype.forEach.call(group.children, function (sib) {
            if (sib.tagName === 'BUTTON') setTab(sib, sib === b);
          });
        });
      }
    });
  })();

})();