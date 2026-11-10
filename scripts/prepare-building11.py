"""Derive metre-based facade features from the four original CAD elevations."""
import json,math,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1];S=json.load(open(R/'data/building11/drawing.json'));I={q['handle']:q for q in S['instances']};groups={}
for q in S['lines']:
 if q['path']:groups.setdefault(q['path'][0],[]).append(q)
def bounds(points):return [min(p[0]for p in points),min(p[1]for p in points),max(p[0]for p in points),max(p[1]for p in points)]
# Elevation origin is the wall corner / finished ground. The 405mm offset of the
# elevation label TEXT anchor is annotation layout, not a building floor datum.
X=61585.913374;BASE=195423.019909
views={'south':{'origin':[X,BASE],'width':56.4,'reverse':False},'north':{'origin':[X,BASE-59400],'width':56.4,'reverse':True},'west':{'origin':[X+100,BASE-118800],'width':20.2,'reverse':False},'east':{'origin':[97685.913374,BASE-118800],'width':20.2,'reverse':True}}
def convert_rect(bb,v):
 x,y=v['origin'];u=(bb[0]-x)/1000;U=(bb[2]-x)/1000
 if v['reverse']:u,U=v['width']-U,v['width']-u
 return [round(u,5),round((bb[1]-y)/1000,5),round(U,5),round((bb[3]-y)/1000,5)]
def convert_lines(ls,v):
 x,y=v['origin'];out=[]
 for q in ls:
  p=[[(a-x)/1000,(b-y)/1000]for a,b in q['points']]
  if v['reverse']:p=[[v['width']-a,b]for a,b in p]
  if q['closed']:p.append(p[0])
  for a,b in zip(p,p[1:]):
   if math.dist(a,b)>.035 and math.dist(a,b)<9:out.append([[round(n,5)for n in a],[round(n,5)for n in b]])
 return out
for name,v in views.items():
 v['windows']=[];v['balconies']=[];v['cladding']=[]
 for h,ls in groups.items():
  ins=I.get(h)
  if not ins:continue
  bb=bounds([p for q in ls for p in q['points']]);r=convert_rect(bb,v);u,y,U,Y=r
  if not(-.01<u<U<v['width']+.01 and -.5<y<Y<28.1):continue
  item={'handle':h,'block':ins['name'],'rect':r,'lines':convert_lines(ls,v)}
  if sum(q['layer']=='AN-窗'for q in ls)>.7*len(ls)and .25<U-u<9 and .5<Y-y<5:v['windows'].append(item)
  elif ins['layer']=='AN-栏杆'and .6<U-u<9 and .5<Y-y<1.5:v['balconies'].append(item)
 # Solid hatch exterior decorative fields, keeping source holes as separate paths.
 for q in S['hatches']:
  if q['path']or q['layer']not in['AN-默认填充','AN-立面填充1','AN-立面填充2']:continue
  r=convert_rect(bounds(q['points']),v);u,y,U,Y=r
  if not(-1.3<u<U<v['width']+1.3 and -.3<y<Y<28.2):continue
  if U-u<.1 or Y-y<.1:continue
  if q['layer']=='AN-默认填充' and .8<U-u<1.7 and 2.5<Y-y<3.2:
   v['cladding'].append({'handle':q['handle'],'rect':r,'material':'louver'})
  elif q['layer']=='AN-立面填充2':
   v['cladding'].append({'handle':q['handle'],'rect':r,'material':'orange'})
 # The grey stair stripes use small source hatch fields between actual windows.
  elif q['layer']=='AN-立面填充1' and .1<U-u and Y-y<5 and Y<27.95:
   v['cladding'].append({'handle':q['handle'],'rect':r,'material':'trim'})
 # Roof access windows are authored as loose polylines rather than INSERTs.
 if name=='south':
  for h,bb in [(3375,[63085.913376,219523.021883,64585.913376,221823.021883]),(22479,[66385.913377,219723.021883,67585.913377,221823.021883])]:
   handles=range(h,h+6);ls=[q for q in S['lines']if q['handle']in handles and not q['path']];v['windows'].append({'handle':h,'rect':convert_rect(bb,v),'lines':convert_lines(ls,v),'block':'loose roof window polylines'})
  # Main entrance glazing outer dimensions from source hatch path 20283.
  r=convert_rect([86085.913375,195423.021883,93485.913375,199023.021883],v)
  v['windows'].append({'handle':20283,'rect':r,'lines':[],'block':'MLC7436 entrance glazing'})
 # Loose side-elevation window polylines.
 if name in ['west','east']:
  h=7182 if name=='west'else 7150
  ls=[q for q in S['lines']if h<=q['handle']<h+5 and not q['path']]
  box=bounds(next(q['points']for q in ls if q['handle']==h))
  v['windows'].append({'handle':h,'rect':convert_rect(box,v),'lines':convert_lines(ls,v),'block':'loose side window polylines'})
 for key in ['windows','balconies','cladding']:v[key].sort(key=lambda f:(f['rect'][1],f['rect'][0]))
 for q in v['cladding']:
  if q['material']=='orange':q['holes']=[o['rect']for o in v['cladding']if o is not q and o['handle']==q['handle'] and o['rect']!=q['rect'] and q['rect'][0]<=o['rect'][0] and q['rect'][1]<=o['rect'][1] and q['rect'][2]>=o['rect'][2] and q['rect'][3]>=o['rect'][3]]
 v['cladding']=[q for q in v['cladding']if not any(o is not q and o['handle']==q['handle'] and o['rect'][0]<=q['rect'][0] and o['rect'][1]<=q['rect'][1] and o['rect'][2]>=q['rect'][2] and o['rect'][3]>=q['rect'][3] and o['rect']!=q['rect'] for o in v['cladding'])]
 print(name,'windows',len(v['windows']),'balconies',len(v['balconies']),'cladding',len(v['cladding']))
