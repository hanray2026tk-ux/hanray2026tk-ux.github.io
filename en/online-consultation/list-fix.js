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
    { n: 22, c: 'male-plastic-surgery', t: '下颌线与颈部提升可以一起做吗', a: 'J*', d: '2026-10-05', p: false, r: true, b: '我今年41岁，最近发现下颌线变松弛了，照片里的脖子也比镜子里看起来更厚。我想知道单独做下颌假体、颊脂垫去除或颈部提升，哪个效果最干净，还是联合手术更现实。\n我没有重大健康问题，可以在首尔停留十天左右。想了解通常的恢复过程，以及男性术后疤痕是否明显。' },
    { n: 21, c: 'male-plastic-surgery', t: '发际线降低还是额头假体，哪种侧面更自然？', a: 'P************', d: '2026-10-05', p: true, r: true, b: '我的额头偏高、发际线后移，显得整张脸比想要的更长。我正在发际线降低和额头假体之间犹豫，但不太清楚两者在疤痕和长期自然度上的区别。\n这对我来说比较私密，希望私下看照片。只做线上评估能否给出建议，还是必须到院面诊？' },
    { n: 20, c: 'nose', t: '鼻尖精修后鼻梁仍显宽', a: 'R*', d: '2026-09-15', p: false, r: true, b: '两年前做过鼻整形，鼻尖有改善，但正面鼻梁还是偏宽，照片里鼻子显得厚重。我不想要夸张的改变，只想让线条更直、更细，和脸型协调。\n想请问修复是否需要软骨移植，二次手术的肿胀大概多久消退？' },
    { n: 19, c: 'nose', t: '海外鼻整形后的修复', a: 'R*', d: '2026-09-15', p: true, r: true, b: '第一次鼻整形是在其他国家做的，术后鼻孔不对称，鼻尖略微下垂。我很担心再次手术，希望得到坦诚的意见：修复更可能改善，还是增加风险？\n如需要，我可以提供手术记录和近期照片。请对一切保密。' },
    { n: 18, c: 'orthognathic-surgery', t: '双颌手术改善地包天：恢复期疑问', a: 'A*****', d: '2026-09-02', p: false, r: true, b: '我有地包天，正畸医生建议做双颌手术。医学部分我能理解，最担心的是实际问题：需要在韩国待多久、多久能正常说话、第一周后能否用笔记本电脑工作。\n还想了解术前术后是否需要戴牙套，整个方案通常要多久。' },
    { n: 17, c: 'face-contouring', t: '颧骨缩小但不显脸平', a: 'L***', d: '2026-08-28', p: false, r: false, b: '我想缩窄颧骨宽度，但害怕术后中面部变平或日后下垂。看过一些案例不是太轻微就是太凹陷，我希望介于两者之间。\n能否在收窄两侧的同时保留容量？是否需要同时做提升？' },
    { n: 16, c: 'face-contouring', t: '12个月的面部女性化计划：眉骨、下颌与身体', a: 'J***********************', d: '2026-08-04', p: true, r: true, b: '我计划用大约一年时间完成面部女性化，希望分阶段手术，好在两次行程之间恢复。重点是眉骨降低、下颌与下巴塑形，以及部分身体塑形。\n能否帮我安排顺序并给出各阶段的大致预算？我更愿意仔细规划，而不是一次全部做完。' },
    { n: 15, c: 'orthognathic-surgery', t: '轻度下颌后缩：必须做骨骼手术，还是填充即可？', a: 'A*******', d: '2026-07-31', p: true, r: false, b: '有人告诉我我是轻度下颌后缩。若非必要我不想做完整的正颌手术，但也不想每年依赖填充。\n想了解骨骼手术在什么程度才值得做，以及差异在日常生活中是否明显，而不只是侧面照片。' },
    { n: 14, c: 'face-contouring', t: '圆脸做颧骨与下巴轮廓', a: 'M*****', d: '2026-07-30', p: false, r: false, b: '我的脸偏圆，照片里下巴几乎看不见，所以考虑颧骨缩小配合下巴延长。我不想改变自己，只想让比例更均衡。\n面诊后多久可以安排手术？前两周淤青明显吗？' },
    { n: 13, c: 'eye', t: '下眼睑成形还是脂肪重置，改善眼下凹陷？', a: 'D**********', d: '2026-07-28', p: false, r: false, b: '即使睡了一整晚我也显得疲惫，因为眼下凹陷发暗。我一直在了解下眼睑成形和脂肪重置，但不确定哪种更适合皮肤仍较紧致的情况。\n能否说明两者区别和效果通常能维持多久？也想知道能否在局部麻醉下完成。' },
    { n: 12, c: 'orthognathic-surgery', t: '决定手术前的费用预估', a: 'T*************', d: '2026-07-22', p: true, r: false, b: '在做出任何决定前，我希望得到正颌手术的诚实费用预估，包括住院、麻醉和复诊，以便合理安排预算。我不是要最终报价，只想要现实的范围。\n目前希望保留个人信息的私密性。了解数字后，我会准备好发送照片和完整病史。' },
    { n: 11, c: 'face-contouring', t: '眉骨降低与额头轮廓女性化', a: 'Y*****', d: '2026-07-18', p: false, r: false, b: '眉骨是最让我困扰的部位，同时希望额头更女性化。我了解到这项手术有时会改变鼻窦周围的感觉，想清楚了解这一风险。\n眼周肿胀会持续多久？最终形态何时显现？' },
    { n: 10, c: 'middle-age-eye', t: '五十多岁做上下眼睑手术', a: 'K*************', d: '2026-07-14', p: false, r: false, b: '我五十多岁，眼睑开始下垂，显得苍老且有些严肃。我想做上下眼睑手术，但担心看起来惊讶或眼神发亮。\n通常建议两项一起做吗？恢复正常社交前需要预留多少恢复时间？' },
    { n: 9, c: 'face-contouring', t: '下颌与下巴轮廓的第二意见', a: 'B***********', d: '2026-07-12', p: true, r: true, b: '我已经在别处咨询过一次下颌与下巴轮廓，但方案感觉很仓促，解释也让我不放心。希望在决定前听取第二意见。\n我可以提供之前的影像和拟定方案。请将此咨询视为保密。' },
    { n: 8, c: 'face-contouring', t: '下巴假体还是颏部滑移术，哪个更好？', a: 'B***********', d: '2026-07-12', p: true, r: false, b: '我的下巴后缩，正在假体和颏部滑移术之间选择。我知道假体更简单，但担心多年后的触感和外观。\n能否从恢复、持久性和自然度三方面坦诚比较？' },
    { n: 7, c: 'body-contouring', t: '手臂吸脂与皮肤紧致可以同时做吗？', a: 'L****', d: '2026-07-08', p: false, r: false, b: '我减了大约十五公斤，上臂即使锻炼也显得松弛。想知道单做吸脂是否足够，还是需要切除皮肤，两者能否一次完成。\n疤痕会是什么样？多久不能去健身房？' },
    { n: 6, c: 'orthognathic-surgery', t: '睡眠呼吸暂停与颌面手术：需要做哪些准备？', a: 'S********', d: '2026-07-07', p: false, r: false, b: '我有轻度睡眠呼吸暂停，医生说下颌前移可能同时改善呼吸和侧面轮廓。想了解有呼吸问题的人如何规划手术。\n出行前需要做哪些检查？术后如何监测气道？' },
    { n: 5, c: 'orthognathic-surgery', t: '鼻整形可以和正颌手术一起做吗？', a: 'H*******', d: '2026-07-07', p: true, r: false, b: '我因咬合问题需要颌面手术，同时也想改善鼻型。不确定一次完成更安全，还是相隔几个月分开做更好。\n能否说明两种方式的优点和风险，以及一项手术的肿胀如何影响另一项的安排？' },
    { n: 4, c: 'anti-aging', t: '考虑拉皮前先做非手术提升', a: 'G******', d: '2026-07-06', p: true, r: false, b: '我还没准备做拉皮，但下颌皮肤开始松弛，想先尝试创伤更小的方式。我在考虑线雕或超声紧致。\n想了解各自效果通常维持多久，以及到什么程度应当等一等再做正规拉皮。' },
    { n: 3, c: 'nose', t: '鼻整形前的鼻中隔偏曲与呼吸问题', a: 'W*****', d: '2026-07-06', p: false, r: false, b: '我有鼻中隔偏曲，经常只能单侧呼吸，睡觉时尤其明显。我也希望鼻部外观更直，但呼吸问题更重要。\n能否在同一次手术中同时改善功能和外观？这会改变手术规划吗？' },
    { n: 2, c: 'breast', t: '哺乳后的假体尺寸：如何选得自然', a: 'N*********', d: '2026-07-02', p: false, r: false, b: '两次怀孕后，我的胸部失去容量，位置也比以前低。我不想看起来明显做过，只想恢复原来的形状，稍微丰满一点。\n是否需要同时做提升？在小骨架怎样选尺寸才自然？' },
    { n: 1, c: 'face-contouring', t: '海外顾客的面部女性化咨询', a: 'N*********', d: '2026-07-01', p: false, r: true, b: '我从海外来，希望在行程中进行面部女性化咨询。主要关注眉骨、下颌和整体面部比例。\n需要提前提供哪些信息和照片？能否在我抵达前准备好治疗方案，以便充分利用行程？' }
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