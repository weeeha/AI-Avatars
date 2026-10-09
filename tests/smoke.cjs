const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
const fs=require('node:fs');
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
    await require('./lens-states-smoke.cjs')(page,origin);
    await page.emulateMedia({reducedMotion:'reduce'});
    await require('./cinematic-smoke.cjs')(page,origin);
    await require('./cinematic-state-smoke.cjs')(page,origin);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(origin+'/characters/oracle/');await page.waitForSelector('#oracle-canvas[data-ready="true"]');
    await page.getByRole('button',{name:'Pause',exact:true}).click();
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'characters/oracle/character.json'),'utf8'));
    const frames=new Set();
    for(const {id} of manifest.states.slice(0,14)){
      await page.getByLabel('Preview',{exact:true}).selectOption(id);
      await page.evaluate(()=>oraclePreview.seek(1.2));
      assert.equal(await page.evaluate(()=>oraclePreview.getState().active),id);
      assert.equal(await page.locator('#oracle-error').textContent(),'');
      frames.add(await page.evaluate(()=>oraclePreview.capture()));
    }
    assert.equal(frames.size,14);
    await page.getByLabel('Preview',{exact:true}).selectOption('resting');await page.evaluate(()=>oraclePreview.seek(1.2));
    const stars=await page.evaluate(()=>oraclePreview.capture());await page.evaluate(()=>oraclePreview.seek(1.8));assert.notEqual(await page.evaluate(()=>oraclePreview.capture()),stars);
    const frozen=await page.evaluate(()=>oraclePreview.capture());await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>oraclePreview.capture()),frozen);
    await page.getByRole('button',{name:'Next state',exact:true}).click();await page.waitForFunction(()=>oraclePreview.getState().active==='curious');
    await page.reload();await page.waitForSelector('#oracle-canvas[data-ready="true"]');assert.equal(await page.evaluate(()=>oraclePreview.getState().mode),'curious');assert.equal(await page.evaluate(()=>oraclePreview.getState().paused),true);
    await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>oraclePreview.getState().time>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('#oracle-canvas[data-ready="true"]');assert.equal(await page.evaluate(()=>oraclePreview.getState().paused),true);
    await require('./oracle-state-smoke.cjs')(page,origin);
    await require('./fragment-smoke.cjs')(page,origin);
    await require('./fragment-state-smoke.cjs')(page,origin);
    await require('./skeleton-smoke.cjs')(page,origin);
    await require('./abstract-smoke.cjs')(page,origin);
    await require('./abstract-lifecycle-smoke.cjs')(page,origin);
    await require('./shape-cast-smoke.cjs')(page,origin);
    assert.deepEqual(errors,[]);console.log('PASS: combined character gallery and all imported checks.');
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
