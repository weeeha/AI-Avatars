import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {build,root} from './build-previews.mjs';
import {checkLocalLinks} from './check-links.mjs';
const catalog=await build({check:true});
for(const study of catalog){
  const file=path.join(root,study.output+'.js');
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr);
  for(const ext of ['html','css','js']){
    const text=await fs.readFile(path.join(root,study.output+'.'+ext),'utf8');
    if(/window\.openai|\/Users\/|\/var\/folders\/|plugin:\/\//.test(text))throw Error('Nonportable content in '+study.output+'.'+ext);
  }
}
await checkLocalLinks(root,catalog);
console.log(`Verified ${catalog.length} current, portable studies.`);
