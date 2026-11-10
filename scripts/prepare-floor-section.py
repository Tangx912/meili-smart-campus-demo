"""Build semantic floor sections; never extrude CAD annotation linework as glazing."""
import json,math,re,sys
from pathlib import Path
if Path('/private/tmp/meili-floor-deps').exists():sys.path.insert(0,'/private/tmp/meili-floor-deps')
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];P=R/'data/building11-floors.json';data=json.load(open(P));drawing=json.load(open(R/'data/building11/drawing.json'));detail=json.load(open(R/'data/building11.json'));I={i['handle']:i for i in drawing['instances']};CUT=2.4

def shapes(g):
 if g.is_empty:return []
 parts=[g]if g.geom_type=='Polygon'else list(g.geoms)
 return [{'outline':[[round(x,4),round(z,4)]for x,z in p.exterior.coords],'holes':[[[round(x,4),round(z,4)]for x,z in h.coords]for h in p.interiors]}for p in parts if p.geom_type=='Polygon'and p.area>.0001]
def poly(p):return Polygon(p['outline'],p.get('holes',[])).buffer(0)
def norm(p,f):return [(p[0]-f['origin'][0])/1000,(f['origin'][1]-p[1])/1000]
def opening(a,b,**extra):
 length=math.dist(a,b);center=[(a[0]+b[0])/2,(a[1]+b[1])/2];direction=[(b[0]-a[0])/length,(b[1]-a[1])/length]
 return {'center':[round(n,5)for n in center],'direction':[round(n,6)for n in direction],'length':round(length,5),**extra}
def same(a,b):
 if abs(a['direction'][0]*b['direction'][1]-a['direction'][1]*b['direction'][0])>.02:return False
 u=a['direction'];delta=[b['center'][i]-a['center'][i]for i in range(2)];along=sum(delta[i]*u[i]for i in range(2));across=abs(delta[0]*u[1]-delta[1]*u[0]);overlap=min(a['length']/2,along+b['length']/2)-max(-a['length']/2,along-b['length']/2)
 return across<.25 and overlap>.8*min(a['length'],b['length'])
def footprint(o,width=.5):
 x,z=o['center'];ux,uz=o['direction'];n=(-uz*width/2,ux*width/2);dx,dz=ux*o['length']/2,uz*o['length']/2
 return Polygon([(x-dx+n[0],z-dz+n[1]),(x+dx+n[0],z+dz+n[1]),(x+dx-n[0],z+dz-n[1]),(x-dx-n[0],z-dz-n[1])])