# Roof plan local u=x-west-wall, v=north-wall-y, independent of elevation panels.
roofOrigin=[61585.913375,269280.169665]
def roofrect(bb):return [round((bb[0]-roofOrigin[0])/1000,5),round((roofOrigin[1]-bb[3])/1000,5),round((bb[2]-roofOrigin[0])/1000,5),round((roofOrigin[1]-bb[1])/1000,5)]
solar={}
for q in S['lines']:
 if q['layer']=='太阳能集热器'and len(q['path'])>1:
  solar.setdefault(q['path'][-1],[]).extend(q['points'])
solar=[{'handle':h,'rect':roofrect(bounds(p))}for h,p in solar.items()if 60000<min(q[0]for q in p)<120000 and 248000<min(q[1]for q in p)<270000]
# Explicit 1.8m balcony depth dimension, 8.3x8.9m machine room and outer roof outline.
data={'version':2,'source':'references/cad/building11.dwg','sha256':S['sha256'],'width':56.4,'depth':20.2,'floorLevels':[0,4.5,9,12.6,16.2,19.8,23.4],'parapetHeight':25.2,'lowerParapetHeight':24.3,'height':27.9,'balconyDepth':1.8,'roofRoom':{'rect':[0,0,8.3,8.9],'height':27.9,'sourceHandle':3445},'solar':solar,'tank':{'rect':roofrect([72885.913375,263830.169665,77885.913375,266830.169665]),'sourceHandle':11550,'label':'热水箱15T'},'views':views,'evidence':{'widthDimensionHandles':[33970,33996,34022,34048,34074],'balconyDepthDimensionHandle':53284,'footprintRoofHandle':1640,'floorCount':6,'roofAnnotationHandles':[95676,95148]},'schematic':['wall/slab thickness where no structural detail is extracted','balcony cavity depth is CAD 1.8m; rail tube sections simplified','colors from supplied photographs; fine material roughness schematic','roof solar tilt and tank height are schematic, plan positions from CAD']}
(R/'data/building11.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('solar',len(solar),'runtime bytes',(R/'data/building11.json').stat().st_size)
