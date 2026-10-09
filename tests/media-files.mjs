import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {byteRange} from '../scripts/byte-range.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'characters/open-skeleton');
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
assert.equal(manifest.clips.length,12);
assert.equal(manifest.clips.filter(c=>c.group==='emotion').length,9);
assert.equal(new Set(manifest.clips.map(c=>c.id)).size,12);
for(const clip of manifest.clips){
  assert.equal(clip.status,'ready');assert(clip.duration>0&&clip.peakTime<clip.duration);
  for(const key of ['file','gif','poster']){
    const file=path.resolve(base,clip[key]);assert(file.startsWith(base+path.sep));
    assert((await fs.stat(file)).size>0,`Empty ${clip[key]}`);
  }
  assert.equal((await fs.readFile(path.join(base,clip.file))).toString('ascii',4,8),'ftyp');
  assert.match((await fs.readFile(path.join(base,clip.gif))).toString('ascii',0,6),/^GIF8[79]a$/);
}
const html=await fs.readFile(path.join(base,'preview.html'),'utf8');
assert.equal([...html.matchAll(/<video\b/g)].length,12);
for(const [,ref]of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)){
  if(/^(?:https?:|data:|#)/.test(ref))continue;
  assert((await fs.stat(path.resolve(base,ref))).isFile(),`Missing ${ref}`);
}
for(const [header,size,expected]of [
  ['bytes=0-9',100,{start:0,end:9}],['bytes=90-',100,{start:90,end:99}],
  ['bytes=-10',100,{start:90,end:99}],['bytes=0-999',100,{start:0,end:99}],
  ['bytes=-999',100,{start:0,end:99}],['bytes=100-',100,null],
  ['bytes=-0',100,null],['bytes=9-0',100,null],['bytes=-',100,null],
  ['bytes=0-1,3-4',100,null],['bytes=0-',0,null],['bytes=999999999999999999-',100,null]
])assert.deepEqual(byteRange(header,size),expected,header);
console.log('Verified 12 media clips, gallery references, and video seek range handling.');
