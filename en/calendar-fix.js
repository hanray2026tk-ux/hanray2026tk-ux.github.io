/* 预约日历补丁：静态导出的日历停留在构建时的固定月份（且客户端未接管），
   这里用原生脚本渲染当前真实年月，支持翻月与选择日期。
   规则参照原站：周日休诊不可选、过去日期不可选；点击日期高亮。 */
(function () {
  'use strict';

  var PREV_SEL = '[aria-label="上个月"],[aria-label="Previous month"]';
  var NEXT_SEL = '[aria-label="下个月"],[aria-label="Next month"]';
  var BASE =
    'group/calendar-cell aspect-square lg:aspect-auto lg:h-[120px] border-solid border-t border-idh-gray-300 p-2 lg:p-4 relative transition-colors';
  var HILITE = '!bg-[oklch(93.2%_0.032_255.585)]';

  var today = null;
  var firstOfMonth = null;
  var view = null;
  var selected = null;
  var ready = false;
  var moTimer = null;

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function initState() {
    today = new Date();
    today.setHours(0, 0, 0, 0);
    firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    view = new Date(firstOfMonth.getTime());
    selected = null;
    ready = true;
  }

  function getGrid() {
    var cell = document.querySelector('[class*="calendar-cell"]');
    return cell ? cell.parentElement : null;
  }

  function getParts() {
    var grid = getGrid();
    if (!grid) return null;
    var root = grid.closest('section') || grid.parentElement;
    var prev = root.querySelector(PREV_SEL);
    var next = root.querySelector(NEXT_SEL);
    var title = prev && prev.parentElement ? prev.parentElement.querySelector('h2') : null;
    return { grid: grid, prev: prev, next: next, title: title };
  }

  function titleText() {
    return view.getFullYear() + '.' + pad(view.getMonth() + 1);
  }

  function render() {
    if (!ready) initState();
    var p = getParts();
    if (!p) return;

    var y = view.getFullYear();
    var m = view.getMonth();

    if (p.title) p.title.textContent = titleText();
    if (p.prev) p.prev.style.opacity = view.getTime() <= firstOfMonth.getTime() ? '0.35' : '';
    if (p.next) p.next.style.opacity = '';

    var startPad = new Date(y, m, 1).getDay();
    var total = new Date(y, m + 1, 0).getDate();
    var rows = Math.ceil((startPad + total) / 7);
    var frag = document.createDocumentFragment();

    for (var k = 0; k < rows * 7; k++) {
      var d = new Date(y, m, 1 - startPad + k);
      var key = ymd(d);
      var isCurrent = d.getMonth() === m;
      var isToday = isCurrent && d.getTime() === today.getTime();
      var isSelected = selected === key;
      var open = isCurrent && d.getDay() !== 0 && d.getTime() >= today.getTime();

      var cls = BASE;
      if (k % 7 !== 0) cls += ' border-l';
      var txt = 'lg:body1 relative z-10 caption3 ';

      if (isSelected || isToday) {
        cls += ' ' + HILITE;
      }

      if (open || isSelected) {
        cls += ' cursor-pointer hover:bg-idh-primary-01';
        txt += 'text-idh-gray-900';
      } else {
        cls += ' bg-idh-gray-100';
        txt += 'text-idh-gray-500';
      }

      var cell = document.createElement('div');
      cell.className = cls;
      cell.setAttribute('data-date', key);
      var inner = document.createElement('div');
      inner.className = txt;
      inner.textContent = d.getDate();
      cell.appendChild(inner);
      frag.appendChild(cell);
    }

    p.grid.innerHTML = '';
    p.grid.appendChild(frag);
  }

  render();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  }
  window.addEventListener('load', render);

  /* 静态 HTML 可能在脚本执行后才被替换，检测到旧月份时自动重绘 */
  function needsRender() {
    var p = getParts();
    if (!p || !ready) return false;
    if (!p.grid.querySelector('[data-date]')) return true;
    if (!p.title) return false;
    return p.title.textContent.replace(/\s/g, '') !== titleText();
  }

  function watch() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    var observer = new MutationObserver(function () {
      clearTimeout(moTimer);
      moTimer = setTimeout(function () {
        if (needsRender()) render();
      }, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  watch();

  document.addEventListener(
    'click',
    function (e) {
      var target = e.target;
      if (!target || !target.closest) return;

      var prevBtn = target.closest(PREV_SEL);
      var nextBtn = target.closest(NEXT_SEL);

      if (prevBtn || nextBtn) {
        if (!ready) initState();
        var delta = prevBtn ? -1 : 1;
        var targetMonth = new Date(view.getFullYear(), view.getMonth() + delta, 1);
        if (targetMonth.getTime() < firstOfMonth.getTime()) return;
        view = targetMonth;
        selected = null;
        render();
        e.preventDefault();
        return;
      }

      var cell = target.closest('[data-date]');
      if (!cell) return;
      var key = cell.getAttribute('data-date');
      var parts = key.split('-');
      var cellDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (cellDate.getDay() === 0 || cellDate.getTime() < today.getTime()) return;
      if (cellDate.getFullYear() !== view.getFullYear() || cellDate.getMonth() !== view.getMonth()) return;
      selected = selected === key ? null : key;
      render();
    },
    false
  );
})();
