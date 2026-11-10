"""CAD-only floor sections. Raster regions are interaction overlays, not survey areas."""
import sys,json,math
from pathlib import Path
if Path('/private/tmp/meili-floor-deps').exists():sys.path.insert(0,'/private/tmp/meili-floor-deps')
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
from shapely.geometry import box,mapping
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];S=json.load(open(R/'data/building11/drawing.json'))
W,D=56.4,20.2;STEP=.05;PX=int(W/STEP)+1;PZ=int(D/STEP)+1
origins=[633923.021883,567315.693634,515123.021883,455723.021883,396323.021883,336923.021883]
levels=[0,4.5,9,12.6,16.2,19.8,23.4]
wallLayers=['AN-墙','A-WALL','AN-柱','0S-COLS-LINE'];doorLayers=['AN-门','AN-防火门窗'];winLayers=['AN-窗','AN-窗（不打印）']
def norm(p,north):return [round((p[0]-61585.913375)/1000,4),round((north-p[1])/1000,4)]
def floorpath(q,north):
 p=[norm(p,north)for p in q['points']]
 if not all(-1.5<a<W+1.5 and -1.5<b<D+1.5 for a,b in p):return None
 return {'handle':q['handle'],'path':q['path'],'points':p,'closed':q['closed']}
def polydata(poly):
 parts=[poly]if poly.geom_type=='Polygon'else list(poly.geoms)
 return [{'outline':[[round(x,3),round(y,3)]for x,y in p.exterior.coords],'holes':[[[round(x,3),round(y,3)]for x,y in h.coords]for h in p.interiors]}for p in parts if p.geom_type=='Polygon' and p.area>.02]
def regionshape(labels,idx):
 mask=labels==idx;runs=[]
 for j in range(PZ):
  row=mask[j];edges=np.flatnonzero(np.diff(np.r_[False,row,False].astype(np.int8)))
  for a,b in zip(edges[::2],edges[1::2]):runs.append(box(a*STEP,j*STEP,b*STEP,(j+1)*STEP))
 return unary_union(runs).intersection(box(0,0,W,D)).simplify(.035,preserve_topology=True)
def kind(name):
 if '宿舍'in name or '居室'in name:return 'dorm'
 if '走廊'in name or '大堂'in name or '电梯厅'in name or '楼梯'in name:return 'corridor'
 if '物业'in name:return 'office'
 if '餐厅'in name or '厨房'in name or '开水'in name:return 'dining'
 if '卫'in name:return 'service'
 if '阳台'in name or '平台'in name:return 'balcony'
 return 'support'
