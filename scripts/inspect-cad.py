import json,math,collections
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
R=Path(__file__).resolve().parents[1]; raw=json.load(open(R/'data/cad-raw.json'));o=raw['OBJECTS']; layers={x['handle'][-1]:x['name']for x in o if x.get('object')=='LAYER'}
a=-5.66924857153568;c=math.cos(a);s=math.sin(a)
def xy(p):
 x,y=p[0]-512880,p[1]-3510670
 return [x*c-y*s,x*s+y*c]
fig,ax=plt.subplots(figsize=(14,14))
colors={5227:'black',5436:'blue',5238:'#aaaaaa',5332:'red',18850:'green',19490:'olive',8661:'purple',18803:'cyan',5090:'orange'}
for layer,col in colors.items():
 lines=[]
 for e in o:
  if e.get('layer',[0])[-1]!=layer:continue
  pts=e.get('points',[]) if e.get('entity')=='LWPOLYLINE' else [e['start'],e['end']] if e.get('entity')=='LINE'else []
  if len(pts)<2 or not 512600<pts[0][0]<513100:continue
  pts=[xy(p)for p in pts]
  if e.get('flag',0)&512:pts.append(pts[0])
  lines.append(pts)
 ax.add_collection(LineCollection(lines,colors=col,linewidths=.7,label=layers[layer]))
 print(layer,layers[layer],len(lines))
for e in o:
 if e.get('entity')=='TEXT' and e.get('layer',[0])[-1]==5020 and 512600<e['ins_pt'][0]<513100:
  x,y=xy(e['ins_pt']);ax.text(x,y,e.get('text_value',''),fontsize=8,color='red')
ax.set(xlim=(-170,170),ylim=(-180,140));ax.set_aspect('equal');ax.grid();fig.savefig(R/'docs/cad-inspection.png',dpi=150)
# candidate footprint closed paths
for e in o:
 if e.get('entity')=='LWPOLYLINE' and e.get('layer',[0])[-1] in [5227,18803,5436,5332]:
  pts=e.get('points',[])
  if len(pts)<3 or not 512600<pts[0][0]<513100:continue
  p=[xy(p)for p in pts];xs=[v[0]for v in p];ys=[v[1]for v in p]
  print('POLY',e['handle'][-1],layers[e['layer'][-1]],len(p),e['flag'], 'bounds',*[round(v,3)for v in [min(xs),max(xs),min(ys),max(ys)]])
