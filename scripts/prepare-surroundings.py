"""Schematic roads and farmland only; not surveyed context."""
import sys,json
from pathlib import Path
if Path('/private/tmp/meili-floor-deps').exists():sys.path.insert(0,'/private/tmp/meili-floor-deps')
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
root=Path(__file__).resolve().parents[1];site=json.loads((root/'data/site.json').read_text());boundary=Polygon(site['boundary']).buffer(0)
def polys(s):
 parts=[s]if s.geom_type=='Polygon'else list(s.geoms)
 return [{'outline':[[round(x,3),round(z,3)]for x,z in p.exterior.coords],'holes':[[[round(x,3),round(z,3)]for x,z in h.coords]for h in p.interiors]}for p in parts if p.geom_type=='Polygon'and p.area>1]
ring=boundary.buffer(22,join_style=1).difference(boundary.buffer(12,join_style=1))
roads=unary_union([ring,box(-520,157,520,167),box(-225,-520,-215,520),box(175,-520,185,520),box(-520,-178,520,-168),box(-225,110,-140,120),box(105,106,185,116),box(-225,-132,95,-122)])
roads=roads.difference(boundary.buffer(.5));farms=[]
for ix,x in enumerate(range(-520,520,65)):
 for iz,z in enumerate(range(-520,520,55)):
  shape=box(x+1,z+1,x+63,z+53).difference(unary_union([boundary.buffer(7),roads.buffer(2)]))
  for p in polys(shape):farms.append({**p,'tone':(ix+2*iz)%4})
out={'note':'用户要求的虚拟示意路网与农田，非CAD、GIS或实测周边。','roads':polys(roads),'farms':farms}
(root/'data/surroundings.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print('schematic roads',len(out['roads']),'farmland patches',len(farms))
