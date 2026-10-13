from pathlib import Path
import subprocess, shutil
import numpy as np
from PIL import Image,ImageFilter
import argparse
parser=argparse.ArgumentParser(description="Rotate the passport ink in the supplied 1440px Gong hero source.")
parser.add_argument("input",type=Path)
parser.add_argument("output",type=Path)
options=parser.parse_args()
source=options.input
output=options.output
if source.resolve()==output.resolve():raise ValueError("Preserve the original: output must differ from input")
output.parent.mkdir(parents=True,exist_ok=True)
root=output.parent
ffmpeg=shutil.which("ffmpeg")
probe=subprocess.check_output([shutil.which("ffprobe"),"-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate","-of","json",str(source)])
import json
stream=json.loads(probe)["streams"][0]
if (stream["width"],stream["height"],stream["r_frame_rate"])!=(1440,1440,"24/1"):raise ValueError("This correction is calibrated only for the supplied 1440x1440 24fps source")
reader=subprocess.Popen([ffmpeg,"-v","error","-i",str(source),"-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
writer=subprocess.Popen([ffmpeg,"-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s","1440x1440","-r","24","-i","-","-i",str(source),"-map","0:v:0","-map","1:a?","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-c:a","copy","-movflags","+faststart",str(output)],stdin=subprocess.PIPE)
index=0;changed=[]
while True:
 data=reader.stdout.read(1440*1440*3)
 if not data:break
 if len(data)!=1440*1440*3:raise RuntimeError("partial frame")
 t=index/24
 if 8.45<=t<=9.67:
  frame=np.frombuffer(data,dtype=np.uint8).reshape(1440,1440,3).copy()
  roi=frame[1195:1320,510:715].copy();f=roi.astype(float)
  mask=(f[:,:,0]-f[:,:,1]>10)&(f[:,:,0]-f[:,:,2]>15)&(f[:,:,0]>190)
  if mask.sum()>6:
   wide=np.array(Image.fromarray(mask.astype("uint8")*255).filter(ImageFilter.MaxFilter(5)))>0
   paper=(f[:,:,0]>225)&(f[:,:,1]>215)&(f[:,:,2]>195)&~wide
   bg=roi.copy()
   for row in range(len(roi)):
    positions=np.where(paper[row])[0]
    if len(positions):
     for c in range(3):bg[row,:,c]=np.interp(np.arange(roi.shape[1]),positions,roi[row,positions,c])
   # Original fully visible ink center: x=606,y=1246. Rotate ink, not page/foot.
   out=roi.copy();erase=wide&(((f[:,:,0]>215)&(f[:,:,1]>190)&(f[:,:,2]>170))|mask)
   out[erase]=bg[erase]
   ys,xs=np.where(mask);xx=192-xs;yy=102-ys
   valid=(xx>=0)&(xx<roi.shape[1])&(yy>=0)&(yy<len(roi))
   ys,xs,xx,yy=ys[valid],xs[valid],xx[valid],yy[valid]
   visible=((f[yy,xx,0]>225)&(f[yy,xx,1]>215)&(f[yy,xx,2]>195))|mask[yy,xx]
   out[yy[visible],xx[visible]]=roi[ys[visible],xs[visible]]
   frame[1195:1320,510:715]=out;data=frame.tobytes();changed.append(index)
 writer.stdin.write(data);index+=1
writer.stdin.close()
assert reader.wait()==0
assert writer.wait()==0
(root/"edit-report.txt").write_text(f"frames={index}; modified_frames={changed}\nOnly passport ink ROI modified before encoding; source preserved.\n")
print(output, "frames",index,"modified",len(changed),flush=True)
