#!/usr/bin/env python3
"""Assemble browser-rendered evidence after npm test (Pillow required)."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
raw=ROOT/'test-results/shape-cast';out=ROOT/'tests/evidence/shape-cast';out.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'studies/shape-cast.states.json').read_text())
for group in ['activity','emotion']:
    states=[s for s in data['states'] if s['group']==group]
    image=Image.new('RGB',(180*len(states),205*8),'#0a0a0a');draw=ImageDraw.Draw(image)
    for y,c in enumerate(data['characters']):
        for x,s in enumerate(states):
            frame=Image.open(raw/f"{c['id']}-{s['id']}.png").convert('RGB').resize((180,180))
            image.paste(frame,(x*180,y*205));draw.text((x*180+5,y*205+185),c['name']+' / '+s['label'],fill='white')
    image.save(out/f'{group}-contact.webp',quality=93)
image=Image.new('RGB',(230*4,258*8),'#0a0a0a');draw=ImageDraw.Draw(image)
for y,c in enumerate(data['characters']):
    for x,(state,early) in enumerate([('working',True),('working',False),('playful',True),('playful',False)]):
        frame=Image.open(raw/f"{c['id']}-{state}{'-early' if early else ''}.png").convert('RGB').resize((230,230))
        image.paste(frame,(x*230,y*258));draw.text((x*230+5,y*258+235),f"{c['name']} / {state} / {'.35s' if early else '.85s'}",fill='white')
image.save(out/'motion-sequence.webp',quality=94)
Image.open(raw/'mobile-reduced-round.png').save(out/'mobile-reduced-round.png')
print('Saved activity, emotion and paired-motion contact sheets plus the mobile reduced-motion capture.')

blink=Image.new('RGB',(230*4,258*2),'#0a0a0a');draw=ImageDraw.Draw(blink)
for i,c in enumerate(data['characters']):
    blink.paste(Image.open(raw/f"{c['id']}-blink.png").convert('RGB').resize((230,230)),((i%4)*230,(i//4)*258))
    draw.text(((i%4)*230+5,(i//4)*258+235),c['name']+' / full blink',fill='white')
blink.save(out/'blink-contact.webp',quality=94)
