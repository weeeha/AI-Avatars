const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
module.exports=async function oracleStates(page,base){
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(base+'/characters/oracle/');
  await page.waitForFunction(()=>window.oraclePreview?.getState().ready);
  assert.equal(await page.evaluate(()=>typeof oraclePreview.setMode),'function','Oracle needs a state API for interruptible activities');
  const core=['resting','starting','listening','thinking','researching','working','coding','checking','speaking','waiting','needs-input','complete','error','sleeping'];
  const images=new Set();
  for(const mode of core){
    await page.evaluate(mode=>{oraclePreview.setPaused(true);oraclePreview.setMode(mode);oraclePreview.setEmotion('auto');oraclePreview.seek(1.2);},mode);
    assert.equal(await page.evaluate(()=>oraclePreview.getState().active),mode);
    images.add(await page.evaluate(()=>oraclePreview.capture()));
  }
  assert.equal(images.size,core.length,'Core activities need visibly distinct poses');
  for(const mode of ['starting','researching','working','coding','checking','speaking','needs-input','complete','error']){
    const captures=await page.evaluate(mode=>{oraclePreview.setMode(mode);oraclePreview.seek(.25);const a=oraclePreview.capture();oraclePreview.seek(1.5);return[a,oraclePreview.capture()];},mode);
    assert.notEqual(...captures,mode+' needs an actual performance');
  }
  await page.evaluate(()=>{oraclePreview.setMode('working');oraclePreview.setEmotion('happy');oraclePreview.seek(1);});
  assert.equal(await page.evaluate(()=>oraclePreview.getState().emotion),'happy');
  const happy=await page.evaluate(()=>oraclePreview.capture());
  await page.evaluate(()=>{oraclePreview.setEmotion('concerned');oraclePreview.seek(1);});
  assert.notEqual(await page.evaluate(()=>oraclePreview.capture()),happy,'Emotion must change the face while activity persists');
  assert.equal(await page.evaluate(()=>oraclePreview.getState().active),'working');
  await page.evaluate(()=>{oraclePreview.react('playful');oraclePreview.seek(1);oraclePreview.setMode('error');});
  assert.equal(await page.evaluate(()=>oraclePreview.getState().reaction),null,'Actionable state interrupts a reaction');
  await page.evaluate(()=>{oraclePreview.setMode('researching');oraclePreview.react('happy');oraclePreview.seek(5);});
  assert.equal(await page.evaluate(()=>oraclePreview.getState().reaction),null);
  assert.equal(await page.evaluate(()=>oraclePreview.getState().active),'researching');
  await page.evaluate(()=>{oraclePreview.setEmotion('auto');oraclePreview.setMode('complete');oraclePreview.seek(4);});
  assert.equal(await page.evaluate(()=>oraclePreview.getState().glyphTo),0,'Acknowledgement returns to resting stars');
  await page.click('#oracle-react');
  assert.equal(await page.evaluate(()=>oraclePreview.getState().paused),false,'Explicit expression playback starts motion');
  await page.evaluate(()=>oraclePreview.setPaused(true));
  for(const mode of ['offline','reconnecting','awaiting-approval','permission-denied','paused','cancelled','partial']){
    await page.evaluate(mode=>{oraclePreview.setMode(mode);oraclePreview.seek(1);},mode);
    assert.equal(await page.evaluate(()=>oraclePreview.getState().mode),mode);
    assert.ok((await page.locator('#oracle-status').textContent()).length>5);
  }
  await page.evaluate(()=>{oraclePreview.setMode('sleeping');oraclePreview.setEmotion('happy');oraclePreview.seek(5);});
  assert.ok(await page.evaluate(()=>oraclePreview.getState().pose.lid.every(x=>x>.95)),'Sleep closes every eye despite emotion');
  await page.evaluate(()=>{oraclePreview.setMode('working');oraclePreview.setPaused(false);});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>oraclePreview.getState().paused);
  const frozen=await page.evaluate(()=>oraclePreview.getState().time);
  await page.waitForTimeout(120);
  assert.equal(await page.evaluate(()=>oraclePreview.getState().time),frozen);
  await page.setViewportSize({width:320,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const out=path.join(__dirname,'../test-results/oracle-completion');await fs.mkdir(out,{recursive:true});
  for(const mode of ['resting','researching','working','needs-input','complete','error','sleeping']){
    await page.evaluate(mode=>{oraclePreview.setEmotion('auto');oraclePreview.setMode(mode);oraclePreview.seek(1.2);},mode);
    await page.locator('.oracle-face').screenshot({path:path.join(out,mode+'.png')});
  }
  console.log('PASS: Oracle activity performances, independent emotions, interruptions, operational conditions, live reduced motion and mobile.');
};
if(require.main===module){
  const {chromium}=require('playwright'),{spawn}=require('node:child_process');
  (async()=>{const port=process.env.AVATAR_TEST_PORT||'44210';const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});let browser;try{await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(Error('Server exited '+code)));});browser=await chromium.launch({headless:true});await module.exports(await browser.newPage(),`http://127.0.0.1:${port}`);}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exit(1);});
}
