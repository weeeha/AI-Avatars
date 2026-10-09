const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const data=require('../studies/shape-cast.states.json');
const root=path.resolve(__dirname,'..');
assert.equal(data.characters.length,8);assert.equal(data.states.length,16);
for(const c of data.characters){
 const folder=path.join(root,'characters/shape-cast');
 const rig=JSON.parse(fs.readFileSync(path.join(folder,'performances',c.id,'rig.json')));
 assert.deepEqual(Object.keys(rig).sort(),data.states.map(s=>s.id).sort());
 for(const s of data.states){const r=rig[s.id];for(const group of ['eyes','hands']){assert.equal(r[group].length,2);assert(r[group].flat().every(v=>Number.isFinite(v)&&v>=0&&v<=1));}assert(r.mouth.every(v=>v>0&&v<1));}
 assert(fs.statSync(path.join(folder,'performances',c.id,'atlas.webp')).size>10000);
 const file=path.join(folder,'animations',c.id,'idle.mp4');
 const probe=spawnSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,nb_read_frames,duration','-of','json',file],{encoding:'utf8'});
 assert.equal(probe.status,0,probe.stderr);const v=JSON.parse(probe.stdout).streams[0];assert.equal(v.width,512);assert.equal(v.height,512);assert.equal(Number(v.nb_read_frames),96);assert.equal(Number(v.duration),4);
 const decoded=spawnSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{encoding:'utf8'});assert.equal(decoded.status,0,decoded.stderr);
}
console.log('PASS: 128 local pose anchors/textures and all eight original MP4s decoded (96 frames, four seconds each).');
