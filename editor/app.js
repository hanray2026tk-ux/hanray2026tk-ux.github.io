/* 凡是与美 · 永久在线编辑器
 *
 * 纯静态页面，部署在 GitHub Pages 上，直接用浏览器打开即可编辑独立站：
 *   · 页面清单：读 pages.json，每行备注「导航项 › 页面标题 —— 主要内容」
 *   · 编辑：在 iframe 里所见即所得，文本点击改、图片点击换
 *   · 保存：调用 GitHub API 把改动提交回仓库，Pages 自动重新发布
 *
 * 保存的是「原文本 → 新文本」补丁，不整页序列化：
 * 同一个句子在静态 HTML 与 Next.js 的 RSC 水合数据块里各出现一次，
 * 只改一处会导致刷新后被打回原样——所以这里对两种形态一起替换。
 */
(function () {
  'use strict';

  var OWNER = 'hanray2026tk-ux';
  var REPO = 'hanray2026tk-ux.github.io';
  var BRANCH = 'main';
  var TOK_KEY = 'fanshi_editor_token_v1';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TITLE: 1, TEXTAREA: 1, SVG: 1, PATH: 1, HEAD: 1, META: 1, LINK: 1, IFRAME: 1 };

  var token = localStorage.getItem(TOK_KEY) || '';
  var pages = [];
  var pageRel = '';
  var pageNote = '';
  var frame = document.getElementById('frame');
  var edits = [];     // 文本：{el, old, new}
  var imgEdits = [];  // 图片：{el, old, file, repoOld, prefix}
  var srcInFileOf = new WeakMap();
  var editMode = true;
  var saving = false;
  var seq = 0;
  var attachTimer = null;

  var $ = function (id) { return document.getElementById(id); };

  /* ===================== 基础工具 ===================== */

  function norm(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); }
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function dirOf(p) { var i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i + 1); }
  function baseExt(p) {
    var name = p.slice(p.lastIndexOf('/') + 1);
    var i = name.lastIndexOf('.');
    var base = i < 0 ? name : name.slice(0, i);
    var ext = i < 0 ? '' : name.slice(i);
    return { base: base.replace(/-v\d+$/, ''), ext: ext || '.png' };
  }

  /* 把页面里的 src 解析成仓库内相对路径（如 ../media/a.png → media/a.png） */
  function resolveRepoPath(rel, src) {
    src = String(src || '').trim();
    if (!src) return '';
    if (/^(https?:)?\/\//i.test(src) || /^(data|blob|javascript):/i.test(src)) return '';
    var raw = src.charAt(0) === '/' ? src.slice(1) : (dirOf(rel.replace(/^\//, '')) + src);
    var out = [];
    raw.split('/').forEach(function (seg) {
      if (!seg || seg === '.') return;
      if (seg === '..') { out.pop(); return; }
      out.push(seg);
    });
    return out.join('/');
  }

  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str), bin = '', i;
    for (i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToUtf8(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function fileToB64(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1]); };
      r.onerror = function () { rej(new Error('读取图片失败')); };
      r.readAsDataURL(file);
    });
  }

  /* ===================== 替换算法（与本地服务一致） ===================== */

  function htmlEscape(s, quote) {
    s = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (quote) s = s.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    return s;
  }

  /* 文本替换：依次尝试 4 种转义形态，把静态 HTML 与 RSC 里的同一句话一起改掉 */
  function applyText(s, old, nw) {
    var pairs = [
      [htmlEscape(old, true), htmlEscape(nw, true)],
      [htmlEscape(old, false), htmlEscape(nw, false)],
      [old.replace(/'/g, '&#x27;'), nw.replace(/'/g, '&#x27;')],
      [old, nw]
    ];
    var out = s, total = 0, seen = {}, i;
    for (i = 0; i < pairs.length; i++) {
      var eo = pairs[i][0], en = pairs[i][1];
      if (!eo || seen[eo]) continue;
      seen[eo] = 1;
      var c = out.split(eo).length - 1;
      if (c) { out = out.split(eo).join(en); total += c; }
    }
    if (total) return { out: out, n: total };

    // 兜底：原句被 inline 标签拆开时，按空白不敏感匹配
    var toks = old.split(/\s+/).filter(Boolean).map(escRe);
    if (toks.length > 1) {
      var m = new RegExp(toks.join('\\s+')).exec(out);
      if (m) {
        return {
          out: out.slice(0, m.index) + htmlEscape(nw, true) + out.slice(m.index + m[0].length),
          n: 1
        };
      }
    }
    return null;
  }

  /* 图片替换：把源文件里对该路径的所有引用（img/ srcSet / preload / RSC）整体换掉 */
  function applyImg(s, old, nw) {
    old = String(old || '').trim();
    nw = String(nw || '').trim();
    if (!old || !nw || old === nw) return { out: s, n: 0 };
    var n = 0;
    var rx = new RegExp('(?<![A-Za-z0-9_.\\-])' + escRe(old) + '(?![A-Za-z0-9_.\\-])', 'g');
    var out = s.replace(rx, function () { n++; return nw; });
    return { out: out, n: n };
  }

  /* ===================== GitHub API ===================== */

  function contentsUrl(path) {
    return API + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  }

  function ghFetch(path, opts) {
    opts = opts || {};
    var headers = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      if (r.ok) return r.json();
      return r.json().catch(function () { return {}; }).then(function (j) {
        var msg = j && j.message ? j.message : ('HTTP ' + r.status);
        if (r.status === 401) msg = 'Token 无效或已过期';
        if (r.status === 403) msg = '没有写入权限（403）：请把 Contents 设为 Read and write';
        if (r.status === 409) msg = '文件在别处被改动过（409），请刷新后重试';
        var e = new Error(msg);
        e.status = r.status;
        throw e;
      });
    });
  }

  function getFile(path) {
    return ghFetch('/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + BRANCH);
  }

  function putFile(path, b64, message, sha) {
    var body = { message: message, content: b64, branch: BRANCH };
    if (sha) body.sha = sha;
    return ghFetch('/contents/' + path.split('/').map(encodeURIComponent).join('/'), { method: 'PUT', body: body });
  }

  function validateToken(t) {
    return fetch(API, { headers: { 'Authorization': 'Bearer ' + t, 'Accept': 'application/vnd.github+json' }, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401) throw new Error('Token 无效（401）');
        if (r.status === 404) throw new Error('访问不到仓库（404）：请确认 Token 勾选了这个仓库并给了 Contents 读写权限');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        if (!(j.permissions && j.permissions.push)) {
          throw new Error('Token 缺少写权限：请把 Contents 权限设为 Read and write');
        }
        return j;
      });
  }

  /* ===================== Token 弹层 ===================== */

  function openToken() {
    $('tok-input').value = token || '';
    $('tok-msg').textContent = '';
    $('modal').hidden = false;
    $('tok-input').focus();
  }
  function closeToken() { $('modal').hidden = true; }

  function refreshTokState() {
    var el = $('tok-state');
    if (token) { el.textContent = 'Token 已配置'; el.className = 'tok on'; }
    else { el.textContent = '未配置 Token'; el.className = 'tok off'; }
  }

  $('btn-tok').addEventListener('click', openToken);
  $('tok-cancel').addEventListener('click', closeToken);
  $('tok-clear').addEventListener('click', function () {
    token = ''; localStorage.removeItem(TOK_KEY); refreshTokState(); $('tok-msg').textContent = '已清除';
  });
  $('tok-save').addEventListener('click', function () {
    var t = $('tok-input').value.trim();
    if (!t) { $('tok-msg').textContent = '请先粘贴 Token'; return; }
    $('tok-msg').textContent = '验证中…';
    validateToken(t).then(function () {
      token = t; localStorage.setItem(TOK_KEY, t);
      refreshTokState();
      $('tok-msg').textContent = '验证通过，已保存';
      setTimeout(closeToken, 700);
    }).catch(function (e) { $('tok-msg').textContent = e.message; });
  });

  /* ===================== 页面清单 ===================== */

  function renderList(filter) {
    var v = String(filter || '').trim().toLowerCase();
    var ul = $('list'), html = '', shown = 0;
    pages.forEach(function (p) {
      var hit = !v || (p.rel + ' ' + p.note).toLowerCase().indexOf(v) >= 0;
      if (!hit) return;
      shown++;
      html += '<li><a href="#p=' + encodeURIComponent(p.rel) + '">' + esc(p.rel) + '</a>' +
              '<span class="note">' + esc(p.note) + '</span></li>';
    });
    ul.innerHTML = html || '<li class="note" style="color:#888">没有匹配的页面</li>';
    $('cnt').textContent = '共 ' + pages.length + ' 个页面，当前显示 ' + shown + ' 个';
  }

  function loadPages() {
    return fetch('pages.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        pages = j.pages || [];
        pages.sort(function (a, b) { return a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0; });
        $('gen').textContent = j.generated ? '（清单生成于 ' + j.generated + '）' : '';
        renderList('');
      })
      .catch(function (e) {
        $('list').innerHTML = '<li class="note" style="color:#b42318">页面清单加载失败：' + esc(e.message) + '</li>';
      });
  }

  $('q').addEventListener('input', function () { renderList(this.value); });

  /* ===================== 路由 ===================== */

  function showList() {
    if (hasDirty() && !confirm('还有未保存的改动，确定返回清单？')) {
      location.hash = '#p=' + encodeURIComponent(pageRel);
      return;
    }
    frame.src = 'about:blank';
    edits = []; imgEdits = []; srcInFileOf = new WeakMap(); setDirty(0);
    $('view-edit').hidden = true;
    $('view-list').hidden = false;
    document.title = '凡是与美 · 在线编辑器';
  }

  function openPage(rel) {
    if (!rel) { showList(); return; }
    pageRel = rel;
    var hit = pages.filter(function (p) { return p.rel === rel; })[0];
    pageNote = hit ? hit.note : rel;
    $('view-list').hidden = true;
    $('view-edit').hidden = false;
    $('note').textContent = pageNote;
    $('note').title = rel;
    document.title = pageNote.split('——')[0].trim() + ' · 在线编辑';
    edits = []; imgEdits = []; srcInFileOf = new WeakMap(); setDirty(0); setState(true);
    frame.src = rel;
  }

  function route() {
    var h = location.hash || '';
    if (h.indexOf('#p=') === 0) openPage(decodeURIComponent(h.slice(3)));
    else showList();
  }

  window.addEventListener('hashchange', route);

  /* ===================== iframe 内编辑 ===================== */

  frame.addEventListener('load', function () {
    var doc;
    try { doc = frame.contentDocument; } catch (e) { doc = null; }
    if (!doc || !doc.body) return;
    attach(doc);
  });

  function attach(doc) {
    function markEditable() {
      var all = doc.body.querySelectorAll('*'), i;
      for (i = 0; i < all.length; i++) {
        var el = all[i];
        if (SKIP[el.tagName]) continue;
        if (el.children.length) continue;
        var t = el.textContent;
        if (!t || !t.trim()) continue;
        if (el.__orig === undefined) el.__orig = t;
        if (editMode) { el.setAttribute('contenteditable', 'true'); el.classList.add('__ed'); }
        else { el.removeAttribute('contenteditable'); el.classList.remove('__ed'); }
      }
    }
    doc.__markEditable = markEditable;

    doc.addEventListener('blur', function (e) {
      var el = e.target;
      if (!el || !el.classList || !el.classList.contains('__ed')) return;
      var now = norm(el.textContent), was = norm(el.__orig), i;
      for (i = edits.length - 1; i >= 0; i--) if (edits[i].el === el) edits.splice(i, 1);
      if (now && now !== was) {
        edits.push({ el: el, old: was, new: now });
        el.classList.add('__dirty');
        msg('已记录改动，记得保存');
      } else {
        el.classList.remove('__dirty');
      }
      setDirty(hasDirty());
    }, true);

    doc.addEventListener('keydown', function (e) {
      var el = e.target;
      if (el && el.classList && el.classList.contains('__ed') && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); el.blur(); return;
      }
      if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 's') {
        e.preventDefault(); save();
      }
    }, true);

    doc.addEventListener('mouseover', function (e) {
      if (editMode && e.target && e.target.tagName === 'IMG') e.target.classList.add('__imghover');
    }, true);
    doc.addEventListener('mouseout', function (e) {
      if (e.target && e.target.tagName === 'IMG') e.target.classList.remove('__imghover');
    }, true);

    doc.addEventListener('click', function (e) {
      var el = e.target;
      if (!el || !el.tagName) return;
      if (editMode && el.tagName === 'IMG') { e.preventDefault(); e.stopPropagation(); pickImage(el); return; }
      var a = el.closest ? el.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || a.hasAttribute('download')) return;
      if (/^(mailto|tel|javascript|data):/i.test(href)) return;
      e.preventDefault(); e.stopPropagation();
      var abs;
      try { abs = new URL(href, doc.location.href); } catch (err) { return; }
      if (abs.origin !== location.origin) { window.open(abs.href, '_blank'); return; }
      if (hasDirty() && !confirm('当前有未保存的改动，跳转后将丢失。仍要打开这个链接吗？')) return;
      location.hash = '#p=' + encodeURIComponent(abs.pathname);
    }, true);

    try {
      new MutationObserver(debounce(markEditable, 250)).observe(doc.body, { childList: true, subtree: true });
    } catch (e) { /* 忽略 */ }

    markEditable();
    if (attachTimer) clearTimeout(attachTimer);
    attachTimer = setTimeout(markEditable, 1500); // 等 React 水合完再标记一次
  }

  function debounce(fn, ms) {
    var t = null;
    return function () { if (t) return; t = setTimeout(function () { t = null; fn(); }, ms); };
  }

  function sourceSrc(img) {
    if (!srcInFileOf.has(img)) srcInFileOf.set(img, img.getAttribute('src') || '');
    return srcInFileOf.get(img);
  }

  function pickImage(el) {
    if (!token) { msg('请先设置 Token', 3000); openToken(); return; }
    var old = sourceSrc(el);
    var repoOld = resolveRepoPath(pageRel, old);
    if (!repoOld) { msg('这张图不是本站图片（外链或内嵌），无法替换', 4000); return; }
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      for (var i = imgEdits.length - 1; i >= 0; i--) if (imgEdits[i].old === old) imgEdits.splice(i, 1);
      imgEdits.push({ el: el, old: old, file: f, repoOld: repoOld, prefix: dirOf(old) });
      el.removeAttribute('srcset'); el.removeAttribute('srcSet');
      el.setAttribute('src', URL.createObjectURL(f));
      el.classList.add('__dirty');
      setDirty(hasDirty());
      msg('图片已替换（预览），记得保存');
    };
    inp.click();
  }

  /* ===================== 状态 / 提示 ===================== */

  function hasDirty() { return edits.length + imgEdits.length; }

  function setDirty(n) {
    var b = $('btn-save');
    b.disabled = !n || saving;
    b.textContent = n ? '保存 (' + n + ')' : '保存';
  }

  function setState(on) {
    editMode = on;
    $('state').textContent = on ? '编辑中' : '已暂停';
    $('state').className = 'state' + (on ? '' : ' off');
    $('btn-toggle').textContent = on ? '暂停编辑' : '继续编辑';
    var doc = frame.contentDocument;
    if (doc && doc.__markEditable) doc.__markEditable();
  }

  function msg(t, ms) {
    var m = $('msg');
    m.textContent = t || '';
    m.title = t || '';
    if (ms) setTimeout(function () { if (m.textContent === t) { m.textContent = ''; m.title = ''; } }, ms);
  }

  /* ===================== 保存 ===================== */

  function pickFreeName(dir, base, ext) {
    // 依次尝试 -v2、-v3 …，直到仓库里不存在同名文件
    var n = 2;
    function step() {
      if (n > 30) return Promise.resolve(base + '-v' + Date.now().toString(36) + ext);
      var cand = base + '-v' + n + ext;
      return getFile(dir + cand).then(function () { n++; return step(); },
        function (e) { if (e.status === 404) return cand; throw e; });
    }
    return step();
  }

  function save() {
    if (!token) { msg('请先设置 Token', 4000); openToken(); return; }
    if (!hasDirty()) { msg('没有改动', 2000); return; }
    if (saving) return;
    saving = true;
    setDirty(hasDirty());
    msg('保存中…');

    var report = [], commitUrls = [];
    var imgTask = Promise.resolve();

    imgEdits.forEach(function (im) {
      imgTask = imgTask.then(function () {
        var be = baseExt(im.repoOld);
        return pickFreeName(dirOf(im.repoOld), be.base, be.ext).then(function (name) {
          var repoNew = dirOf(im.repoOld) + name;
          im.newSrc = im.prefix + name;
          im.repoNew = repoNew;
          return fileToB64(im.file).then(function (b64) {
            return putFile(repoNew, b64, 'asset: 更新图片 ' + name, null).then(function (r) {
              if (r && r.commit) commitUrls.push(r.commit.html_url);
              report.push({ kind: '图片', old: im.old, status: '已替换为 ' + name });
            });
          });
        }).catch(function (e) {
          report.push({ kind: '图片', old: im.old, status: '失败：' + e.message });
        });
      });
    });

    imgTask.then(function () {
      var path = pageRel.replace(/^\//, '');
      return getFile(path).then(function (info) {
        if (!info.content) throw new Error('文件过大或为空，无法在线编辑');
        var src = b64ToUtf8(info.content), changed = 0;

        imgEdits.forEach(function (im) {
          if (!im.newSrc) return;
          var r = applyImg(src, im.old, im.newSrc);
          if (r.n) { src = r.out; changed += r.n; }
          var last = report.filter(function (x) { return x.old === im.old; })[0];
          if (last && last.status.indexOf('失败') === 0) return;
          if (!r.n) report.push({ kind: '图片引用', old: im.old, status: '未找到引用' });
        });

        edits.forEach(function (ed) {
          var r = applyText(src, ed.old, ed.new);
          if (!r) { report.push({ kind: '文本', old: ed.old, status: '未找到' }); return; }
          src = r.out; changed += r.n;
          report.push({ kind: '文本', old: ed.old, status: r.n > 1 ? ('已替换 ' + r.n + ' 处') : '已替换' });
        });

        if (!changed) {
          report.push({ kind: '页面', old: path, status: '无实际变化，未提交' });
          return null;
        }
        var parts = [];
        if (edits.length) parts.push(edits.length + ' 处文本');
        if (imgEdits.length) parts.push(imgEdits.length + ' 张图片');
        var message = 'edit(' + path + '): 在线编辑 ' + parts.join(' + ');
        return putFile(path, utf8ToB64(src), message, info.sha).then(function (r) {
          if (r && r.commit) commitUrls.push(r.commit.html_url);
          report.push({ kind: '页面', old: path, status: '已提交' });
          return true;
        });
      }).catch(function (e) {
        report.push({ kind: '页面', old: path, status: '失败：' + e.message });
      });
    }).then(function (ok) {
      saving = false;
      // 成功的项：把编辑基线推进到新值，可继续编辑而无需刷新
      report.forEach(function () {});
      if (ok) {
        edits.forEach(function (ed) { ed.el.__orig = ed.new; ed.el.classList.remove('__dirty'); });
        imgEdits.forEach(function (im) { if (im.newSrc) srcInFileOf.set(im.el, im.newSrc); });
        edits = []; imgEdits = [];
      }
      setDirty(hasDirty());
      showResults(report, commitUrls, !!ok);
      msg(ok ? '已提交到 GitHub' : '保存未完成', 5000);
    }).catch(function (e) {
      saving = false; setDirty(hasDirty());
      msg('保存失败：' + e.message, 6000);
    });
  }

  function showResults(report, commitUrls, ok) {
    var rows = report.map(function (r) {
      var bad = r.status.indexOf('失败') >= 0 || r.status.indexOf('未找到') >= 0;
      return '<li style="color:' + (bad ? '#b42318' : '#067647') + '">[' + esc(r.kind) + '] ' +
             esc(r.old.length > 40 ? r.old.slice(0, 40) + '…' : r.old) + ' → ' + esc(r.status) + '</li>';
    }).join('');
    var links = commitUrls.map(function (u) { return '<a href="' + esc(u) + '" target="_blank">查看提交</a>'; }).join('　');
    var extra = ok
      ? '<p style="color:#444">改动已提交到 GitHub，本站会在大约 <b>1–10 分钟</b>内自动重新发布' +
        '（含 Pages 构建与 CDN 缓存，最长约 10 分钟）。当前页面显示的就是你编辑后的效果；' +
        '发布完成后再刷新即可看到线上版本。</p>' +
        '<p>' + links + '</p>'
      : '<p style="color:#b42318">部分改动未写入，请看上面的明细。</p>';

    var box = document.createElement('div');
    box.id = 'modal';
    box.innerHTML = '<div class="box"><h3>保存结果</h3><ul>' + (rows || '<li>没有可写入的改动</li>') +
      '</ul>' + extra + '<div class="row"><button class="primary" id="res-ok">知道了</button></div></div>';
    document.body.appendChild(box);
    box.querySelector('#res-ok').onclick = function () { box.remove(); };
  }

  /* ===================== 工具栏事件 ===================== */

  $('btn-toggle').addEventListener('click', function () { setState(!editMode); });
  $('btn-save').addEventListener('click', save);
  $('btn-discard').addEventListener('click', function () {
    if (hasDirty() && !confirm('放弃当前所有未保存的改动？')) return;
    edits = []; imgEdits = []; srcInFileOf = new WeakMap(); setDirty(0);
    frame.src = pageRel + '?t=' + Date.now();
  });
  $('back').addEventListener('click', function (e) {
    if (hasDirty() && !confirm('还有未保存的改动，确定返回清单？')) e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 's') { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', function (e) {
    if (hasDirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ===================== 启动 ===================== */

  document.getElementById('repo-name').textContent = OWNER + '/' + REPO;
  document.getElementById('repo-name2').textContent = REPO;
  refreshTokState();
  loadPages().then(route);
  if (!token) setTimeout(function () { msg('提示：点右上角「设置 Token」后即可保存'); }, 800);
})();