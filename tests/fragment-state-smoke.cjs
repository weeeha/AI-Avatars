const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
module.exports=async function verifyLifecycle(page,origin){
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(origin+'/characters/fragment-faces/');
  await page.waitForFunction(()=>window.avatarPreview?.getState().ready);
  const modes=['starting','working','coding','checking','waiting','needs-input','reconnecting','awaiting-approval','permission-denied','paused','cancelled','partial'];
  for(const mode of modes){
    await page.evaluate(mode=>{avatarPreview.setPaused(true);avatarPreview.setMode(mode);avatarPreview.setEmotion('auto');avatarPreview.seek(1);},mode);
    assert.equal(await page.evaluate(()=>avatarPreview.getState().mode),mode,mode+' must be selectable');
  }
  const out=path.join(__dirname,'../test-results/fragment-completion');await fs.mkdir(out,{recursive:true});
  const distinct=[new Set(),new Set()];
  for(const mode of ['idle','starting','listening','thinking','searching','working','coding','checking','speaking','waiting','needs-input','done','error','sleeping']){
    const captures=await page.evaluate(mode=>{avatarPreview.setMode(mode);avatarPreview.setEmotion('auto');avatarPreview.seek(.25);const a=avatarPreview.capture();avatarPreview.seek(1.2);return[a,avatarPreview.capture()];},mode);
    captures[1].forEach((image,i)=>distinct[i].add(image));
    if(mode!=='sleeping')for(let i=0;i<2;i++)assert.ok(captures[0][i]!==captures[1][i],mode+' must move for both faces');
    if(['working','needs-input','error','sleeping'].includes(mode))await page.locator('.fragment-stage').screenshot({path:path.join(out,mode+'.png')});
  }
  distinct.forEach(set=>assert.equal(set.size,14));
  await page.evaluate(()=>{avatarPreview.setMode('working');avatarPreview.setEmotion('concerned');avatarPreview.seek(1);});
  assert.equal(await page.evaluate(()=>avatarPreview.getState().emotion),'concerned');
  assert.equal(await page.evaluate(()=>avatarPreview.getState().active),'working');
  await page.evaluate(()=>{avatarPreview.react('laugh');avatarPreview.setMode('error');});
  assert.equal(await page.evaluate(()=>avatarPreview.getState().reaction),null,'New activity interrupts a reaction');
  await page.evaluate(()=>{avatarPreview.setMode('working');avatarPreview.seek(0);avatarPreview.react('got-it');avatarPreview.setPaused(true);avatarPreview.seek(3);});
  assert.equal(await page.evaluate(()=>avatarPreview.getState().reaction),null);
  assert.equal(await page.evaluate(()=>avatarPreview.getState().active),'working');
  await page.evaluate(()=>{avatarPreview.setMode('sleeping');avatarPreview.setEmotion('happy');avatarPreview.seek(5);});
  assert.ok(await page.evaluate(()=>avatarPreview.getState().expression.l>.99&&avatarPreview.getState().expression.r>.99));
  for(const [alias,canonical] of [['researching','searching'],['answering','speaking'],['complete','done']]){
    await page.evaluate(alias=>avatarPreview.setMode(alias),alias);assert.equal(await page.evaluate(()=>avatarPreview.getState().mode),canonical);
  }
  await page.evaluate(()=>{avatarPreview.setMode('working');avatarPreview.setPaused(false);});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>avatarPreview.getState().paused);
  const time=await page.evaluate(()=>avatarPreview.getState().time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>avatarPreview.getState().time),time);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{avatarPreview.setMode('working');avatarPreview.setPaused(false);avatarPreview.startTalking(true);});
  await page.waitForFunction(()=>avatarPreview.getState().voice?.playing);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>avatarPreview.getState().paused);
  await page.evaluate(()=>avatarPreview.stopTalking());
  assert.equal(await page.evaluate(()=>avatarPreview.getState().paused),true,'Stopping voice must retain intervening reduced motion');
  const stopped=await page.evaluate(()=>avatarPreview.getState().time);await page.waitForTimeout(160);
  assert.equal(await page.evaluate(()=>avatarPreview.getState().time),stopped);
  console.log('PASS: photographic lifecycle, distinct motion on both faces, emotion layers, interruptions, aliases, sleep and live reduced motion.');
};
if(require.main===module){
  const {chromium}=require('playwright'),{spawn}=require('node:child_process');
  (async()=>{const port=process.env.AVATAR_TEST_PORT||'44211';const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});let browser;try{await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(Error('Server exited '+code)));});browser=await chromium.launch({headless:true});await module.exports(await browser.newPage(),`http://127.0.0.1:${port}`);}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exit(1);});
}
