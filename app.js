// Core application module.
// Responsibilities:
// - Daily report ID sequence (in-memory, resets by date)
// - Questionnaire rendering & navigation
// - Gender-based item filtering (湿热体质差异题)
// - Scoring + constitution classification (平和安全判定)
// - HTML report assembly + debug actions
// No persistence layer; refresh clears all state.

// ================== 编号阶段 & 报告编号生成（每日重置） ==================
let __reportSeqDate = null;
let __reportSeqCounter = 0;
const __ID_STAGES = [
  { letters:0, digits:5 }, // 00001-99999
  { letters:1, digits:4 }, // A0001-Z9999
  { letters:2, digits:3 }, // AA001-ZZ999
  { letters:3, digits:2 }, // AAA01-ZZZ99
  { letters:4, digits:1 }, // AAAA1-ZZZZ9
  { letters:5, digits:0 }  // AAAAA-ZZZZZ
];
let __ID_STAGE_CAPS = null;
let __ID_MAX_INDEX = null;
function __initIdCaps(){
  if(__ID_STAGE_CAPS) return;
  __ID_STAGE_CAPS = [];
  let total = 0;
  __ID_STAGES.forEach(st => {
    const numRange = st.digits === 0 ? 1 : (Math.pow(10, st.digits) - 1);
    const letterComb = Math.pow(26, st.letters);
    const cap = letterComb * numRange;
    __ID_STAGE_CAPS.push(cap);
    total += cap;
  });
  __ID_MAX_INDEX = total;
}
function __indexToToken(idx){
  __initIdCaps();
  if(idx < 1) idx = 1;
  if(idx > __ID_MAX_INDEX) idx = __ID_MAX_INDEX;
  let remain = idx;
  for(let stage=0; stage<__ID_STAGES.length; stage++){
    const cap = __ID_STAGE_CAPS[stage];
    if(remain > cap){ remain -= cap; continue; }
    const st = __ID_STAGES[stage];
    const numRange = st.digits === 0 ? 1 : (Math.pow(10, st.digits) - 1);
    if(st.letters === 0){
      return String(remain).padStart(st.digits, '0');
    }
    const groupIndex = Math.floor((remain - 1) / numRange);
    const numVal = ((remain - 1) % numRange) + 1;
    let letters = '';
    let tmp = groupIndex;
    for(let i=0; i<st.letters; i++){
      const pow = Math.pow(26, st.letters - i - 1);
      const d = Math.floor(tmp / pow);
      tmp = tmp % pow;
      letters += String.fromCharCode(65 + d);
    }
    const digitsPart = st.digits === 0 ? '' : String(numVal).padStart(st.digits, '0');
    return letters + digitsPart;
  }
  return 'ZZZZZ';
}
function __tokenToIndex(token){
  __initIdCaps();
  if(typeof token !== 'string' || token.length !== 5) return null;
  token = token.toUpperCase();
  let digitsCount = 0;
  for(let i=4;i>=0;i--){ if(/\d/.test(token[i])) digitsCount++; else break; }
  const lettersCount = 5 - digitsCount;
  const stageIndex = __ID_STAGES.findIndex(s => s.letters === lettersCount && s.digits === digitsCount);
  if(stageIndex === -1) return null;
  const numRange = digitsCount === 0 ? 1 : (Math.pow(10, digitsCount) - 1);
  const letterPart = token.slice(0, lettersCount);
  const digitPart = token.slice(lettersCount);
  if(lettersCount === 0){
    if(!/^\d{5}$/.test(token)) return null;
    const numVal = Number(token);
    if(numVal < 1) return null;
    return numVal;
  }
  if(lettersCount > 0 && !new RegExp('^[A-Z]{'+lettersCount+'}$').test(letterPart)) return null;
  if(digitsCount > 0){
    if(!new RegExp('^\d{'+digitsCount+'}$').test(digitPart)) return null;
    const numVal = Number(digitPart);
    if(numVal < 1 || numVal > numRange) return null;
  }
  let groupIndex = 0;
  for(let i=0;i<lettersCount;i++){
    const cCode = letterPart.charCodeAt(i) - 65;
    groupIndex = groupIndex * 26 + cCode;
  }
  const numVal = digitsCount === 0 ? 1 : Number(digitPart);
  let offsetBefore = 0;
  for(let i=0;i<stageIndex;i++){ offsetBefore += __ID_STAGE_CAPS[i]; }
  const indexInStage = groupIndex * numRange + numVal;
  return offsetBefore + indexInStage;
}
function resetReportSequence(){
  const now = new Date();
  __reportSeqDate = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  __reportSeqCounter = 0;
}
function generateReportId(){
  const now = new Date();
  const today = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  if(__reportSeqDate !== today){ resetReportSequence(); }
  __reportSeqCounter += 1;
  const token = __indexToToken(__reportSeqCounter);
  updateReportIdDebug();
  return 'TCM'+__reportSeqDate+token;
}
function updateReportIdDebug(){
  const el = document.getElementById('reportIdCurrent');
  if(!el) return;
  if(!__reportSeqDate){ el.textContent='(未生成)'; return; }
  el.textContent = 'TCM'+__reportSeqDate+__indexToToken(Math.max(__reportSeqCounter,1));
}

