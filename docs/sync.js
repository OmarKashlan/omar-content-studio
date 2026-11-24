/* Local-first state, with opt-in synchronization to the site's own API. */
function validStudio(value) {
  const text = x => typeof x === 'string';
  const id = x => text(x) && /^[a-zA-Z0-9_-]{1,80}$/.test(x);
  const entries = (list, validate) => Array.isArray(list) && list.every(x => x && id(x.id) && validate(x)) &&
    new Set(list.map(x => x.id)).size === list.length;
  const date = x => x === '' || (text(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)));
  const link = s => {try {let u=new URL(s); return u.protocol==='https:' && /(^|\.)linkedin\.com$/.test(u.hostname)} catch {return false}};
  return value && entries(value.posts, x => Number.isInteger(x.type) && x.type>=0 && x.type<6 &&
    [x.title,x.note,x.draft,x.url].every(text) && date(x.date) && (!x.url || link(x.url)) &&
    x.metrics && typeof x.metrics === 'object' && Object.values(x.metrics).every(n => Number.isSafeInteger(n) && n>=0)) &&
    ['ideas','contacts','reminders'].every(k => entries(value[k],x => text(x.name) && text(x.note??''))) &&
    value.checks && typeof value.checks==='object' && !Array.isArray(value.checks) && Object.keys(value.checks).every(k => /^\d+$/.test(k) && typeof value.checks[k]==='boolean');
}
const storeKey='omar-blue-studio-v1';
let baseRevision=0, dirty=false, diskStamp='', cloudBusy=false, loadedRemote=null;
const deviceKey=storeKey+'-device-key';
let autoKey='', syncTimer, runAgain=false, syncStatus='', conflictPending=false;
function syncLabel(message){
  syncStatus=message;
  for(const id of ['syncmsg','syncIndicator']){
    const node=document.getElementById(id);
    if(node)node.textContent=message;
  }
}
function scheduleSync(delay=900){
  if(!autoKey || location.protocol!=='https:' || conflictPending)return;
  clearTimeout(syncTimer);
  if(!navigator.onLine){syncLabel('بانتظار الاتصال');return}
  syncTimer=setTimeout(()=>syncNow('',true),delay);
}
function enableAuto(key){
  if(location.protocol!=='https:')return;
  localStorage.setItem(deviceKey,key);autoKey=key;
}
function disconnect(){
  try{localStorage.removeItem(deviceKey)}catch{return report('تعذّر نسيان المفتاح في هذا المتصفح.')}
  autoKey='';clearTimeout(syncTimer);conflictPending=false;loadedRemote=null;runAgain=false;
  syncLabel('الحفظ على الجهاز');render();
}
function startAuto(){
  if(location.protocol!=='https:')return;
  try{autoKey=localStorage.getItem(deviceKey)||''}catch{return}
  if(autoKey){syncLabel('جارٍ التحقق من المزامنة');scheduleSync(50)}
  window.addEventListener('online',()=>scheduleSync(100));
  window.addEventListener('offline',()=>{if(autoKey)syncLabel('بانتظار الاتصال')});
  window.addEventListener('focus',()=>scheduleSync(150));
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)scheduleSync(150);
    else if(dirty && autoKey && !conflictPending)syncNow('',true);
  });
  dlg.addEventListener('close',()=>scheduleSync(150));
  setInterval(()=>{if(!document.hidden)scheduleSync(100)},30000);
}
function readDisk() {
  let raw=localStorage.getItem(storeKey);
  if(raw){let s=JSON.parse(raw);if(!validStudio(s.data))throw Error('invalid');diskStamp=raw;baseRevision=s.revision||0;dirty=!!s.dirty;return s.data}
  let old=localStorage.getItem('omar-content-preview-v1');
  if(old){let value=JSON.parse(old);if(validStudio(value)){dirty=true;return value}}
  return null;
}
function persistState(){
  try{
    let current=localStorage.getItem(storeKey)||'';
    if(current!==diskStamp){
      localStorage.setItem(storeKey+'-recovery',JSON.stringify(db));
      notify('في تعديل بتبويب آخر. حُفظت نسختك للاسترجاع من الإعدادات.');return false;
    }
    const next=JSON.stringify({data:db,revision:baseRevision,dirty});
    localStorage.setItem(storeKey,next);diskStamp=next;return true;
  }catch{notify('تعذّر الحفظ على الجهاز. نزّل نسخة احتياطية من الإعدادات.');return false}
}
function resourceFile(data,name) {
  const href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),2000);
}
function backup(){resourceFile(db,'omar-studio-'+isoDay()+'.json')}
function recover(){try{const s=localStorage.getItem(storeKey+'-recovery');if(!s)return notify('ما في نسخة استرجاع حالياً');resourceFile(JSON.parse(s),'omar-studio-recovery.json')}catch{notify('تعذّر فتح نسخة الاسترجاع')}}
async function importBackup(file){
  if(!file)return;
  try{if(file.size>2000000)throw Error();const x=JSON.parse(await file.text());if(!validStudio(x))throw Error();
    if(!confirm('تريد استعادة هالنسخة؟ رح يحتفظ الجهاز بنسخة استرجاع من بياناتك الحالية.'))return;
    localStorage.setItem(storeKey+'-recovery',JSON.stringify(db));db=x;dirty=true;if(persistState()){render();scheduleSync();notify('تمت استعادة النسخة على هالجهاز')}
  }catch{notify('الملف غير صالح للاستعادة أو تعذّرت الكتابة على الجهاز')}
}
function settings(){
  return title('الحفظ والمزامنة','احفظ نسخة من عملك، أو زامن أجهزتك بعد ربط Cloudflare.')+
  '<section class="panel"><header><h2>الحفظ على هالجهاز</h2></header><p>النصوص والأفكار تُحفظ في هذا المتصفح. نزّل نسخة لنقلها أو الاحتفاظ بها.</p><div class="actions">'+
  btn('تنزيل نسخة احتياطية','backup()','action')+btn('استعادة ملف',"document.getElementById(\'importFile\').click()")+btn('تنزيل نسخة الاسترجاع','recover()')+'</div><input id="importFile" type="file" accept=".json" hidden onchange="importBackup(this.files[0]);this.value=\'\'"></section>'+
  '<section class="panel cloud"><h2>المزامنة التلقائية بين أجهزتك</h2>'+
  (location.protocol!=='https:'?'<p>للتفعيل افتح رابط Cloudflare الآمن بعد نشر اللوحة. يتوفر الحفظ المحلي الآن.</p>':
    autoKey?'<p>هذا الجهاز مربوط. التعديلات تُرسل بعد الكتابة وتُجلب عند فتح اللوحة أو رجوع الاتصال.</p><div class="actions">'+btn('مراجعة المزامنة','syncNow()','action')+btn('إيقاف المزامنة ونسيان المفتاح','disconnect()')+'</div>':
    '<form id="syncform" onsubmit="event.preventDefault();syncNow()"><label class="field" for="cloudKey">مفتاح المزامنة الخاص</label><input id="cloudKey" type="password" autocomplete="off" placeholder="مفتاح Cloudflare"><p class="tiny">سيُحفظ المفتاح في هذا المتصفح على جهازك الشخصي.</p><div class="actions"><button id="syncbutton" class="action">تفعيل المزامنة التلقائية</button></div></form>')+
  '<p id="syncmsg" role="status" class="meta">'+esc(syncStatus||(dirty?'توجد تعديلات محلية.':'بياناتك متاحة محلياً.'))+'</p></section>';
}
function report(message){syncLabel(message)}
async function cloudCall(key,method='GET',body){
  const opt={method,headers:{Authorization:'Bearer '+key},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)};
  if(body){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
  const r=await fetch('/api/studio',opt);
  if(!r.ok){const e=new Error(({401:'مفتاح المزامنة غير صحيح.',403:'الرابط لا يسمح بهذا الاتصال.',404:'خدمة المزامنة غير مفعّلة على هذا الرابط.',409:'تغيّرت النسخة السحابية. أعد المزامنة لمراجعة النسختين.',413:'البيانات أكبر من حدّ المزامنة.',503:'أكمل ربط DB وإعداد STUDIO_KEY على Cloudflare.'})[r.status]||'تعذّر الاتصال بقاعدة البيانات.');throw e}
  if(!r.headers.get('Content-Type')?.includes('application/json'))throw Error('هذا الرابط يقدّم الواجهة فقط. استخدم رابط Cloudflare المربوط بقاعدة البيانات.');
  return r.json();
}
function applyCloud(remote,keepRecovery=false){
  if(!validStudio(remote.data))throw Error('تعذّرت قراءة نسخة السحابة.');
  if(keepRecovery)localStorage.setItem(storeKey+'-recovery',JSON.stringify(db));
  db=remote.data;baseRevision=remote.revision;dirty=false;
  if(!persistState())throw Error('تعذّر تثبيت نسخة السحابة محلياً. حمّل نسخة احتياطية.');
  render();
}
async function syncNow(choice='',automatic=false){
  if(cloudBusy){runAgain=true;return}
  if(automatic && conflictPending)return;
  const key=autoKey||$('cloudKey')?.value.trim();if(!key)return;
  const enabling=!autoKey;
  cloudBusy=true;const button=$('syncbutton');if(button)button.disabled=true;
  const snap=JSON.stringify(db);
  try{
    if((localStorage.getItem(storeKey)||'')!==diskStamp)throw Error('افتح اللوحة من جديد بعد حفظ نسخة احتياطية؛ يوجد تعديل في تبويب آخر.');
    const remote=await cloudCall(key);
    if(!Number.isSafeInteger(remote.revision)||remote.revision<0||(remote.revision>0&&!validStudio(remote.data)))throw Error('صيغة نسخة السحابة غير متوقّعة.');
    if(!enabling && !autoKey)return;
    if(enabling){enableAuto(key);if(page==='desk')render()}
    if(JSON.stringify(db)!==snap){runAgain=true;return}
    if((localStorage.getItem(storeKey)||'')!==diskStamp)throw Error('في تعديل بتبويب آخر. أعد فتح اللوحة.');
    if(automatic && dlg.open && remote.data && remote.revision!==baseRevision)return report('تحديث من جهاز آخر بانتظار إغلاق المحرّر.');
    if(remote.revision!==baseRevision && dirty && remote.data){
      if(!choice || loadedRemote!==remote.revision){
        loadedRemote=remote.revision;conflictPending=true;
        modal('في تعديلات على الجهازين','<p>اختر النسخة اللي بدك تحتفظ فيها. قبل الاستبدال رح تُحفظ النسخة الأخرى للاسترجاع.</p><div class="actions">'+btn('اعتماد نسخة السحابة',"dlg.close();syncNow(\'pull\')")+btn('اعتماد نسخة هالجهاز',"dlg.close();syncNow(\'push\')")+'</div>');
        return report('بانتظار اختيار النسخة المناسبة.')
      }
      conflictPending=false;
      if(choice==='pull'){applyCloud(remote,true);return report('تم جلب نسخة السحابة.')}
      localStorage.setItem(storeKey+'-recovery',JSON.stringify(remote.data));
    } else if(remote.data && !dirty){conflictPending=false;if(remote.revision!==baseRevision)applyCloud(remote);return report('متزامن مع السحابة')}
    const version=await cloudCall(key,'PUT',{revision:remote.revision,data:JSON.parse(snap)});
    baseRevision=version.revision;dirty=JSON.stringify(db)!==snap;
    if(!persistState())throw Error('حُفظت نسخة السحابة وتعذّر تحديث حالة الجهاز.');
    conflictPending=false;if(dirty)runAgain=true;
    report(dirty?'توجد تعديلات أحدث بانتظار المزامنة.':'متزامن مع السحابة');
  }catch(e){report(e.message==='Failed to fetch'?'الاتصال غير متاح. بياناتك محفوظة على هالجهاز.':e.message)}
  finally{cloudBusy=false;if(button)button.disabled=false;if(runAgain){runAgain=false;scheduleSync(150)}}
}
