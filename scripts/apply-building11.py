import json
from pathlib import Path
R=Path(__file__).resolve().parents[1];p=R/'data/site.json';s=json.load(open(p));d=json.load(open(R/'data/building11.json'));b=next(b for b in s['buildings']if b['id']==11)
if 'previousFootprint'not in b:b['previousFootprint']=b['footprint'];b['previousBounds']=b['bounds']
x,z=b['bounds'][:2];X,Z=round(x+d['width'],5),round(z+d['depth'],5);b['bounds']=[x,z,X,Z];b['footprint']=[[x,z],[X,z],[X,Z],[x,Z]]
b['name']='11号综合楼';b['detailRef']='data/building11.json';b['mainHeight']=23.4;b['height']=27.9;b['parapetHeight']=25.2;b['geometryStatus']='11号单体DWG精细化：四面开窗/凹阳台/屋面';b['note']='主体56.4×20.2m；两端外挑1.2m构件使最大包络58.8m；详见11号单体说明'
if 'previousEntrances'not in b:b['previousEntrances']=json.loads(json.dumps(b['entrances']))
for e in b['entrances']:
 if e['side']=='south':e['position'][1]=Z
 elif e['side']=='north':e['position'][1]=z
 elif e['side']=='east':e['position'][0]=X
 else:e['position'][0]=x
s['obstacles']=[o for o in s['obstacles']if o.get('buildingId')!=11]
for i,(a,c)in enumerate([(21.8,23),(33.4,34.6)]):
 s['obstacles'].append({'name':f'11号入口框柱{i+1}','buildingId':11,'collisionOnly':True,'height':4.5,'footprint':[[x+a,Z],[x+c,Z],[x+c,Z+1.2],[x+a,Z+1.2]]})
s['sources']['building11']={'source':'references/cad/building11.dwg','sha256':d['sha256']};p.write_text(json.dumps(s,ensure_ascii=False,indent=2))
print('Updated only building11 footprint, source and detail link')
