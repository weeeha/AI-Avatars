(() => {
const root=document.getElementById('prismatic-dots'),canvas=root.querySelector('canvas'),stage=root.querySelector('.lens-stage');let api;
  const palettes={aurora:{label:'Prismatic',tint:0},pink:{label:'Pink',tint:0},cyan:{label:'Cyan',tint:1},lilac:{label:'Lilac',tint:2},amber:{label:'Amber',tint:3},mint:{label:'Mint',tint:4}};
  let state={look:'aurora'};
  let time=0,modeTime=0,gl,program,uniforms,contextLost=false,pose={};
  let weights=[0,0,1,0,0,0];
  const vertex=`attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const fragment=`
    precision highp float;
    uniform vec2 resolution;
    uniform float time,look,tint,modeTime;
    uniform vec4 weightsA;
    uniform vec2 weightsB;
    uniform vec4 poseA,poseB,performance;
    const float TAU=6.28318530718;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    mat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    vec3 tone(vec3 pink,vec3 cyan,vec3 lilac,vec3 amber,vec3 mint){
      if(tint<.5)return pink;
      if(tint<1.5)return cyan;
      if(tint<2.5)return lilac;
      if(tint<3.5)return amber;
      return mint;
    }
    float speech(float s){
      float syllables=.48+.22*sin(s*9.0)+.18*sin(s*15.0+.7)+.12*sin(s*23.0+1.2);
      float phrase=smoothstep(-.78,-.18,sin(s*1.5+.4));
      return clamp(syllables*phrase,0.0,1.0);
    }
    vec2 motionPoint(vec2 p){
      p=turn(poseB.x)*(p-poseA.xy);p/=poseA.zw;p.y+=poseB.z*.15*sin(p.x*4.);
      float s=modeTime;
      float r=length(p);
      vec2 listen=p*(1.0+.11*sin(r*13.0+s*3.6));
      float envelope=pow(max(0.0,1.0-p.x*p.x),.5);
      float voice=speech(s);
      float h=.22+.48*voice;
      float wave=.035*sin(p.x*11.0+s*9.0)*envelope*voice;
      vec2 talk=vec2(p.x/.96,(p.y-wave)/(h+.09*sin(p.x*15.0+s*8.0)*voice));
      vec2 think=turn(s*.65)*p*(1.0+.055*sin(atan(p.y,p.x)*3.0-s*2.0));
      float finish=.09*exp(-s*.8)*sin(s*4.2);
      vec2 done=p/(1.0+finish);
      return weightsA.x*p+weightsA.y*listen+weightsA.z*talk+weightsA.w*think+weightsB.x*p+weightsB.y*done;
    }
    vec3 aurora(vec2 p,float t){
      vec2 drift=vec2(.024*sin(t),.021*cos(t));
      vec2 v=turn(.13*sin(t))* (p-drift);
      float a=atan(v.y,v.x);
      float r=length(v);
      float edge=.758+.025*sin(t)+.033*sin(3.0*a+t)+.018*cos(5.0*a-2.0*t);
      float inside=1.0-smoothstep(edge-.028,edge+.045,r);
      vec3 teal=mix(vec3(.13,.47,.43),vec3(.20,.61,.57),.5+.5*sin(v.x*2.0+v.y*2.3+t));
      float coral=exp(-pow(length((v-vec2(-.32,.61)) * vec2(1.0,1.1))/ .49,2.0));
      vec3 col=mix(teal,vec3(1.0,.59,.46),clamp(coral*1.45,0.0,1.0));
      vec2 hot=vec2(.64+.07*sin(t),-.38+.12*cos(t));
      float magenta=exp(-pow(length((v-hot)*vec2(.9,1.0))/.39,2.0));
      float indigo=exp(-pow(length(v-(hot-vec2(.23,.02)))/.39,2.0));
      col=mix(col,vec3(.045,.10,.35),indigo*.82);
      col=mix(col,vec3(1.0,.005,.43),clamp(magenta*1.16,0.0,1.0));
      float edgeBand=exp(-pow((r-edge-.028)/.058,2.0));
      float hue=.5+.5*sin(a-1.2+t*.0);
      vec3 rim=mix(vec3(.83,.015,.025),vec3(.01,.32,.12),smoothstep(.34,.82,hue));
      rim=mix(rim,vec3(1.0,.18,.07),pow(max(0.0,sin(a*1.5+t)),8.0)*.5);
      vec3 bg=vec3(.031,.035,.034);
      col=mix(bg,col,inside);
      col=mix(col,rim,edgeBand*.90*(1.0-inside*.68));
      return col;
    }
    vec3 pink(vec2 p,float t){
      vec2 center=vec2(.025*sin(t),.035*cos(t));
      float scale=.91+.095*sin(t);
      float r=length(p-center)/scale;
      float wave=.018*sin(r*14.0-2.0*t);
      r+=wave;
      vec3 c=vec3(.245,.0,.14);
      c=mix(c,vec3(.43,.0,.20),smoothstep(.11,.29,r));
      c=mix(c,vec3(.89,.0,.32),smoothstep(.25,.44,r));
      c=mix(c,vec3(1.0,.0,.45),smoothstep(.37,.53,r));
      c=mix(c,vec3(1.0,.38,.71),smoothstep(.48,.68,r));
      c=mix(c,vec3(.98,.70,.91),smoothstep(.63,.91,r));
      c=mix(c,vec3(.90,.885,.895),smoothstep(.86,1.20,r));
      vec3 blue=vec3(.045,.19,.23);
      blue=mix(blue,vec3(.10,.32,.39),smoothstep(.11,.29,r));
      blue=mix(blue,vec3(.12,.50,.61),smoothstep(.25,.44,r));
      blue=mix(blue,vec3(.18,.65,.77),smoothstep(.37,.56,r));
      blue=mix(blue,vec3(.40,.73,.81),smoothstep(.51,.76,r));
      blue=mix(blue,vec3(.72,.82,.83),smoothstep(.72,1.17,r));
      if(tint<.5)return c;
      if(tint<1.5)return blue;
      vec3 core=tone(c,blue,vec3(.16,.045,.34),vec3(.26,.065,.015),vec3(.015,.18,.14));
      vec3 middle=tone(c,blue,vec3(.45,.22,.88),vec3(.94,.31,.025),vec3(.025,.58,.38));
      vec3 vivid=tone(c,blue,vec3(.72,.51,1.0),vec3(1.0,.66,.10),vec3(.28,.84,.56));
      vec3 pale=tone(c,blue,vec3(.85,.75,.98),vec3(1.0,.87,.52),vec3(.67,.94,.73));
      vec3 edge=tone(c,blue,vec3(.92,.89,.94),vec3(.95,.91,.80),vec3(.84,.91,.86));
      vec3 result=mix(core,middle,smoothstep(.15,.47,r));
      result=mix(result,vivid,smoothstep(.37,.67,r));
      result=mix(result,pale,smoothstep(.60,.89,r));
      return mix(result,edge,smoothstep(.87,1.20,r));
    }
    vec3 field(vec2 p,float t){
      vec2 v=motionPoint(p);
      vec3 c;
      if(look<.5)c=aurora(v,t);else c=pink(v,t);
      float s=modeTime;
      float r=length(p),a=atan(p.y,p.x);
      vec3 bright=mix(vec3(.63,1.0,.84),vec3(1.0,.66,.87),look);
      if(look>.5)bright=tone(bright,vec3(.66,.93,1.0),vec3(.92,.82,1.0),vec3(1.0,.95,.67),vec3(.78,1.0,.85));
      float listening=pow(.5+.5*cos(r*19.0+s*4.6),10.0)*smoothstep(.12,.3,r)*(1.0-smoothstep(.73,.90,r));
      c=mix(c,bright,listening*weightsA.y*.24);
      float orbit=exp(-pow((r-.48)/.075,2.0));
      float head=pow(.5+.5*cos(a-s*2.3),11.0);
      float tail=pow(.5+.5*cos(a-s*2.3+.8),3.0);
      float inner=exp(-pow((r-.26)/.054,2.0))*pow(.5+.5*cos(a+s*1.7),7.0);
      c=mix(c,bright,weightsA.w*clamp(orbit*(head*.85+tail*.3)+inner*.65,0.0,.92));
      float halo=exp(-pow((r-(.18+min(s,3.0)*.30))/.09,2.0))*exp(-s*.5);
      c=mix(c,bright,halo*weightsB.y*.8);
      float quiet=weightsB.y*(1.0-exp(-s*.5));
      c=mix(c,look<.5?aurora(p*.88,0.0):pink(p*.88,0.0),quiet*.92);
      c*=mix(1.,smoothstep(.025,.08,abs(v.x+v.y*.2)),performance.y*.65);
      return c*performance.z;
    }
    void main(){
      vec2 p=(gl_FragCoord.xy/resolution-.5)*2.0;
      float t=time*TAU/24.0;
      float n=mix(13.0,15.0,look);
      float cell=2.0/n;
      vec2 center=(floor(p/cell+.5))*cell;
      vec2 q=(p-center)/(cell*.493);
      float d=length(q);
      float aa=2.2/resolution.x/(cell*.493);
      float mask=1.0-smoothstep(1.0-aa,1.0+aa,d);
      float bulge=sqrt(max(0.0,1.0-dot(q,q)));
      vec2 refracted=center + (p-center)*(.50+1.6*pow(min(d,1.0),3.0));
      refracted += q*cell*.20*bulge;
      vec3 plain,lens;
      if(look<.5){
        plain=field(p,t);
        lens=field(refracted,t);
        float face=.965+.028*dot(q,vec2(-.5,.8));
        lens*=face;
        float spec=pow(max(0.0,1.0-abs(d-.963)/.04),2.0);
        lens+=vec3(.05,.085,.065)*spec*(.35+.65*max(0.0,dot(q,vec2(-.6,.8))));
      }else{
        plain=field(p,t);
        lens=field(mix(center,refracted,.36),t);
        lens*=.992+.012*q.y;
        float spec=exp(-pow((d-.92)/.065,2.0));
        lens+=vec3(.16,.12,.145)*spec*max(.0,dot(q,vec2(-.6,.8)));
        lens-=vec3(.07,.057,.055)*spec*max(.0,dot(q,vec2(.6,-.8)));
      }
      vec3 color=mix(plain,lens,mask);
      // The same lens grid becomes indented lines of activity, one cell at a time.
      if(weightsB.x>.001){
        vec2 id=floor(center/cell+.5);
        float row=3.0-id.y;
        float column=id.x+4.0;
        float inRows=step(0.0,row)*step(row,5.0);
        float indent=mod(row,3.0)<.5?0.0:1.0;
        float lineLength=6.0+floor(hash(vec2(row,17.0))*3.0);
        float isToken=step(indent,column)*step(column,lineLength-1.0)*inRows;
        float cycle=mod(modeTime,6.0);
        float typed=cycle*9.0;
        float index=row*9.0+column;
        float written=1.0-smoothstep(typed-.65,typed+.15,index);
        float cursor=exp(-pow((index-typed)/.7,2.0));
        float finalFade=1.0-smoothstep(5.35,6.0,cycle);
        vec3 base=mix(vec3(.035,.12,.15),vec3(.94,.72,.84),look);
        if(look>.5)base=tone(base,vec3(.64,.81,.86),vec3(.80,.73,.93),vec3(.96,.82,.58),vec3(.67,.87,.77));
        float zone=1.0-smoothstep(.68,.94,length(p));
        color=mix(color,base,weightsB.x*zone*.78);
        vec3 ink=mix(vec3(.18,.76,.60),vec3(.71,.015,.34),look);
        ink=mix(ink,mix(vec3(1.0,.62,.42),vec3(.33,.005,.23),look),mod(row,3.0)/3.0);
        if(look>.5)ink=tone(ink,mix(vec3(.03,.36,.48),vec3(.015,.17,.24),mod(row,3.0)/3.0),vec3(.36,.09,.65),vec3(.70,.24,.015),vec3(.025,.39,.25));
        ink=mix(ink,vec3(1.0,.91,.84),cursor*.95);
        ink*=.96+.045*q.y;
        float codeRim=exp(-pow((d-.92)/.065,2.0));
        ink+=vec3(.09,.075,.085)*codeRim*max(0.0,dot(q,vec2(-.6,.8)));
        float token=mask*isToken*max(written*.88,cursor)*finalFade;
        color=mix(color,ink,weightsB.x*token);
        color+=weightsB.x*cursor*isToken*mask*vec3(.05,.03,.04);
      }
      float noise=(hash(gl_FragCoord.xy)-.5)*mix(.047,.009,look);
      color+=noise;
      gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
    }`;
  function fail(message){const error=root.querySelector('[data-error]');error.textContent=message;error.hidden=false;canvas.dataset.ready='false';}
  function compile(kind,source){const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const m=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(m);}return shader;}
  function init(){
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
    if(!gl)throw Error('This preview needs a browser with WebGL enabled.');
    program=gl.createProgram();
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    uniforms={};for(const key of ['resolution','time','look','tint','modeTime','weightsA','weightsB','poseA','poseB','performance'])uniforms[key]=gl.getUniformLocation(program,key);
    root.querySelector('[data-error]').hidden=true;canvas.dataset.ready='true';
  }
  function draw(){
    if(!gl||contextLost)return;
    const size=Math.max(1,Math.round(stage.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2)));
    if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}
    gl.uniform2f(uniforms.resolution,size,size);gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.look,state.look==='aurora'?0:1);gl.uniform1f(uniforms.tint,palettes[state.look].tint);gl.uniform1f(uniforms.modeTime,modeTime);
    gl.uniform4fv(uniforms.weightsA,weights.slice(0,4));gl.uniform2fv(uniforms.weightsB,weights.slice(4));
    gl.uniform4f(uniforms.poseA,pose.x,pose.y,pose.sx,pose.sy);gl.uniform4f(uniforms.poseB,pose.turn,pose.aperture,pose.fold,pose.focus);gl.uniform4f(uniforms.performance,pose.scan,pose.fail,pose.brightness,0);gl.drawArrays(gl.TRIANGLES,0,6);
  }

try{init();}catch(e){fail(e.message);return;}
api=LensPerformance.mount({root,variants:[{id:'prismatic-lens',name:'Prismatic lens'}],extraControls:"<label>Palette<select data-palette aria-label=\"Palette\"><option value=\"aurora\">Prismatic</option><option value=\"pink\">Pink</option><option value=\"cyan\">Cyan</option><option value=\"lilac\">Lilac</option><option value=\"amber\">Amber</option><option value=\"mint\">Mint</option></select></label><label>Motion speed<input data-speed aria-label=\"Motion speed\" type=\"range\" min=\".25\" max=\"1.75\" step=\".05\" value=\"1\"></label><label><input data-round-control type=\"checkbox\" checked>Round display</label>",render(frame){pose=frame.pose;time=frame.time;modeTime=frame.age;state.look=frame.extra.palette;stage.dataset.round=String(frame.extra.round);const w=[pose.listen,pose.speak,pose.think,pose.focus,pose.success];weights=[Math.max(0,1-w.reduce((a,b)=>a+b,0)),...w];const total=weights.reduce((a,b)=>a+b,0)||1;weights=weights.map(x=>x/total);draw();}});
window.prismaticPreview=api;
new ResizeObserver(()=>api.redraw()).observe(stage);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;api.setPaused(true);fail('Graphics paused while the browser restores the preview.');});
canvas.addEventListener('webglcontextrestored',()=>{try{contextLost=false;init();api.redraw();}catch(e){fail(e.message);}});
})();
