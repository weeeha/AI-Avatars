"""Extract generated frame art, register translations, and encode preview loops."""
from pathlib import Path
import shutil
import json
import subprocess
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
FFMPEG = shutil.which('ffmpeg')
if not FFMPEG: raise SystemExit('Install ffmpeg to rebuild animation files.')

TIMELINES = {
    'idle': [(0, 1.80), (2, .08), (3, .12), (2, .08), (0, 1.92)],
    'thinking': [(0, .80), (1, .20), (2, .24), (3, 1.24), (2, .24), (1, .20), (0, 1.08)],
    'answering': [(0, .24), (1, .12), (2, .16), (3, .12), (2, .12), (1, .08), (0, .20),
                  (1, .12), (2, .12), (1, .12), (0, .40), (1, .08), (3, .16), (2, .12), (1, .12), (0, .72)],
}

def run(*args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)

report = {'method': 'Generated keyframe art, translation registration, timed frame playback; no synthesized in-between frames.', 'states': {}}
for state, timeline in TIMELINES.items():
    source = ROOT / 'sources' / (state + '.png')
    pixels = np.asarray(Image.open(source).convert('RGB'))
    height, width = pixels.shape[:2]
    cell = min(width // 4, height // 2)
    frames = ROOT / 'frames' / state
    frames.mkdir(parents=True, exist_ok=True)
    specs = []
    for i in range(8):
        x, y = round((i % 4) * width / 4), round((i // 4) * height / 2)
        tile = pixels[y:y + cell, x:x + cell]
        # Only the unchanged upper skull determines registration. Jaw motion is retained.
        yy, xx = np.where(tile[:int(cell * .40)].max(axis=2) > 40)
        specs.append({'x': x, 'y': y, 'cx': float((xx.min() + xx.max()) / 2), 'top': int(yy.min())})
    anchor_x, anchor_y = specs[0]['cx'], specs[0]['top']
    details = []
    for i, spec in enumerate(specs):
        dx = round(spec['cx'] - anchor_x)
        dy = spec['top'] - anchor_y
        x, y = spec['x'] + dx, spec['y'] + dy
        if x < 0 or y < 0 or x + cell > width or y + cell > height:
            raise ValueError(f'{state} frame {i}: crop outside sheet')
        frame = frames / f'{i:02d}.png'
        run('-i', source, '-vf', f'crop={cell}:{cell}:{x}:{y},scale=512:512:flags=lanczos', '-frames:v', 1, frame)
        details.append({'frame': i, 'crop': [x, y, cell, cell], 'registration': [-dx, -dy]})
    concat = ROOT / (state + '.ffconcat')
    lines = ['ffconcat version 1.0']
    for index, duration in timeline:
        lines.extend([f"file 'frames/{state}/{index:02d}.png'", f'duration {duration:.4f}'])
    lines.append(f"file 'frames/{state}/{timeline[-1][0]:02d}.png'")
    concat.write_text('\n'.join(lines) + '\n')
    total = sum(d for _, d in timeline)
    run('-safe', 0, '-f', 'concat', '-i', concat, '-vf', 'fps=25', '-t', total,
        '-c:v', 'libx264', '-crf', 17, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ROOT / (state + '.mp4'))
    run('-i', ROOT / (state + '.mp4'), '-filter_complex',
        '[0:v]split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a',
        '-loop', 0, ROOT / (state + '.gif'))
    report['states'][state] = {'duration': total, 'fps': 25, 'size': [512,512], 'timeline': timeline, 'frames': details}

# One synchronized moving comparison; GIF is directly viewable in the conversation.
filters=[]
for i, label in enumerate(['IDLE / BLINK', 'THINKING', 'ANSWERING']):
    filters.append(f'[{i}:v]scale=320:320[v{i}]')
filters.append('[v0][v1][v2]hstack=inputs=3,setsar=1[out]')
args=[]
for state in TIMELINES:
    args += ['-stream_loop', '-1', '-i', ROOT / (state + '.mp4')]
run(*args, '-filter_complex', ';'.join(filters), '-map', '[out]', '-t', 8,
    '-c:v', 'libx264', '-crf', 18, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', ROOT / 'comparison.mp4')
run('-i', ROOT / 'comparison.mp4', '-filter_complex',
    '[0:v]fps=20,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a',
    '-loop', 0, ROOT / 'comparison.gif')
(ROOT / 'assembly-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({state: {'duration': item['duration'], 'frames': len(item['frames'])} for state,item in report['states'].items()}))
