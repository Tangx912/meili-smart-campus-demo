import * as THREE from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {buildBuilding11} from './building11.js';
import {builder} from './geometry.js';
function rect(x,z,X,Z){return [[x,z],[X,z],[X,Z],[x,Z]];}
function facade(g,poly,bottom,top,floors,id){
 // Separate the wall panel, continuous graphite window pier and floor glazing.
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<2)continue;
  const ux=dx/len,uz=dz/len,angle=-Math.atan2(dz,dx),nx=uz*.035,nz=-ux*.035;
  const count=Math.max(1,Math.floor((len-3)/4.4));
  for(let j=0;j<count;j++){
   const t=(j+1)/(count+1),x=a[0]+dx*t+nx,z=a[1]+dz*t+nz;
   const w=Math.min(2.2,len/(count+1)*.55);
   const pierBottom=Math.max(bottom,floors[0]);
   if(top>pierBottom)g.box(x,(pierBottom+top)/2,z,w,top-pierBottom-.15,.12,'trim',angle);
   let level=0;
   for(const height of floors){
    const low=Math.max(bottom,level),high=Math.min(top,level+height);
    if(high-low>1.8){const h=(high-low)*(low<1?.65:.58);g.box(x,(low+high)/2+.15,z+(.012*nz),w-.18,h,.17,'glass',angle);
     g.box(x,(low+high)/2+.15,z,w,.06,.22,'trim',angle);
     g.box(x,(low+high)/2+.15,z,.055,h,.22,'trim',angle);
    }
    level+=height;
   }
  }
  // Panel joints are geometry rather than high resolution textures.
  for(let y=Math.ceil(bottom/3)*3;y<top;y+=3)g.box((a[0]+b[0])/2,y,(a[1]+b[1])/2,len,.018,.025,'roof',angle);
 }
}
function addLabel(b,labels){
 const [x,z,X,Z]=b.bounds,el=document.createElement('div');el.className='building-label';el.textContent=`${b.id}号楼`;el.title=b.name;
 const label=new CSS2DObject(el);label.position.set((x+X)/2,b.height+2,(z+Z)/2);label.userData.buildingId=b.id;labels.add(label);
}
export function buildBuildings(site){
 const all=new THREE.Group(),labels=new THREE.Group(),pickables=[];
 for(const b of site.buildings){
  if(b.id===11){
   const group=buildBuilding11(b,b.detail);all.add(group);pickables.push(group);addLabel(b,labels);continue;
  }
  const g=builder(),[x,z,X,Z]=b.bounds,w=X-x,d=Z-z,H=b.mainHeight;let low=H,upper=[];
  if([3,4,6].includes(b.id)){
   low=b.floors[0]+b.floors[1];const wing=b.id===3?3.5:9.2,depth=b.id===3?7.5:12.25;
   if(b.id===3)upper=[rect(x,z,X,z+depth),rect(x,z+depth,x+wing,Z),rect(X-wing,z+depth,X,Z)];
   else upper=[rect(x,z,X,z+depth),rect(x,z+depth,x+wing,Z),rect(X-wing,z+depth,X,Z)];
  }else if(b.id===9){low=19;upper=[rect(x,z,X,z+16.9)];}
  g.polygon(b.footprint,0,low,'wall');g.polygon(b.footprint,low,.18,'roof');facade(g,b.footprint,0,low,b.floors,b.id);
  for(const p of upper){g.polygon(p,low,H-low,'wall');g.polygon(p,H,.18,'roof');facade(g,p,low,H,b.floors,b.id);}
  // Dark horizontal band seen in the site photographs, just above the high ground floor.
  const band=b.floors[0]-.7;
  g.box((x+X)/2,band,z-.05,w+.16,.8,.22,'trim');g.box((x+X)/2,band,Z+.05,w+.16,.8,.22,'trim');
  g.box(x-.05,band,(z+Z)/2,.22,.8,d+.16,'trim');g.box(X+.05,band,(z+Z)/2,.22,.8,d+.16,'trim');
  // Roof equipment towers: small roof structures, never a full extra storey.
  const rw=b.id===11?7.8:b.id===3?7.1:8.8,rd=b.id===11?9:b.id===3?3.2:4.6;
  g.box(x+rw/2,H+(b.height-H)/2,z+rd/2,rw,b.height-H,rd,'wall');
  g.box(x+rw/2,b.height,z+rd/2,rw,.16,rd,'trim');
  if([2,5,7,8,10].includes(b.id))g.box(X-4.4,H+(b.height-H)/2,z+2.3,8.8,b.height-H,4.6,'wall');
  // Main doors and individual loading canopies, with photographed orange corner panels.
  const front=Z;
  for(const door of b.entrances){
   const [cx,cz]=door.position,vertical=['east','west'].includes(door.side),angle=vertical?Math.PI/2:0;
   const nx=door.side==='east'?.16:door.side==='west'?-.16:0,nz=door.side==='south'?.16:door.side==='north'?-.16:0;
   const dw=door.primary?4.2:1.45,dh=door.primary?5.4:2.9;
   g.box(cx+nx,dh/2,cz+nz,dw,dh,.22,'glass',angle);
   g.box(cx+nx*5,dh+.23,cz+nz*5,dw+.9,.22,1.7,'trim',angle);
  }
  if(b.id!==11)g.box(b.id===8?X-1.8:x+1.8,3.3,front+.11,3.3,6.6,.26,'orange');
  const group=g.finish();group.userData.building=b;group.name=b.name;all.add(group);pickables.push(group);
  addLabel(b,labels);
 }
 for(const b of site.obstacles){if(b.collisionOnly)continue;const g=builder();g.polygon(b.footprint,0,b.height,'wall');all.add(g.finish());}
 return {group:all,labels,pickables};
}
