
/* FANSHI price-inquiry form interactions (native fallback) */
(function () {
  'use strict';
  /* ===== Web3Forms 配置：把 access key 填在这里即可真正接收咨询（https://web3forms.com 免费获取） ===== */
  var WEB3FORMS_KEY = '51d963eb-9294-4b37-b736-184a307f60a8'; /* Web3Forms access key */
  var COUNTRIES = {"AF": "Afghanistan", "AX": "Åland Islands", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa", "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AG": "Antigua and Barbuda", "AR": "Argentina", "AM": "Armenia", "AW": "Aruba", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda", "BT": "Bhutan", "BO": "Bolivia, Plurinational State of", "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BR": "Brazil", "IO": "British Indian Ocean Territory", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "CV": "Cape Verde", "KY": "Cayman Islands", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CO": "Colombia", "KM": "Comoros", "CG": "Congo", "CD": "Democratic Republic of the Congo", "CK": "Cook Islands", "CR": "Costa Rica", "CI": "Côte d'Ivoire", "HR": "Croatia", "CU": "Cuba", "CW": "Curaçao", "CY": "Cyprus", "CZ": "Czech Republic", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "ET": "Ethiopia", "FK": "Falkland Islands (Malvinas)", "FO": "Faroe Islands", "FJ": "Fiji", "FI": "Finland", "FR": "France", "PF": "French Polynesia", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland", "GD": "Grenada", "GU": "Guam", "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau", "HT": "Haiti", "HN": "Honduras", "HK": "Hong Kong", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran, Islamic Republic of", "IQ": "Iraq", "IE": "Ireland", "IM": "Isle of Man", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "XK": "Kosovo", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Lao People's Democratic Republic", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MO": "Macao", "MK": "Republic of Macedonia", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MQ": "Martinique", "MR": "Mauritania", "MU": "Mauritius", "MX": "Mexico", "FM": "Micronesia, Federated States of", "MD": "Republic of Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MS": "Montserrat", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "KP": "North Korea", "MP": "Northern Mariana Islands", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PS": "Palestinian Territory", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PN": "Pitcairn", "PL": "Poland", "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar", "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia", "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome and Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SX": "Sint Maarten", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "KR": "South Korea", "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname", "SZ": "Swaziland", "SE": "Sweden", "CH": "Switzerland", "SY": "Syria", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad and Tobago", "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan", "TC": "Turks and Caicos Islands", "TV": "Tuvalu", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VE": "Venezuela, Bolivarian Republic of", "VN": "Viet Nam", "VI": "Virgin Islands", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"};
  var SURG1 = [
    {label:"Plastic Surgery", value:"plastic-surgery"},
    {label:"Dental", value:"dental"},
    {label:"Petit", value:"petit"},
    {label:"Dermatology", value:"dermatology"}
  ];
  var SURG2 = [
    {label:"Facial Contouring", value:"facial-contouring"},
    {label:"Nose", value:"nose"},
    {label:"ENT Nose", value:"ent-nose"},
    {label:"Orthognathic Surgery", value:"orthognathic-surgery"},
    {label:"Eye", value:"eye"},
    {label:"Middle Age Eye", value:"middle-age-eye"},
    {label:"Lifting", value:"lifting"},
    {label:"Breast Surgery", value:"breast-surgery"},
    {label:"Body Contouring", value:"body-contouring"},
    {label:"Male Plastic Surgery", value:"male-plastic-surgery"}
  ];

  var css = ''
    + '.rfs-wrap{position:relative}'
    + '.rfs-panel{position:absolute;left:0;right:0;top:100%;margin-top:4px;z-index:80;background:#fff;border:1px solid #ececec;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.12);max-height:300px;overflow:auto}'
    + '.rfs-panel.fx-hidden{display:none}'
    + '.rfs-search{position:sticky;top:0;background:#fff;padding:8px;border-bottom:1px solid #f0f0f0;z-index:1}'
    + '.rfs-search input{width:100%;height:36px;padding:0 10px;border:1px solid #ddd;border-radius:6px;outline:none;font-size:14px;box-sizing:border-box}'
    + '.rfs-item{display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:14px;color:#333;cursor:pointer}'
    + '.rfs-item:hover{background:#f6f6f6}'
    + '.rfs-flag{font-size:16px;line-height:1}'
    + '.surg-wrap{position:relative}'
    + '.surg-panel{position:absolute;top:100%;margin-top:4px;z-index:80;background:#fff;border:1px solid #ececec;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.12);max-height:300px;overflow:auto}'
    + '.surg-panel.fx-hidden{display:none}'
    + '.surg-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}'
    + '.surg-chip{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:100px;background:#f2f2f2;color:#333;font-size:13px}'
    + '.surg-chip .sx{cursor:pointer;color:#888;font-weight:700}'
    + '.fx-checked{background-color:#000f24;border-color:#000f24;color:#fff;align-items:center}'
    + '.fx-modal-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.fx-modal{background:#fff;border-radius:12px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25)}'
    + '.fx-modal-title{font-size:18px;font-weight:700;color:#1c1c1c;margin-bottom:8px}'
    + '.fx-modal-body{font-size:15px;color:#444;line-height:1.7;margin-bottom:20px}'
    + '.fx-modal-btn{display:block;width:100%;height:48px;border-radius:8px;background:#003984;color:#fff;font-size:16px;font-weight:600;border:0;cursor:pointer}'
    + '.fx-modal-btn:hover{opacity:.92}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function flag(cc){ return String(cc||'').replace(/[A-Z]/g, function(c){ return String.fromCodePoint(127397 + c.charCodeAt(0)); }); }
  function mk(tag, cls, html){ var n=document.createElement(tag); if(cls) n.className=cls; if(html!=null) n.innerHTML=html; return n; }

  /* ---------- 单选组 ---------- */
  var DOT = '<span data-state="checked" class="flex items-center justify-center"><span class="h-[8px] w-[8px] rounded-full bg-idh-secondary-05"></span></span>';
  function setRadio(btn, on){
    if(!btn) return;
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.setAttribute('data-state', on ? 'checked' : 'unchecked');
    var sp = btn.querySelector(':scope > span[data-state]');
    if(on){ if(!sp) btn.insertAdjacentHTML('beforeend', DOT); }
    else { if(sp) sp.remove(); }
    var host = btn.parentElement;
    var inp = host ? host.querySelector('input[type="radio"]') : null;
    if(inp) inp.checked = !!on;
  }
  function groupOf(node){ var n=node; while(n && n.getAttribute){ if(n.getAttribute('role')==='radiogroup') return n; n=n.parentElement; } return null; }
  function getVal(group){ var b = group && group.querySelector('button[role="radio"][aria-checked="true"]'); return b ? b.getAttribute('value') : null; }

  var contactG1 = document.getElementById('messenger') ? groupOf(document.getElementById('messenger')) : null;
  var contactG2 = document.getElementById('app') ? groupOf(document.getElementById('app')) : null;

  function selectRadio(btn){
    var g = groupOf(btn); if(!g) return;
    var radios = g.querySelectorAll('button[role="radio"]');
    for(var i=0;i<radios.length;i++) setRadio(radios[i], radios[i]===btn);
    if(g===contactG1 || g===contactG2) linkContact();
  }
  document.addEventListener('click', function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var lab = t.closest('label[for]');
    if(lab){
      var id = lab.getAttribute('for');
      var b = id ? document.getElementById(id) : null;
      if(b && b.getAttribute('role')==='radio'){ e.preventDefault(); selectRadio(b); return; }
    }
    var rb = t.closest('button[role="radio"]');
    if(rb){ e.preventDefault(); selectRadio(rb); return; }
  }, true);

  /* ---------- 联系方式联动 ---------- */
  function cloneField(template, labelText, placeholder){
    var f = template.cloneNode(true);
    var lab = f.querySelector('[data-slot="field-label"]');
    if(lab) lab.textContent = labelText;
    var inp = f.querySelector('input');
    if(inp){ inp.value=''; inp.setAttribute('placeholder', placeholder); inp.removeAttribute('id'); }
    return f;
  }
  function linkContact(){
    if(!contactG1 || !contactG2) return;
    var v1 = getVal(contactG1), v2 = getVal(contactG2);
    var secondary = contactG2.parentElement; /* 包裹二级组 + 联系电话 */
    var phoneField = secondary ? secondary.querySelector('[data-slot="field"]') : null;
    var host = contactG1.parentElement;

    /* 一级：邮箱 -> 隐藏二级组并显示邮箱输入框 */
    var emailField = document.getElementById('fx-email-field');
    if(v1 === 'email'){
      if(secondary) secondary.style.display = 'none';
      if(!emailField && phoneField && host){
        emailField = cloneField(phoneField, 'E-mail', 'Enter your e-mail');
        emailField.id = 'fx-email-field';
        host.appendChild(emailField);
      }
    } else {
      if(secondary) secondary.style.display = '';
      if(emailField) emailField.remove();
    }

    /* 二级：非 WhatsApp -> 显示 客服 ID 输入框 */
    var idField = document.getElementById('fx-messengerid-field');
    if(v1 === 'messenger' && v2 && v2 !== 'app'){
      if(!idField && phoneField && secondary){
        idField = cloneField(phoneField, '客服 ID', 'Please type in your messenger id');
        idField.id = 'fx-messengerid-field';
        secondary.insertBefore(idField, phoneField);
      }
    } else {
      if(idField) idField.remove();
    }
  }
  linkContact();

  /* ---------- 国籍下拉 ---------- */
  (function(){
    var wrap = document.querySelector('.flags-select');
    var btn = document.getElementById('rfs-btn');
    if(!wrap || !btn) return;
    wrap.classList.add('rfs-wrap');
    var panel = mk('div','rfs-panel fx-hidden');
    var searchBox = mk('div','rfs-search');
    var search = mk('input'); search.setAttribute('placeholder','Search countries...'); search.setAttribute('type','text');
    searchBox.appendChild(search); panel.appendChild(searchBox);
    var list = mk('div','rfs-list'); panel.appendChild(list);
    wrap.appendChild(panel);

    var entries = Object.keys(COUNTRIES).map(function(code){ return {code:code, name:COUNTRIES[code]}; });
    entries.sort(function(a,b){ return a.name.localeCompare(b.name); });

    function render(kw){
      list.innerHTML='';
      var k = (kw||'').trim().toLowerCase();
      entries.forEach(function(en){
        if(k && en.name.toLowerCase().indexOf(k)===-1) return;
        var it = mk('div','rfs-item');
        it.innerHTML = '<span class="rfs-flag">'+flag(en.code)+'</span><span>'+en.name+'</span>';
        it.addEventListener('click', function(ev){
          ev.stopPropagation();
          var vs = btn.querySelector('span');
          if(vs) vs.innerHTML = flag(en.code)+'&nbsp;'+en.name;
          btn.setAttribute('data-value', en.code);
          close();
        });
        list.appendChild(it);
      });
    }
    function open(){ panel.classList.remove('fx-hidden'); render(''); search.value=''; search.focus(); }
    function close(){ panel.classList.add('fx-hidden'); }
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if(panel.classList.contains('fx-hidden')) open(); else close();
    });
    search.addEventListener('input', function(){ render(search.value); });
    search.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('click', function(){ if(!panel.classList.contains('fx-hidden')) close(); });
  })();

  /* ---------- 手术目录 ---------- */
  (function(){
    var label = null, labels = document.querySelectorAll('[data-slot="field-label"]');
    for(var i=0;i<labels.length;i++){ if(labels[i].textContent.trim()==='手术目录'){ label = labels[i]; break; } }
    if(!label) return;
    var field = label.closest('[data-slot="field"]'); if(!field) return;
    var btns = field.querySelectorAll('button'); if(btns.length < 2) return;
    var btn1 = btns[0], btn2 = btns[1];
    var row = btn1.parentElement;
    var host = row.parentElement;
    host.classList.add('surg-wrap');

    var panel = mk('div','surg-panel fx-hidden'); host.appendChild(panel);
    var chips = mk('div','surg-chips'); host.appendChild(chips);
    var picked = [];
    var cat = '';

    function setBtnLabel(btn, text){
      var s = btn.querySelector('span'); if(s) s.textContent = text;
    }
    function renderChips(){
      chips.innerHTML='';
      chips.setAttribute('data-codes', picked.map(function(p){ return p.value; }).join(','));
      picked.forEach(function(p){
        var c = mk('span','surg-chip');
        c.innerHTML = '<span>'+p.label+'</span>';
        var x = mk('span','sx','&times;');
        x.addEventListener('click', function(ev){ ev.stopPropagation(); picked = picked.filter(function(q){return q.value!==p.value;}); renderChips(); });
        c.appendChild(x);
        chips.appendChild(c);
      });
    }
    function addChip(v){
      if(!picked.some(function(q){return q.value===v.value;})) picked.push(v);
      renderChips();
    }
    function openPanel(opts, leftPct, widthPct, onPick){
      panel.innerHTML='';
      opts.forEach(function(o){
        var it = mk('div','rfs-item','<span>'+o.label+'</span>');
        it.addEventListener('click', function(ev){ ev.stopPropagation(); onPick(o); panel.classList.add('fx-hidden'); });
        panel.appendChild(it);
      });
      panel.style.left = leftPct; panel.style.width = widthPct;
      panel.classList.remove('fx-hidden');
    }
    function closePanel(){ panel.classList.add('fx-hidden'); }

    btn1.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if(!panel.classList.contains('fx-hidden') && panel.getAttribute('data-for')==='1'){ closePanel(); return; }
      panel.setAttribute('data-for','1');
      openPanel(SURG1, '0', 'calc(50% - 6px)', function(v){
        if(v.value==='plastic-surgery'){ cat='plastic-surgery'; setBtnLabel(btn1, v.label); }
        else { addChip(v); cat=''; setBtnLabel(btn1,'选择'); }
      });
    });
    btn2.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if(!panel.classList.contains('fx-hidden') && panel.getAttribute('data-for')==='2'){ closePanel(); return; }
      panel.setAttribute('data-for','2');
      openPanel(SURG2, '50%', 'calc(50% - 6px)', function(v){
        addChip(v);
        cat=''; setBtnLabel(btn1,'选择');
      });
    });
    document.addEventListener('click', function(){ closePanel(); });
    panel.addEventListener('click', function(e){ e.stopPropagation(); });
  })();

  /* ---------- 同意条款复选框 ---------- */
  (function(){
    var cb = document.querySelector('[role="checkbox"]');
    if(!cb) return;
    var CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
    function setChecked(on){
      cb.setAttribute('aria-checked', on ? 'true' : 'false');
      cb.setAttribute('data-state', on ? 'checked' : 'unchecked');
      if(on){
        cb.classList.add('fx-checked');
        if(!cb.querySelector('svg')) cb.insertAdjacentHTML('beforeend', CHECK);
      } else {
        cb.classList.remove('fx-checked');
        var sv = cb.querySelector('svg'); if(sv) sv.remove();
      }
    }
    function toggle(){ setChecked(cb.getAttribute('aria-checked') !== 'true'); }
    cb.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); toggle(); });
    var lbl = document.getElementById(cb.getAttribute('aria-labelledby'));
    if(lbl){
      lbl.addEventListener('click', function(e){
        if(e.target.closest && e.target.closest('a')) return; /* 政策链接不切换勾选 */
        e.preventDefault(); toggle();
      });
    }
  })();

  /* ---------- 立即提交 ---------- */
  (function(){
    var submitBtn = null, all = document.querySelectorAll('button');
    for(var i=0;i<all.length;i++){ if(all[i].textContent.trim()==='立即提交'){ submitBtn = all[i]; break; } }
    if(!submitBtn) return;
    var rfsBtn = document.getElementById('rfs-btn');
    var cb = document.querySelector('[role="checkbox"]');

    function fieldByLabel(text){
      var labels = document.querySelectorAll('[data-slot="field-label"]');
      for(var i=0;i<labels.length;i++){
        if(labels[i].textContent.trim().indexOf(text)===0) return labels[i].closest('[data-slot="field"]');
      }
      return null;
    }
    function radioVal(field){
      var b = field && field.querySelector('button[role="radio"][aria-checked="true"]');
      return b ? b.getAttribute('value') : null;
    }
    var MT = { app:'whatsapp', kakao:'kakao', line:'line', others:'others' };
    function collect(){
      var nameEl = document.getElementById('field-name');
      var phoneEl = document.querySelector('input[placeholder="Please enter country code"]');
      var emailEl = document.querySelector('#fx-email-field input');
      var midEl = document.querySelector('#fx-messengerid-field input');
      var msgEl = document.querySelector('textarea[placeholder="Enter your message"]');
      var chips = document.querySelector('.surg-chips');
      var natCode = rfsBtn ? rfsBtn.getAttribute('data-value') : '';
      var cm = getVal(contactG1), mt = getVal(contactG2);
      return {
        name: nameEl ? nameEl.value.trim() : '',
        nationality_code: natCode || '',
        nationality: natCode ? (COUNTRIES[natCode] || natCode) : '',
        contact_method: cm || '',
        messenger_type: (cm==='messenger' && mt) ? (MT[mt] || mt) : '',
        messenger_id: (midEl && midEl.value.trim()) || '',
        phone: (phoneEl && phoneEl.value.trim()) || '',
        email: (emailEl && emailEl.value.trim()) || '',
        picture_status: radioVal(fieldByLabel('能否提供您的照片')) || '',
        age_range: radioVal(fieldByLabel('年龄')) || '',
        surgery_codes: chips ? (chips.getAttribute('data-codes') || '') : '',
        message: msgEl ? msgEl.value.trim() : ''
      };
    }

    function showModal(title, bodyHtml, okText){
      var mask = mk('div','fx-modal-mask');
      var box = mk('div','fx-modal');
      box.innerHTML = '<div class="fx-modal-title"></div><div class="fx-modal-body"></div>';
      box.querySelector('.fx-modal-title').textContent = title;
      box.querySelector('.fx-modal-body').innerHTML = bodyHtml;
      var act = mk('div');
      var ok = mk('button','fx-modal-btn'); ok.type='button'; ok.textContent = okText || 'OK';
      ok.addEventListener('click', function(){ mask.remove(); });
      act.appendChild(ok); box.appendChild(act);
      mask.appendChild(box);
      mask.addEventListener('click', function(e){ if(e.target===mask) mask.remove(); });
      document.body.appendChild(mask);
      ok.focus();
    }

    function setBusy(on){
      submitBtn.disabled = !!on;
      submitBtn.style.opacity = on ? '.6' : '';
      submitBtn.textContent = on ? '提交中...' : '立即提交';
    }

    submitBtn.addEventListener('click', function(e){
      e.preventDefault();
      var d = collect();
      var errs = [];
      if(!d.name) errs.push('请输入姓名（Name）');
      if(!d.nationality_code) errs.push('请选择国籍（Nationality）');
      if(!cb || cb.getAttribute('aria-checked') !== 'true') errs.push('请勾选「同意收集和使用个人信息」');
      if(errs.length){
        showModal('Please check your input', errs.join('<br>'), 'OK');
        return;
      }
      if(!WEB3FORMS_KEY){
        showModal('提示', '本站为静态站点，尚未接入表单提交后台，您的咨询还没有真正发送出去。', '确定');
        return;
      }
      setBusy(true);
      var payload = {
        access_key: WEB3FORMS_KEY,
        subject: 'Price Inquiry - ' + d.name,
        from_name: 'FANSHI Website',
        name: d.name,
        nationality: d.nationality + (d.nationality_code ? ' (' + d.nationality_code + ')' : ''),
        contact_method: d.contact_method,
        messenger_type: d.messenger_type,
        messenger_id: d.messenger_id,
        phone: d.phone,
        email: d.email,
        age_range: d.age_range,
        picture_status: d.picture_status,
        surgery_codes: d.surgery_codes,
        message: d.message,
        privacy_agreed: true
      };
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r){ return r.json(); }).then(function(res){
        setBusy(false);
        if(res && res.success){
          showModal('提交成功', '您的咨询已发送成功，我们会尽快与您联系。<br>Your inquiry has been successfully submitted.', '确定');
        } else {
          showModal('提交失败', (res && res.message) ? res.message : '抱歉，提交失败，请稍后再试。', 'OK');
        }
      }).catch(function(){
        setBusy(false);
        showModal('提交失败', '网络异常，请检查网络后重试。', 'OK');
      });
    });
  })();

})();
