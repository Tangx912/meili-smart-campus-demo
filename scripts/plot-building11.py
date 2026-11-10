import json,os
from pathlib import Path
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.patches import Polygon
R=Path(__file__).resolve().parents[1];S=json.load(open(R/'data/building11/drawing.json'))
plt.rcParams['font.family']='Arial Unicode MS'
regions={'south':(54000,120000,195000,228000),'north':(54000,120000,136000,169000),'sides':(54000,120000,76000,110000),'floor1':(58000,121000,605000,640000),'floor3':(58000,121000,486000,521000),'roof':(58000,121000,247000,289000),'section':(54000,120000,17000,52000)}
for name,(x,X,y,Y)in regions.items():
 fig,ax=plt.subplots(figsize=(16,8));lines=[]
 for q in S['lines']:
  p=q['points'];a,b=p[0]
  if x<a<X and y<b<Y:lines.append(p+([p[0]]if q['closed']else[]))
 ax.add_collection(LineCollection(lines,colors='#273438',linewidths=.4))
 for q in S['hatches']:
  p=q['points'];a,b=p[0]
  if x<a<X and y<b<Y and q['layer']not in['AN-图框','ASTK']:
   col='#8c9ba4' if '填充'in q['layer']else '#c6c6c6';ax.add_patch(Polygon(p,facecolor=col,edgecolor='none',alpha=.4))
 for t in S['texts']:
  a,b=t['position']
  if x<a<X and y<b<Y and t['height']>180:ax.text(a,b,t['text'],fontsize=4,color='#364a4a')
 ax.set(xlim=(x,X),ylim=(y,Y));ax.set_aspect('equal');ax.axis('off');fig.tight_layout();fig.savefig(R/f'docs/building11/{name}-cad.png',dpi=160);plt.close(fig)
