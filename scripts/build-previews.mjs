import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape=(s)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export async function build({check=false}={}){
  const catalog=JSON.parse(await fs.readFile(path.join(root,'catalog.json'),'utf8'));
  for(const study of catalog){
    const fragment=await fs.readFile(path.join(root,study.source),'utf8');
    const styles=[...fragment.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1].trim());
    const scripts=[...fragment.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1].trim());
    if(styles.length!==1||scripts.length!==1)throw Error('Expected one style and script in '+study.source);
    const markup=fragment.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<script>[\s\S]*?<\/script>/g,'').trim();
    const name=path.basename(study.output);
    const script=scripts[0].replaceAll('window.openai','window.avatarState').replaceAll('openai:set_globals','avatar:set_globals');
    const html=`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escape(study.title)} · AI Avatars</title><link rel="stylesheet" href="../../assets/preview.css"><link rel="stylesheet" href="${name}.css"></head>
<body><main class="page"><nav class="page-nav" aria-label="Gallery navigation"><a href="../../index.html">← AI Avatars</a><span class="page-title">${escape(study.title)}</span></nav>
${markup}
</main><script src="../../assets/preview-state.js"></script><script src="${name}.js"></script></body></html>
`;
    for(const [ext,content]of Object.entries({html,css:styles[0]+'\n',js:script+'\n'})){
      const target=path.join(root,study.output+'.'+ext);
      if(check){if(await fs.readFile(target,'utf8')!==content)throw Error('Generated file is stale: '+path.relative(root,target));}
      else{await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content);}
    }
  }
  return catalog;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const catalog=await build();console.log(`Built ${catalog.length} standalone studies.`);}
