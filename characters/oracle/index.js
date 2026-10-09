(()=>{
  const root=document.getElementById('oracle-alive');
  const canvas=root.querySelector('#oracle-canvas');
  const modeControl=root.querySelector('#oracle-mode');
  const pauseButton=root.querySelector('#oracle-pause');
  const blinkButton=root.querySelector('#oracle-blink');
  const nextButton=root.querySelector('#oracle-next');
  const status=root.querySelector('#oracle-status');
  const clock=root.querySelector('.oracle-clock');
  const error=root.querySelector('#oracle-error');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const presets={
    resting:{label:'Resting · softly shimmering stars',open:[1,1,1],lid:[0,0,0],tilt:[0,0,0],smile:0,asym:0,width:1,gap:0,glyph:0,size:.34,shimmer:.52,speed:1,brightness:1,gaze:[0,0]},
    curious:{label:'Curious · one eye opens wider, stars glance sideways',open:[1.16,1.23,.87],lid:[0,0,.13],tilt:[-.04,-.11,.10],smile:10,asym:12,width:.97,gap:1,glyph:0,size:.41,shimmer:.58,speed:1.15,brightness:1,gaze:[.14,-.06]},
    happy:{label:'Happy · soft smile and luminous hearts',open:[1.04,.91,.91],lid:[0,.21,.21],tilt:[0,-.09,.09],smile:38,asym:0,width:1.04,gap:2,glyph:1,size:.45,shimmer:.43,speed:.9,brightness:1.02,gaze:[0,0]},
    delighted:{label:'Delighted · a bigger smile and dancing starbursts',open:[1.1,.90,.90],lid:[0,.31,.31],tilt:[0,-.12,.12],smile:48,asym:0,width:1.08,gap:17,glyph:6,size:.60,shimmer:.75,speed:1.6,brightness:1.05,gaze:[0,-.03]},
    surprised:{label:'Surprised · wide eyes, oversized stars, open lips',open:[1.30,1.36,1.36],lid:[0,0,0],tilt:[0,0,0],smile:0,asym:0,width:.72,gap:64,glyph:0,size:.69,shimmer:.55,speed:1.25,brightness:1.1,gaze:[0,0]},
    sleepy:{label:'Sleepy · heavy eyelids and slow crescent moons',open:[.93,.94,.94],lid:[.57,.73,.73],tilt:[0,.02,-.02],smile:-4,asym:0,width:.97,gap:0,glyph:2,size:.49,shimmer:.20,speed:.38,brightness:.66,gaze:[0,.08]},
    annoyed:{label:'Annoyed · narrowed eyes and sharp diamonds',open:[.96,.88,.88],lid:[.23,.44,.44],tilt:[0,.24,-.24],smile:-30,asym:4,width:.97,gap:0,glyph:4,size:.33,shimmer:.24,speed:.72,brightness:.86,gaze:[0,.03]},
    sad:{label:'Sad · downturned lips and low, faint stars',open:[.95,1.03,1.03],lid:[.22,.28,.28],tilt:[0,-.19,.19],smile:-39,asym:0,width:.96,gap:0,glyph:0,size:.24,shimmer:.20,speed:.48,brightness:.63,gaze:[0,.20]},
    listening:{label:'Listening · attentive eyes and a soft star pulse',open:[1.15,1.10,1.10],lid:[0,0,0],tilt:[0,-.04,.04],smile:9,asym:0,width:1,gap:0,glyph:5,size:.43,shimmer:.60,speed:1.1,brightness:1.05,gaze:[0,-.05]},
    thinking:{label:'Thinking · orbiting lights and an uneven gaze',open:[1.12,.90,1.10],lid:[0,.32,.04],tilt:[.02,.08,-.03],smile:1,asym:17,width:.96,gap:0,glyph:3,size:.55,shimmer:.43,speed:1,brightness:.92,gaze:[.05,-.03]},
    speaking:{label:'Speaking · shifting stars and a silent lip-motion loop',open:[1.02,1.04,1.04],lid:[0,.03,.03],tilt:[0,0,0],smile:8,asym:0,width:1,gap:0,glyph:0,size:.39,shimmer:.63,speed:1.3,brightness:1,gaze:[0,0]},
    focus:{label:'Focus · steady diamonds and a concentrated gaze',open:[1.04,.94,.94],lid:[0,.24,.24],tilt:[0,.06,-.06],smile:0,asym:0,width:.97,gap:0,glyph:4,size:.39,shimmer:.18,speed:.55,brightness:.86,gaze:[0,0]},
    time:{label:'Time · live clock in the forehead eye',open:[1,1,1],lid:[0,0,0],tilt:[0,0,0],smile:0,asym:0,width:1,gap:0,glyph:0,size:.34,shimmer:.45,speed:.85,brightness:.95,gaze:[0,0]},
    alarm:{label:'Alarm · bright starbursts and an alert expression',open:[1.22,1.23,1.23],lid:[0,0,0],tilt:[0,.04,-.04],smile:-4,asym:0,width:.84,gap:30,glyph:6,size:.67,shimmer:.75,speed:1.35,brightness:1.08,gaze:[0,0]}
  };
  const order=Object.keys(presets);
  const allowed=['demo',...order];
  const saved=window.avatarState?.widgetState?.modelContent;
  const savedUI=window.avatarState?.widgetState?.privateContent;
  let mode=allowed.includes(saved?.mode)?saved.mode:'demo';
  let paused=reduce.matches||savedUI?.paused===true,ready=false,time=0,last=0,blinkStart=-100,timeFade=0,speechFade=0;
  let renderedState='',dirty=true,active='resting',demoOffset=0;
  const pose=JSON.parse(JSON.stringify(presets.resting));
  let glyphFrom=0,glyphTo=0,glyphBlend=1;
  modeControl.value=mode;
  pauseButton.textContent=paused?'Play':'Pause';
  const save=()=>{const result=window.avatarState?.setWidgetState?.({modelContent:{mode,version:2},privateContent:{paused}});result?.catch?.(()=>{});};
  modeControl.onchange=()=>{mode=modeControl.value;dirty=true;save();};
  nextButton.onclick=()=>{mode=order[(order.indexOf(active)+1)%order.length];modeControl.value=mode;dirty=true;save();};
  pauseButton.onclick=()=>{paused=!paused;pauseButton.textContent=paused?'Play':'Pause';save();};
  blinkButton.onclick=()=>{blinkStart=performance.now()/1000;};
  let gl;
  function fail(message){error.hidden=false;error.textContent=message;}
  try{
    gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
    if(!gl)throw Error('This preview needs graphics support in your browser.');
    const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=vec2(position.x*.5+.5,.5-position.y*.5);gl_Position=vec4(position,0.,1.);}`;
    const fragment=`precision highp float;
      varying vec2 uv;
      uniform sampler2D face;
      uniform float t;
      uniform vec3 blink;
      uniform float mouth;
      uniform float showingTime;
      uniform vec3 openness;
      uniform vec3 tilts;
      uniform vec3 lips;
      uniform vec4 stars;
      uniform vec3 glyphs;
      uniform vec2 gaze;
      vec2 poseEye(vec2 p,vec2 c,vec2 r,float opened,float tilt){
        vec2 q=p-c;
        float influence=exp(-pow(length(q/(r*1.65)),4.)*1.6);
        float a=-tilt*influence;
        vec2 moved=vec2(cos(a)*q.x-sin(a)*q.y,sin(a)*q.x+cos(a)*q.y);
        moved.y/=1.+(opened-1.)*influence;
        return p+(moved-q)*influence;
      }
      vec2 eyeWarp(vec2 p,vec2 c,vec2 r,float b){
        vec2 q=p-c;float nx=abs(q.x)/r.x;
        if(nx>=1.8||b<.0001)return p;
        float seam=c.y+8.*min(nx*nx,1.);
        q.y=p.y-seam;
        float h=r.y*1.65;
        float ay=abs(q.y);if(ay>h*2.)return p;
        float weight=exp(-pow(nx,8.)*1.4);
        float lo=ay;float hi=ay+h;
        for(int i=0;i<12;i++){
          float mid=(lo+hi)*.5;
          float mapped=mid*(1.-.998*b*weight*exp(-pow(mid/h,4.)));
          if(mapped<ay)lo=mid;else hi=mid;
        }
        return vec2(p.x,seam+sign(q.y)*(lo+hi)*.5);
      }
      vec3 readFace(vec2 p){return texture2D(face,p/vec2(1536.,1024.)).rgb;}
      float lipSeam(float x){
        return 714.-2.*smoothstep(370.,390.,x)-4.*smoothstep(390.,410.,x)
        -4.*smoothstep(410.,430.,x)-3.*smoothstep(430.,450.,x)-smoothstep(450.,470.,x)
        +3.*smoothstep(470.,490.,x)+5.*smoothstep(490.,510.,x)+3.*smoothstep(510.,530.,x)
        -4.*smoothstep(530.,550.,x)-5.*smoothstep(550.,570.,x)-smoothstep(570.,590.,x)
        +2.*smoothstep(590.,610.,x)+3.*smoothstep(610.,630.,x)+4.*smoothstep(630.,650.,x)
        +3.*smoothstep(650.,670.,x)+smoothstep(670.,690.,x)-3.*smoothstep(690.,710.,x);
      }
      float sparkle(vec2 q,float size){
        vec2 a=abs(q)/max(size,.025);
        float contour=pow(a.x,.55)+pow(a.y,.55);
        return 1.-smoothstep(.93,1.07,contour);
      }
      float circle(vec2 p,vec2 c,float r){return 1.-smoothstep(r-.012,r+.012,length(p-c));}
      float symbol(vec2 q,float type,float size,float seed){
        float phase=t*stars.z;
        float breath=1.+stars.y*.085*sin(phase*2.1+seed);
        q/=size*breath;
        if(type<.5)return sparkle(q,1.);
        if(type<1.5){
          float left=length(q-vec2(-.31,-.20))-.42;
          float right=length(q-vec2(.31,-.20))-.42;
          float point=max(-.15-q.y,(.95*abs(q.x)+.70*q.y-.56)/1.18);
          float heart=min(min(left,right),point);
          return 1.-smoothstep(-.018,.018,heart);
        }
        if(type<2.5){
          float outer=circle(q,vec2(0.),1.);
          float cut=circle(q,vec2(.48,-.32),.94);
          return outer*(1.-cut);
        }
        if(type<3.5){
          float orbit=exp(-pow((length(q)-.85)*44.,2.))*.16;
          for(int i=0;i<3;i++){
            float a=phase*1.05+float(i)*2.094+seed*.35;
            vec2 center=vec2(cos(a),sin(a))*.85;
            orbit+=circle(q,center,.12+float(i)*.012);
          }
          return orbit+sparkle(q,.31)*.85;
        }
        if(type<4.5){
          float diamond=abs(q.x)*1.25+abs(q.y);
          return (1.-smoothstep(.94,1.06,diamond))*(.7+.3*smoothstep(.2,.9,diamond));
        }
        if(type<5.5){
          float radius=.45+.9*fract(phase*.40);
          float ring=exp(-pow((length(q)-radius)*24.,2.))*(1.-fract(phase*.40))*.36;
          return sparkle(q,.85)+ring;
        }
        vec2 rotated=vec2(q.x-q.y,q.x+q.y)*.7071;
        return max(sparkle(q,1.2),sparkle(rotated,.72));
      }
      vec3 eyeInk(vec2 q,float id){
        vec2 physical=q*vec2(1.,.68);
        float sheen=exp(-dot((physical-vec2(-.38,-.34))/vec2(.25,.10),(physical-vec2(-.38,-.34))/vec2(.25,.10)));
        vec3 ink=vec3(.009,.012,.018)+vec3(.035)*max(0.,1.-length(physical)) + vec3(.15)*sheen;
        vec2 drift=gaze+vec2(sin(t*.47+id*.3),cos(t*.39+id*.2))*.023;
        vec2 qstar=physical-drift;
        float shimmer=1.-stars.y*.30+stars.y*.30*sin(t*stars.z*2.35+id*1.7);
        float main=mix(symbol(qstar,glyphs.x,stars.x,id),symbol(qstar,glyphs.y,stars.x,id),glyphs.z);
        float luminosity=main*shimmer;
        for(int i=0;i<9;i++){
          float j=float(i);
          float a=j*2.39996+id*.43;
          float r=.27+.040*j;
          vec2 center=vec2(cos(a),sin(a)*.73)*r;
          center+=vec2(sin(t*.20+j),cos(t*.16+j))*.016;
          float twinkle=.18+.82*pow(.5+.5*sin(t*(1.2+j*.14)*stars.z+j*2.7+id),2.);
          float s=.017+.012*mod(j,3.);
          luminosity+=sparkle(physical-center,s*(.7+.5*twinkle))*twinkle*.70;
        }
        float halo=exp(-dot(qstar,qstar)/(.020+stars.x*.075))*.08*shimmer;
        return ink+vec3(luminosity+halo)*stars.w;
      }
      void main(){
        vec2 original=vec2(58.,10.)+uv*940.;
        vec2 p=original;
        p=poseEye(p,vec2(534.,297.),vec2(120.,73.),openness.x,tilts.x);
        p=poseEye(p,vec2(333.,462.),vec2(126.,77.),openness.y,tilts.y);
        p=poseEye(p,vec2(733.,463.),vec2(127.,77.),openness.z,tilts.z);
        p=eyeWarp(p,vec2(534.,297.),vec2(120.,73.),blink.x);
        p=eyeWarp(p,vec2(333.,462.),vec2(126.,77.),blink.y);
        p=eyeWarp(p,vec2(733.,463.),vec2(127.,77.),blink.z);
        vec2 lipLocal=p-vec2(529.,710.);
        float lipInfluence=exp(-pow(abs(lipLocal.y)/145.,4.)-pow(abs(lipLocal.x)/225.,8.));
        lipInfluence*=smoothstep(550.,610.,p.y)*(1.-smoothstep(800.,865.,p.y));
        p.x=529.+lipLocal.x*(1.+(1./lips.z-1.)*lipInfluence);
        float smileX=(p.x-529.)/184.;
        p.y+=(lips.x*pow(min(abs(smileX),1.),1.3)+lips.y*smileX)*lipInfluence;
        float cavity=0.;float dx=(p.x-529.)/184.;
        if(abs(dx)<1.&&mouth>0.){
          float shape=pow(max(0.,1.-dx*dx),1.7);
          float seam=lipSeam(p.x);
          float dy=p.y-seam;float gap=mouth*shape;
          float up=gap*.32;float down=gap*.68;
          float range=135.;
          if(abs(dy)<range){
            if(dy>down)p.y=seam+(dy-down)*range/(range-down);
            else if(dy< -up)p.y=seam+(dy+up)*range/(range-up);
            else{p.y=seam;}
            cavity=smoothstep(-up-.7,-up+.7,dy)*(1.-smoothstep(down-.7,down+.7,dy));
          }
        }
        vec3 color=readFace(p);
        if(cavity>0.){
          float v=abs((original.y-704.)/max(1.,mouth));
          color=mix(color,vec3(.012,.012,.014)+vec3(.012)*v,cavity);
        }
        vec2 f=(p-vec2(534.,297.))/vec2(97.,56.);
        vec2 l=(p-vec2(333.,462.))/vec2(91.,55.);
        vec2 r=(p-vec2(733.,463.))/vec2(94.,53.);
        float fm=1.-smoothstep(.68,1.,dot(f,f));
        float lm=1.-smoothstep(.68,1.,dot(l,l));
        float rm=1.-smoothstep(.68,1.,dot(r,r));
        if(fm>.001)color=mix(color,eyeInk(f,0.),fm);
        if(lm>.001)color=mix(color,eyeInk(l,1.),lm);
        if(rm>.001)color=mix(color,eyeInk(r,2.),rm);
        color=mix(color,vec3(.015,.018,.023),showingTime*fm*.98);
        float radius=length((original-vec2(529.,476.))/vec2(461.,461.));
        float alpha=1.-smoothstep(.996,1.,radius);
        gl_FragColor=vec4(color,alpha);
      }`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const uniforms={};for(const name of ['t','blink','mouth','showingTime','openness','tilts','lips','stars','glyphs','gaze'])uniforms[name]=gl.getUniformLocation(program,name);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const photo=new Image();photo.src='assets/oracle-source.jpg';
    photo.onload=()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,photo);ready=true;};
    photo.onerror=()=>fail('The statue image could not load.');
    const pulse=(elapsed,duration)=>elapsed>=0&&elapsed<duration?Math.pow(Math.sin(Math.PI*elapsed/duration),1.45):0;
    function draw(dt){
      active=mode==='demo'?order[(Math.floor(time/4.8)+demoOffset)%order.length]:mode;
      const target=presets[active];
      const easing=dirty&&paused?1:1.-Math.exp(-dt*5.5);
      if(active!==renderedState){
        status.textContent=target.label;
        if(target.glyph!==glyphTo){glyphFrom=glyphBlend<.5?glyphFrom:glyphTo;glyphTo=target.glyph;glyphBlend=0;}
        renderedState=active;
      }
      for(const key of ['smile','asym','width','gap','size','shimmer','speed','brightness'])pose[key]+=(target[key]-pose[key])*easing;
      for(const key of ['open','lid','tilt','gaze'])for(let i=0;i<pose[key].length;i++)pose[key][i]+=(target[key][i]-pose[key][i])*easing;
      glyphBlend+=(1-glyphBlend)*easing;
      timeFade+=(Number(active==='time')-timeFade)*easing;
      speechFade+=(Number(active==='speaking')-speechFade)*easing;
      const manual=pulse(performance.now()/1000-blinkStart,.46);
      const slow=time%9.1;
      const b1=pose.lid[0]+(1-pose.lid[0])*Math.max(manual,pulse(slow-5.4,.57));
      const b2=pose.lid[1]+(1-pose.lid[1])*Math.max(manual,pulse(slow-2.6,.42),pulse(slow-7.35,.4));
      const b3=pose.lid[2]+(1-pose.lid[2])*Math.max(manual,pulse(slow-2.67,.44),pulse(slow-7.44,.41));
      const phrase=Math.pow(.5+.5*Math.sin(time*1.13),.8);
      const syllable=.18+.47*Math.pow(.5+.5*Math.sin(time*8.4),2)+.35*Math.pow(.5+.5*Math.sin(time*13.1+.8),3);
      const opening=pose.gap*(.94+.06*Math.sin(time*1.8))+speechFade*(2.+26.*phrase*syllable);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform1f(uniforms.t,time);
      gl.uniform3f(uniforms.blink,b1,b2,b3);
      gl.uniform1f(uniforms.mouth,opening);
      gl.uniform1f(uniforms.showingTime,timeFade);
      gl.uniform3fv(uniforms.openness,pose.open);
      gl.uniform3fv(uniforms.tilts,pose.tilt);
      gl.uniform3f(uniforms.lips,pose.smile,pose.asym,pose.width);
      gl.uniform4f(uniforms.stars,pose.size,pose.shimmer,pose.speed,pose.brightness);
      gl.uniform3f(uniforms.glyphs,glyphFrom,glyphTo,glyphBlend);
      gl.uniform2fv(uniforms.gaze,pose.gaze);
      gl.drawArrays(gl.TRIANGLES,0,6);
      clock.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});
      clock.style.opacity=timeFade*(1-b1);
      clock.style.transform='translate(-50%,-50%) scaleY('+(1-b1*.9)+')';
      canvas.dataset.state=active;canvas.dataset.ready='true';canvas.dataset.time=time.toFixed(3);
      dirty=false;
    }
    function frame(now){
      const dt=Math.min((now-last)/1000||0,.1);last=now;
      if(!paused&&!document.hidden)time+=dt;
      if(ready&&!document.hidden&&(!paused||dirty||now/1000-blinkStart<.6))draw(paused?0:dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.oraclePreview={seek:(seconds)=>{time=seconds;dirty=true;draw(1);},getState:()=>({mode,active,paused,time,ready,timeFade,speechFade,glyphFrom,glyphTo,glyphBlend,pose}),capture:()=>canvas.toDataURL('image/png')};
    addEventListener('avatar:set_globals',event=>{const next=event.detail?.globals?.widgetState?.modelContent?.mode;if(allowed.includes(next)){mode=next;modeControl.value=mode;dirty=true;}});
    reduce.addEventListener('change',event=>{if(event.matches){paused=true;pauseButton.textContent='Play';}});
  }catch(e){fail(e.message);}
})();
