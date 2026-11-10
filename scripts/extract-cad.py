"""Read LibreDWG JSON. All runtime coordinates are metres; no GIS registration."""
import json,math,hashlib
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[1];O=json.load(open(R/'data/cad-raw.json'))['OBJECTS'];D={e['handle'][-1]:e for e in O};L={e['handle'][-1]:e['name']for e in O if e.get('object')=='LAYER'}
angle=-5.66924857153568;c,s=math.cos(angle),math.sin(angle)
T=np.array([[c,-s,-c*512880+s*3510670],[-s,-c,s*512880+c*3510670],[0,0,1]])
def insert(e):
 b=D[e['block_header'][-1]];x,y=e['ins_pt'][:2];sx,sy=e.get('scale',[1,1])[:2];a=e.get('rotation',0);ca,sa=math.cos(a),math.sin(a);bx,by=b.get('base_pt',[0,0])[:2]
 m=np.array([[ca*sx,-sa*sy,x],[sa*sx,ca*sy,y],[0,0,1]]);m[:2,2]-=m[:2,:2]@np.array([bx,by]);return m,b
flat=[]
def walk(e,m,layer=0,path=(),depth=0):
 if depth>10:return
 layer=e.get('layer',[0])[-1] or layer
 if layer==6 and path:layer=path[-1][1]
 typ=e.get('entity');h=e['handle'][-1]
 if typ=='INSERT':
  n,b=insert(e)
  for ref in b.get('entities',[]):walk(D[ref[-1]],m@n,layer,path+((h,layer),),depth+1)
  return
 p=[];closed=False
 if typ=='LWPOLYLINE':
  pts=e.get('points',[]);bulges=e.get('bulges',[]);closed=bool(e.get('flag',0)&512)
  for i,a in enumerate(pts):
   p.append(a[:2]);b=pts[(i+1)%len(pts)]
   bulge=bulges[i] if i<len(bulges)else 0
   if bulge and math.dist(a[:2],b[:2])>1e-8 and(i<len(pts)-1 or closed):
    dx,dy=b[0]-a[0],b[1]-a[1];ch=math.hypot(dx,dy);theta=4*math.atan(bulge);off=ch*(1-bulge*bulge)/(4*bulge);cx=(a[0]+b[0])/2-dy/ch*off;cy=(a[1]+b[1])/2+dx/ch*off;ra=math.hypot(a[0]-cx,a[1]-cy);start=math.atan2(a[1]-cy,a[0]-cx)
    for j in range(1,max(3,int(abs(theta)*10))):
     t=start+theta*j/max(3,int(abs(theta)*10));p.append([cx+ra*math.cos(t),cy+ra*math.sin(t)])
 elif typ=='LINE':p=[e['start'][:2],e['end'][:2]]
 elif typ=='ARC':
  a,b=e['start_angle'],e['end_angle'];b=b if b>a else b+math.tau
  p=[[e['center'][0]+e['radius']*math.cos(t),e['center'][1]+e['radius']*math.sin(t)]for t in np.linspace(a,b,24)]
 if len(p)<2:return
 with np.errstate(over='ignore',invalid='ignore',divide='ignore'):
  p=(m@np.array([[*v,1]for v in p]).T).T[:,:2]
 if not np.isfinite(p).all():return
 if not(-155<p[0][0]<130 and -115<p[0][1]<115):return
 if max(np.ptp(p[:,0]),np.ptp(p[:,1]))>400:return
 flat.append({'handle':h,'path':[v[0]for v in path],'layer':L.get(layer,str(layer)),'points':p.round(4).tolist(),'closed':closed})
model=next(e for e in O if e.get('name')=='*Model_Space')
for r in model['entities']:
 e=D[r[-1]]
 if e.get('layer',[0])[-1]!=19:walk(e,T)
(R/'data/cad-lines.json').write_text(json.dumps(flat,ensure_ascii=False))
print('flattened',len(flat))
from collections import Counter
print(Counter(x['layer']for x in flat).most_common(25))
# Use the explicit 占地 block's inner outlines (not its 20mm plot offsets).
ids={1:18837,2:18820,3:18817,4:18829,5:18808,6:18826,7:18811,8:18814,9:18844,10:18833,11:18840}
levels={1:[9.5,6.5,4.5,4.25],2:[9.5,6.5,5.5,4.15],3:[9.5,6.5,5.5,3.5],4:[9.5,8.05,4.5,3.5],5:[9.5,6.5,5.5,4.15],6:[9.5,8.05,4.5,3.5],7:[9.5,6.5,5.5,4.15],8:[9,6,5,4.5,4.5,4.5,3.9],9:[9,5,5,4.5,3.9],10:[9.5,6.5,4.5,4.25],11:[4.5,4.5,3.6,3.6,3.6,3.6,4.5]}
B=[]
for i,h in ids.items():
 q=next(x for x in flat if x['handle']==h and 18802 in x['path']);p=q['points'];xs=[v[0]for v in p];zs=[v[1]for v in p];b=[min(xs),min(zs),max(xs),max(zs)]
 B.append({'id':i,'name':f'{i}号'+('集宿楼'if i==11 else '厂房'),'footprint':p,'bounds':b,'floors':levels[i],'height':round(sum(levels[i]),2),'sourceHandle':h,'sourceInsert':18802,'geometryStatus':'CAD直接提取','note':'占地块与更新图纸存在差异，见来源记录'if i in[9,11]else '占地块原始轮廓'})
 print(i,[round(x,3)for x in b],round(b[2]-b[0],3),round(b[3]-b[1],3))
site={'units':'metres','transform':{'cadOrigin':[512880,3510670],'rotationRadians':angle,'matrix':T.tolist(),'northNote':'模型轴按建筑正交化；CAD真北已旋转约35.177度'},'buildings':B,'boundary':next(x['points']for x in flat if x['handle']==5331),'stations':[]}
(R/'data/site.json').write_text(json.dumps(site,ensure_ascii=False,indent=2))
