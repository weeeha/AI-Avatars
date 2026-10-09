/* Local source-art performances. No remote renderer, image generation or assistant connection. */
(function(root){
  'use strict';
  const durations={happy:2.4,curious:2.6,surprised:1.2,confused:1.8,concerned:2.5,playful:2.2,complete:1.8};
  const holds=new Set(['needs-input','error','sleeping','waiting','starting','paused','cancelled','offline','permission-denied','awaiting-approval','partial']);
  const styles={triangle:[1.05,1.18,-1],circle:[1.18,.90,1],square:[.62,.82,1],star:[1.25,1.15,-1],crescent:[.72,.70,1],bean:[1,.96,-1],heart:[.78,.80,1],diamond:[.62,1.02,-1]};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  const pulse=(t,start,width)=>Math.sin(Math.PI*clamp((t-start)/width))**2;
  // Independent facial, hand and posture channels. No whole-frame pan/zoom animation.
  function pose(character,state,t,{still=false}={}){
    const [range,speed,side]=styles[character]||styles.triangle;
    const entry=smooth(t/.42),exit=durations[state]?1-smooth((t-durations[state]+.38)/.38):1;
    const k=entry*exit*range,cycle=t*speed;
    const p={eyes:[0,0,0,0],blink:[0,0],hands:[0,0,0,0],turn:[0,0],body:[0,0,0],phase:t<.42?'enter':(exit<1?'exit':'hold'),done:!!durations[state]&&t>=durations[state]};
    const gesture=pulse(cycle,.12,1.35),breath=Math.sin(cycle*Math.PI/2);
    switch(state){
      case 'idle': p.body[1]=.002*breath;p.blink=[pulse(t%5,2.7,.2),pulse(t%5,2.7,.2)];break;
      case 'starting':p.blink=[1-smooth(t/.9),1-smooth(t/.9)];p.hands=[-.012*gesture,-.012*gesture,.012*gesture,-.012*gesture];p.turn=[-.13*gesture,.13*gesture];p.body[1]=.01*(1-smooth(t/1.3));break;
      case 'listening':p.eyes=[0,.002,0,.002];p.body=[0,.009*k*pulse(cycle%4,.6,.8),.007*k];p.hands[2]=-.009*k*gesture;p.turn[1]=-.12*k*gesture;break;
      case 'thinking':p.eyes=[.007*k*side,-.009*k*gesture,.007*k*side,-.009*k*gesture];p.hands[2]=-.007*k*Math.sin(cycle*2);p.hands[3]=-.01*k*pulse(cycle%4,.1,1.5);p.turn[1]=.11*k*gesture;break;
      case 'researching':{const scan=((cycle%3.8)<2.8?Math.floor((cycle%3.8)/.7)/3:0)-.5;p.eyes=[scan*.02*k,.003*k,scan*.02*k,.003*k];p.hands[2]=scan*.014*k;p.body[2]=scan*.008*k;break;}
      case 'working':{const work=cycle%3.8<2.7?Math.sin(cycle*8):0;p.eyes=[0,.007*k,0,.007*k];p.hands=[.004*k*work,.013*k*work,-.004*k*work,-.013*k*work];p.turn=[.05*k*work,-.05*k*work];break;}
      case 'answering':{const explain=pulse(cycle%4,.2,1.8);p.eyes=[-.002*k,0,-.002*k,0];p.hands=[0,.002*k,.016*k*explain,-.01*k*explain];p.turn[1]=-.16*k*explain;break;}
      case 'needs-input':case 'awaiting-approval':case 'permission-denied':p.hands=[-.008*k*gesture,-.015*k*gesture,.008*k*gesture,-.015*k*gesture];p.eyes=[.005*k*gesture,-.001*k,.005*k*gesture,-.001*k];p.turn=[-.12*k*gesture,.12*k*gesture];break;
      case 'complete':p.hands[2]=.005*k*gesture;p.hands[3]=-.025*k*gesture;p.turn[1]=-.14*k*gesture;p.body[1]=-.007*k*gesture;p.blink=[.35*gesture,.35*gesture];break;
      case 'error':p.hands[0]=-.015*k*gesture;p.hands[1]=-.014*k*gesture;p.turn[0]=-.18*k*gesture;p.eyes=[0,.004*k*gesture,0,.004*k*gesture];break;
      case 'sleeping':p.body[1]=.01*range*smooth(t/2);p.hands=[0,.008*smooth(t/2),0,.008*smooth(t/2)];p.body[2]=.007*range*smooth(t/2);break;
      case 'happy':p.blink=[.25*gesture,.25*gesture];p.hands=[-.012*k*gesture,-.013*k*gesture,.012*k*gesture,-.013*k*gesture];p.turn=[-.12*k*gesture,.12*k*gesture];p.body[1]=-.008*k*gesture;break;
      case 'curious':p.eyes=[.008*k*side,-.005*k,.008*k*side,-.005*k];p.hands[0]=.007*k*gesture;p.hands[1]=-.01*k*gesture;p.body[2]=.016*k*side;p.turn[0]=.1*k*gesture;break;
      case 'surprised':{const shock=pulse(t,.02,.65);p.blink=[-.16*shock,-.16*shock];p.eyes=[0,-.003*shock,0,-.003*shock];p.hands=[-.017*shock,-.008*shock,.017*shock,-.008*shock];p.body[1]=.007*shock;break;}
      case 'confused':p.eyes=[-.005*k*Math.sin(cycle*3),0,-.005*k*Math.sin(cycle*3),0];p.hands[2]=.007*k*Math.sin(cycle*8);p.hands[3]=-.007*k*gesture;p.body[2]=.013*k*Math.sin(cycle*3);break;
      case 'concerned':case 'partial':p.hands[0]=-.012*k*gesture;p.hands[1]=-.004*k*gesture;p.turn[0]=-.12*k*gesture;p.body[1]=.008*k*pulse(t,.5,.9);p.eyes=[0,.003*k,0,.003*k];break;
      case 'playful':p.blink=[.1*gesture,.65*gesture];p.hands[0]=.015*k*Math.sin(cycle*10)*gesture;p.turn[0]=.26*k*Math.sin(cycle*10)*gesture;p.body[2]=.012*k*side;break;
      // These conditions intentionally settle. No fake processing while waiting or blocked.
      default:p.hands=[0,.002*gesture,0,.002*gesture];p.eyes=[.002*gesture,0,.002*gesture,0];
    }
    if(holds.has(state)&&t>2.8){p.phase='settled';if(state!=='sleeping'){p.eyes=[0,0,0,0];p.hands=[0,0,0,0];p.turn=[0,0];p.body=[0,0,0];}}
    if(still){p.eyes=[0,0,0,0];p.blink=[0,0];p.hands=[0,0,0,0];p.turn=[0,0];p.body=[0,0,0];p.phase='still';}
    return p;
  }
  function renderer(canvas){
    const gl=canvas.getContext('webgl',{alpha:false,preserveDrawingBuffer:true,antialias:true});
    if(!gl)throw Error('This browser needs WebGL to preview local character performances. The original artwork and idle downloads remain available.');
    const vs=`precision mediump float;attribute vec2 a; varying vec2 uv; uniform vec4 eyes,hands,eyeMotion,handMotion;uniform vec2 blink,turn;uniform vec3 body;uniform vec4 rect;float g(vec2 d,vec2 r){return exp(-dot(d/r,d/r)*2.0);}void main(){uv=rect.xy+a*rect.zw;vec2 p=a;vec2 d=a-eyes.xy;float w=g(d,vec2(.066,.073));p+=eyeMotion.xy*w;p.y-=d.y*blink.x*.94*w*(1.0-smoothstep(.5,.9,blink.x));d=a-eyes.zw;w=g(d,vec2(.066,.073));p+=eyeMotion.zw*w;p.y-=d.y*blink.y*.94*w*(1.0-smoothstep(.5,.9,blink.y));d=a-hands.xy;w=g(d,vec2(.14));p+=handMotion.xy*w+vec2(-d.y,d.x)*turn.x*w;d=a-hands.zw;w=g(d,vec2(.14));p+=handMotion.zw*w+vec2(-d.y,d.x)*turn.y*w;float upper=(1.0-smoothstep(.50,.84,a.y));p+=vec2(body.x+(a.y-.75)*body.z,body.y)*upper;gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0,1);}`;
    const fs=`precision mediump float;varying vec2 uv;uniform sampler2D art;uniform vec4 rect;uniform vec2 mouth,idleMouth,mouthSize;uniform vec4 idleRect;uniform float alpha,quiet;uniform vec4 eyes,eyeRadii;uniform vec2 blink;vec3 eyelid(vec3 color,vec2 local,vec2 eye,vec2 radius,float amount){vec2 d=local-eye;float closing=smoothstep(.45,.95,amount);float mask=(1.0-smoothstep(.90,1.12,length(d/radius)))*closing;vec2 skinPoint=eye+vec2(sign(eye.x-.5)*radius.x*.82,radius.y*.80);vec3 skin=texture2D(art,rect.xy+skinPoint*rect.zw).rgb;float curve=.008*(1.0-pow(d.x/(radius.x*.75),2.0));float lid=(1.0-smoothstep(.002,.006,abs(d.y-curve)))*(1.0-smoothstep(.60,.78,abs(d.x)/radius.x));return mix(color,mix(skin,vec3(.035),lid),mask);}void main(){vec3 color=texture2D(art,uv).rgb;vec2 point=(uv-rect.xy)/rect.zw;color=eyelid(color,point,eyes.xy,eyeRadii.xy,blink.x);color=eyelid(color,point,eyes.zw,eyeRadii.zw,blink.y);if(quiet>.5){vec2 local=(uv-rect.xy)/rect.zw;vec2 d=local-mouth;float mask=1.0-smoothstep(.73,1.0,length(d/(mouthSize*.85+vec2(.014,.025))));vec2 original=idleRect.xy+(idleMouth+d*vec2(.78,.62))*idleRect.zw;color=mix(color,texture2D(art,original).rgb,mask);}gl_FragColor=vec4(color,alpha);}`;
    const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const points=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++){const a=x/64,b=y/64,c=(x+1)/64,d=(y+1)/64;points.push(a,b,c,b,a,d,a,d,c,b,c,d);}
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
    const uniforms={};for(const n of ['eyes','eyeRadii','hands','eyeMotion','handMotion','blink','turn','body','rect','mouth','idleMouth','mouthSize','idleRect','alpha','quiet'])uniforms[n]=gl.getUniformLocation(program,n);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(10/255,10/255,10/255,1);
    let rig=null;
    function draw(state,p,alpha=1){
      const r=rig[state]||rig.idle;gl.uniform4fv(uniforms.eyes,r.eyes.flat());gl.uniform4fv(uniforms.eyeRadii,r.eyeSizes.flat().map((v,i)=>Math.max(i%2?.045:.045,v*.78)));gl.uniform4fv(uniforms.hands,r.hands.flat());gl.uniform4fv(uniforms.eyeMotion,p.eyes);gl.uniform4fv(uniforms.handMotion,p.hands);gl.uniform2fv(uniforms.blink,p.blink);gl.uniform2fv(uniforms.turn,p.turn);gl.uniform3fv(uniforms.body,p.body);gl.uniform4fv(uniforms.rect,r.rect);gl.uniform2fv(uniforms.mouth,r.mouth);gl.uniform2fv(uniforms.mouthSize,r.mouthSize);gl.uniform2fv(uniforms.idleMouth,rig.idle.mouth);gl.uniform4fv(uniforms.idleRect,rig.idle.rect);gl.uniform1f(uniforms.alpha,alpha);gl.uniform1f(uniforms.quiet,state==='answering'?1:0);gl.drawArrays(gl.TRIANGLES,0,points.length/2);
    }
    return {load(image,data){rig=data;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);},render(state,p,from,blend=1,fromPose=null){if(!rig)return;gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);if(from&&blend<1)draw(from,fromPose||pose('square','idle',0,{still:true}));draw(state,p,blend);},gl};
  }
  const api={pose,renderer,durations,holds,smooth};if(typeof module==='object'&&module.exports)module.exports=api;else root.ShapePerformance=api;
})(typeof window!=='undefined'?window:globalThis);
