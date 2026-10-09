import fs from 'node:fs/promises';
import path from 'node:path';

// Validate the complete gallery graph, including artwork that a successful canvas
// render or script syntax check would not reveal as missing.
export async function checkLocalLinks(root,catalog){
  const origin='http://gallery.local';
  let references=0;
  const pages=['index.html',...catalog.map(study=>study.output+'.html')];
  for(const page of pages){
    const html=await fs.readFile(path.join(root,page),'utf8');
    for(const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)){
      const address=new URL(match[1],origin+'/'+page);
      if(address.origin!==origin)continue;
      const local=path.resolve(root,decodeURIComponent(address.pathname).slice(1));
      if(local!==root&&!local.startsWith(root+path.sep))throw Error('Reference escapes gallery: '+page+' → '+match[1]);
      try{await fs.access(local);}catch{throw Error('Missing local reference: '+page+' → '+match[1]);}
      references++;
    }
  }
  const gallery=await fs.readFile(path.join(root,'index.html'),'utf8');
  const links=[...gallery.matchAll(/<a\b[^>]*class=["'][^"']*\bstudy-link\b[^"']*["'][^>]*>/g)].map(match=>new URL(match[0].match(/href=["']([^"']+)["']/)[1],origin));
  const expected=catalog.reduce((n,s)=>n+(s.characters?.length||1),0);
  if(links.length!==expected)throw Error(`Gallery has ${links.length} entries; catalog requires ${expected}`);
  for(const study of catalog){
    const matches=links.filter(link=>link.pathname==='/'+study.output+'.html');
    if(matches.length!==(study.characters?.length||1))throw Error('Gallery coverage mismatch: '+study.id);
    if(study.characters?.length>1)for(const character of study.characters){
      const count=matches.filter(link=>(link.searchParams.get('character')||link.hash.slice(1))===character.id).length;
      if(count!==1)throw Error('Missing or repeated character link: '+character.id);
    }
  }
  console.log(`Verified ${expected} gallery entries and ${references} local page references.`);
}
