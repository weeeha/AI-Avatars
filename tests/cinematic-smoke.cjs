const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');

module.exports=async(page,origin)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const url=origin+'/characters/cinematic-faces/index.html';
  await page.goto(url);
  const root=page.locator('#superclock-cinematic-faces');
  const hash=async()=>createHash('sha256').update(await page.locator('section:not([hidden]) canvas').evaluate(c=>c.toDataURL())).digest('hex');
  assert.equal(await page.locator('#cinema-pause').textContent(),'Play motion');
  for(const character of ['eidolon','lens']){
    await page.selectOption('#cinema-character',character);
    await page.selectOption('#cinema-state','idle');
    assert.equal(await root.getAttribute('data-character'),character);
    assert.equal(await page.locator('#cinema-scatter-slot').isVisible(),character==='eidolon');
    const hashes=new Set();
    for(const emotion of ['calm','happy','curious','focused','surprised','worried','sad','annoyed','playful','sleepy','confused']){
      await page.selectOption('#cinema-emotion',emotion);hashes.add(await hash());
    }
    assert.equal(hashes.size,11,character+' emotions should render differently');
    for(const activity of ['idle','waking','listening','thinking','speaking','searching','remembering','success','error','sleeping']){
      await page.selectOption('#cinema-state',activity);assert.equal(await root.getAttribute('data-state'),activity);
    }
  }
  await page.selectOption('#cinema-character','eidolon');
  await page.selectOption('#cinema-state','idle');await page.selectOption('#cinema-emotion','focused');
  await page.click('#cinema-pause');const moving=await hash();await page.waitForTimeout(400);assert.notEqual(await hash(),moving);
  await page.selectOption('#cinema-reaction','wink');await page.click('#cinema-react');
  assert.equal(await root.getAttribute('data-reaction'),'wink');
  await page.waitForFunction(()=>document.querySelector('#superclock-cinematic-faces').dataset.reaction==='none');
  await page.click('#cinema-pause');const paused=await hash();await page.waitForTimeout(150);assert.equal(await hash(),paused);
  await page.selectOption('#cinema-character','lens');await page.selectOption('#cinema-emotion','curious');await page.reload();
  assert.equal(await page.locator('#cinema-character').inputValue(),'lens');
  assert.equal(await page.locator('#cinema-emotion').inputValue(),'curious');
  await page.goto(url+'?character=eidolon');assert.equal(await page.locator('#cinema-character').inputValue(),'eidolon');
  await page.setViewportSize({width:320,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
};