for floor in data['floors']:
 boundary=box(0,0,floor['width'],floor['depth']);columns=[];seen=set()
 for q in sorted(drawing['lines'],key=lambda q:q['layer']!='AN-柱'):
  if q['layer']not in ['AN-柱','0S-COLS-LINE'] or not q['closed'] or len(q['points'])<4:continue
  pts=[norm(p,floor)for p in q['points']];p=Polygon(pts).buffer(0)
  if p.is_empty or p.geom_type!='Polygon':continue
  x,z,X,Z=p.bounds
  if not(-.01<=x<X<=56.41 and -.01<=z<Z<=20.21 and .18<X-x<1.5 and .18<Z-z<1.5 and .03<p.area<2):continue
  key=tuple(round(v,3)for v in p.bounds)
  if key in seen or any(math.dist([(x+X)/2,(z+Z)/2],[sum(v[0]for v in c['polygon']['outline'][:-1])/len(c['polygon']['outline'][:-1]),sum(v[1]for v in c['polygon']['outline'][:-1])/len(c['polygon']['outline'][:-1])])<.3 for c in columns):continue
  seen.add(key);columns.append({'sourceHandle':q['handle'],'sourcePath':q['path'],'height':floor['height'],'polygon':shapes(p.intersection(boundary))[0]})
 # Use proper door insert semantics. In this DWG the local origin is the opening centre.
 doors=[]
 for ins in drawing['instances']:
  h=ins['handle']
  if not re.search(r'DORLIB|DOOR',ins.get('name',''),re.I):continue
  m=ins['matrix'];width=math.hypot(m[0],m[2])/1000
  if not .5<width<4:continue
  # The 138 library is the 2.4m sliding balcony glazing, represented by its elevation window.
  if '00000138'in ins['name'] or (width>=2 and math.hypot(m[1],m[3])/1000<.4):continue
  c=norm([m[4],m[5]],floor);u=[m[0]/1000/width,-m[2]/1000/width]
  a=[c[i]-u[i]*width/2 for i in range(2)];b=[c[i]+u[i]*width/2 for i in range(2)]
  if not all(-.01<=p[0]<=56.41 and -.01<=p[1]<=20.21 for p in[a,b]):continue
  head=2.1;label=None;near=[]
  for t in drawing['texts']:
   if t['layer']not in['AN-门窗编号','AN-防火门窗编号']:continue
   match=re.search(r'(?:FM|M)[A-Za-z]*([0-9]{2})([0-9]{2})',t['text'])
   if not match:continue
   p=norm(t['position'],floor);distance=math.dist(p,c);height=int(match.group(2))/10
   if distance<1.8 and 1.9<=height<=3:near.append((distance,height,t['text']))
  if near:_,head,label=min(near)
  candidate=opening(a,b,sourceInsert=h,sourcePath=ins['path'],sourceKind='parametric-door',sourceLabel=label,head=head)
  if not any(same(candidate,d)for d in doors):doors.append(candidate)
 # Native door-threshold lines not stored in a reusable door block.
 for q in floor['doors']:
  if q['path'] or len(q['points'])!=2:continue
  a,b=q['points'];length=math.dist(a,b)
  if not .55<length<3.6 or min(abs(a[0]-b[0]),abs(a[1]-b[1]))>.01:continue
  if not all(-.001<=p[0]<=56.401 and -.001<=p[1]<=20.201 for p in[a,b]):continue
  candidate=opening(a,b,sourceHandle=q['handle'],sourceKind='door-threshold',head=2.1)
  if not any(same(candidate,d)for d in doors):doors.append(candidate)
 windows=[]
 for face,v in detail['views'].items():
  for f in v['windows']:
   u,y,U,Y=f['rect'];level=floor['level'];sill=y-level;head=Y-level
   if not -.15<=sill<floor['height']-.15 or head<=0 or (sill+head)/2>=floor['height']+.1:continue
   # Proper balcony door/windows are on the recessed room face, not its outer railing edge.
   balcony=level>=9 and face in['north','south'] and any(abs(a['rect'][1]-y)<.3 and u<a['rect'][2] and U>a['rect'][0]for a in v['balconies'])
   if face=='south':a,b=[u,18.4 if balcony else 20.1],[U,18.4 if balcony else 20.1]
   elif face=='north':a,b=[u,1.8 if balcony else .1],[U,1.8 if balcony else .1]
   elif face=='west':a,b=[.1,u],[.1,U]
   else:a,b=[56.3,u],[56.3,U]
   if not all(-.02<=p[0]<=56.42 and -.02<=p[1]<=20.22 for p in[a,b]):continue
   sill=max(0,sill);head=min(CUT,head)
   if head-sill<.12:continue
   windows.append(opening(a,b,sourceHandle=f['handle'],sourceKind='elevation-opening',face=face,sill=round(sill,4),head=round(head,4),fullHead=round(Y-level,4),frameLines=f['lines']))
 # Only genuine thin WIN2D inserts may add plan-only interior glazing. Non-print/loose
 # annotation polylines, including handle18539, are never converted to glass.
 windowGroups={}
 for q in floor['windows']+floor['doors']:
  if q['path']:windowGroups.setdefault(q['path'][0],[]).append(q)
 for h,qs in windowGroups.items():
  ins=I.get(h,{})
  if not re.search(r'WIN2D|WINLIB',ins.get('name',''),re.I):continue
  pts=[p for q in qs for p in q['points']];x,z,X,Z=min(p[0]for p in pts),min(p[1]for p in pts),max(p[0]for p in pts),max(p[1]for p in pts)
  if not .06<min(X-x,Z-z)<.35 or not .4<max(X-x,Z-z)<8:continue
  a,b=([x,(z+Z)/2],[X,(z+Z)/2])if X-x>Z-z else([(x+X)/2,z],[(x+X)/2,Z])
  if not all(-.001<=p[0]<=56.401 and -.001<=p[1]<=20.201 for p in[a,b]):continue
  candidate=opening(a,b,sourceHandle=h,sourceKind='parametric-window',sill=.9,head=2.4,fullHead=2.4,frameLines=[])
  if not any(same(candidate,w)for w in windows):windows.append(candidate)
 for w in windows:
  holes=[];u=w['direction'];cx,cz=w['center']
  for door in doors:
   if abs(u[0]*door['direction'][1]-u[1]*door['direction'][0])>.02:continue
   dx,dz=door['center'][0]-cx,door['center'][1]-cz
   if abs(dx*u[1]-dz*u[0])>.25:continue
   center=dx*u[0]+dz*u[1];left=max(-w['length']/2,center-door['length']/2);right=min(w['length']/2,center+door['length']/2)
   if right-left>.05:holes.append([round(left,4),0,round(right,4),door['head']])
  w['doorHoles']=holes
 solid=unary_union([poly(p)for p in floor['wallPolygons']]).intersection(boundary)
 holes=[footprint(o,.42)for o in doors+windows]
 if holes:solid=solid.difference(unary_union(holes))
 if columns:solid=solid.difference(unary_union([poly(c['polygon'])for c in columns]))
 floor['section']={'version':2,'cutHeight':CUT,'wallSolids':shapes(solid),'columns':columns,'doors':doors,'windows':windows,'excludedAnnotationLayers':['AN-窗（不打印）'],'note':'门窗为语义对象；窗高优先取单体立面，门高优先取编号，未注明时门洞按2.1m示意。柱按整层高度显示。'}
 print(floor['number'],'columns',len(columns),'doors',len(doors),'windows',len(windows),'wall solids',len(floor['section']['wallSolids']))
data['sectionRevision']=2;P.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
