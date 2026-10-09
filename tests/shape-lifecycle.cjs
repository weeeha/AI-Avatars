const assert=require('node:assert/strict');
module.exports=async(page,base)=>{
  const failures=[];
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(base+'/characters/shape-cast/index.html');
  await page.waitForFunction(()=>window.shapeCastPreview?.getState().ready);
  await page.getByRole('button',{name:'Pause animation',exact:true}).click();
  await page.evaluate(()=>{shapeCastPreview.setActivity('idle');shapeCastPreview.seek(0)});
  const rendered=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const pixels=()=>page.locator('#shape-canvas').evaluate(c=>c.toDataURL());
  await rendered();const idle=await pixels();
  await page.getByLabel('Activity',{exact:true}).selectOption('sleeping');await rendered();
  const sleeping=await pixels();
  if(sleeping===idle)failures.push('Paused selection must immediately replace idle with the selected sleeping artwork.');
  assert.equal(await page.evaluate(()=>shapeCastPreview.getState().paused),true);
  assert.equal(await page.evaluate(()=>shapeCastPreview.getState().time),0);
  await page.waitForTimeout(100);assert.equal(await pixels(),sleeping,'Selected sleeping pose stays still while paused');
  await page.getByLabel('Activity',{exact:true}).selectOption('idle');await page.evaluate(()=>shapeCastPreview.selectCharacter('triangle'));await rendered();const nextIdle=await pixels();
  await page.getByRole('button',{name:'Curious',exact:true}).click();await rendered();
  if(await pixels()===nextIdle)failures.push('Paused reaction selection must immediately show its selected artwork.');

  // Use real playback to ensure the base clock keeps advancing during the reaction.
  await page.goto(base+'/characters/shape-cast/index.html');
  await page.waitForFunction(()=>shapeCastPreview.getState().ready);
  await page.evaluate(()=>{shapeCastPreview.setActivity('starting');shapeCastPreview.seek(3)});await rendered();
  const before=await page.evaluate(()=>shapeCastPreview.getState());
  assert.equal(before.phase,'settled');
  await page.getByRole('button',{name:'Curious',exact:true}).click();
  await page.waitForFunction(()=>shapeCastPreview.getState().expression===null,{},{timeout:6000});
  const after=await page.evaluate(()=>shapeCastPreview.getState());
  if(after.time<before.time+2.5)failures.push(`Reaction return must preserve advancing activity age: ${before.time} -> ${after.time}.`);
  if(after.phase!=='settled'||after.channels.blink.some(v=>v!==0))failures.push('Settled starting must stay settled after a reaction, without replaying startup or eye closure.');
  assert.equal(after.activity,'starting');
  await page.evaluate(()=>{shapeCastPreview.setActivity('starting');shapeCastPreview.seek(3)});await rendered();
  await page.getByRole('button',{name:'Pause animation',exact:true}).click();const savedAge=await page.evaluate(()=>shapeCastPreview.getState().time);
  await page.evaluate(()=>shapeCastPreview.selectCharacter('circle'));await rendered();const switched=await page.evaluate(()=>shapeCastPreview.getState());
  if(switched.time!==savedAge||switched.phase!=='settled'||switched.channels.blink.some(v=>v!==0))failures.push('Changing characters while paused must preserve the settled current activity age.');
  // A near-finished reaction must not restart when the artwork is changed.
  await page.evaluate(()=>{shapeCastPreview.react('curious');shapeCastPreview.seek(2.3)});
  await page.evaluate(()=>shapeCastPreview.selectCharacter('heart'));await rendered();
  await page.getByRole('button',{name:'Play animation',exact:true}).click();
  try{await page.waitForFunction(()=>shapeCastPreview.getState().expression===null,{},{timeout:1200});}catch{failures.push('Changing characters must preserve reaction age instead of replaying the reaction.');}
  assert.deepEqual(failures,[]);
  console.log('PASS: paused activity/reaction selection shows the chosen still pose; reaction completion and character changes preserve activity/reaction ages.');
};
if(require.main===module){
  const {chromium}=require('playwright'),{spawn}=require('node:child_process');
  (async()=>{const port=process.env.AVATAR_TEST_PORT||'44201',base=`http://127.0.0.1:${port}`;const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});let browser;
    try{await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited: '+code)))});browser=await chromium.launch({headless:true});await module.exports(await browser.newPage(),base);}finally{await browser?.close();server.kill();}
  })().catch(e=>{console.error(e);process.exitCode=1;});
}
