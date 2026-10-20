/* 预约日历补丁：渲染真实当前月份、支持翻月与选择日期
   静态导出后日历失去了客户端逻辑，这里补上交互。
   规则参照原站：周日休诊不可选、过去日期不可选；点击日期仅做选中高亮。 */
(function () {
  var grids = Array.prototype.slice.call(document.querySelectorAll('div.grid.grid-cols-7'));
  var grid = null;
  for (var i = 0; i < grids.length; i++) {
    if (grids[i].querySelector('[class*="calendar-cell"]')) { grid = grids[i]; break; }
  }
  if (!grid) return;

  var prevBtn = document.querySelector('[aria-label="Previous month"]');
  var nextBtn = document.querySelector('[aria-label="Next month"]');
  if (!prevBtn || !nextBtn) return;
  var title = prevBtn.parentElement.querySelector('h2');

  var BASE = 'group/calendar-cell aspect-square lg:aspect-auto lg:h-[120px] border-solid border-t border-idh-gray-300 p-2 lg:p-4 relative transition-colors';
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  var view = firstOfMonth;
  var selected = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function pick(cell) {
    var v = cell.getAttribute('data-date');
    selected = selected === v ? null : v;
    render();
  }

  function render() {
    var y = view.getFullYear();
    var m = view.getMonth();
    if (title) title.textContent = y + '.' + pad(m + 1);

    var startPad = new Date(y, m, 1).getDay();
    var total = new Date(y, m + 1, 0).getDate();
    var rows = Math.ceil((startPad + total) / 7);
    var start = new Date(y, m, 1 - startPad);
    var frag = document.createDocumentFragment();

    for (var k = 0; k < rows * 7; k++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + k);
      var key = ymd(d);
      var open = d.getMonth() === m && d.getDay() !== 0 && d.getTime() >= today.getTime();
      var isSel = selected === key;

      var cls = BASE + (k % 7 === 0 ? '' : ' border-l');
      var txt = 'lg:body1 relative z-10 caption3 ';
      if (isSel) {
        cls += ' !bg-[oklch(93.2%_0.032_255.585)] cursor-pointer';
        txt += 'text-idh-gray-900';
      } else if (open) {
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
      if (open) cell.addEventListener('click', function () { pick(this); });
      frag.appendChild(cell);
    }

    grid.innerHTML = '';
    grid.appendChild(frag);
    prevBtn.style.opacity = view.getTime() <= firstOfMonth.getTime() ? '0.35' : '';
  }

  prevBtn.addEventListener('click', function () {
    var p = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    if (p.getTime() < firstOfMonth.getTime()) return;
    view = p;
    render();
  });

  nextBtn.addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    render();
  });

  render();
})();
