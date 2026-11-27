"""Local prototype: python detect_goals.py recording.mp4 --roi 0.08 0.07 0.16 0.15
Install: pip install opencv-python pytesseract. Install Tesseract and FFmpeg separately.
ROI is normalized x1,y1,x2,y2; adjust against the original recording.
"""
import argparse
import re
import subprocess
from pathlib import Path
import cv2
import pytesseract

def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--roi", nargs=4, type=float, default=[.08,.07,.16,.15])
    p.add_argument("--team", default="LIN")
    p.add_argument("--output", default="goal_clips")
    p.add_argument("--tesseract")
    a = p.parse_args()
    if a.tesseract:
        pytesseract.pytesseract.tesseract_cmd = a.tesseract
    cap = cv2.VideoCapture(a.video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not cap.isOpened() or fps <= 0:
        raise SystemExit("Cannot open recording")
    output = Path(a.output)
    output.mkdir(parents=True, exist_ok=True)
    previous = candidate = None
    count = 0
    last_seen = -100
    goals = []
    frame_no = 0
    step = max(1, round(fps))
    while True:
        ok = cap.grab()
        if not ok:
            break
        frame_no += 1
        if frame_no % step:
            continue
        ok, frame = cap.retrieve()
        if not ok:
            continue
        t = frame_no / fps
        h,w = frame.shape[:2]
        x1,y1,x2,y2 = a.roi
        crop = frame[int(y1*h):int(y2*h),int(x1*w):int(x2*w)]
        if not crop.size:
            continue
        gray = cv2.resize(cv2.cvtColor(crop,cv2.COLOR_BGR2GRAY),None,fx=4,fy=4)
        raw = pytesseract.image_to_string(gray,config="--psm 6").upper()
        match = re.search(r"\b"+re.escape(a.team.upper())+r"\b[^\n\d]*([0-9]{1,2})\b",raw)
        if not match:
            continue
        score = int(match.group(1))
        if t-last_seen > 15:
            previous = candidate = None
            count = 0
        last_seen = t
        if score != candidate:
            candidate,count,first = score,1,t
        else:
            count += 1
        if count == 3:
            if previous is not None and score == previous+1:
                goals.append(first)
                print(f"Possible goal at {first:.1f}s: {previous}-{score}",flush=True)
            previous = score
    cap.release()
    for i,t in enumerate(goals,1):
        start=max(0,t-20)
        subprocess.run(["ffmpeg","-y","-ss",str(start),"-i",a.video,"-t",str(t+10-start),"-c:v","libx264","-preset","fast","-crf","19","-c:a","aac","-movflags","+faststart",str(output/f"goal_{i:03}.mp4")],check=True)
    print(f"{len(goals)} candidate clips")
if __name__ == "__main__":
    main()
