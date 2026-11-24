
const $=id=>document.getElementById(id),dlg=$('dialog');
const paths={desk:'M4 5h16v13H4z M8 21h8 M12 18v3',home:'M3 10l9-7 9 7 M5 9v11h14V9 M10 20v-7h4v7',bulb:'M9 16c0-3-4-3-4-8a7 7 0 0114 0c0 5-4 5-4 8z M9 19h6 M11 22h2',calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h3',chart:'M3 3v18h18 M7 16v-4 M12 16V7 M17 16v-7',user:'M8 7a4 4 0 108 0 4 4 0 10-8 0 M4 21a8 8 0 0116 0',users:'M8 6a3 3 0 106 0 3 3 0 10-6 0 M4 21v-2a7 7 0 0114 0v2 M17 5a3 3 0 010 6 M19 15a5 5 0 012 4',bell:'M5 17h14l-2-3V9a5 5 0 00-10 0v5z M10 20a2 2 0 004 0',mic:'M9 4a3 3 0 016 0v7a3 3 0 01-6 0z M5 10a7 7 0 0014 0 M12 17v4 M9 21h6',award:'M7 8a5 5 0 1010 0A5 5 0 007 8 M8 12l-1 9 5-3 5 3-1-9',code:'M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16',project:'M3 7h7l2 2h9v11H3z M3 7V4h7l2 3h7',story:'M3 5c4-1 7 0 9 2 2-2 5-3 9-2v14c-3-1-6 0-9 2-3-2-6-3-9-2z M12 7v14',chat:'M4 4h16v12H9l-5 4z M8 9h8 M8 12h5',pen:'M4 20l1-5L17 3l4 4L9 19z M14 6l4 4',copy:'M8 8h12v13H8z M5 16H3V3h12v2',layers:'M3 8l9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5'};
const icon=k=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+paths[k]+'"/></svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types=[['فعالية حضرتها','جلسة أو لقاء وفكرة لفتتك','mic','#fbe3cb','#a15119','شو لفتك بالفعالية؟'],['منشور تعليمي','مشكلة، شرح، أو خطوة عملية','code','#e2e8ff','#3550ba','شو المشكلة وكيف بتنشرح بمثال؟'],['إنجاز شخصي','محطة بتحب تشاركها','award','#f4def0','#9a487c','شو أنجزت وليش بيعنيلك؟'],['تجربة مشروع','قرار تقني أو نتيجة من شغلك','project','#d9eee8','#24705f','شو كان دورك وشو تغيّر؟'],['قصة شخصية','موقف أو درس من رحلتك','story','#f8e4dd','#974d39','شو صار معك وشو تعلّمت؟'],['سؤال للنقاش','موضوع بدك تسمع آراء الناس فيه','chat','#e2ebf1','#456077','شو السؤال وليش بيهمّك؟']];
const pages=[['home','منشور الأسبوع'],['bulb','بنك الأفكار'],['calendar','التقويم والسجل'],['chart','النتائج'],['user','الملف المهني'],['users','العلاقات'],['bell','التذكيرات'],['desk','الحفظ والمزامنة']];
const seed={posts:[{id:'rive',type:0,title:'جلسة Rive Dive',note:'لفتني كيف الحركة غيّرت شعوري وأنا عم شوف العرض وخلّتني أنطر شو رح يصير بعدها. عندي صورة من الجلسة وصورة للمكان.',draft:'',date:'',url:'',metrics:{}}],ideas:[],contacts:[],checks:{},reminders:[]};
let db, page='home', timer;
try {db=readDisk()||structuredClone(seed)} catch {db=structuredClone(seed);setTimeout(()=>notify('تعذّرت قراءة الحفظ المحلي. نزّل نسخة احتياطية قبل المتابعة.'),0)}
let calendarMonth = new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Damascus'}).slice(0,7), selectedDay='';

function save(){dirty=true;const saved=persistState();if(saved && autoKey){syncLabel('تعديلات محفوظة على الجهاز');scheduleSync()}return saved}
function notify(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.add('hidden'),3000)}

