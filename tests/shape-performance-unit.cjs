const assert=require('node:assert/strict');
const {pose,durations}=require('../assets/shape-performance.js');
const data=require('../studies/shape-cast.states.json');
for(const c of data.characters){
  const signatures=[];
  for(const s of data.states){
    const a=pose(c.id,s.id,.25),b=pose(c.id,s.id,.9);
    assert.notDeepEqual(a,b,`${c.id} ${s.id} must animate its own channels`);
    const later=pose(c.id,s.id,2.8);
    const featureMotion=[...a.eyes,...a.hands,...a.blink,...b.eyes,...b.hands,...b.blink,...later.blink].some(v=>Math.abs(v)>.0001);
    assert(featureMotion,`${s.id} moves features or limbs, not just the whole body`);
    const still=pose(c.id,s.id,.9,{still:true});
    for(const key of ['eyes','hands','blink','turn','body'])assert(still[key].every(v=>v===0),`${s.id} reduced motion`);
    signatures.push(JSON.stringify([a.eyes,a.hands,a.blink,b.eyes,b.hands,b.blink]));
  }
  assert.equal(new Set(signatures).size,16,`${c.id} has distinct performances`);
  for(const state of ['needs-input','error','waiting','paused','offline','partial','awaiting-approval','cancelled']){
    const a=pose(c.id,state,4),b=pose(c.id,state,12);
    assert.deepEqual(a,b,`${state} settles without endless prompting`);
  }
}
for(const state of ['coding','checking'])assert.deepEqual(pose('triangle',state,.85),pose('triangle','working',.85),`${state} uses the working motion, not only its artwork`);
for(const [state,d]of Object.entries(durations)){assert(!pose('triangle',state,d-.1).done);assert(pose('triangle',state,d).done);}
console.log('PASS: 128 distinct motion profiles, feature/limb channels, reaction endings and settled conditions.');
