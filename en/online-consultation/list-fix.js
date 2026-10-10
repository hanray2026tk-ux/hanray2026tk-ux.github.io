/* eslint-disable */
/*
 * 在线咨询 · 列表页原生兜底
 * 目的：镜像站为静态导出，页面上的「分类筛选标签 / 帖子列表 / 分页」原本由
 * 浏览器加载后由 JS 调原站接口动态渲染，镜像站缺失。此脚本用原生 JS 在本地
 * 复原原站加载完成后的最终形态（11 个分类标签 + 帖子表格 + 移动端卡片 + 分页）。
 * 数据取自原站接口 /api/v1/consultations/online（共 22 条）与 /api/v1/surgery-categories。
 */
(function () {
  'use strict';

  var SPRITE = '../../en/icons/sprite.svg';
  var PER_PAGE = 12;

  var CATS = [
    { v: 'all', label: '全部' },
    { v: 'face-contouring', label: '面部轮廓' },
    { v: 'nose', label: '鼻子' },
    { v: 'ent-nose', label: '鼻科耳鼻喉科' },
    { v: 'orthognathic-surgery', label: '正颌手术' },
    { v: 'eye', label: '眼睛' },
    { v: 'middle-age-eye', label: '中年眼' },
    { v: 'anti-aging', label: '抗衰老' },
    { v: 'breast', label: '乳房手术' },
    { v: 'body-contouring', label: '塑形' },
    { v: 'male-plastic-surgery', label: '男性整形手术' }
  ];
  var CATLABEL = {};
  for (var ci = 0; ci < CATS.length; ci++) CATLABEL[CATS[ci].v] = CATS[ci].label;

  // 原站真实帖子（No 为原站展示编号；p=保密 is_private；r=已回复 has_reply；c=分类 slug）
  var POSTS = [
    { n: 22, c: 'male-plastic-surgery', t: 'What course of action for me?', a: 'J*', d: '2026-10-05', p: false, r: true },
    { n: 21, c: 'male-plastic-surgery', t: 'Face assesment', a: 'P************', d: '2026-10-05', p: true, r: true },
    { n: 20, c: 'nose', t: 'Nose and under eye', a: 'R*', d: '2026-09-15', p: false, r: true },
    { n: 19, c: 'nose', t: 'Nose and FACE', a: 'R*', d: '2026-09-15', p: true, r: true },
    { n: 18, c: 'orthognathic-surgery', t: 'Whole face surgery', a: 'A*****', d: '2026-09-02', p: false, r: true },
    { n: 17, c: 'face-contouring', t: 'test', a: 't***', d: '2026-08-10', p: false, r: false },
    { n: 16, c: 'face-contouring', t: 'Facial Feminization & Body Contouring Surgery - Long-term PlanningBody', a: 'J***********************', d: '2026-08-04', p: true, r: true },
    { n: 15, c: 'orthognathic-surgery', t: 'Requesting online consultation to explain about mild mandibular deficiency-Bone surgery and not soft tissue procedures', a: 'A*******', d: '2026-07-31', p: true, r: false },
    { n: 14, c: 'orthognathic-surgery', t: 'test', a: 't***', d: '2026-07-30', p: false, r: false },
    { n: 13, c: 'eye', t: 'Online Consultation Requested', a: 'D**********', d: '2026-07-28', p: false, r: false },
    { n: 12, c: 'orthognathic-surgery', t: 'Enquiry about pricing', a: 'T*************', d: '2026-07-22', p: true, r: false },
    { n: 11, c: 'face-contouring', t: '제 이름은 이링이고 중국어와 영어를 모두 구사합니다. 가능한 한 빨리 눈썹뼈 축소 수술을 통해 안면 여성화를 이루고 싶습니다. 도움 주셔서 감사합니다.', a: 'Y*****', d: '2026-07-18', p: false, r: false },
    { n: 10, c: 'face-contouring', t: 'Need consultation ASAP', a: 'K*************', d: '2026-07-14', p: false, r: false },
    { n: 9, c: 'face-contouring', t: 'Surgery - Bianca and Vera', a: 'B***********', d: '2026-07-12', p: true, r: true },
    { n: 8, c: 'face-contouring', t: 'Surgery - Bianca and Vera', a: 'B***********', d: '2026-07-12', p: true, r: false },
    { n: 7, c: 'body-contouring', t: 'test', a: 't***', d: '2026-07-08', p: false, r: false },
    { n: 6, c: 'orthognathic-surgery', t: 'test', a: 't***', d: '2026-07-07', p: false, r: false },
    { n: 5, c: 'orthognathic-surgery', t: 'test', a: 't***', d: '2026-07-07', p: true, r: false },
    { n: 4, c: 'orthognathic-surgery', t: 'test', a: 't***', d: '2026-07-06', p: false, r: false },
    { n: 3, c: 'ent-nose', t: 'test', a: 't***', d: '2026-07-06', p: false, r: false },
    { n: 2, c: 'face-contouring', t: 'FFS international patient', a: 'N*********', d: '2026-07-02', p: false, r: false },
    { n: 1, c: 'face-contouring', t: 'Facial Feminization Surgery Consultation (International Patient)', a: 'N*********', d: '2026-07-01', p: false, r: true }
  ];

  var TD = 'align-middle [&:has([role=checkbox])]:pr-0 h-[54px] p-0 px-[16px] text-center';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function icon(name) {
    return '<svg aria-hidden="true" class="inline-block leading-none text-idh-secondary-01 shrink-0" style="width:14px;height:14px"><use href="' + SPRITE + '#' + name + '"></use></svg>';
  }

  function rowHTML(p) {
    var bg = p.r ? ' bg-idh-gray-050' : '';
    var icons = (p.p ? icon('ico-lock') : '') + (p.r ? icon('ico-reply') : '');
    var cat = CATLABEL[p.c] || p.c;
    return '<tr data-fix="1" class="transition-colors border-b border-solid border-idh-gray-200 last:border-b-[1px]' + bg + '">' +
      '<td class="' + TD + '">' + p.n + '</td>' +
      '<td class="' + TD + '"><span class="inline-flex items-center justify-center text-wht font-medium whitespace-nowrap h-[32px] min-h-[32px] px-3 text-xs rounded-[8px] bg-idh-secondary-01">' + esc(cat) + '</span></td>' +
      '<td class="' + TD + '"><button type="button" class="flex min-w-0 items-center gap-2 cursor-pointer w-full text-left">' + icons + '<span class="min-w-0 line-clamp-1 body3 text-idh-gray-900">' + esc(p.t) + '</span></button></td>' +
      '<td class="' + TD + '">' + esc(p.a) + '</td>' +
      '<td class="' + TD + '">' + p.d + '</td>' +
      '</tr>';
  }

  function cardHTML(p) {
    var cat = CATLABEL[p.c] || p.c;
    return '<div class="border-solid border-idh-gray-200 bg-wht p-4 border-0 border-b rounded-none cursor-pointer">' +
      '<button type="button" class="flex flex-col gap-1 w-full text-left">' +
      '<div class="body3 text-idh-secondary-01 font-semibold">' + esc(cat) + '</div>' +
      '<div class="flex items-start gap-2"><div class="line-clamp-1 body1 text-idh-gray-900">' + esc(p.t) + '</div></div>' +
      '<div class="caption2 text-idh-gray-600">' + esc(p.a) + ' | ' + p.d + '</div>' +
      '</button></div>';
  }

  function emptyHTML(kind) {
    var wrapCls = kind === 'mobile'
      ? 'flex min-h-[300px] flex-col items-center justify-center bg-wht px-4 py-12 md:min-h-[500px] md:py-16'
      : 'flex min-h-[500px] flex-col items-center justify-center bg-idh-gray-050 px-4 py-12 md:py-16';
    var inner = '<div class="' + wrapCls + '"><svg aria-hidden="true" class="inline-block shrink-0 leading-none mb-[12px] text-idh-gray-050" style="width:80px;height:80px"><use href="' + SPRITE + '#ico-nodata"></use></svg><p class="caption2 mt-[12px] text-center text-idh-gray-600">暂无帖子</p></div>';
    if (kind === 'mobile') return inner;
    return '<tr data-fix="1" class="transition-colors border-0 hover:bg-transparent"><td class="[&:has([role=checkbox])]:pr-0 h-auto border-b border-solid border-idh-gray-200 p-0 align-middle bg-wht" colspan="5">' + inner + '</td></tr>';
  }

  var state = { cat: 'all', page: 1 };

  function filtered() {
    if (state.cat === 'all') return POSTS;
    return POSTS.filter(function (p) { return p.c === state.cat; });
  }

  /* ---------- element lookup ---------- */
  /* React 水合可能替换/重建节点，所有查询都实时进行 */
  var tablist = null, table = null, tbody = null, mobileWrap = null;

  function q() {
    tablist = document.querySelector('[role="tablist"]');
    table = document.querySelector('table');
    tbody = table ? table.querySelector('tbody') : null;
    mobileWrap = null;
    var divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].classList.contains('md:hidden') && divs[i].classList.contains('block')) {
        mobileWrap = divs[i];
        break;
      }
    }
  }

  /* ---------- tabs ---------- */
  function buildTabs() {
    if (!tablist) return;
    if (tablist.querySelectorAll('button[role="tab"]').length === CATS.length) return;
    var proto = tablist.querySelector('button[role="tab"]');
    var cls = proto ? proto.getAttribute('class') : '';
    var frag = document.createDocumentFragment();
    CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-orientation', 'horizontal');
      b.setAttribute('data-radix-collection-item', '');
      if (cls) b.setAttribute('class', cls);
      b.textContent = c.label;
      b.addEventListener('click', function () {
        state.cat = c.v;
        state.page = 1;
        syncTabs();
        render();
      });
      c.__el = b;
      frag.appendChild(b);
    });
    while (tablist.firstChild) tablist.removeChild(tablist.firstChild);
    tablist.appendChild(frag);
    syncTabs();
  }

  function syncTabs() {
    CATS.forEach(function (c) {
      var b = c.__el;
      if (!b) return;
      var active = c.v === state.cat;
      b.setAttribute('data-state', active ? 'active' : 'inactive');
      b.setAttribute('aria-selected', active ? 'true' : 'false');
      b.id = 'radix-online-trigger-' + c.v;
    });
    updateScrollable();
  }

  function updateScrollable() {
    if (!tablist) return;
    try {
      var over = tablist.scrollWidth > tablist.clientWidth + 1;
      tablist.setAttribute('data-scrollable', over ? 'true' : 'false');
    } catch (e) { /* noop */ }
  }

  /* ---------- table / cards / pagination ---------- */
  var pagi = document.createElement('nav');
  pagi.setAttribute('role', 'navigation');
  pagi.setAttribute('aria-label', 'pagination');
  pagi.className = 'pagination-fix mt-[24px] mx-auto flex w-full justify-center';

  function ensurePagi() {
    if (pagi.parentNode && document.body.contains(pagi)) return;
    var write = document.querySelector('a[href="/en/online-consultation/write"]');
    var host = write && write.parentElement ? write.parentElement : null;
    if (host && host.parentElement) host.parentElement.insertBefore(pagi, host);
  }

  var ARROW = {
    prev: '../../en/icons/ico-gray-arrow-left.svg',
    first: '../../en/icons/ico-gray-arrow-doubleleft.svg',
    last: '../../en/icons/ico-gray-arrow-doubleright.svg',
    next: '../../en/icons/ico-gray-arrow-right.svg'
  };
  var LINKBASE = 'inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:pointer-events-none rounded-full h-[44px] w-[44px] p-0 text-idh-gray-500 hover:text-idh-gray-900 font-normal hover:bg-accent';
  var LINKACTIVE = 'inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:pointer-events-none border-solid border-idh-gray-800 h-[44px] w-[44px] p-0 hover:text-idh-gray-900 font-medium text-idh-gray-900 rounded-none border-0 bg-transparent';

  function arrowLi(kind, disabled, label, target) {
    var cls = LINKBASE + (disabled ? ' pointer-events-none opacity-40' : '');
    var img = '<img alt="" width="12" height="12" aria-hidden="true" src="' + ARROW[kind] + '">';
    var a = '<a class="' + cls + '" aria-label="' + label + '" href="#"' +
      (disabled ? ' aria-disabled="true" tabindex="-1"' : ' data-go="' + target + '"') + '>' + img + '</a>';
    return '<li class="">' + a + '</li>';
  }

  function pageLi(num, active) {
    var cls = active ? LINKACTIVE : (LINKBASE + ' border-0 bg-transparent');
    return '<li class=""><a aria-current="' + (active ? 'page' : 'false') + '" class="' + cls + '" href="#" data-go="' + num + '">' + num + '</a></li>';
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) { pagi.innerHTML = ''; return; }
    var page = state.page;
    var html = '<ul class="flex flex-row items-center gap-0">';
    html += arrowLi('prev', page <= 1, 'Go to previous page', page - 1);
    html += arrowLi('first', page <= 1, 'Go to first page', 1);
    for (var i = 1; i <= totalPages; i++) html += pageLi(i, i === page);
    html += arrowLi('last', page >= totalPages, 'Go to last page', totalPages);
    html += arrowLi('next', page >= totalPages, 'Go to next page', page + 1);
    html += '</ul>';
    pagi.innerHTML = html;
    Array.prototype.forEach.call(pagi.querySelectorAll('[data-go]'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var t = parseInt(a.getAttribute('data-go'), 10);
        if (!isNaN(t) && t !== state.page) { state.page = t; render(); }
      });
    });
  }

  function render() {
    if (!tbody || !document.body.contains(tbody) || !document.body.contains(tablist)) q();
    var list = filtered();
    var totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * PER_PAGE;
    var pageItems = list.slice(start, start + PER_PAGE);

    if (tbody) {
      if (pageItems.length === 0) tbody.innerHTML = emptyHTML('desktop');
      else tbody.innerHTML = pageItems.map(rowHTML).join('');
    }
    if (mobileWrap) {
      if (pageItems.length === 0) {
        mobileWrap.innerHTML = '<div class="w-full" data-fix="1">' + emptyHTML('mobile') + '</div>';
      } else {
        mobileWrap.innerHTML = '<div class="w-full" data-fix="1"><div class="flex flex-col border-t border-solid border-idh-gray-900 gap-3">' + pageItems.map(cardHTML).join('') + '</div></div>';
      }
    }
    renderPagination(totalPages);
  }

  var applying = false;

  /* React 水合失败时会把标签/列表重置为空态，这里检测并自动复原 */
  function needsFix() {
    q();
    if (!tablist || tablist.querySelectorAll('button[role="tab"]').length !== CATS.length) return true;
    if (!document.body.contains(pagi)) return true;
    if (!tbody || !tbody.querySelector('[data-fix]')) return true;
    if (!mobileWrap || !mobileWrap.querySelector('[data-fix]')) return true;
    return false;
  }

  function apply() {
    if (applying) return;
    applying = true;
    q();
    ensurePagi();
    buildTabs();
    render();
    updateScrollable();
    applying = false;
  }

  var scheduled = false;
  function observe() {
    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function () {
      if (applying || scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        if (needsFix()) apply();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    apply();
    observe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('resize', updateScrollable);
})();