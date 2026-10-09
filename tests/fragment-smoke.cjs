const assert=require('node:assert/strict');
const {mkdir,writeFile}=require('node:fs/promises');
const {createHash}=require('node:crypto');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
module.exports=async function verifyFragmentFaces(page,origin){
  const output=pathToFileURL(path.join(__dirname,'../test-results/fragment-faces/'));
  await mkdir(output,{recursive:true});
  await page.setViewportSize({width:1000,height:1050});
  await page.emulateMedia({reducedMotion:'no-preference',colorScheme:'light'});
  const errors = [];
  const networkErrors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`); });
  const url=origin+'/characters/fragment-faces/index.html';
  await page.goto(url);
  await page.waitForFunction(() => window.avatarPreview?.getState().ready);
  const state = () => page.evaluate(() => avatarPreview.getState());
  assert.equal((await state()).voice, null, 'Audio must not autoplay');
  await page.evaluate(() => {
    avatarPreview.setPaused(true); avatarPreview.setMode('idle'); avatarPreview.setEmotion('neutral');
    for (let i = 0; i < 4; i++) avatarPreview.seek(.5);
  });

  // Compare the same frame at opposing pointer positions, isolating gaze motion.
  const face = await page.locator('.fragment-face').first().boundingBox();
  async function aim(x, y) {
    await page.mouse.move(face.x + face.width * x, face.y + face.height * y);
    await page.evaluate(() => { for (let i = 0; i < 3; i++) avatarPreview.seek(.5); });
  }
  await aim(.04, .5);
  await page.evaluate(() => {
    window.gazeBaseline = [...document.querySelectorAll('canvas')].map(canvas => {
      const gl = canvas.getContext('webgl'), pixels = new Uint8Array(640 * 640 * 4);
      gl.readPixels(0, 0, 640, 640, gl.RGBA, gl.UNSIGNED_BYTE, pixels); return pixels;
    });
  });
  await aim(.96, .5);
  const gaze = await page.evaluate(() => [...document.querySelectorAll('canvas')].map((canvas, index) => {
    const gl = canvas.getContext('webgl'), pixels = new Uint8Array(640 * 640 * 4);
    gl.readPixels(0, 0, 640, 640, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const origin = index ? 598 : 24;
    const eyes = index ? [[887, 245], [740, 383], [1039, 391]] : [[200, 307], [433, 354]];
    let outside = 0; const inside = eyes.map(() => 0);
    for (let y = 0; y < 640; y++) for (let x = 0; x < 640; x++) {
      const n = (y * 640 + x) * 4;
      const delta = [0, 1, 2].reduce((sum, c) => sum + Math.abs(pixels[n + c] - gazeBaseline[index][n + c]), 0);
      if (delta < 3) continue;
      const px = origin + x / 640 * 574, py = 123 + (639 - y) / 640 * 574;
      const eye = eyes.findIndex(([ex, ey]) => Math.abs(px - ex) < 105 && Math.abs(py - ey) < 70);
      if (eye < 0) outside++; else inside[eye]++;
    }
    return { inside, outside };
  }));
  assert.ok(gaze.every(face => face.inside.every(n => n > 100)), 'All five pupils must move');
  assert.ok(gaze.every(face => face.outside === 0), 'Gaze must leave the surrounding artwork fixed');
  await aim(.5, .5);
  await page.screenshot({ path: new URL('desktop.png', output).pathname });
  await page.mouse.move(0, 0);

  const distinctGazes = value => new Set(value.eyeGazes.flat().map(eye => `${eye.x.toFixed(2)},${eye.y.toFixed(2)}`)).size;
  const gazeModes = {};
  for (const [gazeMode, status, emotion, expected] of [
    ['together', 'thinking', 'neutral', 1],
    ['independent', 'idle', 'neutral', 5],
    ['auto', 'thinking', 'neutral', 5],
    ['auto', 'searching', 'neutral', 5],
    ['auto', 'idle', 'playful', 5],
    ['auto', 'listening', 'neutral', 1],
  ]) {
    await page.evaluate(({gazeMode,status,emotion}) => {
      avatarPreview.setMode(status);avatarPreview.setEmotion(emotion);avatarPreview.setGazeMode(gazeMode);
      for(let i=0;i<4;i++)avatarPreview.seek(2.2);
    }, {gazeMode,status,emotion});
    const value = await state();
    assert.equal(distinctGazes(value), expected, `${gazeMode}/${status}/${emotion} must use the intended gaze pattern`);
    assert.ok(value.eyeGazes.flat().every(eye => Math.abs(eye.x)<=23.001&&Math.abs(eye.y)<=14.001));
    gazeModes[`${gazeMode}/${status}/${emotion}`] = distinctGazes(value);
    if(gazeMode==='independent') {
      await page.locator('.fragment-stage').screenshot({path:new URL('independent-gaze.png',output).pathname});
      const images=await page.evaluate(()=>avatarPreview.capture());
      for(let i=0;i<images.length;i++)await writeFile(new URL(`detailed-eyes-${i}.png`,output),Buffer.from(images[i].split(',')[1],'base64'));
    }
  }
  await page.evaluate(()=>{avatarPreview.setGazeMode('auto');avatarPreview.setMode('idle');avatarPreview.setEmotion('neutral');});

  const emotions = await page.locator('#fragment-emotion option').evaluateAll(nodes => nodes.map(n => n.value).filter(v => v !== 'auto'));
  const expressionHashes = [];
  for (const emotion of emotions) {
    await page.selectOption('#fragment-emotion', emotion);
    await page.evaluate(() => avatarPreview.seek(.4));
    const captures = await page.evaluate(() => avatarPreview.capture());
    expressionHashes.push(captures.map(image => createHash('sha256').update(image).digest('hex')));
  }
  for (let i = 0; i < 2; i++) assert.equal(new Set(expressionHashes.map(h => h[i])).size, 10, 'Each character must have ten distinct expressions');

  await page.selectOption('#fragment-emotion', 'auto');
  const statuses = await page.locator('#fragment-mode option').evaluateAll(nodes => nodes.map(n => n.value));
  for (const mode of statuses) {
    await page.selectOption('#fragment-mode', mode);
    await page.evaluate(() => avatarPreview.seek(10.2));
    if (mode !== 'demo') assert.equal((await state()).active, mode);
  }
  await page.selectOption('#fragment-mode', 'listening');
  await page.selectOption('#fragment-emotion', 'curious');
  for (const reaction of ['wink', 'got-it', 'no', 'startled', 'laugh', 'blink']) {
    await page.evaluate(() => avatarPreview.seek(20));
    await page.click(`[data-reaction="${reaction}"]`);
    await page.evaluate(() => { avatarPreview.setPaused(true); avatarPreview.seek(20.3); });
    assert.equal((await state()).reaction, reaction);
    await page.evaluate(() => avatarPreview.seek(24));
    const restored = await state();
    assert.equal(restored.reaction, null);
    assert.equal(restored.mode, 'listening'); assert.equal(restored.emotion, 'curious');
  }
  const pausedTime = (await state()).time;
  await page.waitForTimeout(160);
  assert.equal((await state()).time, pausedTime);
  await page.click('#fragment-pause');
  await page.waitForTimeout(200);
  assert.ok((await state()).time > pausedTime);

  // Included audio is deterministic and must work without any installed voice.
  await page.selectOption('#fragment-mode', 'thinking');
  await page.selectOption('#fragment-emotion', 'happy');
  await page.click('#fragment-talk');
  await page.waitForFunction(() => avatarPreview.getState().voice?.playing);
  const samples = [];
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(110); samples.push((await state()).voice); }
  assert.ok(samples.some(s => s.audioTime > 0));
  assert.ok(new Set(samples.map(s => s.mouth.toFixed(1))).size > 3, 'Mouth must follow the audio');
  await page.screenshot({ path: new URL('talking.png', output).pathname });
  await page.click('#fragment-pause');
  const pausedAudio = (await state()).voice.audioTime;
  await page.waitForTimeout(220);
  assert.ok(Math.abs((await state()).voice.audioTime - pausedAudio) < .05);
  assert.equal((await state()).voice.playing, false);
  await page.click('#fragment-pause');
  await page.waitForFunction(() => !avatarPreview.getState().voice, null, { timeout: 12000 });
  assert.equal((await state()).mode, 'thinking'); assert.equal((await state()).emotion, 'happy');
  await page.click('#fragment-talk');
  await page.waitForFunction(() => avatarPreview.getState().voice?.playing);
  await page.click('#fragment-stop');
  assert.equal((await state()).voice, null); assert.equal((await state()).mode, 'thinking');

  await page.fill('#fragment-say', 'Hello. This is a custom voice check.');
  await page.click('#fragment-talk');
  await page.waitForTimeout(600);
  const custom = await state();
  const customVoice = { available: custom.localVoices, started: custom.voice?.started || false, message: await page.locator('#fragment-voice-note').textContent() };
  if (custom.voice) await page.click('#fragment-stop');
  await page.click('#fragment-demo');
  await page.waitForFunction(() => avatarPreview.getState().voice?.playing);
  assert.equal((await state()).voice.source, 'demo');
  await page.click('#fragment-stop');

  await page.selectOption('#fragment-mode', 'idle');
  await page.selectOption('#fragment-emotion', 'neutral');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: new URL('dark.png', output).pathname });
  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 1500 });
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.equal(layout.scroll, layout.width, `No horizontal overflow at ${width}px`);
  }
  await page.screenshot({ path: new URL('mobile.png', output).pathname });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  assert.equal((await state()).paused, true);
  await page.selectOption('#fragment-mode', 'thinking');
  await page.selectOption('#fragment-emotion', 'skeptical');
  await page.reload();
  await page.waitForFunction(() => window.avatarPreview?.getState().ready);
  const restored = await state();
  assert.equal(restored.mode, 'thinking'); assert.equal(restored.emotion, 'skeptical'); assert.equal(restored.paused, true);
  assert.equal(await page.locator('#fragment-error').textContent(), '');
  assert.deepEqual(errors, []); assert.deepEqual(networkErrors, []);

  const report = { passed: true, gaze, gazeModes, distinctExpressions: 10, statuses: statuses.length - 1, reactions: 6, speech: { demoPlayback: true, mouthTracksAudio: true, pauseResume: true, stopAndEndRestoreState: true, customVoice }, mobileWidths: [360, 320], reducedMotion: true, preferenceRestoration: true, errors, networkErrors };
  await writeFile(new URL('verification.json', output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
};
