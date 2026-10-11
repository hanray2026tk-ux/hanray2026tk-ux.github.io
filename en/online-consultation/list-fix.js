/* eslint-disable */
/*
 * 在线咨询 · 列表页原生兜底
 * 目的：镜像站为静态导出，页面上的「分类筛选标签 / 帖子列表 / 分页」原本由
 * 浏览器加载后由 JS 调原站接口动态渲染，镜像站缺失。此脚本用原生 JS 在本地
 * 复原原站加载完成后的最终形态（11 个分类标签 + 帖子表格 + 移动端卡片 + 分页）。
 * 列表数据为全新生成的演示咨询内容（非原站搬运），点击标题可查看客户叙述详情。
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

  // 全新生成的演示帖子（非原站内容）；p=保密；r=已回复；c=分类 slug；b=客户叙述正文
  var POSTS = [
    { n: 22, c: 'male-plastic-surgery', t: 'Planning a jawline and neck lift combination', a: 'J*', d: '2026-10-05', p: false, r: true, b: 'I am a 41-year-old man and I have started to notice that my jawline has softened and my neck looks fuller in photos than it does in the mirror. I would like to know whether a jawline implant, buccal fat removal, or a neck lift alone would give the cleanest result, or if a combination is more realistic.\nI have no major health issues and I can stay in Seoul for about ten days. Could you let me know what the usual recovery is like and whether the scars are visible in men?' },
    { n: 21, c: 'male-plastic-surgery', t: 'Hairline lowering or forehead implant for a stronger profile?', a: 'P************', d: '2026-10-05', p: true, r: true, b: 'I have a tall forehead and a receding hairline, and it makes my whole face look longer than I would like. I am deciding between hairline lowering surgery and a forehead implant, but I do not fully understand the difference in scarring and how natural each one looks over time.\nBecause this is quite personal to me, I would prefer to discuss the photos privately. Would an online review be enough to recommend one option, or would I need to be examined in person first?' },
    { n: 20, c: 'nose', t: 'Rhinoplasty with tip refinement - bridge still looks wide', a: 'R*', d: '2026-09-15', p: false, r: true, b: 'I had a rhinoplasty about two years ago and, although the tip is better, the bridge still looks wide from the front and my nose feels heavy in photos. I am not looking for a dramatic change - I just want a straighter, slimmer line that matches my face.\nCould you tell me whether a revision would need cartilage grafting and roughly how long the swelling takes to settle for a second surgery?' },
    { n: 19, c: 'nose', t: 'Revision after previous rhinoplasty abroad', a: 'R*', d: '2026-09-15', p: true, r: true, b: 'My first rhinoplasty was done in another country and the result left my nostrils uneven and the tip slightly drooping. I am nervous about operating again, so I would like an honest opinion about whether a revision is likely to improve things or add more risk.\nI can send the operative notes and recent photos if that helps. Please keep everything confidential.' },
    { n: 18, c: 'orthognathic-surgery', t: 'Two-jaw surgery for an underbite - recovery questions', a: 'A*****', d: '2026-09-02', p: false, r: true, b: 'I have an underbite and my orthodontist has recommended two-jaw surgery. I understand the medical side, but I am most worried about the practical parts: how long I will need to stay in Korea, when I can speak normally again, and whether I can work from a laptop after the first week.\nCould you also explain whether braces are required before and after the surgery, and how long the whole plan usually takes?' },
    { n: 17, c: 'face-contouring', t: 'Cheekbone reduction without looking flat', a: 'L***', d: '2026-08-28', p: false, r: false, b: 'I would like to reduce the width of my cheekbones, but I am afraid of ending up with a flat midface or a sagging look later on. I have seen results that are either too subtle or too hollow, and I want something in between.\nIs it possible to keep volume while narrowing the sides, and would a lifting procedure be needed together with it?' },
    { n: 16, c: 'face-contouring', t: 'Facial feminization plan over 12 months - brow, jaw, and body', a: 'J***********************', d: '2026-08-04', p: true, r: true, b: 'I am planning facial feminization over about a year, and I would like to spread the procedures so that I can recover between trips. My priorities are brow bone reduction, jaw and chin reshaping, and some body contouring.\nCould you help me build a sequence and a rough budget for each stage? I would rather plan carefully than rush everything into one visit.' },
    { n: 15, c: 'orthognathic-surgery', t: 'Mild mandibular deficiency - is bone surgery necessary, or can fillers help?', a: 'A*******', d: '2026-07-31', p: true, r: false, b: 'I have been told I have a mild mandibular deficiency. I do not want a full orthognathic procedure if it is not truly needed, but I also do not want to keep relying on fillers every year.\nCould you explain at what point bone surgery becomes worthwhile, and whether the difference would be noticeable in everyday life rather than only in profile photos?' },
    { n: 14, c: 'face-contouring', t: 'Zygoma and chin contouring for a round face', a: 'M*****', d: '2026-07-30', p: false, r: false, b: 'My face is round and my chin disappears in photos, so I have been looking into zygoma reduction together with chin lengthening. I do not want to change who I am - just to make the proportions a little more balanced.\nHow soon after the consultation can surgery be scheduled, and is there a lot of visible bruising in the first two weeks?' },
    { n: 13, c: 'eye', t: 'Lower blepharoplasty or fat repositioning for under-eye hollows?', a: 'D**********', d: '2026-07-28', p: false, r: false, b: 'I look tired even after a full night of sleep because my under-eye area is hollow and dark. I keep reading about lower blepharoplasty and fat repositioning, but I cannot tell which one suits skin that is still fairly firm.\nCould you explain the difference and how long the results usually last? I would also like to know if this can be done under local anaesthesia.' },
    { n: 12, c: 'orthognathic-surgery', t: 'Cost estimate before committing to surgery', a: 'T*************', d: '2026-07-22', p: true, r: false, b: 'Before I decide anything I would like an honest cost estimate for orthognathic surgery, including hospital, anaesthesia, and follow-up, so I can plan my finances properly. I am not asking for a final quote, only a realistic range.\nI would prefer to keep my details private for now. Once I understand the numbers I will be ready to send photos and a full history.' },
    { n: 11, c: 'face-contouring', t: 'Brow bone reduction and forehead contouring for feminization', a: 'Y*****', d: '2026-07-18', p: false, r: false, b: 'My brow ridge is the feature that bothers me most, and I would like to feminize my forehead at the same time. I have read that this procedure can sometimes change the sense of pressure around the sinuses, and I would like to understand that risk clearly.\nHow long does the swelling around the eyes last, and when does the final shape become visible?' },
    { n: 10, c: 'middle-age-eye', t: 'Upper and lower eyelid surgery in my fifties', a: 'K*************', d: '2026-07-14', p: false, r: false, b: 'I am in my fifties and my eyelids have started to feel heavy, which makes me look older and a little stern. I am interested in both upper and lower eyelid surgery, but I am worried about looking surprised or glassy.\nIs it usually recommended to combine the two, and how much downtime should I plan before returning to a normal social life?' },
    { n: 9, c: 'face-contouring', t: 'Second opinion for jaw and chin contouring', a: 'B***********', d: '2026-07-12', p: true, r: true, b: 'I have already had one consultation elsewhere for jaw and chin contouring, but the plan felt rushed and I was not comfortable with the explanation. I would like a second opinion before I make a decision.\nI can share my previous scan and the proposed plan. Please treat this enquiry as confidential.' },
    { n: 8, c: 'face-contouring', t: 'Chin implant or sliding genioplasty - which is better?', a: 'B***********', d: '2026-07-12', p: true, r: false, b: 'My chin is receding and I am deciding between an implant and a sliding genioplasty. I understand the implant is simpler, but I am worried about how it feels and looks after many years.\nCould you compare the two honestly in terms of recovery, longevity, and how natural each one appears?' },
    { n: 7, c: 'body-contouring', t: 'Arm liposuction and skin tightening together?', a: 'L****', d: '2026-07-08', p: false, r: false, b: 'I have lost about fifteen kilograms and my upper arms now look loose even though I exercise. I would like to know whether liposuction alone is enough or if skin removal is needed, and whether both can be done in one operation.\nWhat would the scars look like, and how long would I need to avoid the gym?' },
    { n: 6, c: 'orthognathic-surgery', t: 'Sleep apnea and jaw surgery - what should I prepare?', a: 'S********', d: '2026-07-07', p: false, r: false, b: 'I have mild sleep apnea and I have been told that advancing my jaw could help my breathing as well as my profile. I would like to understand how the surgery is planned for someone with a breathing problem.\nWhat tests would I need before travelling, and how is the airway monitored afterwards?' },
    { n: 5, c: 'orthognathic-surgery', t: 'Can I combine rhinoplasty with orthognathic surgery?', a: 'H*******', d: '2026-07-07', p: true, r: false, b: 'I need jaw surgery for a bite problem, and I would also like my nose refined. I am not sure whether it is safer to do both at once or to separate them by several months.\nCould you explain the advantages and risks of each approach, and how the swelling of one procedure affects the planning of the other?' },
    { n: 4, c: 'anti-aging', t: 'Non-surgical lifting before considering a facelift', a: 'G******', d: '2026-07-06', p: true, r: false, b: 'I am not ready for a facelift, but the skin along my jaw has started to sag and I would like to try something less invasive first. I am considering thread lifting or ultrasound-based tightening.\nCould you tell me how long the results of each usually last, and at what point it becomes wiser to wait and do a proper facelift instead?' },
    { n: 3, c: 'ent-nose', t: 'Deviated septum and breathing problems before rhinoplasty', a: 'W*****', d: '2026-07-06', p: false, r: false, b: 'I have a deviated septum and I often breathe through one side only, especially when I sleep. I would also like the outside of my nose to be straighter, but the breathing problem matters more to me.\nIs it possible to correct both the function and the appearance in the same operation, and would that change how the surgery is planned?' },
    { n: 2, c: 'breast', t: 'Implant size after breastfeeding - choosing something natural', a: 'N*********', d: '2026-07-02', p: false, r: false, b: 'After two pregnancies my breasts have lost volume and sit lower than before. I do not want to look obviously augmented - I would like my old shape back, only slightly fuller.\nWould a lift be necessary together with implants, and how do you choose a size that still looks natural on a small frame?' },
    { n: 1, c: 'face-contouring', t: 'Facial feminization consultation for an overseas patient', a: 'N*********', d: '2026-07-01', p: false, r: true, b: 'I am travelling from abroad and would like a facial feminization consultation during my trip. My main concerns are my brow, my jaw, and the overall balance of my face.\nCould you tell me what information and photos you need in advance, and whether a treatment plan can be prepared before I arrive so that I can make the most of my visit?' }
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
      '<td class="' + TD + '"><button type="button" data-post-n="' + p.n + '" class="flex min-w-0 items-center gap-2 cursor-pointer w-full text-left">' + icons + '<span class="min-w-0 line-clamp-1 body3 text-idh-gray-900">' + esc(p.t) + '</span></button></td>' +
      '<td class="' + TD + '">' + esc(p.a) + '</td>' +
      '<td class="' + TD + '">' + p.d + '</td>' +
      '</tr>';
  }

  function cardHTML(p) {
    var cat = CATLABEL[p.c] || p.c;
    return '<div class="border-solid border-idh-gray-200 bg-wht p-4 border-0 border-b rounded-none cursor-pointer">' +
      '<button type="button" data-post-n="' + p.n + '" class="flex flex-col gap-1 w-full text-left">' +
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

  /* ---------- 帖子详情弹窗（点击标题查看客户叙述） ---------- */
  var MCS = ''
    + '.ocm-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.ocm-panel{position:relative;background:#fff;border-radius:16px;max-width:640px;width:100%;max-height:82vh;overflow:auto;padding:28px 24px;box-shadow:0 24px 70px rgba(0,0,0,.28)}'
    + '.ocm-close{position:absolute;top:10px;right:12px;border:0;background:transparent;font-size:26px;line-height:1;color:#999;cursor:pointer}'
    + '.ocm-close:hover{color:#222}'
    + '.ocm-head{display:flex;align-items:center;gap:8px}'
    + '.ocm-tag{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:8px;background:#003984;color:#fff;font-size:12px;font-weight:500;white-space:nowrap}'
    + '.ocm-title{margin:14px 0 6px;font-size:20px;font-weight:600;color:#1c1c1c;line-height:1.4}'
    + '.ocm-meta{font-size:13px;color:#777;margin-bottom:16px}'
    + '.ocm-body{border-top:1px solid #eee;padding-top:16px}'
    + '.ocm-p{font-size:15px;line-height:1.75;color:#333;margin:0 0 12px}';
  var mcsInjected = false;
  function injectMCS() {
    if (mcsInjected) return;
    var st = document.createElement('style');
    st.textContent = MCS;
    document.head.appendChild(st);
    mcsInjected = true;
  }
  function postByN(n) {
    for (var i = 0; i < POSTS.length; i++) if (POSTS[i].n === n) return POSTS[i];
    return null;
  }
  function onEsc(e) { if (e.key === 'Escape' || e.keyCode === 27) closeDetail(); }
  function closeDetail() {
    var m = document.querySelector('[data-ocm]');
    if (m && m.parentNode) m.parentNode.removeChild(m);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onEsc);
  }
  function openDetail(n) {
    var p = postByN(n);
    if (!p) return;
    injectMCS();
    closeDetail();
    var cat = CATLABEL[p.c] || p.c;
    var paras = String(p.b || '').split('\n').map(function (x) { return x.trim(); })
      .filter(function (x) { return x; })
      .map(function (x) { return '<p class="ocm-p">' + esc(x) + '</p>'; }).join('');
    var mask = document.createElement('div');
    mask.className = 'ocm-mask';
    mask.setAttribute('data-ocm', '1');
    mask.innerHTML = '<div class="ocm-panel" role="dialog" aria-modal="true" aria-label="咨询详情">'
      + '<button type="button" class="ocm-close" aria-label="关闭">&times;</button>'
      + '<div class="ocm-head"><span class="ocm-tag">' + esc(cat) + '</span>' + (p.p ? icon('ico-lock') : '') + (p.r ? icon('ico-reply') : '') + '</div>'
      + '<h3 class="ocm-title">' + esc(p.t) + '</h3>'
      + '<div class="ocm-meta">No. ' + p.n + ' &middot; ' + esc(p.a) + ' &middot; ' + p.d + '</div>'
      + '<div class="ocm-body">' + paras + '</div>'
      + '</div>';
    document.body.appendChild(mask);
    document.body.style.overflow = 'hidden';
    mask.addEventListener('click', function (e) {
      var t = e.target;
      if (t === mask || (t.closest && t.closest('.ocm-close'))) closeDetail();
    });
    document.addEventListener('keydown', onEsc);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var b = t.closest('[data-post-n]');
    if (b) { e.preventDefault(); openDetail(parseInt(b.getAttribute('data-post-n'), 10)); }
  });

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