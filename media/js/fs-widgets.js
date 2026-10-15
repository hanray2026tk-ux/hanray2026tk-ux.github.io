/* fs-widgets.js — 凡是与美 静态站共享交互组件（幂等，全站通用）
 * 覆盖：① FAQ 问答展开（纯 CSS）② 底部预约栏：两个下拉、勾选框、立即预约（方案B：前端模拟成功弹窗）
 * 定位方式：结构锚点（文案/placeholder），不依赖 Radix 随机 id，桌面/移动两套容器同时绑定。
 * 用法：页面 </body> 前插入 <script src="../..{depth}media/js/fs-widgets.js" defer></script>
 */
(function () {
  if (window.__FS_WIDGETS__) { return; }
  window.__FS_WIDGETS__ = true;

  var MSG_OPTS = [
    { label: 'KakaoTalk', value: 'kakao' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'LINE', value: 'line' }
  ];
  // 手术项目选项：中文措辞与全站导航「整形外科」子菜单完全一致；value 为英文 slug（不可见，逻辑用）
  var SURG_OPTS = [
    { label: '面部轮廓', value: 'face-contouring' },
    { label: '鼻子', value: 'nose' },
    { label: '眼睛', value: 'eye' },
    { label: '抗衰老', value: 'anti-aging' },
    { label: '乳房手术', value: 'breast' },
    { label: '塑形', value: 'body-contouring' },
    { label: '正颌手术', value: 'orthognathic-surgery' },
    { label: '牙科', value: 'dentistry' },
    { label: '中年眼', value: 'middle-age-eye' },
    { label: '男性整形手术', value: 'male-plastic-surgery' }
  ];

  var CSS = [
    '#faq details>summary{list-style:none;cursor:pointer}',
    '#faq details>summary::-webkit-details-marker{display:none}',
    '#faq details>summary>span:last-child{transition:transform .3s ease-in-out}',
    '#faq details[open]>div.grid{grid-template-rows:1fr!important;opacity:1!important}',
    '#faq details[open]>summary>span:last-child{transform:rotate(45deg)}',
    '.fs-dd-panel{position:fixed;left:0;top:0;z-index:90;background:#fff;border:1px solid #e5e7eb;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.18);max-height:264px;overflow:auto;display:none;text-align:left}',
    '.fs-dd-panel.fs-open{display:block}',
    '.fs-dd-item{padding:10px 14px;font-size:14px;line-height:1.35;color:#374151;cursor:pointer;white-space:nowrap}',
    '.fs-dd-item:hover{background:#f3f4f6}',
    '.fs-dd-item.fs-sel{background:#eef9fa;color:#0097A4;font-weight:600}',
    '.fs-modal-mask{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;padding:20px}',
    '.fs-modal-mask.fs-open{display:flex}',
    '.fs-modal{background:#fff;border-radius:12px;max-width:380px;width:100%;padding:28px 24px 20px;position:relative;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}',
    '.fs-modal h3{margin:0;font-size:20px;font-weight:600;line-height:1.3;color:#111827}',
    '.fs-modal p{margin:10px 0 0;font-size:14px;line-height:1.55;color:#4b5563}',
    '.fs-modal .fs-x{position:absolute;right:10px;top:8px;background:none;border:0;font-size:22px;line-height:1;color:#9ca3af;cursor:pointer}',
    '.fs-modal .fs-ok{margin-top:18px;width:100%;height:44px;border:0;border-radius:8px;background:#003984;color:#fff;font-size:15px;cursor:pointer}',
    '.fs-invalid{box-shadow:0 0 0 2px #f87171!important}',
    '.fs-check{color:#fff;font-size:12px;line-height:1;font-style:normal}'
  ].join('');

  function txt(el) { return (el.textContent || '').replace(/\s+/g, ''); }

  function injectCss() {
    if (document.getElementById('fs-widgets-css')) { return; }
    var st = document.createElement('style');
    st.id = 'fs-widgets-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // ---------- 下拉（浮层挂 body + fixed 定位，避免被父容器裁剪） ----------
  var panels = [];
  function closeAll() {
    panels.forEach(function (p) {
      p.el.classList.remove('fs-open');
      p.btn.setAttribute('aria-expanded', 'false');
    });
  }

  function place(rec) {
    var b = rec.btn.getBoundingClientRect();
    var el = rec.el;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var pw = rec.btn.parentElement ? rec.btn.parentElement.getBoundingClientRect().width : 0;
    var w = Math.max(b.width, Math.min(pw, 360), 160);
    el.style.width = w + 'px';
    el.style.left = Math.round(Math.max(8, Math.min(b.left, vw - w - 8))) + 'px';
    var hh = el.offsetHeight;
    if (b.top >= hh + 8) { el.style.top = Math.round(b.top - hh - 6) + 'px'; }
    else if (vh - b.bottom >= hh + 8) { el.style.top = Math.round(b.bottom + 6) + 'px'; }
    else { el.style.top = Math.max(8, Math.round(vh - hh - 8)) + 'px'; }
  }

  function reposition() {
    panels.forEach(function (p) { if (p.el.classList.contains('fs-open')) { place(p); } });
  }

  function buildPanel(btn, opts) {
    var panel = document.createElement('div');
    panel.className = 'fs-dd-panel';
    panel.setAttribute('role', 'listbox');
    opts.forEach(function (o) {
      var it = document.createElement('div');
      it.className = 'fs-dd-item';
      it.setAttribute('role', 'option');
      it.textContent = o.label;
      it.setAttribute('data-value', o.value);
      it.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var lab = btn.querySelector('span.line-clamp-1') || btn.querySelector('span');
        if (lab) { lab.textContent = o.label; }
        btn.setAttribute('data-fs-value', o.value);
        panel.querySelectorAll('.fs-dd-item').forEach(function (x) { x.classList.remove('fs-sel'); });
        it.classList.add('fs-sel');
        closeAll();
      });
      panel.appendChild(it);
    });
    document.body.appendChild(panel);
    var rec = { btn: btn, el: panel };
    panels.push(rec);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var isOpen = panel.classList.contains('fs-open');
      closeAll();
      if (!isOpen) {
        panel.classList.add('fs-open');
        btn.setAttribute('aria-expanded', 'true');
        place(rec);
      }
    });
  }

  function initDropdowns() {
    var btns = document.querySelectorAll('button[aria-haspopup="dialog"]');
    for (var i = 0; i < btns.length; i++) {
      var t = txt(btns[i]);
      if (t === '在线咨询') { buildPanel(btns[i], MSG_OPTS); }
      else if (t === '手术项目' || t === '手术目录') { buildPanel(btns[i], SURG_OPTS); }
    }
  }

  // 预约栏定位：向上找「含姓名输入框」的容器（全部 61 个页面均为 姓名 或 Name）
  var NAME_SEL = 'input[placeholder="姓名"],input[placeholder="Name"]';
  function barOf(el) {
    var n = el;
    for (var k = 0; k < 10 && n; k++) {
      n = n.parentElement;
      if (!n) { break; }
      if (n.querySelector && n.querySelector(NAME_SEL)) { return n; }
    }
    return null;
  }

  // ---------- 勾选框（只绑预约栏内的，避免影响其它页面的勾选框） ----------
  function initCheckboxes() {
    document.querySelectorAll('div[role="checkbox"]').forEach(function (cb) {
      if (!barOf(cb)) { return; }
      cb.addEventListener('click', function (ev) {
        ev.preventDefault();
        var on = cb.getAttribute('aria-checked') === 'true';
        cb.setAttribute('aria-checked', on ? 'false' : 'true');
        cb.style.backgroundColor = on ? '#ffffff' : '#0097A4';
        cb.style.borderColor = on ? 'rgba(255,255,255,.7)' : '#0097A4';
        cb.classList.remove('fs-invalid');
        var ic = cb.querySelector('.fs-check');
        if (!on) {
          if (!ic) { ic = document.createElement('i'); ic.className = 'fs-check'; ic.textContent = '\u2713'; cb.appendChild(ic); }
        } else if (ic) { ic.remove(); }
      });
    });
  }

  // ---------- 成功弹窗（方案B） ----------
  var modalEl = null;
  function hideModal() { if (modalEl) { modalEl.classList.remove('fs-open'); } }
  function showModal() {
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.className = 'fs-modal-mask';
      modalEl.innerHTML =
        '<div class="fs-modal" role="dialog" aria-modal="true">' +
        '<button type="button" class="fs-x" aria-label="关闭">\u00d7</button>' +
        '<h3>谢谢！</h3>' +
        '<p>您的预约已提交，我们会尽快通过您选择的渠道与您联系。</p>' +
        '<button type="button" class="fs-ok">关闭</button>' +
        '</div>';
      document.body.appendChild(modalEl);
      modalEl.addEventListener('click', function (e) { if (e.target === modalEl) { hideModal(); } });
      modalEl.querySelector('.fs-x').addEventListener('click', hideModal);
      modalEl.querySelector('.fs-ok').addEventListener('click', hideModal);
    }
    modalEl.classList.add('fs-open');
  }

  // ---------- 立即预约 ----------
  function initSubmit() {
    document.querySelectorAll('button').forEach(function (btn) {
      if (txt(btn) !== '立即预约') { return; }
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var bar = barOf(btn) || document.body;
        var name = bar.querySelector(NAME_SEL);
        var boxes = bar.querySelectorAll('div[role="checkbox"]');
        var privacy = boxes.length ? boxes[boxes.length - 1] : null;
        var ok = true;
        if (name && !name.value.trim()) { name.classList.add('fs-invalid'); ok = false; }
        else if (name) { name.classList.remove('fs-invalid'); }
        if (privacy && privacy.getAttribute('aria-checked') !== 'true') { privacy.classList.add('fs-invalid'); ok = false; }
        else if (privacy) { privacy.classList.remove('fs-invalid'); }
        if (!ok) { return; }
        showModal();
      });
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); }
    else { fn(); }
  }

  ready(function () {
    injectCss();
    // fs-widgets.js 以 defer 加载，一定在 fs-hero-book.js 之后执行；
    // 若页面已引入 fs-hero-book.js，预约栏（下拉/勾选框/立即预约）统一由它接管，
    // 此处不再重复绑定，否则同一控件会被绑定两次（弹出两个下拉、勾选状态互相抵消）。
    if (document.querySelector('script[src*="fs-hero-book"]')) { return; }
    initDropdowns();
    initCheckboxes();
    initSubmit();
    document.addEventListener('click', closeAll);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  });
})();
