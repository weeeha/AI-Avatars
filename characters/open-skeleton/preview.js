const allVideos=[...document.querySelectorAll('video')],toggle=document.querySelector('#toggle'),status=document.querySelector('#status');
let playing=!matchMedia('(prefers-reduced-motion:reduce)').matches,group='emotion',focused=null;
const visible=()=>allVideos.filter(v=>!v.closest('.card').hidden);
function update(){const vs=visible(),active=vs.filter(v=>!v.paused&&!v.ended).length;toggle.textContent=active?'Pause all':'Play all';status.textContent=active?'Playing '+active+' / '+vs.length:vs.length&&vs.every(v=>v.ended)?'Complete':'Paused'}
async function playAll(){const result=await Promise.allSettled(visible().map(v=>v.play()));playing=result.some(r=>r.status==='fulfilled');update()}
function filter(){allVideos.forEach(v=>{const card=v.closest('.card');card.hidden=focused?v.id!==focused:group!=='all'&&card.dataset.group!==group;if(card.hidden)v.pause()});document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===group)));document.querySelector('.grid').classList.toggle('focused',Boolean(focused));document.querySelector('#back').hidden=!focused;update();if(playing)playAll()}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{group=b.dataset.filter;focused=null;filter()});
document.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>{focused=b.dataset.focus;filter();scrollTo({top:0,behavior:'instant'})});
document.querySelector('#back').onclick=()=>{focused=null;filter()};
document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{const v=document.getElementById(b.dataset.replay);v.currentTime=0;v.play().catch(()=>{});playing=true});
toggle.onclick=()=>{if(visible().some(v=>!v.paused&&!v.ended)){playing=false;visible().forEach(v=>v.pause());update()}else playAll()};
document.querySelector('#restart').onclick=()=>{visible().forEach(v=>v.currentTime=0);playing=true;playAll()};
document.querySelector('#speed').onchange=e=>allVideos.forEach(v=>v.playbackRate=Number(e.target.value));
document.querySelector('#loop').onchange=e=>allVideos.forEach(v=>v.loop=e.target.checked);
allVideos.forEach(v=>{v.autoplay=false;v.pause();v.addEventListener('play',update);v.addEventListener('pause',update);v.addEventListener('ended',()=>{if(visible().every(x=>x.ended))playing=false;update()});v.addEventListener('error',()=>{document.querySelector('#error').textContent='Could not load '+v.id+'. Try reloading the local preview.'})});
filter();
