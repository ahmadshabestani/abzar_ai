const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const API_URL=window.INDUSTRIA_API_URL||'/industria/api/chat.php';
const history=[];

function view(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');scrollTo(0,0)}
$$('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
function toast(t){const x=$('#toast');if(!x)return;x.textContent=t;x.style.display='block';clearTimeout(window._t);window._t=setTimeout(()=>x.style.display='none',3000)}
function add(text,who){const d=document.createElement('div');d.className='bubble '+who;d.textContent=text;$('#messages').appendChild(d);$('#messages').scrollTop=$('#messages').scrollHeight;return d}
function setBusy(b){['#homeSend','#chatSend','#chatMic'].forEach(s=>{const x=$(s);if(x)x.disabled=b})}
function pushHistory(role,content){history.push({role,content});if(history.length>12)history.splice(0,history.length-12)}

function speak(text){
  if(!('speechSynthesis'in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang='fa-IR';u.rate=.95;u.pitch=1;
  const voices=window.speechSynthesis.getVoices();const fa=voices.find(v=>/^fa(-|_)/i.test(v.lang));if(fa)u.voice=fa;
  window.speechSynthesis.speak(u);
}
if('speechSynthesis'in window)window.speechSynthesis.onvoiceschanged=()=>{};

async function askAI(message){
  let r;
  try{r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history})});}
  catch(e){throw new Error('ارتباط با سرور برقرار نشد. آدرس API یا SSL هاست را بررسی کنید.');}
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||`خطای Backend (HTTP ${r.status})`);
  return data.answer||'پاسخی دریافت نشد.';
}

async function send(text,{speakAnswer=true}={}){
  text=(text||'').trim();if(!text||window._sending)return;
  window._sending=true;view('chat');add(text,'user');pushHistory('user',text);$('#chatInput').value='';setBusy(true);
  const typing=add('در حال تحلیل درخواست...','ai');
  try{const answer=await askAI(text);typing.textContent=answer;pushHistory('assistant',answer);if(speakAnswer)speak(answer);if($('#recommend'))$('#recommend').classList.remove('hidden');}
  catch(e){const msg=e.message||'خطای ارتباط با AI';typing.textContent='❌ '+msg;toast(msg)}
  finally{setBusy(false);window._sending=false}
}

$('#homeSend').onclick=()=>send($('#homeInput').value);
$('#homeInput').onkeydown=e=>{if(e.key==='Enter')send(e.target.value)};
$('#chatSend').onclick=()=>send($('#chatInput').value);
$('#chatInput').onkeydown=e=>{if(e.key==='Enter')send(e.target.value)};
$$('.quick button').forEach(b=>b.onclick=()=>send(b.dataset.prompt));
$('#recommend').onclick=e=>{if(e.target.closest('button'))view('product')};

function voice(){
  view('chat');const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!R)return toast('تشخیص گفتار در این مرورگر در دسترس نیست. از Chrome یا Edge استفاده کنید.');
  const r=new R();r.lang='fa-IR';r.interimResults=false;r.maxAlternatives=1;
  r.onstart=()=>toast('🎙️ گوش می‌دهم... صحبت کنید.');
  r.onresult=e=>{const text=e.results[0][0].transcript;$('#chatInput').value=text;send(text,{speakAnswer:true})};
  r.onerror=e=>toast(e.error==='not-allowed'?'اجازه دسترسی به میکروفون داده نشده است.':'خطا در تشخیص صدا.');
  try{r.start()}catch(e){toast('میکروفون در حال استفاده است یا مرورگر اجازه شروع آن را نداد.');}
}
$('#voiceHero').onclick=voice;$('#voiceChat').onclick=voice;$('#navVoice').onclick=voice;$('#chatMic').onclick=voice;
$('#homeInput').focus();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
