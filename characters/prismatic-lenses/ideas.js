(() => {
  const root=document.getElementById('lens-motion-ideas');
  const gallery=root.querySelector('.mi-gallery'),canvas=root.querySelector('canvas');
  const tiles=Array.from(root.querySelectorAll('.mi-art'));
  const palette=root.querySelector('#mi-palette'),speed=root.querySelector('#mi-speed'),output=root.querySelector('output'),play=root.querySelector('[data-play]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const paletteNames=['Prismatic','Pink','Cyan','Lilac','Amber','Mint'];
  let state={palette:0,speed:1.75,paused:reduced.matches};
  let time=0,previous=0,lastDraw=0,raf=0,visible=true,lost=false,gl,program,uniforms,viewports=[];
  const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
  const fragment=`
    precision highp float;
    uniform vec2 size,offset;
    uniform float time,idea,palette;
    const float PI=3.14159265359;
    const float TAU=6.28318530718;
    float hash(float p){return fract(sin(p*127.1+19.7)*43758.5453);}
    mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    float disk(vec2 p,float radius){return 1.-smoothstep(radius-.025,radius+.045,length(p));}
    float line(float d,float width){return exp(-pow(d/width,2.));}
    float ring(vec2 p,float radius,float width){return line(length(p)-radius,width);}
    float scene(vec2 p,float t){
      float r=length(p),a=atan(p.y,p.x);
      if(idea<.5){
        vec2 c1=vec2(.28*cos(t*.8),.22*sin(t*.9));
        vec2 c2=vec2(-.29*cos(t*.8),-.26*sin(t*.75));
        vec2 c3=vec2(.30*sin(t*.6),.37*cos(t*.8));
        float f=.065/(dot(p-c1,p-c1)+.014)+.053/(dot(p-c2,p-c2)+.014)+.038/(dot(p-c3,p-c3)+.013);
        return smoothstep(.73,1.2,f);
      }
      if(idea<1.5){
        vec2 orbit=vec2(.39*cos(t*.65),.20*sin(t*.65));
        float sun=disk(p-orbit,.30);
        float moon=disk(p+orbit,.24);
        float rim=ring(p+orbit,.242,.024);
        return clamp(sun*(1.-moon)+rim*.62+moon*.16,0.,1.);
      }
      if(idea<2.5){
        vec2 q=turn(.25*sin(t*.4))*p;
        float k=sin(q.x*4.8+t*.8);
        float d1=q.y-.32*k,d2=q.y+.32*k;
        float ribbon1=line(d1,.105),ribbon2=line(d2,.072);
        float cover=smoothstep(-.12,.12,cos(q.x*4.8+t*.8));
        float weave=mix(max(ribbon1*.6,ribbon2),max(ribbon1,ribbon2*.45),cover);
        return weave*(1.-smoothstep(.57,.83,abs(q.x)));
      }
      if(idea<3.5){
        float cycle=mod(t,7.0),pour=min(cycle/5.8,1.);
        float flip=smoothstep(5.8,7.0,cycle)*PI;
        vec2 q=turn(flip)*p;
        float width=.045+.77*abs(q.y);
        float sides=line(abs(q.x)-width,.018)*(1.-smoothstep(.56,.61,abs(q.y)));
        float caps=line(abs(q.y)-.59,.021)*(1.-smoothstep(.46,.50,abs(q.x)));
        float interior=(1.-smoothstep(width-.035,width-.005,abs(q.x)))*(1.-smoothstep(.565,.595,abs(q.y)));
        float top=step(.035,q.y)*(1.-smoothstep(.55*(1.-pour)-.02,.55*(1.-pour)+.015,q.y));
        float bottom=(1.-step(-.035,q.y))*(1.-smoothstep(-.56+.55*pour,-.53+.55*pour,q.y));
        float stream=line(q.x,.024)*step(-.48,q.y)*(1.-step(.05,q.y))*(.5+.5*sin(q.y*62.+t*18.));
        return clamp((top+bottom)*interior*.83+max(sides,caps)*.4+stream*(1.-step(5.8,cycle)),0.,1.);
      }
      if(idea<4.5){
        float lights=0.;
        float spread=.42+.19*sin(t*.45);
        for(int i=0;i<9;i++){
          float k=float(i);
          vec2 pos=vec2(sin(t*(.24+hash(k)*.20)+k*2.4),cos(t*(.33+hash(k+4.)*.15)+k*1.9))*spread;
          float twinkle=.55+.45*sin(t*1.7+k*2.0);
          lights+=exp(-dot(p-pos,p-pos)/(.003+twinkle*.004))*(.35+.65*twinkle);
        }
        return min(lights,1.);
      }
      if(idea<5.5){
        float angle=mod(a-t*.9+TAU*10.,TAU);
        float sweep=exp(-angle*4.1)*(1.-smoothstep(.66,.75,r));
        float rings=(ring(p,.25,.009)+ring(p,.48,.009)+ring(p,.70,.009))*.18;
        float cross=(line(p.x,.007)+line(p.y,.007))*.12*(1.-smoothstep(.66,.71,r));
        float target=0.;
        for(int i=0;i<3;i++){
          float k=float(i),ta=k*2.2+.6;
          vec2 pos=vec2(cos(ta),sin(ta))*(.29+k*.13);
          float age=mod(ta-t*.9+TAU*10.,TAU);
          target+=disk(p-pos,.06)*exp(-age*.65);
        }
        return clamp(sweep+rings+cross+target,0.,1.);
      }
      if(idea<6.5){
        vec2 q=turn(-.23)*p;
        float phase=q.y*7.-t*1.3;
        float x=.33*sin(phase);
        float front=.6+.4*cos(phase);
        float strands=line(q.x-x,.06)*front+line(q.x+x,.06)*(1.2-front);
        float rungPhase=fract((q.y-t*1.3/7.)/.16+.5)-.5;
        float rungs=line(rungPhase*.16,.014)*(1.-smoothstep(abs(x)-.02,abs(x)+.02,abs(q.x)))*.33;
        return min(strands+rungs,1.)*(1.-smoothstep(.64,.79,abs(q.y)));
      }
      if(idea<7.5){
        float level=.12*sin(t*.45);
        float wave=level+.10*sin(p.x*5.+t*1.0)+.046*sin(p.x*9.-t*.65);
        float filled=1.-smoothstep(wave-.02,wave+.025,p.y);
        float foam=line(p.y-wave,.045);
        float depth=.60+.14*sin(p.y*13.+p.x*3.+t*.8);
        return clamp(filled*depth+foam*.45,0.,1.)*(1.-smoothstep(.83,.9,r));
      }
      if(idea<8.5){
        float opening=.5+.5*sin(t*.65);
        float petal=.30+opening*.18+(.10+opening*.08)*cos(6.*a+t*.32);
        float silhouette=1.-smoothstep(petal-.025,petal+.05,r);
        float veins=.65+.35*cos(6.*a+t*.32);
        float core=disk(p,.12+.045*opening);
        return clamp(silhouette*(.40+.4*veins)+core*.38,0.,1.);
      }
      float blink=1.-.95*exp(-pow((mod(t,4.7)-3.45)/.10,2.));
      vec2 gaze=vec2(.065*sin(t*.8),.05*sin(t*.55));
      float eyes=0.;
      for(int i=0;i<2;i++){
        vec2 e=p-vec2(i==0?-.29:.29,.05);
        float outer=length(e/vec2(.205,.29*blink));
        float white=1.-smoothstep(.91,1.04,outer);
        vec2 ep=(e-gaze*vec2(1.,blink))/vec2(1.,max(blink,.04));
        float pupil=disk(ep,.098);
        float glint=disk(ep-vec2(-.04,.055),.026);
        eyes+=white*(1.-pupil*.90)+glint;
      }
      return clamp(eyes,0.,1.);
    }
    vec3 theme(vec3 rose,vec3 cyan,vec3 lilac,vec3 amber,vec3 mint){
      if(palette<1.5)return rose;
      if(palette<2.5)return cyan;
      if(palette<3.5)return lilac;
      if(palette<4.5)return amber;
      return mint;
    }
    vec3 colorField(vec2 p,float t){
      float f=clamp(scene(p,t),0.,1.);
      if(palette<.5){
        vec3 bg=vec3(.028,.041,.052);
        vec3 teal=vec3(.10,.71,.65),coral=vec3(1.,.43,.31),pink=vec3(.96,.04,.52);
        vec3 ink=mix(teal,coral,smoothstep(-.15,.68,p.y-p.x+.16*sin(t*.4)));
        ink=mix(ink,pink,smoothstep(.0,.72,p.x-p.y));
        vec3 c=mix(bg,ink,pow(f,.67));
        float edge=exp(-pow((f-.30)/.12,2.));
        return c+ink*edge*.16;
      }
      vec3 bg=theme(vec3(.93,.89,.92),vec3(.76,.86,.88),vec3(.92,.88,.96),vec3(.98,.93,.81),vec3(.84,.94,.87));
      vec3 mid=theme(vec3(1.,.12,.58),vec3(.19,.65,.78),vec3(.65,.39,.99),vec3(1.,.58,.06),vec3(.13,.73,.48));
      vec3 dark=theme(vec3(.31,.0,.17),vec3(.03,.23,.29),vec3(.20,.045,.39),vec3(.36,.10,.008),vec3(.015,.23,.16));
      vec3 c=mix(bg,mid,smoothstep(.0,.45,f));
      return mix(c,dark,smoothstep(.45,1.0,f));
    }
    void main(){
      vec2 p=(gl_FragCoord.xy-offset)/size*2.-1.;
      if(length(p)>.985)discard;
      float cell=2./15.;
      vec2 center=floor(p/cell+.5)*cell;
      vec2 q=(p-center)/(cell*.49);
      float d=length(q),aa=2.5/size.x/(cell*.49);
      float mask=1.-smoothstep(1.-aa,1.+aa,d);
      float bulge=sqrt(max(0.,1.-dot(q,q)));
      vec2 refracted=center+(p-center)*(.45+1.5*pow(min(d,1.),3.))+q*cell*.18*bulge;
      vec3 plain=colorField(p,time);
      vec3 lens=colorField(mix(center,refracted,.72),time);
      float rim=exp(-pow((d-.92)/.065,2.));
      lens*=.98+.02*q.y;
      lens+=vec3(.11,.095,.105)*rim*max(0.,dot(q,vec2(-.6,.8)));
      lens-=vec3(.04)*rim*max(0.,dot(q,vec2(.6,-.8)));
      vec3 c=mix(plain,lens,mask);
      float noise=fract(sin(dot(gl_FragCoord.xy,vec2(127.1,311.7)))*43758.5453)-.5;
      c+=noise*(palette<.5?.019:.007);
      float alpha=1.-smoothstep(.977,.985,length(p));
      gl_FragColor=vec4(clamp(c,0.,1.),alpha);
    }`;
  function fail(message){root.querySelector('[data-error]').hidden=false;root.querySelector('[data-error]').textContent=message;canvas.dataset.ready='false';}
  function compile(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  function init(){
    gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
    if(!gl)throw Error('This preview needs WebGL enabled.');
    program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    uniforms={};for(const key of ['size','offset','time','idea','palette'])uniforms[key]=gl.getUniformLocation(program,key);
    gl.clearColor(0,0,0,0);canvas.dataset.ready='true';root.querySelector('[data-error]').hidden=true;
  }
  function resize(){
    if(!gl||lost)return;
    const bounds=gallery.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);
    const w=Math.max(1,Math.round(bounds.width*ratio)),h=Math.max(1,Math.round(bounds.height*ratio));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    viewports=tiles.map(tile=>{const b=tile.getBoundingClientRect();return{x:Math.round((b.left-bounds.left)*ratio),y:Math.round((bounds.bottom-b.bottom)*ratio),size:Math.round(b.width*ratio)};});
    draw();
  }
  function draw(){
    if(!gl||lost||!viewports.length)return;
    gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.palette,state.palette);
    viewports.forEach((v,i)=>{gl.viewport(v.x,v.y,v.size,v.size);gl.uniform2f(uniforms.size,v.size,v.size);gl.uniform2f(uniforms.offset,v.x,v.y);gl.uniform1f(uniforms.idea,i);gl.drawArrays(gl.TRIANGLES,0,6);});
  }
  function animate(now){
    raf=0;if(state.paused||!visible||document.hidden||lost)return;
    if(previous)time+=Math.min((now-previous)/1000,.2)*state.speed;previous=now;
    if(now-lastDraw>1000/30){draw();lastDraw=now;}
    raf=requestAnimationFrame(animate);
  }
  function schedule(){cancelAnimationFrame(raf);raf=0;previous=0;if(!state.paused&&visible&&!document.hidden&&!lost)raf=requestAnimationFrame(animate);}
  function sync(){palette.value=String(state.palette);speed.value=state.speed;output.textContent=state.speed.toFixed(2)+'×';play.textContent=state.paused?'Play all':'Pause all';play.setAttribute('aria-label',state.paused?'Play all animations':'Pause all animations');draw();schedule();}
  function save(){window.avatarState?.setWidgetState?.({modelContent:{study:'SuperClock ten motion ideas',palette:paletteNames[state.palette],speed:state.speed},privateContent:{paused:state.paused}})?.catch(()=>{});}
  function restore(saved){const m=saved?.modelContent,p=saved?.privateContent;if(m?.study!=='SuperClock ten motion ideas')return;const index=paletteNames.indexOf(m.palette);if(index>=0)state.palette=index;if(typeof m.speed==='number'&&Number.isFinite(m.speed))state.speed=Math.max(.25,Math.min(2,m.speed));if(typeof p?.paused==='boolean')state.paused=p.paused||reduced.matches;}
  palette.addEventListener('change',()=>{state.palette=Number(palette.value);sync();save();root.querySelector('[data-status]').textContent=paletteNames[state.palette]+' applied to all ten ideas.';});
  speed.addEventListener('input',()=>{state.speed=Number(speed.value);output.textContent=state.speed.toFixed(2)+'×';});speed.addEventListener('change',save);
  play.addEventListener('click',()=>{state.paused=!state.paused;sync();save();});
  window.addEventListener('avatar:set_globals',e=>{if(e.detail?.globals?.widgetState){restore(e.detail.globals.widgetState);sync();}});
  reduced.addEventListener('change',e=>{if(e.matches){state.paused=true;sync();}});document.addEventListener('visibilitychange',schedule);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);fail('Graphics paused while the preview recovers.');});
  canvas.addEventListener('webglcontextrestored',()=>{try{lost=false;init();resize();sync();}catch(e){fail(e.message);}});
  new ResizeObserver(resize).observe(gallery);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();}).observe(gallery);
  try{restore(window.avatarState?.widgetState);init();resize();sync();}catch(e){fail(e.message);}
  window.motionIdeasPreview={seek:(s)=>{time=Math.max(0,Number(s)||0);draw();},getState:()=>({...state,time,ready:canvas.dataset.ready==='true',viewports}),capture:()=>canvas.toDataURL('image/png')};
})();
