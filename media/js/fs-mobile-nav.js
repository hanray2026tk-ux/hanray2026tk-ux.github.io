(function () {
  if (window.__fsMNav) return;
  window.__fsMNav = 1;

  var CSS = ''
    + '#fs-mnav-btn{z-index:80}'
    + 'header[data-fs-hero]:not([data-fs-scrolled]) #fs-mnav-btn{background:rgba(0,0,0,.30);border-radius:10px;padding:6px;box-sizing:content-box;box-shadow:0 1px 6px rgba(0,0,0,.18)}'
    + '#fs-mnav-mask{position:fixed;inset:0;background:rgba(0,0,0,.42);opacity:0;visibility:hidden;transition:opacity .25s ease;z-index:9998}'
    + '#fs-mnav-mask.fs-on{opacity:1;visibility:visible}'
    + '#fs-mnav{position:fixed;top:0;left:0;bottom:0;width:82%;max-width:330px;background:#fff;z-index:9999;'
    + 'transform:translateX(-102%);transition:transform .28s ease;display:flex;flex-direction:column;box-shadow:2px 0 18px rgba(0,0,0,.12)}'
    + '#fs-mnav.fs-on{transform:translateX(0)}'
    + '#fs-mnav-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee}'
    + '#fs-mnav-head img{height:26px;width:auto}'
    + '#fs-mnav-close{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:0;background:none;font-size:24px;line-height:1;color:#333;cursor:pointer}'
    + '#fs-mnav-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 0 40px}'
    + '#fs-mnav-body .fs-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f2f2f2;color:#333;text-decoration:none;font-size:15px;font-weight:600}'
    + '#fs-mnav-body .fs-row:active{background:#fafafa}'
    + '#fs-mnav-body .fs-sub{display:none;background:#fafafa}'
    + '#fs-mnav-body .fs-sub.fs-open{display:block}'
    + '#fs-mnav-body .fs-sub a{display:block;padding:12px 16px 12px 30px;color:#555;text-decoration:none;font-size:14px;border-bottom:1px solid #f0f0f0}'
    + '#fs-mnav-body .fs-arrow{font-size:12px;color:#aaa;transition:transform .2s}'
    + '#fs-mnav-body .fs-open-row .fs-arrow{transform:rotate(90deg)}'
    + 'body.fs-mnav-lock{overflow:hidden}';

  function build() {
    var btn = document.querySelector('button[aria-label="切换菜单"],button[aria-label="Toggle menu"]');
    if (!btn || document.getElementById('fs-mnav')) return;
    btn.id = 'fs-mnav-btn';

    var nav = document.querySelector('nav.hidden.w-full');
    var items = nav ? [].slice.call(nav.children) : [];
    var logo = document.querySelector('header a[href^="/zh"],header a[href^="/en"]');
    var logoSrc = logo && logo.querySelector('img') ? logo.querySelector('img').getAttribute('src') : '';

    var mask = document.createElement('div');
    mask.id = 'fs-mnav-mask';

    var panel = document.createElement('aside');
    panel.id = 'fs-mnav';
    panel.setAttribute('aria-hidden', 'true');
    var html = '<div id="fs-mnav-head">'
      + (logoSrc ? '<img src="' + logoSrc + '" alt="logo">' : '<span style="font-weight:700">菜单</span>')
      + '<button id="fs-mnav-close" aria-label="关闭菜单">&times;</button></div><div id="fs-mnav-body">';

    items.forEach(function (it) {
      var parent = it.querySelector('a');
      if (!parent) return;
      var panelEl = it.querySelector('.fs-subnav-panel');
      var subLinks = panelEl ? [].slice.call(panelEl.querySelectorAll('a[role="menuitem"]')) : [];
      if (subLinks.length) {
        html += '<div class="fs-grp"><div class="fs-row fs-open-row">' + parent.textContent.trim()
          + '<span class="fs-arrow">&#9654;</span></div><div class="fs-sub">';
        subLinks.forEach(function (a) {
          html += '<a href="' + a.getAttribute('href') + '">' + a.textContent.trim() + '</a>';
        });
        html += '</div></div>';
      } else {
        html += '<a class="fs-row" href="' + parent.getAttribute('href') + '">' + parent.textContent.trim() + '</a>';
      }
    });
    html += '</div>';
    panel.innerHTML = html;

    document.body.appendChild(mask);
    document.body.appendChild(panel);

    var style = document.createElement('style');
    style.id = 'fs-mnav-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    [].slice.call(panel.querySelectorAll('.fs-open-row')).forEach(function (row) {
      row.addEventListener('click', function (e) {
        e.preventDefault();
        row.parentElement.querySelector('.fs-sub').classList.toggle('fs-open');
        row.classList.toggle('fs-open-row');
      });
    });

    function open() {
      panel.classList.add('fs-on');
      mask.classList.add('fs-on');
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('fs-mnav-lock');
    }
    function close() {
      panel.classList.remove('fs-on');
      mask.classList.remove('fs-on');
      panel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('fs-mnav-lock');
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.classList.contains('fs-on')) close(); else open();
    });
    btn.addEventListener('touchstart', function (e) {
      e.stopPropagation();
    }, { passive: true });
    mask.addEventListener('click', close);
    document.getElementById('fs-mnav-close').addEventListener('click', close);
    panel.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a && !a.closest('.fs-open-row')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
