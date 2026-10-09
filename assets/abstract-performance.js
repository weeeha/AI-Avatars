/* Shared local preview performance. No agent, audio, microphone, or host integration. */
(() => {
  'use strict';
  const activities = {
    idle:'Idle', starting:'Starting / waking', listening:'Listening', thinking:'Thinking', researching:'Researching / searching', working:'Working / coding / checking', answering:'Answering / speaking', waiting:'Waiting', 'needs-input':'Needs input / approval', complete:'Complete / success', error:'Error / recovery', sleeping:'Sleeping'
  };
  const emotions = {neutral:'Neutral / calm',happy:'Happy',curious:'Curious',surprised:'Surprised',confused:'Confused',concerned:'Concerned',playful:'Playful'};
  const conditions = {
    normal:{label:'Normal'}, offline:{label:'Offline · waiting for connection',state:'waiting'}, reconnecting:{label:'Reconnecting · outcome unknown',state:'waiting'}, 'permission-denied':{label:'Permission denied · action required',state:'needs-input'}, paused:{label:'Task paused',state:'waiting'}, cancelled:{label:'Cancelled · no completion claimed',state:'idle'}, partial:{label:'Partial result · review required',state:'needs-input'}
  };
  const descriptions = {idle:'Ambient presence',starting:'Unfolds and opens into an attentive pose',listening:'Draws inward and attends · simulated input',thinking:'Alternates inward folds while considering',researching:'Scans separate regions in a deliberate sweep',working:'Indexes through focused, repeated operations',answering:'Phrases expand and release · simulated voice',waiting:'Releases tension and holds a patient pose','needs-input':'Leans forward once, then holds attention',complete:'One opening gesture, then a resolved pose · simulated outcome',error:'Recoils, holds an interrupted pose, and waits for recovery',sleeping:'Closes and settles into rest'};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const settledStates=new Set(['starting','waiting','needs-input','complete','error','sleeping']);
  const protectedStates=new Set(['needs-input','error','sleeping']);
  function poseFor(state,emotion,age,variant) {
    const quiet=settledStates.has(state), t=quiet?Math.min(age,2.4):age;
    const u=smooth(t/1.1), decay=Math.exp(-t*3), k=variant%7;
    const tempo=.88+(variant%5)*.07, a=t*tempo;
    const p={x:0,y:0,sx:1,sy:1,turn:0,aperture:1,fold:0,scan:0,focus:0,listen:0,think:0,speak:0,success:0,fail:0,brightness:1,clock:quiet?Math.min(age,2.4):age};
    switch(state) {
      case 'idle': p.y=Math.sin(a*.9)*.009; break;
      case 'starting': p.sx=p.sy=.52+.48*u+Math.sin(t*4)*decay*.12;p.aperture=.15+.85*u;p.turn=(1-u)*(-.2+k*.035);break;
      case 'listening': p.listen=1;p.aperture=1.15;p.x=Math.sin(a*.6)*.012;p.y=-.025;p.sx=.98;p.sy=1.04;p.fold=.08*Math.sin(a*2);break;
      case 'thinking': p.think=1;p.x=.027*Math.sin(a*1.6);p.y=-.03;p.turn=.07*Math.sin(a*1.4);p.aperture=.8;p.fold=.18*Math.sin(a*2.1);break;
      case 'researching': p.scan=Math.sin(a*1.15);p.x=p.scan*.13;p.y=Math.cos(a*.75)*.06;p.aperture=1.12;p.turn=.1*p.scan;p.fold=.08*Math.sin(a*3);break;
      case 'working': {const q=(a%1.6)/1.6; p.focus=1;p.x=(Math.floor(q*4)-1.5)*.025;p.y=.035*Math.sin(q*Math.PI*2);p.aperture=.72;p.turn=(Math.floor(a/1.6)%3-1)*.08;p.fold=.14*Math.sin(q*Math.PI*4);break;}
      case 'answering': p.speak=(.3+.7*Math.pow(Math.sin(a*6.4),2))*(.55+.45*Math.sin(a*1.6)**2);p.sy=1+p.speak*.08;p.sx=1-p.speak*.025;p.aperture=1+p.speak*.18;p.y=-p.speak*.014;break;
      case 'waiting': p.y=.035*u;p.sx=1-.025*u;p.sy=1-.09*u;p.aperture=1-.24*u;p.turn=.035*u;break;
      case 'needs-input': p.y=-.05*u;p.sx=1+.06*u;p.sy=1+.1*u;p.aperture=1+.24*u;p.turn=.085*u;p.scan=.35*u;break;
      case 'complete': p.success=u;p.sx=p.sy=1+Math.sin(Math.min(t/1.8,1)*Math.PI)*.17;p.aperture=1+.13*u;p.y=-.018*u;break;
      case 'error': p.fail=u;p.x=Math.sin(t*21)*decay*.12;p.sx=1-.08*u;p.sy=1-.17*u;p.turn=-.11*u;p.fold=.21*u;p.aperture=1-.48*u;break;
      case 'sleeping': p.sy=1-.50*u;p.sx=1-.14*u;p.aperture=1-.58*u;p.y=.07*u;p.brightness=1-.48*u;break;
    }
    // Expressions reshape material and gaze independently of the selected activity.
    switch(emotion) {
      case 'happy':p.sy*=.92;p.sx*=1.055;p.aperture*=.87;p.y-=.035+.012*Math.sin(a*2);p.turn+=.025*Math.sin(a*2);break;
      case 'curious':p.turn+=.16;p.x+=.035*Math.sin(a*.8);p.aperture*=1.13;p.fold+=.075;p.sy*=1.06;break;
      case 'surprised':p.sx*=1.12;p.sy*=1.15;p.aperture*=1.28;p.y-=.05;p.fold+=.045*Math.sin(a*3);break;
      case 'confused':p.turn+=.14*Math.sin(a*1.6);p.x+=.028*Math.sin(a*2.4);p.fold+=.19;p.aperture*=.82;break;
      case 'concerned':p.turn-=.11;p.sx*=.94;p.sy*=.91;p.aperture*=.72;p.y+=.027;p.fold-=.09;break;
      case 'playful':p.turn+=.19*Math.sin(a*2.2);p.x+=.05*Math.sin(a*1.4);p.y-=.045*Math.abs(Math.sin(a*2.2));p.sx*=1+.045*Math.sin(a*4.4);p.fold+=.12*Math.sin(a*2.2);break;
    }
    // Character-dependent amplitude preserves differing temperaments and avoids lockstep acting.
    const gain=.86+(variant%6)*.06;p.x*=gain;p.y*=gain;p.turn*=gain;p.fold*=gain;
    return p;
  }
  function mount({root,variants,render,extraControls=''}) {
    let selected=0, state='idle', emotion='neutral', condition='normal', age=0,time=0, frame=0, previous=0, raf=0, transition=1, from=null, reactionAge=2, demo=false,demoAge=0;
    const media=matchMedia('(prefers-reduced-motion: reduce)'); let paused=media.matches;
    let extra={shell:false,showTime:false,palette:'violet'};
    const key='abstract-performance:'+root.id;
    try {const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){if(activities[saved.state])state=saved.state;if(emotions[saved.emotion])emotion=saved.emotion;if(variants.some(v=>v.id===saved.character))selected=variants.findIndex(v=>v.id===saved.character);extra={...extra,...saved.extra};}}catch{}
    const requested=new URLSearchParams(location.search).get('character');if(variants.some(v=>v.id===requested))selected=variants.findIndex(v=>v.id===requested);
    const controls=document.createElement('div');controls.className='abstract-controls';controls.innerHTML=`<div class="abstract-fields"><label>Character<select data-character>${variants.map(v=>`<option value="${v.id}">${v.name}</option>`).join('')}</select></label><label>Activity<select data-activity>${Object.entries(activities).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Emotion<select data-emotion>${Object.entries(emotions).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>System condition<select data-condition>${Object.entries(conditions).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label></div><div class="abstract-actions"><button data-play type="button"></button><button data-demo type="button">Play demo</button><button data-react type="button">Acknowledge</button><button data-recover type="button">Recover to idle</button>${extraControls}</div><p data-status aria-live="polite"></p><p class="abstract-note">Visual simulation · no microphone, audio, or agent connection. Completion in this preview is a manually selected demonstration.</p>`;
    root.append(controls);
    const q=s=>root.querySelector(s);const persist=()=>{try{localStorage.setItem(key,JSON.stringify({character:variants[selected].id,state,emotion,extra}));}catch{}};
    let pose=poseFor(state,emotion,age,selected);
    function sync(){q('[data-character]').value=variants[selected].id;q('[data-activity]').value=state;q('[data-emotion]').value=emotion;q('[data-condition]').value=condition;q('[data-play]').textContent=paused?'Play motion':'Pause motion';q('[data-play]').setAttribute('aria-pressed',String(paused));q('[data-demo]').textContent=demo?'Stop demo':'Play demo';q('[data-react]').disabled=protectedStates.has(state);q('[data-status]').textContent=`${variants[selected].name} · ${activities[state]} · ${emotions[emotion]}. ${descriptions[state]}.${condition!=='normal'?' '+conditions[condition].label+'.':''}${media.matches?' Reduced motion: still pose.':paused?' Motion paused.':''}`;if(q('[data-shell]'))q('[data-shell]').checked=extra.shell;if(q('[data-time]'))q('[data-time]').checked=extra.showTime;if(q('[data-palette]'))q('[data-palette]').value=extra.palette;}
    function draw(){
      const target=poseFor(state,emotion,media.matches?Math.max(age,2.4):age,selected);
      const blend=smooth(transition);pose={};for(const k of Object.keys(target))pose[k]=from?mix(from[k],target[k],blend):target[k];
      if(reactionAge<1&&!protectedStates.has(state)){pose.y+=Math.sin(reactionAge*Math.PI*2)*.06*(1-reactionAge);pose.aperture*=1-.3*Math.sin(reactionAge*Math.PI);}
      render({variant:variants[selected],index:selected,state,emotion,pose,time:pose.clock,age:settledStates.has(state)?Math.min(media.matches?2.4:age,2.4):age,extra});
      const canvas=root.querySelector('canvas:not([hidden])');if(canvas){canvas.dataset.ready='true';canvas.dataset.state=state;canvas.dataset.renderedEmotion=emotion;canvas.dataset.frame=String(frame);canvas.setAttribute('aria-label',`${variants[selected].name}. ${activities[state]}. ${emotions[emotion]}. ${descriptions[state]}.`);}
    }
    function setState(value,keepDemo=false){if(!activities[value])return;from={...pose};state=value;age=paused||media.matches?2.4:0;transition=paused||media.matches?1:0;reactionAge=2;if(!keepDemo){demo=false;condition='normal';}sync();draw();persist();}
    function advance(dt){if(paused||document.hidden)return;time+=dt;age+=dt;frame++;transition=Math.min(1,transition+dt/.45);reactionAge+=dt;
      if(demo){demoAge+=dt;if(demoAge>=3){demoAge=0;const order=['starting','listening','thinking','researching','working','answering','waiting','needs-input','complete','idle'];const at=order.indexOf(state);if(at===order.length-1)demo=false;else setState(order[at+1]||'starting',true);sync();}}
      draw();
    }
    function tick(now){raf=0;if(media.matches&&!paused){from=null;transition=1;reactionAge=2;setPaused(true);return;}if(!paused&&!document.hidden){const dt=previous?Math.min((now-previous)/1000,.08):0;previous=now;advance(dt);raf=requestAnimationFrame(tick);}else previous=0;}
    function run(){if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(tick);}
    function setPaused(value){paused=Boolean(value)||media.matches;previous=0;if(paused){cancelAnimationFrame(raf);raf=0;demo=false;}sync();draw();run();}
    q('[data-character]').addEventListener('change',e=>{selected=variants.findIndex(v=>v.id===e.target.value);from=null;age=0;transition=1;sync();draw();persist();});
    q('[data-activity]').addEventListener('change',e=>setState(e.target.value));
    function setEmotion(value){if(!emotions[value])return;from={...pose};emotion=value;transition=paused||media.matches?1:0;sync();draw();persist();}
    q('[data-emotion]').addEventListener('change',e=>setEmotion(e.target.value));
    q('[data-condition]').addEventListener('change',e=>{const value=e.target.value;setState(conditions[value].state||'idle');condition=value;sync();});
    q('[data-play]').addEventListener('click',()=>setPaused(!paused));
    q('[data-demo]').addEventListener('click',()=>{if(demo){demo=false;sync();}else if(!media.matches){paused=false;demo=true;demoAge=0;setState('starting',true);run();}});
    q('[data-react]').addEventListener('click',()=>{if(!protectedStates.has(state)){reactionAge=media.matches||paused?2:0;draw();}});
    q('[data-recover]').addEventListener('click',()=>setState('idle'));
    for(const [selector,key] of [['[data-shell]','shell'],['[data-time]','showTime'],['[data-palette]','palette']])q(selector)?.addEventListener('change',e=>{extra[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;draw();persist();});
    media.addEventListener('change',()=>{if(media.matches){from=null;transition=1;reactionAge=2;setPaused(true);}else{sync();draw();}});
    document.addEventListener('visibilitychange',()=>{previous=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else run();});
    const api={getState:()=>({character:variants[selected].id,state,emotion,condition,paused,reducedMotion:media.matches,age,time,frame,transition,reaction:reactionAge<1,demo,pose:{...pose},extra:{...extra}}),setState,setEmotion,setPaused,advance,redraw:draw};
    window.abstractPreview=api;sync();draw();run();return api;
  }
  window.AbstractPerformance={mount,activities,emotions,conditions,poseFor};
})();
