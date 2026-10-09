"""Locally articulate the original Open Skeleton artwork; no generation services.

The neutral photograph and its aligned closed-lid pose are the two textures.
Compact smooth displacement fields move the eyes, eyebrow linkages and jaw
independently. Keyed nod/tilt is secondary motion, never the whole animation.
Run from any directory. Requires Pillow, numpy and ffmpeg on PATH.
"""
from pathlib import Path
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'activities'
FPS = 25
SIZE = 512
DEFAULT = dict(gaze_x=0, gaze_y=0, lid_l=0, lid_r=0, wide=0,
               brow_l=0, brow_r=0, jaw=0, nod=0, tilt=0)

# Every key is a complete pose, so omitted channels always return to neutral.
def k(t, **pose): return [t, {**DEFAULT, **pose}]

STATES = {
    'starting': dict(duration=4, peak=2.5, end='idle', keys=[
        k(0,lid_l=1,lid_r=1,nod=6), k(.55,lid_l=1,lid_r=1,nod=6),
        k(1.05,lid_l=.55,lid_r=.55,nod=3), k(1.4,lid_l=.55,lid_r=.55,nod=3),
        k(2,wide=.24,brow_l=-2,brow_r=-2), k(2.5,wide=.18,nod=4), k(3.2), k(4)]),
    'listening': dict(duration=4.8, peak=1.9, end='loop', keys=[
        k(0,wide=.3,brow_l=-2,brow_r=-2), k(.8,wide=.38,gaze_x=-2,brow_l=-3,brow_r=-3),
        k(1.5,wide=.38,gaze_x=-2,brow_l=-3,brow_r=-3), k(1.9,wide=.27,nod=5,jaw=1),
        k(2.4,wide=.3,brow_l=-2,brow_r=-2), k(3.3,wide=.3,brow_l=-2,brow_r=-2),
        k(3.44,lid_l=1,lid_r=1), k(3.62,wide=.3,brow_l=-2,brow_r=-2),
        k(4.8,wide=.3,brow_l=-2,brow_r=-2)]),
    'researching': dict(duration=5.6, peak=2.35, end='loop', keys=[
        k(0,gaze_x=-8,gaze_y=-2,brow_l=-1), k(.55,gaze_x=-8,gaze_y=-2,brow_l=-1),
        k(1.15,gaze_x=7,gaze_y=-2), k(1.55,gaze_x=7,gaze_y=-2),
        k(1.8,gaze_x=-8,gaze_y=3,nod=1), k(2.35,gaze_x=8,gaze_y=3,nod=1),
        k(2.8,gaze_x=8,gaze_y=3,nod=1), k(3.05,gaze_x=-7,gaze_y=6,nod=2),
        k(3.65,gaze_x=7,gaze_y=6,nod=2), k(4.1,gaze_x=7,gaze_y=6,nod=2),
        k(4.3,lid_l=1,lid_r=1), k(4.55), k(5.1,gaze_x=-8,gaze_y=-2,brow_l=-1),
        k(5.6,gaze_x=-8,gaze_y=-2,brow_l=-1)]),
    'coding': dict(duration=4.8, peak=1.55, end='loop', keys=[
        k(0,gaze_x=-4,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(.45,gaze_x=-4,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(.62,gaze_x=4,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(.94,gaze_x=4,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(1.08,gaze_x=-2,gaze_y=8,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(1.55,gaze_x=7,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(1.9,gaze_x=7,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(2.2,gaze_y=-3,wide=.16,brow_l=-2,brow_r=-2), k(2.8,gaze_y=-3,wide=.16,brow_l=-2,brow_r=-2),
        k(3.1,nod=5,jaw=1), k(3.45),
        k(4,gaze_x=-4,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2),
        k(4.8,gaze_x=-4,gaze_y=6,wide=-.16,brow_l=2,brow_r=2,nod=2)]),
    'waiting': dict(duration=4.8, peak=1.2, end='hold', keys=[
        k(0), k(.7,gaze_x=7,lid_l=.16,lid_r=.16), k(1.6,gaze_x=7,lid_l=.16,lid_r=.16),
        k(2.1,lid_l=1,lid_r=1,nod=1), k(2.5,lid_l=1,lid_r=1,nod=1),
        k(3.1,lid_l=.14,lid_r=.14), k(4.8,lid_l=.14,lid_r=.14)]),
    'needs-input': dict(duration=4.4, peak=2, end='hold', keys=[
        k(0), k(.6,wide=.16,brow_l=-6,brow_r=1,tilt=-3,jaw=1),
        k(1.2,wide=.22,brow_l=-6,brow_r=1,tilt=-4,jaw=1),
        k(1.5,lid_r=1,wide=.2,brow_l=-6,brow_r=1,tilt=-4,jaw=1),
        k(1.75,wide=.22,brow_l=-6,brow_r=1,tilt=-4,jaw=1),
        k(2.4,wide=.16,brow_l=-5,brow_r=1,tilt=-3,jaw=1),
        k(4.4,wide=.16,brow_l=-5,brow_r=1,tilt=-3,jaw=1)]),
    'complete': dict(duration=4, peak=1.7, end='idle', keys=[
        k(0), k(.5,wide=-.18,brow_l=-3,brow_r=-3,jaw=2,nod=-2),
        k(1,wide=-.2,brow_l=-3,brow_r=-3,jaw=2,nod=-2),
        k(1.35,wide=-.15,brow_l=-2,brow_r=-2,nod=6),
        k(1.7,wide=-.15,brow_l=-2,brow_r=-2,nod=-1),
        k(2.05,wide=-.15,brow_l=-2,brow_r=-2,nod=4),
        k(2.5,wide=-.15,brow_l=-2,brow_r=-2), k(3.3), k(4)]),
    'error': dict(duration=4.4, peak=.6, end='hold', keys=[
        k(0), k(.24,wide=.65,brow_l=-5,brow_r=-5,jaw=7,nod=-2),
        k(.65,wide=.65,brow_l=-5,brow_r=-5,jaw=7,nod=-2),
        k(1.1,wide=.12,brow_l=-3,brow_r=1,jaw=2,tilt=3),
        k(1.4,wide=.12,brow_l=-3,brow_r=1,jaw=2,tilt=-3),
        k(1.7,wide=.12,brow_l=-3,brow_r=1,jaw=2,tilt=2),
        k(2.2,wide=.15,brow_l=-3,brow_r=1), k(4.4,wide=.15,brow_l=-3,brow_r=1)]),
    'sleeping': dict(duration=4.8, peak=3.4, end='hold', keys=[
        k(0), k(.8,gaze_y=4,lid_l=.2,lid_r=.2,nod=2),
        k(1.8,lid_l=.65,lid_r=.65,nod=4), k(2.7,lid_l=1,lid_r=1,nod=7),
        k(4.8,lid_l=1,lid_r=1,nod=7)])
}

yy, xx = np.mgrid[:SIZE,:SIZE].astype(np.float32)
neutral = np.asarray(Image.open(ROOT/'frames/idle/00.png').convert('RGB'),dtype=np.float32)
closed = np.asarray(Image.open(ROOT/'frames/idle/03.png').convert('RGB'),dtype=np.float32)

def bump(cx,cy,rx,ry):
    radius = ((xx-cx)/rx)**2 + ((yy-cy)/ry)**2
    return np.maximum(0,1-radius)**2

def sample(texture,x,y):
    x=np.clip(x,0,SIZE-1.001); y=np.clip(y,0,SIZE-1.001)
    ix=x.astype(int); iy=y.astype(int); fx=(x-ix)[...,None]; fy=(y-iy)[...,None]
    return ((texture[iy,ix]*(1-fx)+texture[iy,ix+1]*fx)*(1-fy)
          +(texture[iy+1,ix]*(1-fx)+texture[iy+1,ix+1]*fx)*fy)

def pose_at(spec,t):
    keys=spec['keys']
    for (a,pa),(b,pb) in zip(keys,keys[1:]):
        if t<=b:
            u=max(0,min(1,(t-a)/(b-a))); u=u*u*(3-2*u)
            return {key:pa[key]+(pb[key]-pa[key])*u for key in DEFAULT}
    return keys[-1][1]

def render(pose):
    texture=neutral.copy()
    sx=xx.copy(); sy=yy.copy()
    for cx,side in [(171,'l'),(341,'r')]:
        # Local lid texture belongs to the same original face, including skin detail.
        aperture=((xx-cx)/45)**2+((yy-267)/29)**2
        # Reveal the closed lid from top to bottom instead of dissolving skin
        # over the entire iris. Partial closure must not make the eye milky.
        lid=pose['lid_'+side]
        coverage=np.clip((243+lid*53-yy)/3,0,1) if lid>0 else np.zeros_like(xx)
        mask=np.clip((1.4-aperture)*3,0,1)*coverage
        texture=texture*(1-mask[...,None])+closed*mask[...,None]
        eye=bump(cx,268,45,26)
        sx-=pose['gaze_x']*eye*(1-pose['lid_'+side])
        sy-=pose['gaze_y']*eye*(1-pose['lid_'+side])
        # Stretch the lid surround, not the iris. Photographic pupils stay round.
        iris_radius=((xx-cx)/24)**2+((yy-268)/24)**2
        iris_protection=np.clip((iris_radius-.6)*2.5,0,1)
        sy-=(yy-268)*pose['wide']*bump(cx,268,53,38)*iris_protection
        sy-=pose['brow_'+side]*bump(cx,233,53,33)
    sy-=pose['jaw']*bump(256,405,121,64)
    # A restrained perspective-like nod keeps the neck-free round silhouette.
    sy-=pose['nod']*bump(256,320,220,230)
    frame=Image.fromarray(np.clip(sample(texture,sx,sy),0,255).astype('uint8'))
    if pose['tilt']:
        frame=frame.rotate(pose['tilt'],resample=Image.Resampling.BICUBIC,center=(256,256),fillcolor='black')
    return frame

def run(*args):
    subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

def main():
    if not shutil.which('ffmpeg'): raise SystemExit('ffmpeg is required.')
    OUT.mkdir(exist_ok=True)
    report={'method':'Local two-texture articulation; hand-keyed eye, lid, brow, jaw and secondary head motion.',
            'sources':['frames/idle/00.png','frames/idle/03.png'], 'fps':FPS,'size':[SIZE,SIZE],'states':{}}
    contact=Image.new('RGB',(SIZE*3, (SIZE+40)*3),'#090a09')
    for i,(name,spec) in enumerate(STATES.items()):
        with tempfile.TemporaryDirectory(prefix='skeleton-') as temp:
            temp=Path(temp)
            for index in range(round(spec['duration']*FPS)):
                render(pose_at(spec,index/FPS)).save(temp/f'{index:04d}.png')
            run('-framerate',FPS,'-i',temp/'%04d.png','-c:v','libx264','-crf','18',
                '-pix_fmt','yuv420p','-movflags','+faststart',OUT/f'{name}.mp4')
            run('-i',OUT/f'{name}.mp4','-filter_complex',
                '[0:v]fps=12.5,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a',
                '-loop',0 if spec['end']=='loop' else -1,OUT/f'{name}.gif')
        poster=render(pose_at(spec,spec['peak']))
        poster.save(OUT/f'{name}.png')
        render(pose_at(spec,spec['duration'])).save(OUT/f'{name}-rest.png')
        contact.paste(poster,((i%3)*SIZE,(i//3)*(SIZE+40)))
        ImageDraw.Draw(contact).text(((i%3)*SIZE+20,(i//3)*(SIZE+40)+SIZE+10),name,fill='#cbdaae',font_size=21)
        report['states'][name]={**spec,'sha256':hashlib.sha256((OUT/f'{name}.mp4').read_bytes()).hexdigest()}
        print(name,flush=True)
    contact.save(OUT/'contact-sheet.jpg',quality=91)
    (OUT/'assembly-report.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__': main()
