const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=async(page,origin)=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const family of ['luminous-faces','core-eyes','assistant-iris','fractal-presence']){
    await page.goto(origin+'/characters/'+family+'/index.html');await page.waitForFunction(()=>window.abstractPreview);
    await page.evaluate(()=>{abstractPreview.setEmotion('neutral');abstractPreview.setPaused(false);abstractPreview.setState('sleeping');abstractPreview.advance(3);abstractPreview.setPaused(true);});
    const before=await page.evaluate(()=>abstractPreview.getState());
    const variants=await page.locator('[data-character] option').evaluateAll(options=>options.map(x=>x.value));
    await page.locator('[data-character]').selectOption(variants[1]||variants[0]);
    const after=await page.evaluate(()=>abstractPreview.getState());
    assert.equal(after.paused,true);assert.equal(after.state,'sleeping');
    assert.equal(after.pose.sy,before.pose.sy,family+' must retain held sleep on paused character switch');
    assert.equal(after.pose.aperture,before.pose.aperture);assert.equal(after.pose.brightness,before.pose.brightness);
    await page.evaluate(()=>{abstractPreview.setPaused(false);abstractPreview.setState('idle');abstractPreview.advance(120);});
    const oldClock=await page.evaluate(()=>abstractPreview.getState().pose.clock);
    await page.evaluate(()=>{abstractPreview.setState('researching');abstractPreview.advance(.225);});
    const clock=await page.evaluate(()=>abstractPreview.getState().pose.clock);
    assert.ok(clock>=oldClock&&clock-oldClock<1,'Material phase advances continuously through activity transitions');
    await page.evaluate(()=>abstractPreview.setPaused(false));
    await page.locator('[data-condition]').selectOption('cancelled');
    await page.getByRole('button',{name:'Play demo',exact:true}).click();
    assert.equal(await page.evaluate(()=>abstractPreview.getState().condition),'normal','Demo clears prior simulated condition');
    await page.evaluate(()=>{for(let i=0;i<8;i++)abstractPreview.advance(3.1);});
    assert.equal(await page.evaluate(()=>abstractPreview.getState().state),'complete');
    assert.equal(await page.evaluate(()=>abstractPreview.getState().condition),'normal');
    assert.ok(!(await page.locator('[data-status]').textContent()).includes('Cancelled'));
  }
  const clockPage=await page.context().browser().newPage();
  await clockPage.clock.install({time:new Date('2026-10-09T12:00:00Z')});
  await clockPage.goto(origin+'/characters/core-eyes/index.html');await clockPage.waitForFunction(()=>window.abstractPreview);
  await clockPage.evaluate(()=>{abstractPreview.setPaused(true);abstractPreview.setState('idle');});
  await clockPage.locator('[data-time]').check();
  const timeBefore=await clockPage.evaluate(()=>abstractPreview.getState().time);
  const clockBefore=await clockPage.locator('.abstract-stage canvas:not([hidden])').evaluate(c=>c.toDataURL());
  await clockPage.clock.fastForward(61000);
  const clockAfter=await clockPage.locator('.abstract-stage canvas:not([hidden])').evaluate(c=>c.toDataURL());
  assert.ok(clockBefore!==clockAfter,'Paused clock display updates at the next minute');
  assert.equal(await clockPage.evaluate(()=>abstractPreview.getState().time),timeBefore,'Clock update does not advance animation');
  await clockPage.close();
  console.log('PASS: all four abstract families retain paused sleep and clear stale demo conditions.');
};
if(require.main===module){
  const {chromium}=require('playwright'),{spawn}=require('node:child_process');
  (async()=>{const port=process.env.AVATAR_TEST_PORT||'44215';const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});let browser;try{await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',code=>reject(Error('Server exited '+code)));});browser=await chromium.launch({headless:true});await module.exports(await browser.newPage(),`http://127.0.0.1:${port}`);}finally{await browser?.close();server.kill();}})().catch(error=>{console.error(error);process.exit(1);});
}