// ================== 报告生成辅助 ==================
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}
function mapConstitutionResult(key, score, classification){
  if(key === 'pinghe'){
    if(classification.pinghe) return '<span class="badge pinghe">平和</span>';
    if(score >= 50) return '基本平和';
    return '未达平和';
  }
  if(score >= 40) return '<span class="badge">主要</span>';
  if(score >= 30) return '<span class="badge tendency">倾向</span>';
  return '参考';
}
function buildProfessionalReport(scores, classification, userInfo, reportId) {
  const container = document.getElementById('finalReport');
  if (!container) return;
  const ts = new Date();
  const genTime = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}`;
  const genDateCn = `${ts.getFullYear()}年${String(ts.getMonth()+1).padStart(2,'0')}月${String(ts.getDate()).padStart(2,'0')}日`;
  const name = userInfo?.name || '用户未填写';
  const gender = userInfo?.gender || '用户未填写';
  const age = userInfo?.age ? String(userInfo.age) : '用户未填写';
  const rows = Object.keys(scores).map(key => {
    const obj = scores[key];
    const transformed = obj && typeof obj === 'object' ? obj.transformed : 0;
    const result = mapConstitutionResult(key, transformed, classification);
    const nameCn = obj && obj.name ? obj.name : key;
    return { key, name: nameCn, score: transformed, result };
  });
  const main = classification.main || [];
  const tendency = classification.tendency || [];
  function rand(){ return Math.random(); }
  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } }
  function pickSome(list, min=2, max=3){ if(!Array.isArray(list)||!list.length) return []; if(list.length<=min) return list.slice(); const n=Math.min(max,list.length); const pool=list.slice(); shuffle(pool); return pool.slice(0,n); }
  function generateIntelligentReportHTML(){
    const kb = window.KNOWLEDGE_BASE || {};
    const comboRules = window.COMBO_RULES || {};
    const activeKeys = [];
    if(classification.pinghe) activeKeys.push('pinghe');
    classification.main.forEach(s=>activeKeys.push(s.key));
    classification.tendency.forEach(s=>{ if(!activeKeys.includes(s.key)) activeKeys.push(s.key); });
    if(activeKeys.length === 0){
      if(scores['pinghe']) activeKeys.push('pinghe'); else {
        const top = Object.values(scores).sort((a,b)=>b.transformed - a.transformed)[0];
        if(top) activeKeys.push(top.key);
      }
    }
    const singleFocus = activeKeys.length === 1;
    function scoreStrength(val){
      if(val >= 60) return { text: '关注', cls: 'strength-label strength-strong' };
      if(val >= 40) return { text: '建议', cls: 'strength-label strength-normal' };
      if(val >= 30) return { text: '适当注意', cls: 'strength-label strength-light' };
      return { text: '参考', cls: 'strength-label strength-light' };
    }
    function pickCategories(obj){
      const keys = Object.keys(obj || {});
      if(singleFocus) return keys;
      if(!keys.length) return [];
      if(keys.length <= 4) return keys;
      const pool = keys.slice(); shuffle(pool); return pool.slice(0,4);
    }
    function pickItems(items, single){ if(single) return items.slice(); if(!Array.isArray(items)||!items.length) return []; return pickSome(items,1,2); }
    let part = '<h2 class="section-title">四、智能分析报告</h2>';
    activeKeys.forEach(key => {
      const sc = scores[key]; const data = kb[key]; if(!sc||!data) return; const st = scoreStrength(sc.transformed);
      part += `<div class="analysis-block smart-block"><h4>${escapeHtml(sc.name)} <span class='${st.cls}'>${st.text}</span></h4>`;
      if(Array.isArray(data.symptoms)&&data.symptoms.length){ part += `<p><strong>症状表现：</strong>${escapeHtml(data.symptoms.join('；'))}</p>`; }
      const adviceObj = data.advice || {}; const cats = pickCategories(adviceObj);
      cats.forEach(cat => { const items = pickItems(adviceObj[cat]||[], singleFocus); if(!items.length) return; part += `<p>【${escapeHtml(cat)}】方面调护：${escapeHtml(items.join('；'))}</p>`; });
      part += '</div>';
    });
    const nonPingheKeys = activeKeys.filter(k=>'pinghe'!==k);
    if(nonPingheKeys.length >= 2){
      const combosShown = [];
      for(let i=0;i<nonPingheKeys.length;i++){
        for(let j=i+1;j<nonPingheKeys.length;j++){
          const a = nonPingheKeys[i]; const b = nonPingheKeys[j]; const pairKey = [a,b].sort().join('+');
          if(comboRules[pairKey]) combosShown.push(`<strong>${escapeHtml(scores[a].name)} + ${escapeHtml(scores[b].name)}：</strong>${escapeHtml(comboRules[pairKey])}`);
        }
      }
      if(combosShown.length){ part += '<div class="analysis-block smart-block"><h4>兼夹体质综合提示</h4>' + combosShown.map(line=>`<p>${line}</p>`).join('') + '</div>'; }
    }
    return part;
  }
  let html = '';
  html += '<h1 class="report-title">中医体质测评报告</h1>';
  html += '<div class="report-subtitle">基于《中医体质分类与判定自测表》（中华中医药学会标准）</div>';
  html += '<h2 class="section-title">一、基本信息</h2>';
  html += '<table class="base-info-table"><tbody>';
  html += `<tr><th>姓名</th><td>${escapeHtml(name)}</td></tr>`;
  html += `<tr><th>性别</th><td>${escapeHtml(gender)}</td></tr>`;
  html += `<tr><th>年龄</th><td>${escapeHtml(age)}</td></tr>`;
  html += `<tr><th>测评ID</th><td class="code-id">${reportId}</td></tr>`;
  html += `<tr><th>测评日期</th><td>${genDateCn}</td></tr>`;
  html += '</tbody></table>';
  html += '<h2 class="section-title">二、总体判定</h2>';
  let overall = '';
  if (classification.pinghe) overall = '主要体质：<strong>平和质</strong><span class="badge pinghe">主要</span>';
  const mainNames = (classification.main||[]).map(s=>s.name||s.key).filter(Boolean);
  const tendencyNames = (classification.tendency||[]).map(s=>s.name||s.key).filter(Boolean);
  if (!classification.pinghe) {
    if (mainNames.length) overall += '主要体质：' + mainNames.map(n=>`<strong>${escapeHtml(n)}</strong><span class="badge">主要</span>`).join('、'); else overall += '主要体质：无';
    if (tendencyNames.length) overall += '；兼有 ' + tendencyNames.map(n=>`<strong>${escapeHtml(n)}</strong><span class="badge tendency">倾向</span>`).join('、');
  }
  if (!overall) overall = `测评编号：<span class="code-id">${reportId}</span>`;
  html += `<div class="highlight-overall">${overall}</div>`;
  html += '<div class="small">说明：“主要”表示该体质转化分≥40；“倾向”表示30~39；平和质需满足其标准（≥60 且其他均 <40）。</div>';
  html += '<h2 class="section-title">三、体质得分与判定</h2>';
  html += '<table class="score-table"><thead><tr><th>体质类型</th><th>转化分数</th><th>判定结果</th><th>参考范围</th></tr></thead><tbody>';
  rows.forEach(r=>{ const ref = r.key==='pinghe'?'≥60 分（且其他 <40）':'≥40 分（30~39 倾向）'; html += `<tr><td>${escapeHtml(r.name)}</td><td>${r.score.toFixed(1)}</td><td>${r.result}</td><td>${ref}</td></tr>`; });
  html += '</tbody></table>';
  html += generateIntelligentReportHTML();
  html += '<div class="footer-note">本报告基于问卷自评结果自动生成，仅供学习与参考。如需获得进一步健康指导，请咨询专业医师或相关机构。</div>';
  html += `<div class="gen-time">生成时间：${genTime}</div>`;
  container.innerHTML = html;
  container.dataset.reportId = reportId;
}

(function(){
  const constitutions = window.CONSTITUTIONS || [];
  const OPTION_VALUES = window.OPTION_VALUES || [1,2,3,4,5];
  const CONST = window.CONST || {};
  const OPTION_LABELS_GLOBAL = CONST.OPTION_LABELS || {1:'没有',2:'很少',3:'有些',4:'经常',5:'总是'};
  const currentConstitutionNameEl = document.getElementById('currentConstitutionName');
  const completedCountEl = document.getElementById('completedCount');
  const constitutionTitleEl = document.getElementById('constitutionTitle');
  const questionsContainerEl = document.getElementById('questionsContainer');
  const prevGroupBtn = document.getElementById('prevGroupBtn');
  const nextGroupBtn = document.getElementById('nextGroupBtn');
  const questionSection = document.getElementById('questionSection');
  const resultSection = document.getElementById('resultSection');
  const restartBtn = document.getElementById('restartBtn');
  const debugPanel = document.getElementById('debugPanel');
  const closeDebugBtn = document.getElementById('closeDebugBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');
  const notifyBar = document.getElementById('notifyBar');
  let notifyTimer = null;
  if(debugPanel) debugPanel.hidden = true;
  let state = { currentIndex: 0, answers: {}, finished: false, mode: 'sequential', order: [], user: { name:'', gender:'', age:'' } };
  let lastScores = null, lastClassification = null, lastReportId = null;
  let prng = null;
  function rand(){ return prng ? prng() : Math.random(); }
  // 统一题目过滤（性别相关）
  function getFilteredQuestions(c, gender){
    if(!c || !Array.isArray(c.questions)) return [];
    return c.questions.filter(q => {
      if(c.key === 'shire'){
        if(gender === '男' && /带下/.test(q.text)) return false;
        if(gender === '女' && /阴囊/.test(q.text)) return false;
      }
      return true;
    });
  }
  function ensureOrder(){
    if(!Array.isArray(state.order) || state.order.length !== constitutions.length){
      state.order = constitutions.map((_,i)=>i);
      if(state.mode === 'random'){
        for(let i=state.order.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [state.order[i],state.order[j]]=[state.order[j],state.order[i]]; }
      }
    }
  }
  function renderCurrent(){
    if(state.finished){ showResult(); return; }
    updateResetBtnVisibility(); ensureOrder();
    const idx = state.order[state.currentIndex]; const current = constitutions[idx]; if(!current) return;
    const filteredQuestions = getFilteredQuestions(current, state.user.gender);
    currentConstitutionNameEl.textContent = current.name;
    constitutionTitleEl.textContent = current.name + '（第 '+ (state.currentIndex+1) +' 组）';
    completedCountEl.textContent = state.currentIndex;
    questionsContainerEl.innerHTML = '';
    let answerArr = state.answers[current.key];
    if(!Array.isArray(answerArr) || answerArr.length !== filteredQuestions.length){
      answerArr = Array(filteredQuestions.length).fill(null);
      state.answers[current.key] = answerArr;
    }
    filteredQuestions.forEach((q, qi)=>{
      const item = document.createElement('div'); item.className='question-item';
      const qText = document.createElement('p'); qText.className='question-text'; qText.textContent=(qi+1)+'. '+q.text;
      const opts = document.createElement('div'); opts.className='options';
      OPTION_VALUES.forEach(val => {
        const label = document.createElement('label'); label.className='option-label'; label.textContent = OPTION_LABELS_GLOBAL[val];
        const input = document.createElement('input'); input.type='radio'; input.name=current.key+'_q_'+qi; input.value=val;
        if(answerArr[qi]===val){ input.checked=true; label.classList.add('active'); }
        input.addEventListener('change', ()=>{ answerArr[qi]=Number(input.value); state.answers[current.key]=answerArr; [...opts.querySelectorAll('.option-label')].forEach(l=>l.classList.remove('active')); label.classList.add('active'); updateNextButtonState(); });
        label.appendChild(input); opts.appendChild(label);
      });
      item.appendChild(qText); item.appendChild(opts); questionsContainerEl.appendChild(item);
    });
    prevGroupBtn.disabled = state.currentIndex === 0; updateNextButtonState();
  }
  function updateNextButtonState(){
    const idx = state.order[state.currentIndex]; const current = constitutions[idx];
    const filteredQuestions = getFilteredQuestions(current, state.user.gender);
    const answerArr = state.answers[current.key] || [];
    const allAnswered = answerArr.length === filteredQuestions.length && answerArr.every(v=>typeof v==='number');
    nextGroupBtn.disabled = !allAnswered;
    nextGroupBtn.textContent = state.currentIndex === constitutions.length -1 ? '完成测评' : '下一组';
  }
  prevGroupBtn.addEventListener('click', ()=>{ if(state.currentIndex>0){ state.currentIndex--; renderCurrent(); } });
  nextGroupBtn.addEventListener('click', ()=>{ ensureOrder(); const idx = state.order[state.currentIndex]; const c = constitutions[idx]; const answerArr = state.answers[c.key]; if(!answerArr||answerArr.some(v=>v==null)) return; if(state.currentIndex < constitutions.length -1){ state.currentIndex++; renderCurrent(); } else { state.finished=true; showResult(); } });
  if(restartBtn){ restartBtn.addEventListener('click', ()=>{ state={ currentIndex:0, answers:{}, finished:false, mode:'sequential', order:[], user: state.user }; resultSection.hidden=true; questionSection.hidden=false; updateResetBtnVisibility(); renderCurrent(); }); }
  function resetToIntro(){ const currentMode = state.mode; state={ currentIndex:0, answers:{}, finished:false, mode:currentMode, order:[], user:{ name:'', gender:'', age:'' } }; resetReportSequence(); if(introSection){ introSection.hidden=false; questionSection.hidden=true; resultSection.hidden=true; if(orderModeSelect){ orderModeSelect.disabled=false; orderModeSelect.value=state.mode; } if(userNameInput) userNameInput.value=''; if(userGenderSelect) userGenderSelect.value=''; if(userAgeInput) userAgeInput.value=''; if(userInfoErrorEl) userInfoErrorEl.textContent=''; if(ageErrorEl){ ageErrorEl.hidden=true; ageErrorEl.textContent=''; } updateResetBtnVisibility(); showNotice('已重置并返回信息填写页'); } else { questionSection.hidden=false; resultSection.hidden=true; updateResetBtnVisibility(); renderCurrent(); } }
  if(resetAllBtn){ resetAllBtn.addEventListener('click', ()=>{ if(window.confirm('将清空答题与预留信息并返回信息填写页，确认重置吗？')) resetToIntro(); }); }
  function calculateScores(){
    const scores={};
    constitutions.forEach(c=>{
      const filteredQuestions = getFilteredQuestions(c, state.user.gender);
      const ans=state.answers[c.key]||[];
      if(ans.length !== filteredQuestions.length) return; // 未完成此体质
      let raw=0;
      filteredQuestions.forEach((q,i)=>{ let val=ans[i]; if(q.reverse) val=6-val; raw+=val; });
      const n=filteredQuestions.length; const transformed=((raw-n)/(n*4))*100;
      scores[c.key]={ raw, transformed, count:n, name:c.name, key:c.key };
    });
    return scores;
  }
  function classify(scores){
    const result={ main:[], tendency:[], pinghe:false };
    const pingheScore=scores['pinghe'];
    if(pingheScore){
      const otherKeys = constitutions.map(c=>c.key).filter(k=>k!=='pinghe');
      const allOthersHaveScore = otherKeys.every(k=>!!scores[k]);
      const othersAllBelow40 = allOthersHaveScore && otherKeys.every(k=>scores[k].transformed < 40);
      if(pingheScore.transformed>=60 && othersAllBelow40){
        result.pinghe=true; result.main.push(pingheScore);
      }
    }
    if(!result.pinghe){
      Object.keys(scores).forEach(k=>{
        if(k==='pinghe') return;
        const s=scores[k];
        if(s.transformed>=40) result.main.push(s); else if(s.transformed>=30) result.tendency.push(s);
      });
    }
    return result;
  }
  function showResult(){ const scores = calculateScores(); const classification = classify(scores); lastScores=scores; lastClassification=classification; const reportId=generateReportId(); lastReportId=reportId; buildProfessionalReport(scores, classification, state.user, reportId); questionSection.hidden=true; resultSection.hidden=false; updateResetBtnVisibility(); }
  const introSection = document.getElementById('introSection');
  const startBtn = document.getElementById('startBtn');
  const skipBtn = document.getElementById('skipBtn');
  const userNameInput = document.getElementById('userName');
  const userGenderSelect = document.getElementById('userGender');
  const userAgeInput = document.getElementById('userAge');
  const userInfoErrorEl = document.getElementById('userInfoError');
  const ageErrorEl = document.getElementById('ageError');
  let ageErrorTimer = null;
  function sanitize(str){ if(typeof str!=='string') return ''; const trimmed=str.trim().slice(0,20); return trimmed.replace(/[^\u4e00-\u9fa5A-Za-z0-9 \._\-·]/g,''); }
  function validateAndStart(){ if(!introSection){ renderCurrent(); return; } userInfoErrorEl.textContent=''; const rawName=userNameInput.value||''; const rawGender=userGenderSelect.value||''; const rawAge=userAgeInput.value||''; let ageVal=rawAge.trim(); if(ageVal){ if(!/^\d{1,3}$/.test(ageVal)){ userInfoErrorEl.textContent='请输入有效年龄（仅数字且不超过3位）'; return; } } const name=sanitize(rawName); if(rawName && !name){ userInfoErrorEl.textContent='姓名含不允许字符。'; return; } state.user={ name, gender:rawGender, age:ageVal }; introSection.hidden=true; questionSection.hidden=false; updateResetBtnVisibility(); renderCurrent(); }
  function skipIntro(){ if(!introSection){ renderCurrent(); return; } state.user={ name:'', gender:'', age:'' }; introSection.hidden=true; questionSection.hidden=false; updateResetBtnVisibility(); renderCurrent(); }
  if(startBtn) startBtn.addEventListener('click', validateAndStart); if(skipBtn) skipBtn.addEventListener('click', skipIntro);
  // 年龄输入：仅数字，最多 3 位；错误提示位于输入框下方
  if(userAgeInput){
    const ERROR_TIMEOUT = 2500;
    function showAgeError(msg){
      if(!ageErrorEl) return;
      if(!msg){ ageErrorEl.hidden = true; ageErrorEl.textContent=''; return; }
      ageErrorEl.textContent = msg;
      ageErrorEl.hidden = false;
      if(ageErrorTimer) clearTimeout(ageErrorTimer);
      ageErrorTimer = setTimeout(()=>{ if(ageErrorEl) ageErrorEl.hidden = true; }, ERROR_TIMEOUT);
    }
    userAgeInput.addEventListener('input', ()=>{
      let v = userAgeInput.value;
      let msg='';
      const digitsOnly = v.replace(/[^0-9]/g,'');
      if(digitsOnly !== v) msg='只能输入数字';
      v = digitsOnly;
      if(v.length > 3){ v = v.slice(0,3); msg='输入位数超过3位'; }
      userAgeInput.value = v;
      showAgeError(msg);
    });
    userAgeInput.addEventListener('blur', ()=>{ if(ageErrorEl) ageErrorEl.hidden = true; });
  }
  if(introSection){ questionSection.hidden=true; resultSection.hidden=true; updateResetBtnVisibility(); } else { renderCurrent(); }
  const secretSequence = CONST.SECRET_SEQUENCE || ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowLeft','ArrowRight','ArrowRight','b','a','b','a'];
  let inputBuffer=[]; window.addEventListener('keydown', e=>{ const key=e.key.length===1?e.key.toLowerCase():e.key; inputBuffer.push(key); if(inputBuffer.length>secretSequence.length) inputBuffer.shift(); if(secretSequence.every((k,i)=>inputBuffer[i]===k)) toggleDebugPanel(true); });
  function toggleDebugPanel(show){ if(!debugPanel) return; debugPanel.hidden=!show; }
  if(closeDebugBtn) closeDebugBtn.addEventListener('click', ()=>toggleDebugPanel(false));
  function updateResetBtnVisibility(){ if(!resetAllBtn) return; const introVisible=!!(introSection && !introSection.hidden); resetAllBtn.hidden=introVisible; }
  function showNotice(msg, duration=2000){ if(!notifyBar) return; notifyBar.textContent=msg; notifyBar.hidden=false; if(notifyTimer) clearTimeout(notifyTimer); notifyTimer=setTimeout(()=>{ notifyBar.hidden=true; }, duration); }
  function writeDebug(msg){ const out=document.getElementById('debugOutput'); if(out){ out.textContent=(out.textContent||'')+'\n'+msg; const maxLines=300; const lines=out.textContent.split('\n'); if(lines.length>maxLines) out.textContent=lines.slice(lines.length-maxLines).join('\n'); out.scrollTop=out.scrollHeight; } }
  updateReportIdDebug();
  document.querySelectorAll('.debug-action').forEach(btn=>{ btn.addEventListener('click', ()=>{ handleDebugAction(btn.getAttribute('data-action')); }); });
  function handleDebugAction(action){
    switch(action){
      case 'fill-current-3':{
        if(introSection && !introSection.hidden){ writeDebug('未打开试题'); break; }
        ensureOrder(); const idx=state.order[state.currentIndex]; const c=constitutions[idx]; const filtered=getFilteredQuestions(c,state.user.gender); state.answers[c.key]=filtered.map(()=>3); writeDebug('当前组填 3'); renderCurrent(); break; }
      case 'fill-current-1':{
        if(introSection && !introSection.hidden){ writeDebug('未打开试题'); break; }
        ensureOrder(); const idx=state.order[state.currentIndex]; const c=constitutions[idx]; const filtered=getFilteredQuestions(c,state.user.gender); state.answers[c.key]=filtered.map(()=>1); writeDebug('当前组填 1'); renderCurrent(); break; }
      case 'fill-current-5':{
        if(introSection && !introSection.hidden){ writeDebug('未打开试题'); break; }
        ensureOrder(); const idx=state.order[state.currentIndex]; const c=constitutions[idx]; const filtered=getFilteredQuestions(c,state.user.gender); state.answers[c.key]=filtered.map(()=>5); writeDebug('当前组填 5'); renderCurrent(); break; }
      case 'fill-all-random':{
        const isResultMode = state.finished;
        constitutions.forEach(cn=>{
          const filtered = getFilteredQuestions(cn, state.user.gender);
          state.answers[cn.key] = filtered.map(()=> 1 + Math.floor(rand()*5));
        });
        if(isResultMode){
          writeDebug('结果界面：已随机重新生成结果');
          showResult();
        } else {
          // 不直接出结果：跳到最后一组，等待用户点击“完成测评”手动提交
          if(introSection && !introSection.hidden){ introSection.hidden = true; questionSection.hidden = true; }
          questionSection.hidden = false;
          ensureOrder();
          state.finished = false;
          state.currentIndex = constitutions.length - 1;
          renderCurrent();
          writeDebug('已随机填充全部组，跳转最后一组等待手动完成');
        }
        break; }
      case 'preset-pinghe':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?1:5); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('预设平和'); showResult(); break; }
      case 'preset-qixu-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='qixu') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('气虚示例'); showResult(); break; }
      case 'preset-yangxu-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='yangxu') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('阳虚示例'); showResult(); break; }
      case 'preset-yinxu-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='yinxu') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('阴虚示例'); showResult(); break; }
      case 'preset-tanshi-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='tanshi') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('痰湿示例'); showResult(); break; }
      case 'preset-shire-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='shire') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('湿热示例'); showResult(); break; }
      case 'preset-xueyu-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='xueyu') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('瘀血示例'); showResult(); break; }
      case 'preset-qiyu-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='qiyu') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('气郁示例'); showResult(); break; }
      case 'preset-tebing-main':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(cn.key==='tebing') state.answers[cn.key]=filtered.map(()=>5); else if(cn.key==='pinghe') state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); else state.answers[cn.key]=filtered.map(()=>1); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('特禀示例'); showResult(); break; }
      case 'preset-random-multi-main':{
        const nonPinghe=constitutions.filter(cn=>cn.key!=='pinghe').map(cn=>cn.key); const count=2+Math.floor(rand()*2); const picked=[]; const pool=[...nonPinghe]; while(picked.length<count && pool.length){ const i=Math.floor(rand()*pool.length); picked.push(pool.splice(i,1)[0]); }
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); if(picked.includes(cn.key)){ state.answers[cn.key]=filtered.map(()=>{ const r=rand(); return r<0.2?5:(r<0.6?4:3); }); } else if(cn.key==='pinghe'){ state.answers[cn.key]=filtered.map(q=>{ const r=rand(); if(q.reverse) return r<0.5?2:3; return r<0.5?3:4; }); } else { state.answers[cn.key]=filtered.map(()=> rand()<0.8?1:2); } }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('随机多主体质: '+picked.join(',')); showResult(); break; }
      case 'clear':{
        state={ currentIndex:0, answers:{}, finished:false, mode:state.mode||'sequential', order:[], user: state.user||{ name:'', gender:'', age:'' } }; resetReportSequence(); if(introSection) introSection.hidden=true; questionSection.hidden=false; resultSection.hidden=true; ensureOrder(); updateResetBtnVisibility(); writeDebug('清空并回到第一组'); renderCurrent(); updateReportIdDebug(); break; }
      case 'toggle-mode':{
        state.mode = state.mode==='sequential'?'random':'sequential'; state.order=[]; state.currentIndex=0; ensureOrder(); writeDebug('模式切换为 '+state.mode); renderCurrent(); break; }
      case 'preset-all':{
        constitutions.forEach(cn=>{ const filtered=getFilteredQuestions(cn,state.user.gender); state.answers[cn.key]=filtered.map(q=>q.reverse?2:4); }); state.finished=true; if(introSection) introSection.hidden=true; writeDebug('全部偏颇示例'); showResult(); break; }
      case 'randomize-advice':{
        if(!state.finished){ writeDebug('尚未生成结果'); break; }
        if(lastScores && lastClassification && lastReportId){ buildProfessionalReport(lastScores, lastClassification, state.user, lastReportId); writeDebug('智能分析已重新随机'); } else { writeDebug('缺少上下文'); } break; }
      case 'id-min':{
        __reportSeqCounter=0; updateReportIdDebug();
        if(state.finished && lastScores && lastClassification){
          const tok = __indexToToken(Math.max(__reportSeqCounter,1));
          const rid = 'TCM'+__reportSeqDate+tok;
          lastReportId = rid;
          buildProfessionalReport(lastScores, lastClassification, state.user, rid);
          writeDebug('编号设为最小并已应用当前报告: '+rid);
        } else {
          writeDebug('编号设为最小');
        }
        break; }
      case 'id-max':{
        __initIdCaps(); __reportSeqCounter=__ID_MAX_INDEX-1; updateReportIdDebug();
        if(state.finished && lastScores && lastClassification){
          const tok = __indexToToken(Math.max(__reportSeqCounter,1));
          const rid = 'TCM'+__reportSeqDate+tok;
          lastReportId = rid;
          buildProfessionalReport(lastScores, lastClassification, state.user, rid);
          writeDebug('编号设为最大并已应用当前报告: '+rid);
        } else {
          writeDebug('编号设为最大');
        }
        break; }
      case 'id-dec-1':{
        __reportSeqCounter=Math.max(0,__reportSeqCounter-1); updateReportIdDebug();
        if(state.finished && lastScores && lastClassification){
          const tok = __indexToToken(Math.max(__reportSeqCounter,1));
          const rid = 'TCM'+__reportSeqDate+tok;
          lastReportId = rid;
          buildProfessionalReport(lastScores, lastClassification, state.user, rid);
          writeDebug('编号减 1 并已应用当前报告: '+rid);
        } else {
          writeDebug('编号减 1');
        }
        break; }
      case 'id-inc-1':{
        __initIdCaps(); __reportSeqCounter=Math.min(__ID_MAX_INDEX-1,__reportSeqCounter+1); updateReportIdDebug();
        if(state.finished && lastScores && lastClassification){
          const tok = __indexToToken(Math.max(__reportSeqCounter,1));
          const rid = 'TCM'+__reportSeqDate+tok;
          lastReportId = rid;
          buildProfessionalReport(lastScores, lastClassification, state.user, rid);
          writeDebug('编号加 1 并已应用当前报告: '+rid);
        } else {
          writeDebug('编号加 1');
        }
        break; }
      case 'id-apply':{
        const inputEl=document.getElementById('reportIdInput'); const errEl=document.getElementById('reportIdError'); if(!inputEl||!errEl){ writeDebug('缺少控件'); break; }
        const raw=(inputEl.value||'').trim().toUpperCase(); errEl.hidden=true; errEl.textContent=''; if(!raw){ errEl.textContent='请输入编号'; errEl.hidden=false; break; } if(/[^A-Z0-9]/.test(raw)){ errEl.textContent='编号只能为数字或字母'; errEl.hidden=false; break; } if(raw.length!==5){ errEl.textContent='必须为 5 位'; errEl.hidden=false; break; }
        const idx=__tokenToIndex(raw); if(idx==null){ errEl.textContent='编码不合法'; errEl.hidden=false; break; }
        if(!__reportSeqDate){ const now=new Date(); __reportSeqDate=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`; }
        __reportSeqCounter=idx-1; updateReportIdDebug();
        if(state.finished && lastScores && lastClassification){
          const rid='TCM'+__reportSeqDate+raw;
          lastReportId=rid;
          buildProfessionalReport(lastScores,lastClassification,state.user,rid);
          writeDebug('编号已应用到当前报告：'+rid);
        } else {
          writeDebug('下一编号设为：TCM'+__reportSeqDate+raw);
        }
        break; }
      case 'restart-user-info':{ if(introSection){ resetToIntro(); writeDebug('已返回信息填写页'); } else { writeDebug('未找到信息填写区'); } break; }
      default: writeDebug('未知调试动作: '+action);
    }
  }
  const orderModeSelect=document.getElementById('orderMode'); const modeHintEl=document.getElementById('modeHint');
  if(orderModeSelect){ orderModeSelect.value=state.mode; orderModeSelect.addEventListener('change', ()=>{ const anyAnswered=Object.values(state.answers).some(arr=>Array.isArray(arr)&&arr.some(v=>typeof v==='number')); if(anyAnswered){ orderModeSelect.value=state.mode; modeHintEl.textContent='已有作答，无法切换模式。'; return; } state.mode=orderModeSelect.value; state.order=[]; ensureOrder(); modeHintEl.textContent=state.mode==='random'?'已启用乱序模式。':'顺序模式。'; state.currentIndex=0; renderCurrent(); }); }
})();
