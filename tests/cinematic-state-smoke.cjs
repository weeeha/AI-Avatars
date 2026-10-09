const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
module.exports=async function cinematicLifecycle(page,origin){
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(origin+'/characters/cinematic-faces/');
  assert.equal(await page.evaluate(()=>typeof window.cinematicPreview),'object','Cinematic characters need an interruptible activity API');
  const out=path.join(__dirname,'../test-results/cinematic-completion');await fs.mkdir(out,{recursive:true});
  for(const character of ['eidolon','lens']){
    await page.selectOption('#cinema-character',character);
    const hashes=new Set();
    for(const mode of ['idle','waking','listening','thinking','searching','working','coding','checking','speaking','waiting','needs-input','success','error','sleeping']){
      await page.evaluate(mode=>{cinematicPreview.setPaused(true);cinematicPreview.setEmotion('calm');cinematicPreview.setMode(mode);cinematicPreview.seek(1);},mode);
      assert.equal(await page.evaluate(()=>cinematicPreview.getState().mode),mode);
      hashes.add(await page.evaluate(()=>cinematicPreview.capture()));
      if(['working','needs-input','error','sleeping'].includes(mode))await page.locator('section:not([hidden]) canvas').screenshot({path:path.join(out,character+'-'+mode+'.png')});
    }
    assert.equal(hashes.size,14,character+' needs distinct activity poses');
    for(const mode of ['waking','working','coding','checking','needs-input','success','error']){
      const images=await page.evaluate(mode=>{cinematicPreview.setMode(mode);cinematicPreview.seek(.2);const a=cinematicPreview.capture();cinematicPreview.seek(1.4);return[a,cinematicPreview.capture()];},mode);
      assert.ok(images[0]!==images[1],mode+' should perform for '+character);
    }
    await page.evaluate(()=>{cinematicPreview.setMode('working');cinematicPreview.setEmotion('confused');cinematicPreview.seek(1);});
    assert.equal(await page.evaluate(()=>cinematicPreview.getState().emotion),'confused');
    await page.evaluate(()=>{cinematicPreview.react('laugh');cinematicPreview.setMode('error');});
    assert.equal(await page.evaluate(()=>cinematicPreview.getState().reaction),null);
    await page.evaluate(()=>{cinematicPreview.setMode('working');cinematicPreview.seek(0);cinematicPreview.react('nod');cinematicPreview.setPaused(true);cinematicPreview.seek(3);});
    assert.equal(await page.evaluate(()=>cinematicPreview.getState().reaction),null);
    assert.equal(await page.evaluate(()=>cinematicPreview.getState().mode),'working');
    for(const mode of ['offline','reconnecting','awaiting-approval','permission-denied','paused','cancelled','partial']){
      await page.evaluate(mode=>cinematicPreview.setMode(mode),mode);
      assert.equal(await page.evaluate(()=>cinematicPreview.getState().mode),mode);
      assert.ok((await page.locator('#cinema-caption').textContent()).length>8);
    }
    await page.evaluate(()=>{cinematicPreview.setMode('success');cinematicPreview.seek(5);});
    assert.equal(await page.evaluate(()=>cinematicPreview.getState().pose.celebrate),0,'Success acknowledgement settles');
  }
  await page.evaluate(()=>{cinematicPreview.setMode('working');cinematicPreview.setPaused(false);});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!cinematicPreview.getState().playing);
  const frozen=await page.evaluate(()=>cinematicPreview.getState().time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>cinematicPreview.getState().time),frozen);
  await page.setViewportSize({width:320,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log('PASS: both cinematic character lifecycles, distinct activity performances, independent emotion, reaction interruption, settling and reduced motion.');
};
if(require.main===module){
  const {chromium}=require('playwright'),{spawn}=require('node:child_process');
  (async()=>{const port=process.env.AVATAR_TEST_PORT||'44212';const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});let browser;try{await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(Error('Server exited '+code)));});browser=await chromium.launch({headless:true});await module.exports(await browser.newPage(),`http://127.0.0.1:${port}`);}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exit(1);});
}
