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
    await require('./lens-states-smoke.cjs')(page,origin);
    await page.emulateMedia({reducedMotion:'reduce'});
    await require('./cinematic-smoke.cjs')(page,origin);
    assert.deepEqual(errors,[]);console.log('PASS: gallery, lens studies, both cinematic characters, expressions, playback, reactions, saved preferences, mobile layout, reduced motion.');
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
