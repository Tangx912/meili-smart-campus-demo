"""Continuous abstract floor colors; CAD room outlines remain unchanged."""
import sys,json
from pathlib import Path
if Path('/private/tmp/meili-floor-deps').exists():sys.path.insert(0,'/private/tmp/meili-floor-deps')
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
from shapely.geometry import box
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];path=R/'data/building11-floors.json';data=json.loads(path.read_text());step=.05
for floor in data['floors']:
 width,depth=floor['width'],floor['depth'];nx,nz=round(width/step),round(depth/step)
 im=Image.new('I',(nx,nz),0);draw=ImageDraw.Draw(im)
 for i,room in enumerate(floor['rooms'],1):
  for poly in room['polygons']:
   # Pillar holes and door-swing cutouts are omitted from presentation colors.
   draw.polygon([(round(x/step),round(z/step))for x,z in poly['outline']],fill=i)
 labels=np.array(im);empty=labels==0
 indices=ndimage.distance_transform_edt(empty,return_distances=False,return_indices=True)
 labels[empty]=labels[tuple(indices[:,empty])]
 # Snap presentation regions to CAD wall axes, then vote within rectangular cells.
 cuts=[[],[]]
 for wall in floor['walls']:
  points=wall['points']+([wall['points'][0]]if wall['closed']else[])
  for a,b in zip(points,points[1:]):
   if abs(a[0]-b[0])<.003 and abs(a[1]-b[1])>1:cuts[0].append(a[0])
   if abs(a[1]-b[1])<.003 and abs(a[0]-b[0])>1:cuts[1].append(a[1])
 for room in floor['rooms']:
  for polygon in room['polygons']:
   coords=polygon['outline'];xx=[p[0]for p in coords];zz=[p[1]for p in coords]
   cuts[0].extend([min(xx),max(xx)]);cuts[1].extend([min(zz),max(zz)])
 def axes(values,limit):
  groups=[]
  for value in sorted(v for v in values if .25<v<limit-.25):
   if groups and value-groups[-1][-1]<.26:groups[-1].append(value)
   else:groups.append([value])
  return sorted(set([0,round(limit/step)]+[round(sum(g)/len(g)/step)for g in groups]))
 xs,zs=axes(cuts[0],width),axes(cuts[1],depth)
 rectilinear=np.zeros_like(labels)
 for z,Z in zip(zs,zs[1:]):
  for x,X in zip(xs,xs[1:]):
   values=labels[z:Z,x:X].ravel();winner=int(np.bincount(values).argmax());rectilinear[z:Z,x:X]=winner
 labels=rectilinear
 for i,room in enumerate(floor['rooms'],1):
  runs=[]
  for z,row in enumerate(labels==i):
   edges=np.flatnonzero(np.diff(np.r_[False,row,False].astype(np.int8)))
   runs.extend(box(a*step,z*step,b*step,(z+1)*step)for a,b in zip(edges[::2],edges[1::2]))
  shape=unary_union(runs).simplify(.001,preserve_topology=True)
  parts=[shape]if shape.geom_type=='Polygon'else list(shape.geoms)
  room['displayPolygons']=[{'outline':[[round(x,3),round(z,3)]for x,z in p.exterior.coords],'holes':[[[round(x,3),round(z,3)]for x,z in h.coords]for h in p.interiors]}for p in parts if p.geom_type=='Polygon']
 floor['colorFillMode']='orthogonal-cad-wall-cells'
 print(floor['name'],'grid',len(xs)-1,len(zs)-1,'empty rooms',sum(not r['displayPolygons']for r in floor['rooms']))
path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
