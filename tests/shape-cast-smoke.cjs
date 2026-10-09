const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');
const data=require('../studies/shape-cast.states.json');
module.exports=async(page,base)=>{
  await require('./shape-lifecycle.cjs')(page,base);
  const out=path.join(__dirname,'../test-results/shape-cast'),evidence=path.join(__dirname,'evidence/shape-cast');await fs.mkdir(out,{recursive:true});await fs.mkdir(evidence,{recursive:true});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1000,height:1100});
  await page.goto(base+'/characters/shape-cast/index.html');
  await page.waitForFunction(()=>window.shapeCastPreview?.getState().ready);
  const video=page.locator('#shape-video'),canvas=page.locator('#shape-canvas'),report=[];
  async function clock(t){await page.evaluate(t=>shapeCastPreview.seek(t),t);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
  async function hash(){return crypto.createHash('sha256').update(await canvas.evaluate(c=>c.toDataURL())).digest('hex');}
  for(const character of data.characters){
    await page.getByRole('button',{name:character.name,exact:true}).click();
    await page.waitForFunction(()=>shapeCastPreview.getState().ready);
    if(!await page.evaluate(()=>shapeCastPreview.getState().paused))await page.getByRole('button',{name:'Pause animation',exact:true}).click();
    await page.evaluate(()=>{shapeCastPreview.setActivity('error');shapeCastPreview.setActivity('idle')});
    const eyeWhite=()=>canvas.evaluate(c=>{const gl=c.getContext('webgl'),pixels=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let white=0;for(let y=Math.floor(c.height*.44);y<c.height*.73;y++)for(let x=Math.floor(c.width*.27);x<c.width*.73;x++){const i=(y*c.width+x)*4,lo=Math.min(pixels[i],pixels[i+1],pixels[i+2]),hi=Math.max(pixels[i],pixels[i+1],pixels[i+2]);if(lo>140&&hi-lo<50)white++;}return white;});
    await clock(.3);const openWhite=await eyeWhite();await clock(2.8);const closedWhite=await eyeWhite();assert.ok(closedWhite<openWhite*.1,`${character.id} closes both eyelids: ${closedWhite}/${openWhite} white pixels`);
    await canvas.screenshot({path:path.join(out,`${character.id}-blink.png`)});
    const hashes=[];
    for(const state of data.states){
      await page.evaluate(id=>{shapeCastPreview.setActivity('error');shapeCastPreview.setActivity('idle');if(['happy','curious','surprised','confused','concerned','playful'].includes(id))shapeCastPreview.react(id);else shapeCastPreview.setActivity(id)},state.id);
      await clock(.35);const first=await hash();
      if(state.id==='working'||state.id==='playful')await canvas.screenshot({path:path.join(out,`${character.id}-${state.id}-early.png`)});
      await clock(.85);const second=await hash();
      assert.notEqual(first,second,`${character.id} ${state.id} must visibly move`);
      assert.equal(await page.evaluate(()=>shapeCastPreview.getState().state),state.id);
      hashes.push(second);
      await canvas.screenshot({path:path.join(out,`${character.id}-${state.id}.png`)});
      report.push({character:character.id,state:state.id,first,second,visibleMotion:true});
    }
    assert.equal(new Set(hashes).size,16,character.id+' distinct rendered states');
    await page.getByRole('button',{name:'Original idle',exact:true}).click();
    await page.getByRole('button',{name:'Play animation',exact:true}).click();
    await page.waitForFunction(()=>shapeCastPreview.getState().ready&&!shapeCastPreview.getState().paused);
    assert.equal(await video.evaluate(v=>v.videoWidth),512);assert.equal(await video.evaluate(v=>v.duration),4);
    const t=await video.evaluate(v=>v.currentTime);await page.waitForFunction(t=>document.querySelector('#shape-video').currentTime!==t,t);
    await page.getByRole('button',{name:'Pause animation',exact:true}).click();const paused=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(100);assert.equal(await video.evaluate(v=>v.currentTime),paused);
    await page.getByRole('button',{name:'Restart',exact:true}).click();await page.waitForFunction(()=>!shapeCastPreview.getState().paused);
    for(const format of ['mp4','gif','webp']){const link=page.locator('#shape-'+format);assert.ok((await page.request.get(new URL(await link.getAttribute('href'),page.url()).href)).ok());}
    await page.getByRole('button',{name:'State concepts',exact:true}).click();assert.ok(await video.evaluate(v=>v.paused));
    await page.waitForFunction(()=>document.querySelector('#shape-pose').naturalWidth>0);
    for(const state of data.states){await page.getByLabel('Expression or activity').selectOption(state.id);assert.ok((await page.locator('#shape-pose').getAttribute('alt')).includes(state.label));}
    await page.getByRole('button',{name:'Performances',exact:true}).click();
  }
  // Reactions return to the CURRENT activity, and blocking events interrupt immediately.
  await page.evaluate(()=>{shapeCastPreview.setActivity('thinking');shapeCastPreview.react('curious');shapeCastPreview.setActivity('working')});
  assert.equal(await page.evaluate(()=>shapeCastPreview.getState().expression),'curious');
  await clock(2.7);assert.equal(await page.evaluate(()=>shapeCastPreview.getState().state),'working');
  await page.evaluate(()=>{shapeCastPreview.react('playful');shapeCastPreview.setActivity('error')});
  assert.equal(await page.evaluate(()=>shapeCastPreview.getState().expression),null);
  assert.equal(await page.evaluate(()=>shapeCastPreview.react('happy')),false);
  await clock(4);const settled=await hash();await clock(8);assert.equal(await hash(),settled,'error must hold calmly');
  for(const condition of data.systemVariants){await page.getByLabel('Activity',{exact:true}).selectOption(condition.id);assert.equal(await page.evaluate(()=>shapeCastPreview.getState().activity),condition.id);assert.ok((await page.locator('#shape-status').textContent()).includes(condition.label));}
  await page.evaluate(()=>shapeCastPreview.setActivity('complete'));await clock(2);assert.equal(await page.evaluate(()=>shapeCastPreview.getState().activity),'idle');assert.match(await page.locator('#shape-result').textContent(),/Complete/);
  await page.evaluate(()=>shapeCastPreview.setActivity('cancelled'));assert.doesNotMatch(await page.locator('#shape-result').textContent(),/^Complete/);
  await page.evaluate(()=>shapeCastPreview.setActivity('sleeping'));await clock(3);assert.equal(await page.evaluate(()=>shapeCastPreview.getState().phase),'settled');await page.evaluate(()=>shapeCastPreview.setActivity('listening'));assert.equal(await page.evaluate(()=>shapeCastPreview.getState().activity),'listening');
  // Live changes must stop both render time and an already-playing/pending video.
  await page.getByRole('button',{name:'Original idle',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('#shape-video').paused);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#shape-video').paused,{},{timeout:500});
  const stopped=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(350);assert.equal(await video.evaluate(v=>v.currentTime),stopped);
  await page.reload();await page.waitForFunction(()=>shapeCastPreview.getState().ready);assert.ok(await video.evaluate(v=>v.paused));
  await page.getByRole('button',{name:'Play animation',exact:true}).click();await page.waitForFunction(()=>!shapeCastPreview.getState().paused);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(60);
  await page.getByRole('button',{name:'Triangle',exact:true}).click();await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#shape-video').paused,{},{timeout:500});await page.waitForTimeout(150);assert.ok(await video.evaluate(v=>v.paused));
  await page.getByRole('button',{name:'Performances',exact:true}).click();await page.waitForFunction(()=>shapeCastPreview.getState().ready);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const stillTime=await page.evaluate(()=>shapeCastPreview.getState().time);const still=await hash();await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>shapeCastPreview.getState().time),stillTime);assert.equal(await hash(),still);
  await page.getByLabel('Activity',{exact:true}).selectOption('working');assert.equal(await page.evaluate(()=>shapeCastPreview.getState().phase),'still');
  await page.setViewportSize({width:320,height:1000});await page.getByLabel('Round display preview').check();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'mobile-reduced-round.png'),fullPage:true});
  await page.goto(base+'/characters/shape-cast/index.html?character=not-a-character&state=invalid');await page.waitForFunction(()=>shapeCastPreview.getState().ready);assert.equal(await page.evaluate(()=>shapeCastPreview.getState().character),'triangle');
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'?null:original.call(this,kind,...args)}});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#shape-pose').naturalWidth>0);assert.ok(await page.getByRole('button',{name:'Performances',exact:true}).isDisabled());assert.equal(await page.evaluate(()=>shapeCastPreview.getState().mode),'concepts');
  await fs.writeFile(path.join(evidence,'runtime-motion-report.json'),JSON.stringify({coverage:report,checks:['8 original videos','128 visible state motions','8 complete blinks verified by rendered white-pixel reduction','128 distinct source poses','128 static concepts','current-activity reaction return','blocking interruption','one-shot completion','durable results','10 conditions','settled waiting and errors','live reduced-motion event','pending playback reduction','reduced-motion reload','explicit replay','320px round layout']},null,2)+'\n');
  console.log('PASS: eight shape characters, 128 visibly moving performances, reactions, transitions, conditions, original exports, mobile and live reduced motion.');
};
