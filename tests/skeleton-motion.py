"""Inspect decoded exports, independently of the rig's keyframe declarations.

Requires ffmpeg and numpy. Detects blank/static exports, global-pan substitutes,
duplicate clips, broken loop seams and states that fail to settle.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[1]/'characters/open-skeleton'
manifest=json.loads((ROOT/'manifest.json').read_text())
clips=[c for c in manifest['clips'] if c.get('method')=='local-articulation']
assert len(clips)==9
signatures=set()
for clip in clips:
    encoded=(ROOT/clip['file']).read_bytes()
    signature=hashlib.sha256(encoded).hexdigest()
    assert signature not in signatures, f"Duplicate activity export: {clip['id']}"
    signatures.add(signature)
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/clip['file']),
                                 '-vf','fps=5','-f','rawvideo','-pix_fmt','gray','-'])
    frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,512,512).astype(float)
    assert abs(len(frames)/5-clip['duration'])<.21,clip['id']
    eye_motion=np.std(frames[:,235:300,125:385],axis=0).mean()
    forehead_motion=np.std(frames[:,60:125,220:292],axis=0).mean()
    assert eye_motion>7, f"No expressive eye/lid motion in {clip['id']}"
    assert eye_motion>forehead_motion*2, f"Only head/camera motion in {clip['id']}"
    assert frames[:,30:480,50:460].mean()>35, f"Blank or missing face in {clip['id']}"
    if clip['onEnd']=='hold':
        assert np.abs(frames[-1]-frames[-4]).mean()<.2, f"{clip['id']} never settles"
    if clip['defaultLoop']:
        assert np.abs(frames[0]-frames[-1]).mean()<1.5, f"Loop seam in {clip['id']}"
    # The head remains within a circle with safe clearance. Ignore compression noise.
    yy,xx=np.mgrid[:512,:512]
    outside=(xx-255.5)**2+(yy-255.5)**2>250**2
    assert np.percentile(frames[:,outside],99.99)<30, f"Round-frame clipping in {clip['id']}"
    print(f"PASS {clip['id']}: {len(frames)} decoded samples; local eye motion, duration, framing and terminal behavior")
print('Verified nine distinct articulated activity exports.')