const btn=(text,fn,cls='minor')=>'<button class="'+cls+'" onclick="'+fn+'">'+text+'</button>';
const shortDate=d=>d?new Intl.DateTimeFormat('ar',{day:'numeric',month:'long'}).format(new Date(d+'T12:00:00')):'بدون موعد';
const isoDay=(d=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Damascus',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
function reviewDay(p){if(!p.url||!p.date)return '';let d=new Date(p.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);return d.toISOString().slice(0,10)}
function due(){return db.posts.filter(p=>reviewDay(p)&&reviewDay(p)<=isoDay()&&!p.reviewed)}
function goto(k){page=k;render();window.scrollTo(0,0)}
function title(t,s){return '<div class="pageintro"><h1>'+t+'</h1><p>'+s+'</p></div>'}
function rows(list,fn,empty){return list.length?list.map(fn).join(''):'<p class="meta">'+empty+'</p>'}
function row(name,sub,action=''){return '<div class="listrow"><div><strong>'+esc(name)+'</strong><div class="meta">'+esc(sub)+'</div></div>'+action+'</div>'}
function modal(t,html){$('dialogTitle').textContent=t;$('form').innerHTML=html;if(!dlg.open)dlg.showModal()}
function status(p){return p.url?'منشور':p.date?'مخطّط':'مسوّدة'}
function render(){
 $('nav').innerHTML=pages.map(([k,n])=>'<button class="'+(page===k?'sel':'')+'" '+(page===k?'aria-current="page"':'')+' onclick="goto(\''+k+'\')">'+icon(k)+n+'</button>').join('');
 $('crumb').innerHTML=icon('layers')+pages.find(x=>x[0]===page)[1];$('brandIcon').innerHTML=icon('pen');
 $('today').innerHTML=icon('calendar')+new Intl.DateTimeFormat('ar',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Damascus'}).format(new Date());
 const v=$('view');if(page==='home'){
 let latest=db.posts.find(p=>!p.url),count=due().length+db.reminders.filter(r=>!r.done).length;
 v.innerHTML='<section class="hero"><div class="copy"><div class="eyebrow">'+icon('pen')+'منشور واحد بالأسبوع</div><h1>شو حابب تكتب هالأسبوع؟</h1><p>اختَر نوع البوست، واكتب الفكرة بطريقتك.</p></div><div class="ribbon" aria-hidden="true">'+Array.from({length:11},(_,i)=>'<i style="--i:'+i+'"></i>').join('')+'</div></section><div class="secTitle"><h2>اختَر نوع المنشور</h2><small>٦ أنواع</small></div><div class="cards">'+types.map((t,i)=>'<button class="kind" onclick="edit(null,'+i+')" style="--icbg:'+t[3]+';--ic:'+t[4]+'"><span class="iconTile">'+icon(t[2])+'</span><strong>'+t[0]+'</strong><small>'+t[1]+'</small></button>').join('')+'</div><div class="below"><section class="panel"><header><h2>آخر مسوّدة</h2>'+btn('عرض السجل',"goto(\'calendar\')",'textbtn')+'</header>'+(latest?'<div class="event"><strong>'+esc(latest.title)+'</strong><div class="meta">'+types[latest.type][0]+'</div></div>'+btn('كمّل الكتابة',"edit(\'"+latest.id+"\')",'textbtn'):'<p class="meta">اختَر نوع منشور لتبدأ مسوّدة.</p>')+'</section><section class="panel"><header><h2>التذكيرات</h2>'+btn('فتح القائمة',"goto(\'bell\')",'textbtn')+'</header><div class="rem">'+icon('bell')+(count?'عندك '+count+' تذكير للمراجعة':'ما عندك تذكيرات مستحقّة')+'</div><p class="tiny">مراجعة نتائج كل منشور بعد أسبوع من نشره.</p></section></div>';return}
 let html='';if(page==='bulb'){html=title('بنك الأفكار','التقط الفكرة قبل ما تضيع.')+'<section class="panel">'+btn('إضافة فكرة','addItem(\'ideas\')','action')+rows(db.ideas,x=>row(x.name,x.note,btn('تحويل لمسوّدة',"fromIdea('"+x.id+"')")+btn('تعديل',"manageItem('ideas','"+x.id+"')",'textbtn')),'لسّه ما أضفت أفكار.')+'</section>'}
if(page==='calendar') html=calendarView();
 if(page==='desk') html=settings();
 if(page==='chart'){html=title('نتائج المنشورات','قارن الوصول والحفظ والنقاش لكل منشور بعد أسبوع.')+'<section class="panel">'+rows(db.posts.filter(p=>p.url),p=>row(p.title,p.reviewed?'الوصول: '+(p.metrics.reach??'—')+' · الحفظ: '+(p.metrics.saves??'—')+' · التعليقات: '+(p.metrics.comments??'—')+' · الظهور: '+(p.metrics.views??'—')+' · زيارات الملف: '+(p.metrics.visits??'—'):'موعد المراجعة: '+shortDate(reviewDay(p)),btn('تسجيل النتائج',"metrics(\'"+p.id+"\')")),'بعد ما تنشر، أضف الرابط والتاريخ في السجل ليظهر المنشور هون.')+'</section>'}
 if(page==='user'){html=title('الملف المهني','علّم على الأقسام اللي جهّزتها في حسابك.')+'<section class="panel">'+['الصورة الشخصية والغلاف','العنوان المهني','النبذة','الخبرات والمهارات','الأعمال المميّزة'].map((n,i)=>'<label class="check"><input type="checkbox" '+(db.checks[i]?'checked':'')+' onchange="db.checks['+i+']=this.checked;save()"> '+n+'</label>').join('')+'</section>'}
 if(page==='users'){html=title('العلاقات','احتفظ باسم الشخص وسبب المتابعة.')+'<section class="panel">'+btn('إضافة شخص','addItem(\'contacts\')','action')+rows(db.contacts,x=>row(x.name,x.note,btn('تعديل',"manageItem('contacts','"+x.id+"')",'textbtn')),'مثلاً زميل التقيت فيه بجلسة تقنية.')+'</section>'}
 if(page==='bell'){html=title('التذكيرات','مهامك ومراجعات الأسبوع في مكان واحد.')+'<section class="panel">'+btn('إضافة تذكير','addItem(\'reminders\')','action')+rows(due(),p=>row('راجع نتائج '+p.title,shortDate(reviewDay(p)),btn('مراجعة',"metrics(\'"+p.id+"\')")),'ما في مراجعات منشورات مستحقّة اليوم.')+db.reminders.map((r,i)=>'<label class="check"><input type="checkbox" '+(r.done?'checked':'')+' onchange="db.reminders['+i+'].done=this.checked;save()"> '+esc(r.name)+'</label>').join('')+'</section>'}v.innerHTML=html;
}
function field(id,label,value='',multi=false,type='text'){return '<label class="field" for="'+id+'">'+label+'</label>'+(multi?'<textarea id="'+id+'">'+esc(value)+'</textarea>':'<input id="'+id+'" type="'+type+'" value="'+esc(value)+'">')}
function addItem(k){const n={ideas:'فكرة',contacts:'شخص',reminders:'تذكير'}[k];modal('إضافة '+n,'<form id="itemform">'+field('iname',k==='contacts'?'الاسم':'العنوان')+(k==='reminders'?'':field('inote',k==='contacts'?'سبب المتابعة':'ملاحظتك','',true))+'<div class="actions"><button class="action">حفظ</button></div></form>');$('iname').required=true;$('itemform').onsubmit=e=>{e.preventDefault();const name=$('iname').value.trim();if(!name)return;db[k].unshift({id:uid(),name,note:$('inote')?.value||'',done:false});save();dlg.close();render()}}
function uid(){return globalThis.crypto?.randomUUID?.()||('p'+Date.now().toString(36)+Math.random().toString(36).slice(2))}
function fromIdea(id){const i=db.ideas.find(x=>x.id===id);edit(null,4,{title:i.name,note:i.note})}
function prompt(p){return 'ساعدني أكتب منشور لينكدإن بالعربي بلهجة سورية خفيفة ومفهومة. أنا عمر كاشلان، مطوّر برمجيات بدمشق عندي خبرة بالواجهات العربية وVue وRTL. هدفي الحضور المهني والتواصل مع مجتمع المطورين. بنشر مرة بالأسبوع.\n\nنوع المنشور: '+types[p.type][0]+'\nالفكرة: '+p.title+'\nملاحظتي الحقيقية: '+p.note+'\n'+(p.draft?'مسوّدتي الحالية: '+p.draft+'\n':'')+'\nابدأ من تفصيل حقيقي، وركّز على فكرة واحدة. اسألني فقط عن المعلومة الناقصة اللي بتغيّر النص، واستأذنّي أولاً قبل استخدام تفاصيل شركة أو عميل أو أسماء وصور. اسألني إذا عندي صورة حقيقية أو مادة بدي أضيفها، أو إذا بدي صورة مولّدة. إذا اخترت التوليد أعطني برومبت إنكليزي جاهز لـ Nano Banana لرسمة مفاهيمية 4:5 بدون واجهات مزيفة أو بيانات شخصية. اختَر افتتاحية من تجربتي. في الفعالية اسألني عن التفصيل اللي بقي معي، وفي الشرح التقني ضمّن خطوات واختباراً، وفي الإنجاز أو القصة وضّح دوري، وفي النقاش خليك بسؤال محدّد. بعد إجابتي سلّمني الفكرة بسطر، النص الجاهز، والصورة أو برومبت Nano Banana عند الحاجة. اكتب نسخة عربية واحدة بصوتي. لا تخترع مواقف أو نتائج، وميّز اللي شفته عن اللي طبّقته بنفسي.'}
async function copyText(t){try{await navigator.clipboard.writeText(t);notify('تم نسخ الطلب. الصقه في ChatGPT.')}catch{const a=document.createElement('textarea');a.value=t;$('form').append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch{}if(ok){a.remove();notify('تم نسخ الطلب')}else{notify('حدّد النص وانسخه يدوياً')}}}
function edit(id,type=0,initial={}){let p=id?db.posts.find(x=>x.id===id):{id:uid(),type,title:'',note:'',draft:'',date:'',url:'',metrics:{},...initial};let kind=types[p.type];modal(kind[0],'<form id="postform">'+field('ptitle','عنوان الفكرة',p.title)+field('pnote',kind[5],p.note,true)+'<div class="actions"><button type="button" id="pcopy" class="action">'+icon('copy')+'نسخ الطلب للذكاء الاصطناعي</button></div><p class="tiny">الصق الطلب في ChatGPT، وارجع حطّ النص النهائي هون.</p>'+field('pdraft','نص المنشور',p.draft,true)+'<details '+(p.url?'open':'')+'><summary>الموعد ورابط النشر اليدوي</summary>'+field('pdate','تاريخ النشر',p.date,false,'date')+field('purl','رابط منشور لينكدإن',p.url,false,'url')+'</details><div class="actions"><button class="minor">حفظ في السجل</button></div></form>');
 const form=$('postform');$('ptitle').required=true;
 if(p.url){const link=document.createElement('a');link.href=p.url;link.textContent='فتح المنشور على لينكدإن';link.target='_blank';link.rel='noopener noreferrer';form.append(link)}
 if(id){const remove=document.createElement('button');remove.type='button';remove.className='textbtn';remove.textContent='حذف من السجل';
 remove.onclick=()=>{if(confirm('حذف هذه المسوّدة أو المنشور من سجلك؟')){db.posts=db.posts.filter(x=>x.id!==id);save();dlg.close();render()}};form.append(remove)}
 function read(){return {...p,title:$('ptitle').value.trim(),note:$('pnote').value.trim(),draft:$('pdraft').value,date:$('pdate').value,url:$('purl').value.trim()}}
 function persist(v){
   p=v;db.posts=[v,...db.posts.filter(x=>x.id!==v.id)];const ok=save();render();return ok
 }
 form.insertAdjacentHTML('beforeend','<small id="draftState" role="status" class="storestate">نص المسوّدة يُحفظ تلقائياً على الجهاز. أكّد الرابط والموعد بزر الحفظ.</small>');
 for(const key of ['ptitle','pnote','pdraft'])$(key).addEventListener('input',()=>{
   const v=read();
   if(!v.title&&!v.note&&!v.draft)return;
   const saved=persist({...v,title:v.title||'مسوّدة '+kind[0],date:p.date,url:p.url});
   $('draftState').textContent=saved?'تم حفظ نص المسوّدة على هالجهاز.':'تعذّر الحفظ المحلي. نزّل نسخة احتياطية.';
 });
 $('pcopy').onclick=()=>{let v=read();if(!v.title||!v.note){notify('اكتب العنوان وملاحظتك أولاً');(!v.title?$('ptitle'):$('pnote')).focus();return}persist({...v,date:p.date,url:p.url});copyText(prompt(v))};
 form.onsubmit=e=>{e.preventDefault();let v=read();if(!v.title){$('ptitle').focus();return}if(v.url){try{const u=new URL(v.url);if(u.protocol!=='https:'||!/(^|\.)linkedin\.com$/.test(u.hostname))throw Error()}catch{notify('أدخل رابط لينكدإن صحيحاً يبدأ بـ https');return}v.date=v.date||isoDay()}if(persist(v)){dlg.close();notify('تم حفظ المنشور في السجل')}}}
function metrics(id){let p=db.posts.find(x=>x.id===id);modal('نتائج المنشور','<form id="mf">'+['reach','saves','comments','views','visits'].map((k,i)=>field(k,['الوصول الفريد','مرات الحفظ','التعليقات','مرات الظهور','زيارات الملف'][i],p.metrics[k]??'',false,'number')).join('')+'<div class="actions"><button class="action">حفظ النتائج</button></div></form>');document.querySelectorAll('#mf input').forEach(x=>x.min='0');$('mf').onsubmit=e=>{e.preventDefault();const vals={};for(const k of ['reach','saves','comments','views','visits'])if($(k).value!=='')vals[k]=Number($(k).value);if(!Object.keys(vals).length){notify('أدخل مؤشراً واحداً على الأقل');return}p.metrics=vals;p.reviewed=true;save();dlg.close();render()}}
function manageItem(group,id) {
  const item=db[group].find(x=>x.id===id);
  modal('تعديل', '<form id="manage">'+field('recordName','الاسم أو العنوان',item.name)+field('recordNote','ملاحظاتك',item.note,true)+'<div class="actions"><button class="action">حفظ</button><button type="button" id="deleteItem" class="textbtn">حذف</button></div></form>');
  $('recordName').required=true;
  $('manage').onsubmit=e=>{e.preventDefault();const name=$('recordName').value.trim();if(!name)return;item.name=name;item.note=$('recordNote').value;save();dlg.close();render()};
  $('deleteItem').onclick=()=>{if(confirm('حذف هذا العنصر؟')){db[group]=db[group].filter(x=>x.id!==id);save();dlg.close();render()}};
}
function shiftMonth(amount) {
  const d=new Date(calendarMonth+'-15T12:00:00Z');
  d.setUTCMonth(d.getUTCMonth()+amount);calendarMonth=d.toISOString().slice(0,7);selectedDay='';render();
}
function filterDay(day){selectedDay=day;render()}
function calendarView(){
  const start=new Date(calendarMonth+'-01T12:00:00Z'), end=new Date(start);
  end.setUTCMonth(end.getUTCMonth()+1,0);
  let grid=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'].map(w=>'<small>'+w+'</small>').join('');
  grid+='<span></span>'.repeat(start.getUTCDay());
  for(let day=1;day<=end.getUTCDate();day++){
    const date=calendarMonth+'-'+String(day).padStart(2,'0');
    const count=db.posts.filter(p=>p.date===date).length;
    grid+='<button class="day '+(selectedDay===date?'active':'')+'" aria-label="'+date+'، '+count+' منشور" onclick="filterDay(\''+date+'\')">'+day+(count?'<i class="dot"></i>':'')+'</button>';
  }
  const list=db.posts.filter(p=>!selectedDay||p.date===selectedDay).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return title('التقويم والسجل','اختَر يوماً لعرض منشوراته، أو افتح مسوّدة من السجل.')+
  '<section class="panel"><div class="calbar">'+btn('السابق','shiftMonth(-1)')+'<strong>'+new Intl.DateTimeFormat('ar',{month:'long',year:'numeric'}).format(start)+'</strong>'+btn('التالي','shiftMonth(1)')+'</div><div class="calgrid">'+grid+'</div></section>'+
  '<section class="panel cloud"><header><h2>'+(selectedDay?shortDate(selectedDay):'كل المنشورات')+'</h2>'+btn('عرض الكل',"filterDay('')",'textbtn')+'</header>'+
  rows(list,p=>row(p.title,status(p)+' · '+shortDate(p.date),btn('فتح',"edit('"+p.id+"')")),'ما في منشورات بهاليوم.')+'</section>';
}

render();
startAuto();
