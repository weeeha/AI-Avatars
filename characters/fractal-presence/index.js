(() => {
let pose={x:0,y:0,turn:0,fold:0,sx:1,sy:1,brightness:1};
function createFractalField(count=240000) {
  const points=new Float32Array(count*4);
  const choices=new Float32Array(count+100);
  let seed=782713;
  for(let i=0;i<choices.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;choices[i]=(seed>>>0)/4294967296;}
  function update(time=0,energy=.7){
    const per=Math.floor(count/5);let index=0;
    for(let plume=0;plume<5;plume++){
      let x=0,y=0,generation=0;
      const phase=plume*1.73;
      const sway=(.035+.045*energy)*Math.sin(time*.72+phase);
      const curl=.34*Math.sin(time*.33+phase)+.35;
      const growth=.035*Math.sin(time*.47+phase*1.4);
      const angleBase=[-.95,-.30,.17,.56,1.12][plume];
      const length=[1.27,1.53,1.64,1.32,1.05][plume];
      const width=.70+plume*.035;
      const baseX=[-.13,-.13,-.17,-.25,-.22][plume];
      const baseY=-.72+plume*.055;
      for(let i=0;i<per+30;i++){
        const r=choices[(i+plume*per)%choices.length];
        let nx,ny;
        if(r<.014){nx=.025*x;ny=.15*y;generation=0;}
        else if(r<.84){nx=.886*x+(.056+sway*.3)*y;ny=-.045*x+.874*y+1.21;generation*=.91;}
        else if(r<.922){nx=(.28+growth)*x-(.36+sway)*y;ny=.23*x+(.32+growth)*y+1.50;generation=generation*.6+.7;}
        else{nx=(-.22-growth)*x+(.33-sway)*y;ny=.28*x+(.27-growth*.5)*y+.80;generation=generation*.6+.35;}
        nx+=.016*ny*Math.sin(ny*2.7+nx*.8+time*.60+phase);
        x=nx;y=ny;
        if(i<30)continue;
        const u=x/5.4,v=y/8.6;
        const angle=angleBase+curl*v*.7;
        const px=u*width+(.22*Math.sin(v*5.+time*.31+phase))*v+.10*Math.sin(u*7.+v*6.+phase)*v;
        const py=v*length;
        const ca=Math.cos(angle),sa=Math.sin(angle);
        points[index++]=(px*ca+py*sa)+baseX;
        points[index++]=(-px*sa+py*ca)+baseY;
        points[index++]=v*.70+u*.19+generation*.52+.14*Math.sin(v*8.+time*.43)+plume*.052;
        points[index++]=.12+.88*Math.min(1,generation*5.0);
      }
    }
    return points;
  }
  return {points,update};
}

const vertexSource="#ifdef GL_ES\nprecision highp float;\n#endif\nattribute vec4 aPoint;\nuniform vec2 resolution;\nuniform float time;\nuniform float energy;\nuniform float pointScale;\nuniform float fieldScale;\nvarying vec3 color;\nvarying vec2 axis;\nvec3 palette(float f){\n  f=fract(f);\n  if(f<.18)return mix(vec3(.003,.004,.027),vec3(.015,.055,.9),f/.18);\n  if(f<.34)return mix(vec3(.015,.055,.9),vec3(.24,.003,.012),(f-.18)/.16);\n  if(f<.53)return mix(vec3(.24,.003,.012),vec3(1.,.055,.012),(f-.34)/.19);\n  if(f<.68)return mix(vec3(1.,.055,.012),vec3(1.,.43,.07),(f-.53)/.15);\n  if(f<.80)return mix(vec3(1.,.43,.07),vec3(.52,.96,1.),(f-.68)/.12);\n  if(f<.9)return mix(vec3(.52,.96,1.),vec3(1.,1.,.96),(f-.8)/.1);\n  return mix(vec3(1.,1.,.96),vec3(.003,.004,.027),(f-.9)/.1);\n}\nvoid main(){\n  vec2 p=aPoint.xy*.72;\n  p=mat2(.84,-.54,.54,.84)*p;\n  p+=vec2(-.07,.15);\n  float r2=dot(p,p);\n  p/=1.+.18*r2*r2;\n  p*=fieldScale;\n  p.x*=resolution.y/resolution.x;\n  gl_Position=vec4(p,0.,1.);\n  gl_PointSize=pointScale*2.4;\n  float band=aPoint.z*.93+time*.22+.09*sin(aPoint.z*11.-time*.7+aPoint.x*4.);\n  color=palette(band)*(.24+.07*energy)*aPoint.w;\n  float angle=-.6+.35*sin(aPoint.z*5.+aPoint.x*4.);\n  axis=vec2(cos(angle),sin(angle));\n}\n";
const fragmentSource="#ifdef GL_ES\nprecision highp float;\n#endif\nvarying vec3 color;\nvarying vec2 axis;\nvoid main(){\n  vec2 p=gl_PointCoord-.5;\n  p=mat2(axis.x,-axis.y,axis.y,axis.x)*p;\n  float d=length(vec2(p.x*.62,p.y*2.3));\n  float alpha=1.-smoothstep(.22,.55,d);\n  gl_FragColor=vec4(color*alpha,1.);\n}\n";
const root=document.getElementById('code-fractal-presence');
let canvas=root.querySelector('canvas');

let mode='idle',time=0,wall=0;
let energy=.70,scale=1,ready=false,gl,ctx,program,locations,buffer,field,pixels;
function compile(type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function setup(){
  try{
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    if(!gl)throw new Error('No WebGL context');
    program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    field=createFractalField(240000);gl.bufferData(gl.ARRAY_BUFFER,field.points.byteLength,gl.DYNAMIC_DRAW);
    const attr=gl.getAttribLocation(program,'aPoint');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,4,gl.FLOAT,false,16,0);
    locations={};['resolution','time','energy','pointScale','fieldScale'].forEach(name=>locations[name]=gl.getUniformLocation(program,name));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.clearColor(0,0,0,1);
  }catch(error){
    console.info('Using the procedural Canvas renderer:',error.message);
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    gl=null;ctx=canvas.getContext('2d',{alpha:false});field=createFractalField(95000);
  }
  ready=true;resize();
}
function resize(){
  if(!ready)return;
  const box=canvas.getBoundingClientRect();
  const density=gl?Math.min(devicePixelRatio||1,1.5,1050/Math.max(box.width,box.height)):Math.min(1,600/Math.max(box.width,box.height));
  canvas.width=Math.max(2,Math.round(box.width*density));canvas.height=Math.max(2,Math.round(box.height*density));
  if(gl)gl.viewport(0,0,canvas.width,canvas.height);else pixels=ctx.createImageData(canvas.width,canvas.height);
  draw();
}
const paletteStops=[
  [0,[.003,.004,.027]],[.18,[.015,.055,.9]],[.34,[.24,.003,.012]],
  [.53,[1,.055,.012]],[.68,[1,.43,.07]],[.80,[.52,.96,1]],
  [.90,[1,1,.96]],[1,[.003,.004,.027]]
];
function drawCanvas(points,fieldScale){
  const w=canvas.width,h=canvas.height,d=pixels.data;d.fill(0);
  for(let i=3;i<d.length;i+=4)d[i]=255;
  for(let i=0;i<points.length;i+=4){
    const px=points[i]*.72,py=points[i+1]*.72;
    const wx=(.84*px+.54*py)-.07,wy=(-.54*px+.84*py)+.15,r2=wx*wx+wy*wy;
    const compact=fieldScale/(1+.18*r2*r2);
    const x=Math.round(w*.5+wx*compact*h*.5);
    const y=Math.round(h*.5-wy*compact*h*.5);
    if(x<0||x>=w||y<0||y>=h)continue;
    let band=points[i+2]*.93+time*.22+.09*Math.sin(points[i+2]*11-time*.7+points[i]*4);band-=Math.floor(band);
    let s=0;while(s<paletteStops.length-2&&band>paletteStops[s+1][0])s++;
    const lo=paletteStops[s],hi=paletteStops[s+1],f=(band-lo[0])/(hi[0]-lo[0]);
    const gain=(.24+.07*energy)*points[i+3]*255*.8;
    const j=(y*w+x)*4;
    for(let c=0;c<3;c++)d[j+c]=Math.min(255,d[j+c]+(lo[1][c]+(hi[1][c]-lo[1][c])*f)*gain);
  }
  ctx.putImageData(pixels,0,0);
}
function draw(){
  if(!ready)return;
  const points=field.update(time,energy);
  // Deform the five recursive plumes while retaining their dense branching structure.
  const co=Math.cos(pose.turn),si=Math.sin(pose.turn);
  for(let i=0;i<points.length;i+=4){const x=points[i],y=points[i+1];const curl=pose.fold*Math.sin(y*4+x*3);points[i]=(x*co-y*si+curl)*pose.sx+pose.x;points[i+1]=(x*si+y*co)*pose.sy+pose.y;points[i+3]*=pose.brightness;}
  const voice=mode==='speaking'?(.028*Math.sin(wall*8.1)+.016*Math.sin(wall*13.7)+.014*Math.sin(wall*4.3)):0;
  const size=scale+voice;
  if(gl){
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,points);
    gl.uniform2f(locations.resolution,canvas.width,canvas.height);gl.uniform1f(locations.time,time);
    gl.uniform1f(locations.energy,energy);gl.uniform1f(locations.pointScale,canvas.height/720);gl.uniform1f(locations.fieldScale,size);
    gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.POINTS,0,points.length/4);
  }else drawCanvas(points,size);
  canvas.dataset.frame=String(Math.round(time*1000));canvas.dataset.mode=mode;
}

setup();

  const variants=[{"id": "fractal-presence", "name": "Fractal presence"}];
  AbstractPerformance.mount({root,variants,render(frame){pose=frame.pose;mode=frame.state==='answering'?'speaking':frame.state;time=frame.time;wall=frame.time;energy=.7+pose.think*.3+pose.speak*.2;scale=.93+pose.listen*.06+pose.success*.03;draw();}});
new ResizeObserver(()=>{resize();window.abstractPreview.redraw();}).observe(root.querySelector('.abstract-stage'));
})();
