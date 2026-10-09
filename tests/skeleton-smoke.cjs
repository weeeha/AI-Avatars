const assert=require('node:assert/strict');
module.exports=async function(page,origin){
  const capture=process.env.SKELETON_SCREENSHOTS;
  if(capture)require('node:fs').mkdirSync(capture,{recursive:true});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1000,height:1000});
  await page.goto(origin+'/characters/open-skeleton/preview.html');
  await page.waitForFunction(()=>window.openSkeletonPreview&&document.querySelector('#live-face').readyState>=2);
  const state=()=>page.evaluate(()=>openSkeletonPreview.getState());
  const activity=async id=>{await page.getByLabel('Activity or condition',{exact:true}).selectOption(id);await page.waitForFunction(()=>document.querySelector('#live-face').readyState>=2);};
  const reaction=async id=>{await page.getByLabel('Emotion reaction',{exact:true}).selectOption(id);await page.waitForFunction(()=>document.querySelector('#live-face').readyState>=2);};
  assert.equal(await page.locator('.grid video').count(),21);
  assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.length===new Set(ids).size;}),true);
  await page.getByRole('button',{name:'Activities · 12',exact:true}).click();
  assert.equal(await page.locator('.card:visible').count(),12);
  await page.getByRole('button',{name:'Pause all',exact:true}).click();
  for(const id of ['idle','starting','listening','thinking','researching','coding','answering','waiting','needs-input','complete','error','sleeping']){
    await activity(id);assert.equal((await state()).clip,id);
    await page.waitForFunction(()=>document.querySelector('#live-face').currentTime>.06);
    assert.equal(await page.locator('#live-face').isVisible(),true);
    if(capture){
      const peak=require('../characters/open-skeleton/manifest.json').clips.find(c=>c.id===id).peakTime;
      await page.locator('#live-face').evaluate((v,t)=>{v.pause();v.currentTime=t;},peak);
      await page.waitForFunction(()=>!document.querySelector('#live-face').seeking);
      await page.locator('.live-display').screenshot({path:require('node:path').join(capture,id+'.png')});
    }
  }
  // Reaction completes in actual browser playback and resumes the selected work.
  await activity('researching');await reaction('happy');
  assert.equal((await state()).reaction,'happy');
  await page.evaluate(()=>{const v=document.querySelector('#live-face');v.currentTime=v.duration-.12;});
  await page.waitForFunction(()=>openSkeletonPreview.getState().reaction===null);
  assert.equal((await state()).activity,'researching');assert.equal((await state()).clip,'researching');
  // Interrupt a reaction and verify its old completion cannot restore stale work.
  await reaction('surprised');await activity('sleeping');
  assert.equal((await state()).reaction,null);assert.equal((await state()).clip,'sleeping');
  await page.evaluate(()=>{const v=document.querySelector('#live-face');v.currentTime=v.duration-.12;});
  await page.waitForFunction(()=>openSkeletonPreview.getState().settled);
  assert.equal(await page.locator('#live-still').isVisible(),true);
  assert.match(await page.locator('#live-still').getAttribute('src'),/sleeping-rest/);
  // Success/startup settle into idle without changing the recorded event label.
  for(const id of ['starting','complete']){await activity(id);await page.evaluate(()=>{const v=document.querySelector('#live-face');v.currentTime=v.duration-.12;});await page.waitForFunction(()=>openSkeletonPreview.getState().clip==='idle');assert.equal((await state()).activity,id);}
  for(const [id,clip] of Object.entries({'working':'coding','checking':'coding','approval':'needs-input','offline':'waiting','reconnecting':'waiting','permission-denied':'error','paused':'waiting','cancelled':'waiting','partial':'needs-input'})){
    await activity(id);assert.equal((await state()).clip,clip);
    assert.equal((await state()).activity,id);
    if(['offline','reconnecting','permission-denied','paused','cancelled','partial'].includes(id)){assert.equal((await state()).settled,true);assert.equal(await page.locator('#live-still').isVisible(),true);}
  }
  await activity('coding');await page.getByRole('button',{name:'Pause character',exact:true}).click();
  const paused=(await state()).time;await page.waitForTimeout(160);assert.equal((await state()).time,paused);
  await page.getByRole('button',{name:'Play character',exact:true}).click();await page.waitForFunction(t=>openSkeletonPreview.getState().time>t,paused);
  // Every emotion is selectable; neutral is a return command, not a tenth clip.
  for(const id of ['happy','curious','surprised','confused','concerned','frustrated','playful','proud','relieved']){await reaction(id);assert.equal((await state()).reaction,id);}
  await reaction('neutral');assert.equal((await state()).clip,'coding');
  if(capture)await page.screenshot({path:require('node:path').join(capture,'desktop.png')});
  // Live preference change and fresh load must both remain still.
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!openSkeletonPreview.getState().playing);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].every(v=>v.paused)),true);
  await activity('sleeping');assert.equal(await page.locator('#live-still').isVisible(),true);
  await reaction('happy');assert.match(await page.locator('#live-still').getAttribute('src'),/happy\/03\.png/);
  assert.equal((await state()).paused,true);
  await page.reload();await page.waitForFunction(()=>window.openSkeletonPreview);
  assert.equal((await state()).playing,false);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].every(v=>v.paused)),true);
  await page.setViewportSize({width:320,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(capture)await page.screenshot({path:require('node:path').join(capture,'mobile.png'),fullPage:true});
  assert.equal(await page.locator('#media-error').textContent(),'');
  assert.equal(await page.evaluate(()=>openSkeletonPreview.setActivity('waking')),true);
  assert.equal(await page.getByLabel('Activity or condition',{exact:true}).inputValue(),'starting');
  assert.equal(await page.evaluate(()=>openSkeletonPreview.setActivity('toString')),false);
  assert.equal(await page.evaluate(()=>openSkeletonPreview.react('not-an-emotion')),false);
};
