import json,hashlib,math
from pathlib import Path
R=Path(__file__).resolve().parents[1];S=json.load(open(R/'data/site.json'));F=json.load(open(R/'data/cad-lines.json'))
# Each selection is an actual CAD entity, including the INSERT ancestry.
def get(h,parent=None):return next(q for q in F if q['handle']==h and(parent is None or parent in q['path']))
# Use main shell, with the lower transformer as its own object, instead of a 78m-wide solid box.
b=S['buildings'][8];b['footprint']=get(18832)['points'];b['bounds']=[min(p[0]for p in b['footprint']),min(p[1]for p in b['footprint']),max(p[0]for p in b['footprint']),max(p[1]for p in b['footprint'])];b['sourceHandle']=18832
S['obstacles']=[{'name':'变配电','footprint':get(18836)['points'],'height':4.5,'sourceHandle':18836}]
roofParents={1:19525,2:19538,3:5451,4:5435,5:19549,6:5450,7:19561,8:19587,9:19601,10:19573,11:19619}
for b in S['buildings']:
 b['roofProfiles']=[q for q in F if q['layer']=='AN-屋顶' and roofParents[b['id']] in q['path'] and q['closed']]
 b['mainHeight']=round(sum(b['floors'][:-1]),2)
 b['geometryStatus']='CAD占地轮廓；立面按照片示意'
# Triangular entry symbols on the source 用地红线 layer are projected onto the nearest shell edge.
for b in S['buildings']:
 x,z,X,Z=b['bounds'];b['entrances']=[]
 for q in F:
  p=q['points']
  if q['layer']!='用地红线' or len(p)!=3:continue
  cx=sum(v[0]for v in p)/3;cz=sum(v[1]for v in p)/3
  if not(x-2<cx<X+2 and z-2<cz<Z+2):continue
  distances=[(abs(cx-x),'west'),(abs(cx-X),'east'),(abs(cz-z),'north'),(abs(cz-Z),'south')];dist,side=min(distances)
  if dist>2:continue
  area=abs(sum(p[i][0]*p[(i+1)%3][1]-p[(i+1)%3][0]*p[i][1]for i in range(3)))/2
  b['entrances'].append({'sourceHandle':q['handle'],'position':[x if side=='west'else X if side=='east'else cx,z if side=='north'else Z if side=='south'else cz],'side':side,'primary':area>.7})
S['gatehouses']=[{'name':'门卫二','footprint':get(18823)['points'],'height':3.6,'sourceHandle':18823},{'name':'门卫一','footprint':get(18845)['points'],'height':3.6,'sourceHandle':18845}]
S['obstacles']+=S['gatehouses']
S['sign']={'position':[-65.65,0,-.54],'sourceHandle':38589,'note':'CAD门牌注记锚点，构件大小按照片示意'}
S['stations']=[{'id':'forecourt','name':'入口庭院','position':[-42,0,5],'yaw':1.57},{'id':'plaza','name':'8号楼前场','position':[-10,0,11],'yaw':3.14},{'id':'corridor','name':'2 / 3号公共通道','position':[1.6,0,45],'yaw':0},{'id':'dorm','name':'集宿楼前场','position':[39,0,-70],'yaw':3.14},{'id':'east','name':'东侧广场','position':[37.5,0,10],'yaw':0}]
S['sources']={'cad':'梅李特色产业园zp250430(车位调整)_t3(1).dwg','sha256':hashlib.sha256((R/'references/cad/masterplan.dwg').read_bytes()).hexdigest(),'height':'用户附件 Image #3','photos':'用户附件 Image #2、#4–#10','pdfCrossCheck':'总平面图（变更）(2).pdf'}
# Keep CAD linework per layer; no architectural interior or unrelated documents in runtime payload.
keep=['AN-区内道路','00路缘石','车位','J-绿地','围墙']
lines=[q for q in F if q['layer']in keep]
S['landscapeProfiles']=[q for q in F if q['layer']=='J-绿地' and q['closed'] and len(q['points'])>3]
S['parkingBays']=[]
for e in lines:
 if e['layer']!='车位':continue
 p=e['points'];xs=[v[0]for v in p];zs=[v[1]for v in p];w=max(xs)-min(xs);d=max(zs)-min(zs)
 if len(p)>2 and 1.5<w<7 and 1.5<d<7:S['parkingBays'].append({'points':p,'handle':e['handle'],'path':e['path']})
(R/'data/site.json').write_text(json.dumps(S,ensure_ascii=False,indent=2));(R/'data/site-lines.json').write_text(json.dumps(lines,ensure_ascii=False,separators=(',',':')))
print('runtime lines',len(lines),'landscape',len(S['landscapeProfiles']),'parking outlines',len(S['parkingBays']))
