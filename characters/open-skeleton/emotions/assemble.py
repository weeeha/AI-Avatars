"""Extract generated emotion art into playable reaction loops."""
from pathlib import Path
import shutil
import json, subprocess, hashlib
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
FFMPEG=shutil.which('ffmpeg')
if not FFMPEG: raise SystemExit('Install ffmpeg to rebuild animation files.')
JOBS=json.loads((ROOT/'prompts.json').read_text())
PHASES={
 'happy':[.64,.16,.20,.32,.60,.24,.20,.84],
 'curious':[.60,.20,.28,.40,.76,.28,.24,.84],
 'surprised':[.72,.08,.12,.16,.40,.20,.24,1.08],
 'confused':[.60,.24,.28,.36,.72,.28,.24,.88],
 'concerned':[.60,.24,.28,.36,.88,.28,.24,.92],
 'frustrated':[.60,.16,.20,.28,.72,.24,.24,.96],
 'playful':[.60,.12,.16,.20,.36,.16,.20,1.20],
 'proud':[.60,.24,.28,.40,.72,.28,.24,.84],
 'relieved':[.64,.24,.32,.40,.72,.32,.28,1.08],
}
FIXED_HEAD={'happy','surprised','frustrated'}
def run(*args):
 subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

report={'method':'Generated eight-pose sheets, shared-scale extraction, timed keyframe playback. No drawn replacement features or synthetic in-between frames.','states':{}}
manifest=[]
for job in JOBS:
 state=job['id'];source=ROOT/'sources'/f'{state}.png'
 pix=np.asarray(Image.open(source).convert('RGB'));h,w=pix.shape[:2];size=min(w//4,h//2)
 target=ROOT/'frames'/state;target.mkdir(parents=True,exist_ok=True)
 cells=[]
 for i in range(8):
  x,y=round((i%4)*w/4),round((i//4)*h/2)
  cell=pix[y:y+size,x:x+size];yy,xx=np.where(cell.max(axis=2)>40)
  if min(xx.min(),yy.min(),size-1-xx.max(),size-1-yy.max())<8:raise ValueError(f'{state} frame {i} needs more border clearance')
  topy,topx=np.where(cell[:int(size*.4)].max(axis=2)>40)
  radial=np.sqrt((xx-(size-1)/2)**2+(yy-(size-1)/2)**2).max()/(size/2)
  cells.append({'x':x,'y':y,'top':int(topy.min()),'center':float((topx.min()+topx.max())/2),'radialExtent':float(radial)})
 anchor=cells[0];frame_report=[]
 for i,c in enumerate(cells):
  dx=round(c['center']-anchor['center']) if state in FIXED_HEAD else 0
  dy=c['top']-anchor['top'] if state in FIXED_HEAD else 0
  x,y=c['x']+dx,c['y']+dy
  frame=target/f'{i:02d}.png'
  # Padding permits tiny registration corrections at outer sheet boundaries.
  run('-i',source,'-vf',f'pad=iw+32:ih+32:16:16:black,crop={size}:{size}:{x+16}:{y+16},scale=512:512:flags=lanczos','-frames:v',1,frame)
  frame_report.append({'frame':i,'crop':[x,y,size,size],'translation':[-dx,-dy],'radialExtent':c['radialExtent']})
 durations=PHASES[state];indices=[0,1,2,3,4,5,6,0]
 lines=['ffconcat version 1.0']
 for i,duration in zip(indices,durations):lines.extend([f"file 'frames/{state}/{i:02d}.png'",f'duration {duration:.4f}'])
 lines.append(f"file 'frames/{state}/00.png'")
 concat=ROOT/f'{state}.ffconcat';concat.write_text('\n'.join(lines)+'\n')
 duration=sum(durations)
 run('-safe',0,'-f','concat','-i',concat,'-vf','fps=25','-t',duration,'-c:v','libx264','-crf',17,'-pix_fmt','yuv420p','-movflags','+faststart',ROOT/f'{state}.mp4')
 run('-i',ROOT/f'{state}.mp4','-filter_complex','[0:v]fps=25,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop',0,ROOT/f'{state}.gif')
 peak=sum(durations[:3])+.08
 item={k:job[k] for k in ['id','label','description']}
 item.update({'group':'emotion','file':f'emotions/{state}.mp4','gif':f'emotions/{state}.gif','poster':f'emotions/frames/{state}/00.png','duration':round(duration,2),'peakTime':round(peak,2),'defaultLoop':False,'status':'ready'})
 manifest.append(item)
 report['states'][state]={'duration':duration,'frames':frame_report,'timeline':list(zip(indices,durations)),'sha256':hashlib.sha256((ROOT/f'{state}.mp4').read_bytes()).hexdigest()}
 print(f'{state}: {duration:.2f}s',flush=True)

# A compact moving overview, preserving every generated head intact.
args=[];filters=[]
for i,item in enumerate(manifest):
 args+=['-stream_loop','-1','-i',ROOT/f'{item["id"]}.mp4']
 filters.append(f'[{i}:v]scale=240:240[v{i}]')
layout='|'.join(f'{(i%3)*240}_{(i//3)*240}' for i in range(9))
filters.append(''.join(f'[v{i}]' for i in range(9))+f'xstack=inputs=9:layout={layout}:fill=black,setsar=1[out]')
run(*args,'-filter_complex',';'.join(filters),'-map','[out]','-t',6,'-c:v','libx264','-crf',19,'-pix_fmt','yuv420p','-movflags','+faststart',ROOT/'all-emotions.mp4')
run('-i',ROOT/'all-emotions.mp4','-filter_complex','[0:v]fps=20,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a','-loop',0,ROOT/'all-emotions.gif')
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'assembly-report.json').write_text(json.dumps(report,indent=2)+'\n')
