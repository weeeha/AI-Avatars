const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const port=process.env.AVATAR_TEST_PORT||'4174';
const origin=`http://127.0.0.1:${port}`;
(async()=>{
  const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
  let browser;
  try{
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Preview server did not start')),5000);server.stdout.once('data',()=>{clearTimeout(timeout);resolve();});server.once('error',reject);server.once('exit',code=>{clearTimeout(timeout);reject(Error('Preview server exited: '+code));});});
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:768,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/');
    const expectedLinks=require('../catalog.json').reduce((n,s)=>n+(s.characters?.length||1),0);
    assert.equal(await page.locator('.study-link').count(),expectedLinks);
    await page.getByRole('link',{name:/Prismatic lenses/}).click();await page.waitForSelector('canvas[data-ready="true"]');
    await page.getByRole('button',{name:'Writing code',exact:true}).click();
    assert.equal(await page.evaluate(()=>prismaticPreview.getState().mode),'coding');
    await page.getByRole('button',{name:'Mint',exact:true}).click();await page.reload();await page.waitForSelector('canvas[data-ready="true"]');
    assert.equal(await page.evaluate(()=>prismaticPreview.getState().look),'mint');
    const t=await page.evaluate(()=>prismaticPreview.getState().time);await page.waitForFunction(t=>prismaticPreview.getState().time>t,t,{timeout:4000});
    await page.getByRole('button',{name:'Pause animation'}).click();const p=await page.evaluate(()=>prismaticPreview.getState().time);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>prismaticPreview.getState().time),p);
    await page.goto(origin+'/characters/prismatic-lenses/ideas.html');await page.waitForSelector('canvas[data-ready="true"]');assert.equal(await page.locator('figure').count(),10);
    await page.getByLabel('Palette',{exact:true}).selectOption('4');assert.equal(await page.evaluate(()=>motionIdeasPreview.getState().palette),4);
    await page.reload();await page.waitForSelector('canvas[data-ready="true"]');assert.equal(await page.evaluate(()=>motionIdeasPreview.getState().palette),4);
    await page.setViewportSize({width:320,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('canvas[data-ready="true"]');assert.equal(await page.evaluate(()=>motionIdeasPreview.getState().paused),true);
    await require('./cinematic-smoke.cjs')(page,origin);
    await require('./cinematic-state-smoke.cjs')(page,origin);
    assert.deepEqual(errors,[]);console.log('PASS: gallery, lens studies, both cinematic characters, expressions, playback, reactions, saved preferences, mobile layout, reduced motion.');
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
