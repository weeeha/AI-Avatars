#!/usr/bin/env python3
"""Extract registered performance textures and feature anchors from existing art.
Local, deterministic processing only. The original artwork and exports are untouched.
"""
import json
from itertools import combinations
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
FAMILY=ROOT/'characters/shape-cast'
data=json.loads((ROOT/'studies/shape-cast.states.json').read_text())
SIZE=384

def components(mask):
    seen=set(); groups=[]
    for y,x in zip(*np.where(mask)):
        if (int(x),int(y)) in seen: continue
        stack=[(int(x),int(y))];seen.add(stack[0]); group=[]
        while stack:
            a,b=stack.pop();group.append((a,b))
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                q=(a+dx,b+dy)
                if 0<=q[0]<SIZE and 0<=q[1]<SIZE and q not in seen and mask[q[1],q[0]]:
                    seen.add(q);stack.append(q)
        if len(group)>20:
            pts=np.array(group);lo=pts.min(axis=0);hi=pts.max(axis=0)
            groups.append({'xy':pts.mean(axis=0)/SIZE,'center':(lo+hi)/2/SIZE,'size':(hi-lo+1)/SIZE,'area':len(group),'pixels':pts})
    return groups

report=[]
for char in data['characters']:
    source=Image.open(FAMILY/'states'/f"{char['id']}.png").convert('RGB')
    w,h=source.size
    original=np.asarray(source); chroma=(original.max(2)-original.min(2)>55)&(original.max(2)>90)
    spans=[];start=None
    for y,v in enumerate(chroma.sum(1)):
        if v>5 and start is None:start=y
        if v<=5 and start is not None:spans.append((start,y));start=None
    if len(spans)!=4:raise ValueError(f'{char["id"]}: expected four artwork rows')
    row_boxes=[]
    white=((original.min(2)>110)&((original.max(2)-original.min(2))<35)).sum(1)
    for top,bottom in spans:
        label=next((y for y in range(bottom+30,min(h,bottom+95)) if white[y]>45),bottom+55)
        row_boxes.append((max(0,top-12),label-5))
    atlas=Image.new('RGB',(SIZE*4,SIZE*4),(10,10,10)); rig={}
    for state in data['states']:
        row,col=state['row'],state['column']
        tile=source.crop((round(col*w/4),row_boxes[row][0],round((col+1)*w/4),row_boxes[row][1]))
        tile=tile.resize((344,round(tile.height*344/tile.width)),Image.Resampling.LANCZOS)
        pose=Image.new('RGB',(SIZE,SIZE),(10,10,10));pose.paste(tile,((SIZE-tile.width)//2,round(SIZE*.87)-tile.height))
        pixels=np.asarray(pose).copy(); dark=pixels.max(2)<25; pixels[dark]=10
        # Contact-sheet drawings occasionally cross a cell edge. Remove only small
        # disconnected edge fragments; never remove the central character component.
        for blob in components(pixels.max(2)>32):
            if blob['area']<1600 and (blob['xy'][0]<.12 or blob['xy'][0]>.88):
                pts=blob['pixels'];pixels[pts[:,1],pts[:,0]]=10
        pose=Image.fromarray(pixels)
        arr=np.asarray(pose).astype(float); mx=arr.max(2);mn=arr.min(2)
        yy,xx=np.indices(mx.shape)
        blobs=components((mn>140)&((mx-mn)<68)&(yy<SIZE*.77))
        eyes=[b for b in blobs if .30<b['xy'][0]<.69 and .22<b['xy'][1]<.56 and b['area']<1450]
        pairs=[sorted(pair,key=lambda b:b['xy'][0]) for pair in combinations(eyes,2) if abs(pair[0]['xy'][0]-pair[1]['xy'][0])>.09]
        def eye_score(pair):
            a,b=[p['xy'] for p in pair];mid=(a+b)/2
            return abs(a[1]-b[1])*4+abs(b[0]-a[0]-.17)*.8+abs(mid[0]-.49)+abs(mid[1]-.41)*.5
        eyes=min(pairs,key=eye_score) if pairs else []
        eye_centers=[b['xy'].tolist() for b in eyes] if len(eyes)==2 else [[.425,.365],[.575,.365]]
        # Large white components are gloves; prefer outer components to sclera.
        hands=[b for b in blobs if not any(b is e for e in eyes)]
        hands=sorted(hands,key=lambda b:b['area'],reverse=True)[:2]
        hands=sorted(hands,key=lambda b:b['xy'][0])
        hand_centers=[b['xy'].tolist() for b in hands] if len(hands)==2 else [[.24,.56],[.76,.56]]
        eye_mid=np.mean(np.array(eye_centers),axis=0)
        mouths=components((mx<75)&(yy>SIZE*(eye_mid[1]+.045))&(yy<SIZE*(eye_mid[1]+.19))&(xx>SIZE*.36)&(xx<SIZE*.64))
        mouth=max(mouths,key=lambda b:b['area']) if mouths else {'xy':eye_mid+[0,.105],'size':np.array([.09,.055])}
        rig[state['id']]={'mouth':mouth.get('center',mouth['xy']).tolist(),'mouthSize':mouth['size'].tolist(),'eyes':eye_centers,'hands':hand_centers,'eyeSizes':[b['size'].tolist() for b in eyes] if len(eyes)==2 else [[.08,.08],[.08,.08]],'rect':[col/4,row/4,.25,.25]}
        atlas.paste(pose,(col*SIZE,row*SIZE))
    out=FAMILY/'performances'/char['id'];out.mkdir(parents=True,exist_ok=True)
    atlas.save(out/'atlas.webp',quality=95,method=6)
    (out/'rig.json').write_text(json.dumps(rig,indent=2)+'\n')
    report.append({'character':char['id'],'poses':len(rig),'method':'registered source-art texture and local feature deformation'})
print(json.dumps(report,indent=2))
