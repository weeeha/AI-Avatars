const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const families=require('../catalog.json').filter(s=>['luminous-faces','core-eyes','assistant-iris','fractal-presence'].includes(s.id));
// Pixel hashes are sampled immediately after the real renderer runs; changing a label
// or advancing a counter alone cannot satisfy the animation assertions.
async function sample(page,dt=0){return page.evaluate(dt=>{if(dt)abstractPreview.advance(dt);else abstractPreview.redraw();const canvas=document.querySelector('.abstract-stage canvas:not([hidden])');const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0,48,48);const data=ctx.getImageData(0,0,48,48).data;let hash=2166136261,light=0;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4<3)light+=data[i];}return {hash:hash>>>0,light,state:abstractPreview.getState()};},dt);}
module.exports=async function(page,origin){
 const out=path.resolve(process.env.ABSTRACT_EVIDENCE_DIR||'output/playwright/abstract');fs.mkdirSync(out,{recursive:true});
 const report=[];let combinations=0;
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const family of families){
  await page.goto(origin+'/'+family.output+'.html');
  await page.waitForFunction(()=>window.abstractPreview,{timeout:10000});
  const activities=await page.evaluate(()=>Object.keys(AbstractPerformance.activities));
  const emotions=await page.evaluate(()=>Object.keys(AbstractPerformance.emotions));
  const variants=[];
  // Control time explicitly between rendered frames, then separately verify RAF playback.
  await page.evaluate(()=>{abstractPreview.setPaused(false);document.dispatchEvent(new Event('visibilitychange'));});
  for(const character of family.characters){
   await page.locator('[data-character]').selectOption(character.id);
   const record={id:character.id,activities:{},emotions:{}};
   await page.locator('[data-emotion]').selectOption('neutral');
   for(const state of activities){
    await page.locator('[data-activity]').selectOption(state);
    const a=await sample(page,.7),b=await sample(page,.7);
    assert.ok(a.light>1000,`${character.id}/${state} blank`);
    assert.notEqual(a.hash,b.hash,`${character.id}/${state} has no entry/temporal motion`);
    assert.equal(b.state.state,state);assert.equal(b.state.character,character.id);
    if(['waiting','needs-input','error','sleeping','complete','starting'].includes(state)){
      const held=await sample(page,3),heldAgain=await sample(page,1);
      assert.equal(held.hash,heldAgain.hash,`${character.id}/${state} does not settle`);
    }
    record.activities[state]=[a.hash,b.hash];
    // Every activity / expression combination must render real nonempty artwork.
    const matrix=await page.evaluate(emotions=>emotions.map(emotion=>{abstractPreview.setEmotion(emotion);abstractPreview.advance(.5);const canvas=document.querySelector('.abstract-stage canvas:not([hidden])');const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0,48,48);const d=ctx.getImageData(0,0,48,48).data;let light=0;for(let i=0;i<d.length;i++)if(i%4<3)light+=d[i];return {emotion:abstractPreview.getState().emotion,light};}),emotions);
    for(const x of matrix){assert.ok(x.light>1000,`${character.id}/${state}/${x.emotion} blank`);combinations++;}
    await page.locator('[data-emotion]').selectOption('neutral');
   }
   await page.locator('[data-activity]').selectOption('idle');
   for(const emotion of emotions){
    await page.locator('[data-emotion]').selectOption(emotion);const a=await sample(page,.6),b=await sample(page,.65);assert.notEqual(a.hash,b.hash,`${character.id}/${emotion} has no motion`);record.emotions[emotion]=b.hash;
   }
   assert.equal(new Set(Object.values(record.emotions)).size,7,`${character.id} duplicate expressions`);
   await page.locator('[data-emotion]').selectOption('neutral');
   await page.locator('[data-activity]').selectOption('idle');await sample(page,.2);
   await page.locator('.abstract-stage').screenshot({path:path.join(out,character.id+'-idle.png')});
   await page.locator('[data-activity]').selectOption('researching');await page.locator('[data-emotion]').selectOption('curious');await sample(page,1);
   await page.locator('.abstract-stage').screenshot({path:path.join(out,character.id+'-curious-research.png')});
   await page.locator('[data-activity]').selectOption('needs-input');await page.locator('[data-emotion]').selectOption('concerned');await sample(page,3);
   await page.locator('.abstract-stage').screenshot({path:path.join(out,character.id+'-needs-input.png')});
   variants.push(record);
  }
  await page.locator('[data-activity]').selectOption('answering');const live=await sample(page);await page.waitForTimeout(150);const moved=await sample(page);assert.ok(moved.state.time>live.state.time,'RAF is not running');
  await page.evaluate(()=>{const before=JSON.stringify(abstractPreview.getState().pose);abstractPreview.setPaused(true);if(JSON.stringify(abstractPreview.getState().pose)!==before)throw Error('Pause changes the current pose');});const paused=await sample(page);await page.waitForTimeout(150);const pausedAgain=await sample(page);assert.equal(paused.state.time,pausedAgain.state.time);assert.equal(paused.hash,pausedAgain.hash);
  await page.getByRole('button',{name:'Play motion',exact:true}).click();
  await page.locator('[data-activity]').selectOption('working');await page.getByRole('button',{name:'Acknowledge',exact:true}).click();assert.equal((await sample(page,.1)).state.reaction,true);assert.equal((await sample(page,1.1)).state.reaction,false);assert.equal((await sample(page)).state.state,'working');
  await page.getByRole('button',{name:'Acknowledge',exact:true}).click();await page.locator('[data-activity]').selectOption('error');assert.equal((await sample(page)).state.reaction,false);assert.equal(await page.locator('[data-react]').isDisabled(),true);await page.getByRole('button',{name:'Recover to idle'}).click();assert.equal((await sample(page)).state.state,'idle');
  for(const [condition,state]of Object.entries({offline:'waiting',reconnecting:'waiting','permission-denied':'needs-input',paused:'waiting',cancelled:'idle',partial:'needs-input'})){
   await page.locator('[data-condition]').selectOption(condition);assert.equal((await sample(page)).state.state,state);assert.equal((await sample(page)).state.condition,condition);
  }
  await page.getByRole('button',{name:'Play demo',exact:true}).click();assert.equal((await sample(page)).state.demo,true);await page.locator('[data-activity]').selectOption('error');assert.equal((await sample(page)).state.demo,false);
  if(family.id==='core-eyes'){await page.locator('[data-time]').check();await page.locator('[data-shell]').check();assert.deepEqual((await sample(page)).state.extra,{shell:true,showTime:true,palette:'violet'});await page.reload();await page.waitForFunction(()=>window.abstractPreview);assert.equal(await page.locator('[data-time]').isChecked(),true);await page.locator('[data-time]').uncheck();await page.locator('[data-shell]').uncheck();}
  if(family.id==='assistant-iris'){for(const color of ['violet','cyan','emerald','amber','coral','pink','aurora']){await page.locator('[data-palette]').selectOption(color);assert.equal((await sample(page)).state.extra.palette,color);}}
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>abstractPreview.getState().paused,null,{timeout:5000});const reduced=await sample(page);assert.equal(reduced.state.paused,true);assert.equal(reduced.state.reducedMotion,true);await page.waitForTimeout(120);assert.equal((await sample(page)).hash,reduced.hash);
  await page.locator('[data-activity]').selectOption('needs-input');const still=await sample(page);assert.ok(still.light>1000);await page.getByRole('button',{name:'Play demo'}).click();assert.equal((await sample(page)).state.demo,false);
  await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,family.id+'-mobile.png'),fullPage:true});
  await page.reload();await page.waitForFunction(()=>window.abstractPreview);assert.equal((await sample(page)).state.paused,true);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:768,height:1000});
  report.push({family:family.id,variants});
  console.log('PASS: '+family.id+' ('+family.characters.length+' designs)');
 }
 fs.writeFileSync(path.join(out,'coverage.json'),JSON.stringify({combinations,report},null,2));
 console.log(`PASS: all 25 abstract designs, ${combinations} activity/expression renders, actual temporal pixel changes, settling, controls, reactions, interruptions, clock/palettes, live reduced motion and mobile.`);
};
