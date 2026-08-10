const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const API_URL=window.INDUSTRIA_API_URL||localStorage.getItem('industria_api_url')||'';
const history=[];

function view(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');scrollTo(0,0)}
$$('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
function toast(t){const x=$('#toast');x.textContent=t;x.style.display='block';clearTimeout(window._t);window._t=setTimeout(()=>x.style.display='none',2200)}
function add(text,who){const d=document.createElement('div');d.className='bubble '+who;d.textContent=text;$('#messages').appendChild(d);$('#messages').scrollTop=$('#messages').scrollHeight}
function setBusy(b){['#homeSend','#chatSend','#chatMic'].forEach(s=>{const x=$(s);if(x)x.disabled=b})}
function pushHistory(role,content){history.push({role,content});if(history.length>12)history.splice(0,history.length-12)}

async function askAI(message){
  if(!API_URL) return 'نسخه آنلاین فعلی هنوز به موتور AI متصل نشده است. Backend را وصل کنیم تا پاسخ واقعی دریافت کنی. فعلاً می‌توانم جریان گفتگو را برایت آماده نگه دارم.';
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||'AI request failed');
  return data.answer||'پاسخی دریافت نشد.';
}

async function send(text){
  text=(text||'').trim();if(!text||window._sending)return;
  window._sending=true;view('chat');add(text,'user');pushHistory('user',text);$('#chatInput').value='';setBusy(true);
  const typing=add('در حال تحلیل درخواست...','ai');
  try{
    const answer=await askAI(text);typing.textContent=answer;pushHistory('assistant',answer);
    if(API_URL)$('#recommend').classList.remove('hidden');
  }catch(e){typing.textContent='متأسفانه ارتباط با موتور هوش مصنوعی برقرار نشد. تنظیمات Backend را بررسی کن.';toast(e.message||'خطای ارتباط با AI')}
  finally{setBusy(false);window._sending=false}
}

$('#homeSend').onclick=()=>send($('#homeInput').value);
$('#homeInput').onkeydown=e=>{if(e.key==='Enter')send(e.target.value)};
$('#chatSend').onclick=()=>send($('#chatInput').value);
$('#chatInput').onkeydown=e=>{if(e.key==='Enter')send(e.target.value)};
$$('.quick button').forEach(b=>b.onclick=()=>send(b.dataset.prompt));
$('#recommend').onclick=e=>{if(e.target.closest('button'))view('product')};

function voice(){
  view('chat');toast('میکروفون فعال شد؛ صحبت کنید...');
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!R)return toast('تشخیص گفتار در این مرورگر در دسترس نیست.');
  const r=new R();r.lang='fa-IR';r.interimResults=false;r.maxAlternatives=1;
  r.onresult=e=>send(e.results[0][0].transcript);
  r.onerror=()=>toast('دسترسی به میکروفون فعال نیست.');
  try{r.start()}catch(e){}
}
$('#voiceHero').onclick=voice;$('#voiceChat').onclick=voice;$('#navVoice').onclick=voice;$('#chatMic').onclick=voice;
$('#homeInput').focus();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