F=[]
for number,north in enumerate(origins,1):
 floor={'number':number,'name':f'{number}F','level':levels[number-1],'height':levels[number]-levels[number-1],'origin':[61585.913375,north],'width':W,'depth':D,'walls':[],'doors':[],'windows':[],'rooms':[],'wallPolygons':[]}
 for q in S['lines']:
  if q['layer']not in wallLayers+doorLayers+winLayers:continue
  p=floorpath(q,north)
  if not p:continue
  key='walls'if q['layer']in wallLayers else 'doors'if q['layer']in doorLayers else 'windows';floor[key].append(p)
 # Match double wall faces at 100–300mm distance; exact CAD coordinates retained.
 horizontal=[];vertical=[]
 for q in floor['walls']:
  p=q['points']+([q['points'][0]]if q['closed']else[])
  for a,b in zip(p,p[1:]):
   if abs(a[1]-b[1])<.002 and abs(a[0]-b[0])>.08:horizontal.append((a[1],min(a[0],b[0]),max(a[0],b[0])))
   elif abs(a[0]-b[0])<.002 and abs(a[1]-b[1])>.08:vertical.append((a[0],min(a[1],b[1]),max(a[1],b[1])))
 rectangles=[]
 for seq,axis in [(horizontal,0),(vertical,1)]:
  for i,(pos,a,b)in enumerate(seq):
   for pos2,a2,b2 in seq[i+1:]:
    gap=abs(pos-pos2);lo,hi=max(a,a2),min(b,b2)
    if .09<gap<.31 and hi-lo>.08:
     rectangles.append(box(lo,min(pos,pos2),hi,max(pos,pos2))if axis==0 else box(min(pos,pos2),lo,max(pos,pos2),hi))
 # Draw the exact wall/door/window lines to seal regions; furniture layers never enter.
 im=Image.new('1',(PX,PZ),0);draw=ImageDraw.Draw(im)
 for key in ['walls','doors','windows']:
  for q in floor[key]:
   p=q['points']+([q['points'][0]]if q['closed']else[])
   draw.line([(round(a/STEP),round(b/STEP))for a,b in p],fill=1,width=2)
 # Room overlays close plan door/window gaps along an existing wall line only.
 # These closures are NOT exported as physical walls.
 for seq,axis in [(horizontal,0),(vertical,1)]:
  bypos={}
  for pos,a,b in seq:bypos.setdefault(round(pos,2),[]).append((a,b))
  for pos,parts in bypos.items():
   parts.sort();end=parts[0][1]
   for a,b in parts[1:]:
    if .08<a-end<=1.95:
     q=[(end,pos),(a,pos)]if axis==0 else[(pos,end),(pos,a)]
     draw.line([(round(x/STEP),round(y/STEP))for x,y in q],fill=1,width=2)
    end=max(end,b)
 draw.rectangle((0,0,PX-1,PZ-1),outline=1,width=7)
 walls=np.array(im,dtype=bool);walls=ndimage.binary_closing(walls,iterations=1);walls[[0,-1],:]=True;walls[:,[0,-1]]=True
 labels,count=ndimage.label(~walls);areas=np.bincount(labels.ravel());seeded={}
 for t in S['texts']:
  if t['layer']!='AN-房间名称':continue
  x,z=norm(t['position'],north);name=t['text']
  if not(0<x<W and 0<z<D):continue
  if name in ['消防控制室','水井','风井','电梯','楼梯','电梯厅','大堂','活动室','餐厅','男卫','女卫','走廊','物业办公','弱电机房','储藏室','配电间','开水间','垃圾收集间','电气设备间','无障碍卫生间','人间宿舍','无障碍居室','阳台','卫','设备平台']or'厨房'in name or'宿舍'in name:
   ix,iz=round(x/STEP),round(z/STEP);idx=int(labels[min(PZ-1,iz),min(PX-1,ix)])
   if not idx:
    for rr in range(1,5):
     nearby=labels[max(0,iz-rr):min(PZ,iz+rr+1),max(0,ix-rr):min(PX,ix+rr+1)];values=nearby[nearby>0]
     if len(values):idx=int(max(values,key=lambda v:areas[v]));break
   # Labels occasionally sit on a door-swing sector; use the nearest plausible room,
   # rather than treating that 1–2m² sector as a whole dormitory.
   if idx and ('宿舍'in name or '居室'in name)and areas[idx]*STEP*STEP<8:
    rr=60;xl,xr=max(0,ix-rr),min(PX,ix+rr+1);zl,zr=max(0,iz-rr),min(PZ,iz+rr+1);window=labels[zl:zr,xl:xr];valid=(areas[window]*STEP*STEP>=8)&(areas[window]*STEP*STEP<70)&(window>0)
    yy,xx=np.where(valid)
    if len(xx):
     best=np.argmin((xx+xl-ix)**2+(yy+zl-iz)**2);idx=int(window[yy[best],xx[best]])
   if idx and areas[idx]*STEP*STEP>.3:
    seeded.setdefault(idx,[]).append({'name':'2人间宿舍'if name=='人间宿舍'else '卫生间'if name=='卫'else name,'handle':t['handle'],'position':[x,z]})
 for idx,annotations in seeded.items():
  shape=regionshape(labels,idx)
  if shape.is_empty:continue
  names=list(dict.fromkeys(a['name']for a in annotations));name=' / '.join(names);typ=kind(name);rep=shape.representative_point()
  floor['rooms'].append({'id':f'11-{number}-{len(floor["rooms"])+1:02d}','name':name,'kind':typ,'sourceLabels':annotations,'center':[round(rep.x,3),round(rep.y,3)],'polygons':polydata(shape),'areaIllustrative':round(shape.area,2),'virtualEnterprise':'XX企业','virtualIntro':('本区域为XX企业员工配套住宿的虚拟演示，房间分配与入住信息仅作交互示例。'if typ=='dorm'else 'XX企业综合服务团队在此提供物业办公与园区协同服务。本介绍为虚拟演示，不代表真实使用单位。'if typ=='office'else '本区域用于综合楼餐饮与生活配套服务，XX企业为虚拟服务单位，仅用于演示空间信息查询。'if typ=='dining'else 'XX企业为本空间的虚拟服务关联单位，展示房间功能与园区配套信息，不代表真实租赁或入驻情况。')})
 floor['wallPolygons']=polydata(unary_union(rectangles).intersection(box(-.5,-.5,W+.5,D+.5)))if rectangles else []
 print(number,'walls',len(floor['walls']),'wallpolys',len(floor['wallPolygons']),'doors',len(floor['doors']),'windows',len(floor['windows']),'rooms',len(floor['rooms']),[(r['name'],r['areaIllustrative'])for r in floor['rooms']if r['areaIllustrative']>100])
 F.append(floor)
out={'source':'references/cad/building11.dwg','sha256':S['sha256'],'buildingName':'11号综合楼','program':'宿舍、物业办公室、食堂','regionResolutionMetres':STEP,'note':'墙门窗来自原CAD；色块由5cm连通区域识别，非测绘面积；企业名称和介绍全部虚拟。','floors':F,'excludedLayers':['AN-厨卫家具','AN-家具','洁具','Toliet','床桌椅、厨房设备和卫生器具均不建模']}
(R/'data/building11-floors.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))

# Keep semantic apertures and section solids synchronized with regenerated rooms.
import subprocess
subprocess.run([sys.executable,str(R/"scripts/prepare-floor-section.py")],check=True)
subprocess.run([sys.executable,str(R/"scripts/prepare-floor-colors.py")],check=True)
