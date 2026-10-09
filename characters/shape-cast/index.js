(()=>{
  const characters=[{"id": "triangle", "name": "Triangle", "color": "electric lemon yellow", "hex": "#FFF42A", "personality": "Jaunty and enterprising. Snappy asymmetrical brows, small forward leans and brisk compact gestures; never angry or bossy."}, {"id": "circle", "name": "Circle", "color": "vivid tangerine orange", "hex": "#FF861F", "personality": "Warm and buoyant. Rounded gestures, gentle bounces and open facial expressions."}, {"id": "square", "name": "Square", "color": "electric spring green", "hex": "#45EE47", "personality": "Calm and dependable. Small measured gestures, balanced stance and restrained expressive changes; visibly awake when active."}, {"id": "star", "name": "Star", "color": "electric hot pink", "hex": "#F92BB9", "personality": "Playful and enthusiastic. Broad but controlled arm poses and energetic eye expression, without changing the five-point silhouette."}, {"id": "crescent", "name": "Crescent", "color": "luminous lavender violet", "hex": "#B85FF4", "personality": "Gentle and unhurried. Graceful lean, slow nod and relaxed hands. Open attentive eyes for listening and work; fully closed eyes for blinks and sleeping."}, {"id": "bean", "name": "Bean", "color": "electric cyan aqua", "hex": "#0FD5E5", "personality": "Inquisitive and slightly quirky. Small alternating tilts, asymmetrical brows and thoughtful glove-to-cheek gestures."}, {"id": "heart", "name": "Heart", "color": "bright warm coral red", "hex": "#FF575E", "personality": "Kind and encouraging. Open palms, soft direct gaze and small reassuring nods; concern is supportive, not distressed."}, {"id": "diamond", "name": "Diamond", "color": "electric cobalt blue", "hex": "#2167EE", "personality": "Poised and precise. Compact deliberate gestures, mild confident smile and controlled tilts."}];
  const states=[{"id": "happy", "group": "emotion", "label": "Happy", "row": 0, "column": 0, "trigger": "A positive conversational moment; never used alone as proof that work completed.", "motion": "Brief eye-crinkle and small bounce, then return to the current activity."}, {"id": "curious", "group": "emotion", "label": "Curious", "row": 0, "column": 1, "trigger": "A new topic or user-invited exploration.", "motion": "Raise one brow, tilt and glance toward the topic, then settle."}, {"id": "surprised", "group": "emotion", "label": "Surprised", "row": 0, "column": 2, "trigger": "An unexpected but noncritical event.", "motion": "Quick widened eyes and tiny recoil, then recover."}, {"id": "confused", "group": "emotion", "label": "Confused", "row": 0, "column": 3, "trigger": "The assistant cannot interpret a request with enough confidence.", "motion": "Small uneven brow and tilt, followed by a clear clarification question."}, {"id": "concerned", "group": "emotion", "label": "Concerned", "row": 1, "column": 0, "trigger": "A supportive conversational response or a recoverable problem.", "motion": "Soft gaze, gentle open palm, one small reassuring nod."}, {"id": "playful", "group": "emotion", "label": "Playful", "row": 1, "column": 1, "trigger": "User chooses a playful tone or initiates play.", "motion": "One wink and a tiny jaunty wave."}, {"id": "idle", "group": "activity", "label": "Idle", "row": 1, "column": 2, "trigger": "The assistant is available and no task is executing.", "motion": "Small breathing motion and occasional complete blink."}, {"id": "listening", "group": "activity", "label": "Listening", "row": 1, "column": 3, "trigger": "Microphone permission is granted and audio capture is actively receiving user input.", "motion": "Attentive forward lean and a restrained acknowledgment nod."}, {"id": "thinking", "group": "activity", "label": "Thinking", "row": 2, "column": 0, "trigger": "The assistant is processing/planning and is not currently running a tool.", "motion": "Look up briefly, glove at chin, return gaze to center."}, {"id": "researching", "group": "activity", "label": "Researching", "row": 2, "column": 1, "trigger": "Retrieval, browsing or source inspection is actively running.", "motion": "Small reading sweeps with pauses, then a downward reset."}, {"id": "working", "group": "activity", "label": "Working", "row": 2, "column": 2, "trigger": "An action such as writing, coding, generating or testing is executing.", "motion": "Steady downward focus, small precise glove movements, occasional checking pause."}, {"id": "answering", "group": "activity", "label": "Answering", "row": 2, "column": 3, "trigger": "A response is being delivered as text or audio.", "motion": "Open-palm explaining gesture with soft eye contact."}, {"id": "needs-input", "group": "activity", "label": "Needs Input", "row": 3, "column": 0, "trigger": "Execution is blocked on a user answer or explicit approval.", "motion": "Patient questioning glance and one open-palm invitation, then rest."}, {"id": "complete", "group": "activity", "label": "Complete", "row": 3, "column": 1, "trigger": "All requested work is confirmed successful.", "motion": "One thumbs-up, small pleased lift, then settle."}, {"id": "error", "group": "activity", "label": "Error", "row": 3, "column": 2, "trigger": "A task or tool action failed and cannot continue without recovery.", "motion": "One concerned pause signal, then attentive neutral stance."}, {"id": "sleeping", "group": "activity", "label": "Sleeping", "row": 3, "column": 3, "trigger": "The assistant is explicitly resting and no foreground or background task requires a visible status.", "motion": "Slow eye closure and a gentle lowered posture."}];
  const variants=[{"id": "starting", "pose": "idle", "label": "Starting\u2026", "trigger": "Initialization is running.", "controls": "Cancel if startup can be interrupted.", "exit": "Idle when ready; error if startup fails."}, {"id": "waiting", "pose": "idle", "label": "Waiting for a result\u2026", "trigger": "An external tool or queue has not returned; no active local work.", "controls": "Stop; show elapsed time when useful, not invented completion percentages.", "exit": "Resume the task when the result arrives; error on timeout."}, {"id": "coding", "pose": "working", "label": "Writing code\u2026", "trigger": "Code generation or editing is actually running.", "controls": "Stop.", "exit": "Checking or answering according to actual workflow."}, {"id": "checking", "pose": "working", "label": "Checking\u2026", "trigger": "A real verification step is running.", "controls": "Stop where supported.", "exit": "Complete only on successful verification, otherwise error or partial result."}, {"id": "awaiting-approval", "pose": "needs-input", "label": "Approval needed", "trigger": "A permission-sensitive action awaits explicit consent.", "controls": "Approve / Decline, with the exact action and destination visible.", "exit": "Resume only on approval; decline leaves the action unperformed."}, {"id": "paused", "pose": "idle", "label": "Paused", "trigger": "A user pause has actually been acknowledged.", "controls": "Resume / Cancel.", "exit": "Resume the saved activity; indicate pending pause until it takes effect."}, {"id": "cancelled", "pose": "idle", "label": "Stopped", "trigger": "Cancellation acknowledged.", "controls": "Start again; keep completed output available.", "exit": "Idle, never complete."}, {"id": "offline", "pose": "idle", "label": "Offline", "trigger": "Required connectivity is unavailable.", "controls": "Reconnect / Retry; identify any available local-only actions.", "exit": "Restore prior task only if it can safely resume; otherwise ask."}, {"id": "permission-denied", "pose": "needs-input", "label": "Access needed", "trigger": "A required permission was denied.", "controls": "Review permission / Choose another method / Cancel.", "exit": "Continue only with a permitted method."}, {"id": "partial", "pose": "concerned", "label": "Partly done", "trigger": "Some requested work completed but some remains blocked or failed.", "controls": "View results / Retry remaining / Stop.", "exit": "Complete only when the remaining work succeeds."}];

  const $=id=>document.getElementById(id),video=$('shape-video'),canvas=$('shape-canvas'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const params=new URLSearchParams(location.search),engine=window.ShapePerformance;
  let current=characters.find(c=>c.id===params.get('character'))||characters[0];
  let activity=[...states.filter(s=>s.group==='activity'),...variants].find(s=>s.id===params.get('state'))?.id||'idle';
  let concept=states.find(s=>s.id===params.get('state'))||states.find(s=>s.id==='idle');
  let expression=null,mode=['concepts','video'].includes(params.get('mode'))?params.get('mode'):'animation';
  let wantsPlay=!reduced.matches,lastReduced=reduced.matches,revision=0,ready=false,time=0,reactionTime=0,last=performance.now(),from='idle',blendTime=1,frame=0,renderer;
  let rendererError='',durable='',lastPose=engine.pose(current.id,'idle',0),loading=null;
  const critical=new Set(['needs-input','awaiting-approval','permission-denied','error','offline','paused','cancelled','waiting','partial','sleeping','complete']);
  const byId=id=>states.find(s=>s.id===id),variant=id=>variants.find(v=>v.id===id),artFor=id=>variant(id)?.pose||id;
  const displayed=()=>expression||activity,art=()=>artFor(displayed());
  const label=id=>variant(id)?.label||byId(id)?.label||id;
  function announce(){ $('shape-announcement').textContent=`${current.name}, ${label(displayed())}. Preview simulation.`; }
  function url(){try{const u=new URL(location.href);u.searchParams.set('character',current.id);u.searchParams.set('mode',mode);u.searchParams.set('state',mode==='concepts'?concept.id:activity);history.replaceState(null,'',u);}catch{}}
  function updatePlay(){ $('shape-play').textContent=wantsPlay?'Pause animation':'Play animation'; }
  function syncReducedMotion(){
    // Chromium can report the new matches value before dispatching change. Reconcile
    // in the render loop and every play entry, so an in-flight play cannot escape it.
    const next=reduced.matches;
    if(next!==lastReduced){lastReduced=next;if(next){wantsPlay=false;video.pause();}updatePlay();}
    $('shape-motion-note').textContent=next?'Reduced motion is on. Still poses are shown; Play explicitly previews motion.':'Preview simulation · No live microphone, audio or assistant is connected.';
  }
  function pause(){wantsPlay=false;video.pause();updatePlay();}
  async function play(){syncReducedMotion();const token=revision;if(!wantsPlay||mode!=='video')return;try{await video.play();syncReducedMotion();if(token!==revision||!wantsPlay||mode!=='video')video.pause();}catch(e){if(token===revision&&e.name!=='AbortError'){pause();}}}
  function details(){
    const id=displayed(),v=variant(activity),s=byId(artFor(id));
    $('shape-activity').value=activity;$('shape-status').textContent=label(activity)+(expression?' · '+label(expression):'');
    $('shape-status-description').textContent=(v?.trigger||byId(activity)?.trigger||'')+' (Simulated in this viewer.)';
    $('shape-recovery').textContent=v?.controls||({idle:'Choose an activity to rehearse.',listening:'Stop capture in a connected application. No microphone is active here.',thinking:'Stop or switch to the actual next activity.',researching:'Show the source being inspected. Stop remains available.',working:'Show the actual action. Stop / Pause when supported.',answering:'Text response preview: quiet mouth; no synthetic speech.', 'needs-input':'Answer the question before work resumes.',complete:'Demo result remains visible after the gesture.',error:'Retry / Edit request / Dismiss; preserve completed output.',sleeping:'Wake on explicit interaction; do not hide active work.'}[activity]||'');
    $('shape-performance-label').textContent=label(id)+' · '+(mode==='video'?'Original idle export':'Local performance');
    $('shape-media-label').textContent=mode==='concepts'?concept.label+' · Still pose':mode==='video'?'Original idle · 4 seconds':label(id)+' · '+(expression?'One-shot reaction':'Activity performance');
    canvas.setAttribute('aria-label',`${current.name}, ${label(id)}, animated artwork preview`);
    $('shape-result').hidden=!durable;$('shape-result').textContent=durable;
    $('shape-status').setAttribute('aria-live',activity==='error'?'assertive':'polite');
    $('shape-reactions').querySelectorAll('button').forEach(b=>b.disabled=critical.has(activity));
    updatePlay();url();
  }
  function setActivity(id){
    if(!byId(id)&&!variant(id))return false;if(byId(id)?.group==='emotion')return react(id);
    from=art();const previous=activity;activity=id;time=0;
    if(critical.has(id))expression=null;
    if(!expression)blendTime=0;
    if(id==='complete')durable='Complete · The demonstration result stays available after the celebration.';
    else if(id==='partial')durable='Partly done · Review completed output and retry the remaining work.';
    else if(id==='cancelled')durable='Stopped · Previously completed output is preserved. No success was reported.';
    if(previous!==id){details();announce();}return true;
  }
  function react(id){if(!engine.durations[id]||id==='complete'||critical.has(activity))return false;from=art();expression=id;reactionTime=0;blendTime=0;details();announce();return true;}
  function updatePose(){
    $('shape-state').value=concept.id;$('shape-pose').alt=`${current.name}, ${concept.label}, static pose concept`;
    $('shape-pose').style.left=`${-concept.column*100}%`;$('shape-pose').style.top=`${-concept.row*100}%`;
    $('shape-trigger').textContent=concept.trigger;$('shape-motion').textContent=concept.motion;
  }
  function updateMode(){
    video.hidden=mode!=='video';canvas.hidden=mode!=='animation';$('shape-crop').hidden=mode!=='concepts';
    $('shape-animation-controls').hidden=mode==='concepts';$('shape-concept-controls').hidden=mode!=='concepts';$('shape-performance-controls').hidden=mode!=='animation';
    for(const [id,m]of [['animation','animation'],['video','video'],['concept','concepts']])$('shape-'+id+'-mode').setAttribute('aria-pressed',String(mode===m));
    if(mode==='video'&&wantsPlay)play();else video.pause();updatePose();details();
  }
  async function loadPerformance(c,token){
    if(!renderer){ready=true;return;}
    ready=false;
    try{
      const image=new Image();image.src=`performances/${c.id}/atlas.webp`;
      const [response]=await Promise.all([fetch(`performances/${c.id}/rig.json`),image.decode()]);
      if(!response.ok)throw Error('The local performance anchors could not be loaded.');const rig=await response.json();
      if(token!==revision)return;renderer.load(image,rig);lastPose=engine.pose(current.id,displayed(),expression?reactionTime:time,{still:!wantsPlay&&reduced.matches});renderer.render(art(),lastPose,null,1);ready=true;canvas.dataset.ready='true';
    }catch(e){if(token===revision){$('shape-error').textContent=e.message;$('shape-error').hidden=false;pause();}}
  }
  function select(c,initial=false){
    revision++;video.pause();current=c;time=0;reactionTime=0;blendTime=1;const folder=`animations/${c.id}/`;
    $('shape-cast').style.setProperty('--accent',c.hex);$('shape-name').textContent=c.name;$('shape-color').textContent=c.color;$('shape-personality').textContent=c.personality;
    document.querySelectorAll('.shape-pick').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.character===c.id)));
    $('shape-error').hidden=!rendererError;if(rendererError)$('shape-error').textContent=rendererError;video.poster=folder+'poster.png';video.src=folder+'idle.mp4';video.setAttribute('aria-label',c.name+' original idle animation');video.load();
    for(const format of ['mp4','webp','gif']){const a=$('shape-'+format);a.href=folder+'idle.'+format;a.download=c.id+'-idle.'+format;}
    $('shape-pose').src=`performances/${c.id}/atlas.webp`;$('shape-sheet').href=`states/${c.id}.png`;
    loading=loadPerformance(c,revision);updateMode();if(!initial)announce();
  }
  characters.forEach(c=>{
    const b=document.createElement('button');b.className='shape-pick';b.dataset.character=c.id;b.setAttribute('aria-label',c.name);b.setAttribute('aria-pressed','false');
    const img=document.createElement('img');img.src=`animations/${c.id}/poster.png`;img.alt='';img.width=80;img.height=80;
    const text=document.createElement('span');text.textContent=c.name;b.append(img,text);b.addEventListener('click',()=>select(c));$('shape-picker').append(b);
  });
  for(const [group,text]of [['emotion','Core expressions'],['activity','Assistant activities']]){
    const g=document.createElement('optgroup');g.label=text;
    states.filter(s=>s.group===group).forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.label;g.append(o);});$('shape-state').append(g);
  }
  for(const s of [...states.filter(s=>s.group==='activity'),...variants]){const o=document.createElement('option');o.value=s.id;o.textContent=s.label;$('shape-activity').append(o);}
  states.filter(s=>s.group==='emotion').forEach(s=>{const b=document.createElement('button');b.className='btn';b.textContent=s.label;b.addEventListener('click',()=>react(s.id));$('shape-reactions').append(b);});
  $('shape-animation-mode').addEventListener('click',()=>{mode='animation';updateMode();announce();});
  $('shape-video-mode').addEventListener('click',()=>{mode='video';updateMode();announce();});
  $('shape-concept-mode').addEventListener('click',()=>{mode='concepts';updateMode();announce();});
  $('shape-activity').addEventListener('change',e=>setActivity(e.target.value));
  $('shape-state').addEventListener('change',e=>{concept=byId(e.target.value);updateMode();announce();});
  $('shape-play').addEventListener('click',()=>{syncReducedMotion();wantsPlay=!wantsPlay;if(wantsPlay)play();else video.pause();updatePlay();});
  $('shape-restart').addEventListener('click',()=>{syncReducedMotion();video.currentTime=0;time=0;reactionTime=0;blendTime=0;wantsPlay=true;play();updatePlay();});
  $('shape-round').addEventListener('change',e=>$('shape-stage').classList.toggle('round',e.target.checked));
  video.addEventListener('play',()=>{syncReducedMotion();if(!wantsPlay||mode!=='video')video.pause();});
  video.addEventListener('error',()=>{$('shape-error').textContent='This browser could not play the video. Try the animated WebP or GIF download.';$('shape-error').hidden=false;if(mode==='video')pause();});
  reduced.addEventListener('change',syncReducedMotion);
  try{renderer=engine.renderer(canvas);}catch(e){rendererError=e.message;$('shape-error').textContent=e.message;$('shape-error').hidden=false;mode='concepts';$('shape-animation-mode').disabled=true;}
  function render(now){
    syncReducedMotion();const dt=Math.min(.05,(now-last)/1000);last=now;
    if(wantsPlay&&mode==='animation'&&!document.hidden&&ready){time+=dt;reactionTime+=dt;blendTime+=dt;}
    const t=expression?reactionTime:time;
    if(expression&&t>=engine.durations[expression]){expression=null;time=0;from=art();blendTime=1;details();}
    else if(activity==='complete'&&time>=engine.durations.complete){activity='idle';time=0;blendTime=1;details();}
    if(ready&&mode==='animation'){
      lastPose=engine.pose(current.id,displayed(),expression?reactionTime:time,{still:!wantsPlay&&reduced.matches});
      let blend=reduced.matches&&!wantsPlay?1:engine.smooth(blendTime/.24);
      const duration=engine.durations[displayed()];if(duration&&duration-t<.3){from=artFor(expression?activity:'idle');blend=engine.smooth((duration-t)/.3);}
      let fromPose=null;
      if(activity==='sleeping'&&!expression&&time<1.1&&wantsPlay){from='idle';blend=engine.smooth((time-.7)/.4);fromPose=engine.pose(current.id,'idle',0);fromPose.blink=[engine.smooth(time/.8),engine.smooth(time/.8)];}
      renderer.render(art(),lastPose,from,blend,fromPose);frame++;
    }
    requestAnimationFrame(render);
  }
  syncReducedMotion();select(current,true);requestAnimationFrame(render);
  window.shapeCastPreview={
    getState:()=>({character:current.id,mode,state:mode==='concepts'?concept.id:displayed(),activity,expression,paused:mode==='video'?video.paused:!wantsPlay,time:mode==='video'?video.currentTime:time,ready:mode==='video'?video.readyState>=2:ready,reducedMotion:reduced.matches,phase:lastPose.phase,channels:lastPose,frame,durable}),
    setActivity,react,
    // Deterministic review clock used by the contact-sheet and pixel-motion tests.
    seek(seconds){time=seconds;reactionTime=seconds;blendTime=seconds;},
    selectCharacter(id){const c=characters.find(c=>c.id===id);if(c)select(c);return loading;}
  };
})();
