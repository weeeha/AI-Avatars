/** A single HTTP byte range, used by browsers to seek within local videos. */
export function byteRange(header,size){
  if(typeof header!=='string'||!Number.isSafeInteger(size)||size<=0)return null;
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);
  if(!match||(!match[1]&&!match[2]))return null;
  const first=match[1]?Number(match[1]):null,last=match[2]?Number(match[2]):null;
  if((first!==null&&!Number.isSafeInteger(first))||(last!==null&&!Number.isSafeInteger(last)))return null;
  if(first===null){if(last<=0)return null;return {start:Math.max(0,size-last),end:size-1};}
  const end=last===null?size-1:Math.min(last,size-1);
  if(first>=size||end<first)return null;
  return {start:first,end};
}
