#!/usr/bin/env python3
"""Assemble generated sequential pose sheets into local pet animation studies.
No generative service or network access. Requires Pillow, NumPy and ffmpeg.
Source art is retained unchanged. Registration stabilizes the boots before
timing and motion-compensated interpolation; this does not create a 3D rig.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FAMILY = ROOT / "characters" / "shape-cast"
SIZE = 320
HOLDS = [10, 4, 2, 2, 2, 4, 3, 3, 3, 3, 4, 3, 3, 3, 3, 3]
TIMELINE = [i for i, hold in enumerate(HOLDS) for _ in range(hold)] + [0] * 9
assert len(TIMELINE) == 64

def run(args):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors="replace"))

def register(tile):
    tile = tile.resize((SIZE, SIZE), Image.Resampling.LANCZOS).convert("RGB")
    rgb = np.asarray(tile)
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    yy = np.indices(hi.shape)[0]
    boots = (yy > SIZE * .62) & (hi > 22) & (hi < 130) & ((hi - lo) < 35)
    ys, xs = np.where(boots)
    if len(xs) < 20:
        raise ValueError("Could not identify dark boot anchors")
    left, right = np.percentile(xs, [1, 99])
    baseline = np.percentile(ys, 99)
    dx = int(round(SIZE / 2 - (left + right) / 2))
    dy = int(round(SIZE * .87 - baseline))
    if abs(dx) > SIZE * .14 or abs(dy) > SIZE * .14:
        raise ValueError(f"Unexpected registration offset {dx}, {dy}")
    out = Image.new("RGB", (SIZE, SIZE), "black")
    out.paste(tile, (dx, dy))
    return out, {"x": dx, "y": dy}

def assemble(character):
    source = FAMILY / "animation-sources" / f"{character}.png"
    output = FAMILY / "animations" / character
    output.mkdir(parents=True, exist_ok=True)
    image = Image.open(source).convert("RGB")
    width, height = image.size
    frames, offsets = [], []
    for index in range(16):
        row, col = divmod(index, 4)
        box = (round(col * width / 4), round(row * height / 4),
               round((col + 1) * width / 4), round((row + 1) * height / 4))
        frame, offset = register(image.crop(box))
        frames.append(frame)
        offsets.append(offset)
    frame_hashes = [hashlib.sha256(f.tobytes()).hexdigest() for f in frames]
    if len(set(frame_hashes)) < 8:
        raise ValueError("Insufficient distinct generated poses")
    frames[0].resize((512, 512), Image.Resampling.LANCZOS).save(output / "poster.png")
    with tempfile.TemporaryDirectory(prefix="shape-loop-") as temp:
        temp = Path(temp)
        padded = [0] * 4 + TIMELINE + [0] * 4
        for i, frame_index in enumerate(padded):
            frames[frame_index].save(temp / f"{i:03d}.png")
        filters = (
            "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:"
            "me=epzs:vsbmc=1:scd=none,"
            "trim=start=0.25:duration=4,setpts=PTS-STARTPTS,"
            "scale=512:512:flags=lanczos,setsar=1"
        )
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-framerate", "16", "-i", str(temp / "%03d.png"),
             "-vf", filters, "-frames:v", "96", "-an", "-c:v", "libx264",
             "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", str(output / "idle.mp4")])
        # Preserve the actual eyelid drawings during the short blink. Optical
        # flow can otherwise blend pupils through the closing eyelids.
        raw = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i",
             str(output / "idle.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout
        decoded = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 512, 512, 3).copy()
        for frame_index in range(20, 31):
            pose_index = TIMELINE[int(frame_index * 16 / 24)]
            decoded[frame_index] = np.asarray(frames[pose_index].resize((512, 512), Image.Resampling.LANCZOS))
        encoded = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
             "-pix_fmt", "rgb24", "-s", "512x512", "-r", "24", "-i", "-", "-an",
             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", str(output / "idle.mp4")],
            input=decoded.tobytes(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if encoded.returncode:
            raise RuntimeError(encoded.stderr.decode(errors="replace"))
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-i", str(output / "idle.mp4"), "-vf",
             "fps=24,scale=384:384:flags=lanczos,split[a][b];"
             "[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a",
             "-loop", "0", str(output / "idle.gif")])
        # Verify the exact finished video, after the blink pass and encoding.
        raw = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(output / "idle.mp4"),
             "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
            check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout
        decoded = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 512, 512, 3)
        endpoint_delta = float(np.abs(decoded[0].astype(float) - decoded[-1]).mean())
        motion_delta = float(np.abs(decoded[0].astype(float) - decoded[48]).mean())
        if decoded.shape[0] != 96:
            raise ValueError(f"Expected 96 video frames, got {decoded.shape[0]}")
        if endpoint_delta > 4:
            raise ValueError(f"Loop endpoint mismatch: {endpoint_delta}")
        if motion_delta < .3:
            raise ValueError("Animation has no measurable motion")
        webp_frames = [Image.fromarray(frame).resize((384, 384), Image.Resampling.LANCZOS)
                       for frame in decoded]
        webp_frames[0].save(output / "idle.webp", save_all=True,
                            append_images=webp_frames[1:], duration=[42, 42, 41] * 32,
                            loop=0, quality=88, method=4)
        Image.fromarray(decoded[24]).save(output / "blink-check.png")
        Image.fromarray(decoded[48]).save(output / "gesture-check.png")
    report = {
        "character": character, "status": "assembled",
        "format": "generated-keyframe-animation", "duration": 4, "fps": 24,
        "width": 512, "height": 512, "decodedFrames": 96,
        "sourceFrames": 16, "uniqueSourceFrames": len(set(frame_hashes)),
        "loopEndpointMeanPixelDifference": endpoint_delta,
        "middleFrameMeanPixelDifference": motion_delta,
        "registrationOffsets": offsets,
        "blinkFrames": "Original eyelid poses preserved for output frames 20-30 to avoid optical-flow ghosting",
        "note": "Local pose-sequence animation with optical-flow interpolation; not a rigged 3D model."
    }
    (output / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ["character", "duration", "decodedFrames",
          "loopEndpointMeanPixelDifference", "middleFrameMeanPixelDifference"]}), flush=True)

def comparison():
    characters = ["triangle", "circle", "square", "star", "crescent", "bean", "heart", "diamond"]
    inputs = [arg for char in characters for arg in ["-i", str(FAMILY / "animations" / char / "idle.mp4")]]
    filters = ";".join(f"[{i}:v]scale=256:256[v{i}]" for i in range(8))
    filters += ";" + "".join(f"[v{i}]" for i in range(8))
    filters += "xstack=inputs=8:layout=0_0|256_0|512_0|768_0|0_256|256_256|512_256|768_256[out]"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
         "-filter_complex", filters, "-map", "[out]", "-an", "-c:v", "libx264",
         "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         str(FAMILY / "all-idle.mp4")])
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-i", str(FAMILY / "all-idle.mp4"), "-vf",
         "scale=768:384:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse",
         "-loop", "0", str(FAMILY / "all-idle.gif")])
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-i", str(FAMILY / "all-idle.mp4"), "-frames:v", "1", str(FAMILY / "all-idle.png")])
    print("Assembled all-idle.mp4, all-idle.gif and all-idle.png", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("characters", nargs="*")
    parser.add_argument("--comparison", action="store_true", help="Assemble an overview of the eight existing loops")
    args = parser.parse_args()
    if not args.characters and not args.comparison:
        parser.error("Provide characters to assemble or --comparison")
    for char in args.characters:
        if char not in {"triangle", "circle", "square", "star", "crescent", "bean", "heart", "diamond"}:
            parser.error("Unknown shape character: " + char)
        assemble(char)
    if args.comparison:
        comparison()
