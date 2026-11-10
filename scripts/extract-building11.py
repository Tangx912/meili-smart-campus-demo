"""Expand building11 source DWG JSON to auditable millimetre drawing primitives."""
import json,math,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1];O=json.load(open(R/'data/building11/raw.json'))['OBJECTS'];D={e['handle'][-1]:e for e in O};L={e['handle'][-1]:e['name']for e in O if e.get('object')=='LAYER'}
# Affine transforms [a,b,c,d,tx,ty], no map registration.
def mul(m,n):
 a,b,c,d,x,y=m;A,B,C,E,X,Y=n
 return [a*A+b*C,a*B+b*E,c*A+d*C,c*B+d*E,a*X+b*Y+x,c*X+d*Y+y]
def point(m,p):return [m[0]*p[0]+m[1]*p[1]+m[4],m[2]*p[0]+m[3]*p[1]+m[5]]
def transform(e):
 h=D[e['block_header'][-1]];bx,by=h.get('base_pt',[0,0])[:2];x,y=e['ins_pt'][:2];sx,sy=e.get('scale',[1,1])[:2];a=e.get('rotation',0);c,s=math.cos(a),math.sin(a)
 return [c*sx,-s*sy,s*sx,c*sy,x-c*sx*bx+s*sy*by,y-s*sx*bx-c*sy*by],h
lines=[];texts=[];instances=[];hatches=[]
def accepted(p):return p and all(math.isfinite(x)for v in p for x in v)and 45000<min(v[0]for v in p)<136000 and 0<min(v[1]for v in p)<650000 and max(v[0]for v in p)<180000 and max(v[1]for v in p)<700000
def walk(e,m,layer=6,path=(),depth=0):
 if depth>12:return
 typ=e.get('entity');h=e['handle'][-1];own=e.get('layer',[6])[-1];layer=own if own!=6 else layer
 if typ=='INSERT':
  n,b=transform(e);n=mul(m,n);p=point(n,[0,0]);name=b['name']
  instances.append({'handle':h,'name':name,'layer':L.get(layer),'position':p,'matrix':n,'path':list(path)})
  for ref in b.get('entities',[]):walk(D[ref[-1]],n,layer,path+(h,),depth+1)
  return
 record={'handle':h,'path':list(path),'layer':L.get(layer,str(layer))}
 if typ in ['TEXT','MTEXT']:
  pos=point(m,e['ins_pt']);text=e.get('text_value',e.get('text',''))
  if accepted([pos]):texts.append({**record,'position':pos,'text':text,'height':e.get('height',e.get('text_height',250))})
  return
 if typ=='HATCH':
  for p in e.get('paths',[]):
   pts=[v['point']for v in p.get('polyline_paths',[])]
   if not pts:
    pts=[v['first_endpoint']for v in p.get('segs',[])if 'first_endpoint'in v]
   pts=[point(m,v)for v in pts]
   if len(pts)>2 and accepted(pts):hatches.append({**record,'points':pts,'color':e.get('color'),'solid':e.get('is_solid_fill'),'pattern':e.get('name')})
  return
 pts=[];closed=False
 if typ=='LINE':pts=[e['start'],e['end']]
 elif typ=='LWPOLYLINE':pts=e.get('points',[]);closed=bool(e.get('flag',0)&512)
 elif typ=='ARC':
  a,b=e['start_angle'],e['end_angle'];b=b if b>a else b+math.tau
  pts=[[e['center'][0]+e['radius']*math.cos(a+(b-a)*i/12),e['center'][1]+e['radius']*math.sin(a+(b-a)*i/12)]for i in range(13)]
 elif typ=='CIRCLE':pts=[[e['center'][0]+e['radius']*math.cos(i*math.tau/20),e['center'][1]+e['radius']*math.sin(i*math.tau/20)]for i in range(21)]
 if len(pts)>1:
  pts=[point(m,p)for p in pts]
  if accepted(pts):lines.append({**record,'points':pts,'closed':closed})
model=next(e for e in O if e.get('name')=='*Model_Space')
for r in model['entities']:walk(D[r[-1]],[1,0,0,1,0,0])
out={'source':'references/cad/building11.dwg','sha256':hashlib.sha256((R/'references/cad/building11.dwg').read_bytes()).hexdigest(),'units':'millimetres','lines':lines,'texts':texts,'instances':instances,'hatches':hatches}
(R/'data/building11/drawing.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print('lines',len(lines),'texts',len(texts),'instances',len(instances),'hatches',len(hatches))
