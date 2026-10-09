const assert=require('node:assert/strict');
const data=require('../studies/shape-cast.states.json');
module.exports=async(page,base)=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:768,height:1000});
  await page.goto(base+'/characters/shape-cast/index.html');
  const video=page.locator('#shape-video');
  for(const character of data.characters){
    await page.getByRole('button',{name:character.name,exact:true}).click();
    await page.waitForFunction(()=>shapeCastPreview.getState().ready&&!shapeCastPreview.getState().paused);
    assert.equal(await video.evaluate(v=>v.videoWidth),512);
    assert.equal(await video.evaluate(v=>v.duration),4);
    const t=await video.evaluate(v=>v.currentTime);
    await page.waitForFunction(t=>document.querySelector('#shape-video').currentTime!==t,t);
    await page.getByRole('button',{name:'Pause animation',exact:true}).click();
    const paused=await video.evaluate(v=>v.currentTime);
    await page.waitForTimeout(100);
    assert.equal(await video.evaluate(v=>v.currentTime),paused);
    await page.getByRole('button',{name:'Restart',exact:true}).click();
    await page.waitForFunction(()=>!shapeCastPreview.getState().paused);
    assert.ok(await video.evaluate(v=>v.currentTime<1));
    for(const format of ['mp4','gif','webp']){
      const link=page.locator('#shape-'+format);
      const response=await page.request.get(new URL(await link.getAttribute('href'),page.url()).href);
      assert.ok(response.ok(),character.id+' '+format+' is downloadable');
    }
    await page.getByRole('button',{name:'State concepts',exact:true}).click();
    assert.ok(await video.evaluate(v=>v.paused));
    await page.waitForFunction(()=>document.querySelector('#shape-pose').naturalWidth>0);
    for(const state of data.states){
      await page.getByLabel('Expression or activity').selectOption(state.id);
      assert.equal(await page.evaluate(()=>shapeCastPreview.getState().state),state.id);
      assert.ok((await page.locator('#shape-pose').getAttribute('alt')).includes(state.label));
    }
    await page.getByRole('button',{name:'Animation',exact:true}).click();
  }
  await page.setViewportSize({width:320,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.ok(await video.evaluate(v=>v.paused));
  await page.reload();
  await page.waitForFunction(()=>shapeCastPreview.getState().ready);
  assert.ok(await video.evaluate(v=>v.paused));
  await page.getByRole('button',{name:'Play animation',exact:true}).click();
  await page.waitForFunction(()=>!shapeCastPreview.getState().paused);
  await page.goto(base+'/characters/shape-cast/index.html?character=not-a-character&state=invalid');
  assert.equal(await page.evaluate(()=>shapeCastPreview.getState().character),'triangle');
  console.log('PASS: eight shape clips, playback, downloads, 128 state selections, mobile layout, reduced motion.');
};
