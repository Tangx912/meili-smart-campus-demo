import * as THREE from 'three';
import {builder,linework,textSprite} from './geometry.js';
import {inside} from './navigation.js';
export function buildSite(site,lines){
 const group=new THREE.Group(),g=builder(),trees=builder();
 g.box(-15,-1.6,0,340,2,278,'ground');
 g.polygon(site.boundary,-.2,.2,'road');
 for(const b of site.buildings){const[x,z,X,Z]=b.bounds;g.box((x+X)/2,.025,(z+Z)/2,X-x+3.4,.05,Z-z+3.4,'paving');}
 for(const q of site.landscapeProfiles)g.polygon(q.points,.045,.08,'grass');
 // Fill the existing CAD entrance island; omit the former square paving placeholder.
 const entranceIsland=lines.find(q=>q.handle===35920);if(entranceIsland)g.polygon(entranceIsland.points,.045,.08,'grass');
 // Keep all 189 CAD parking outlines; vehicles are sparse, schematic occupants.
 for(let i=0;i<site.parkingBays.length;i+=13){
  const p=site.parkingBays[i].points;let xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);const x=(Math.min(...xs)+Math.max(...xs))/2,z=(Math.min(...zs)+Math.max(...zs))/2;
  const a=p[0],b=p[1],angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  g.box(x,.62,z,1.75,1.18,3.9,i%2?'white':'trim',angle);g.box(x,1.2,z,1.6,.55,2.1,'glass',angle);
 }
 // Street lights and planting are deliberately simple; location is not a surveyed inventory.
 const treePoints=[];
 for(let x=-130;x<104;x+=12)treePoints.push([x,94]);
 for(let z=28;z<90;z+=12)treePoints.push([-135,z]);
 for(let i=0;i<11;i++)treePoints.push([-55+i*5.9,-8-i*8]);
 for(let x=11;x<65;x+=10)treePoints.push([x,-102]);
 for(const[x,z]of treePoints){if(!inside(x,z,site.boundary)||site.buildings.some(b=>inside(x,z,b.footprint)))continue;
  trees.box(x,1.55,z,.16,3.1,.16,'bark');const geo=new THREE.IcosahedronGeometry(1.8,1);geo.scale(1,1.3,1);geo.translate(x,4,z);trees.add(geo,'leaf');
 }
 for(let z=-65;z<87;z+=23){g.box(37,3,z,.10,6,.10,'white');g.box(36.6,6,z,.9,.11,.45,'trim');}
 // Ground markings on the inter-building axes.
 for(const x of [1.65,37.7])for(let z=18;z<89;z+=7)g.box(x,.055,z,.14,.016,2.8,'yellow');
 for(let x=-127;x<104;x+=7)g.box(x,.055,55,.016,.016,1.5,'yellow');
 // Schematic entrance wall, based on the photographed marble/graphite sign.
 g.box(-65.65,1.4,-.54,.65,2.8,10,'trim');g.box(-66.02,1.85,-.54,.08,1.55,9.2,'wall');
 const signTexture=textSprite('梅李镇特色产业发展中心',{size:.72,color:'#202c2d',background:'#e9e8dfff'});
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(9.2,1.55),new THREE.MeshBasicMaterial({map:signTexture.material.map,side:THREE.DoubleSide}));sign.rotation.y=-Math.PI/2;sign.position.set(-66.08,1.85,-.54);sign.name='entrance-nameplate';group.add(sign);
 group.add(g.finish());const vegetation=trees.finish();group.add(vegetation);
 group.add(linework(lines.filter(q=>q.layer==='AN-区内道路'||q.layer==='00路缘石'),0xd0d3c5,.075));
 group.add(linework(lines.filter(q=>q.layer==='车位'),0xe8eadd,.08));
 // Fence follows CAD boundary, with two deliberate openings at the source entrances.
 const fence=builder();
 for(let i=0;i<site.boundary.length;i++){
  const a=site.boundary[i],b=site.boundary[(i+1)%site.boundary.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(len<2)continue;
  const n=Math.ceil(len/2.8);
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   if((x>-80&&x<-50&&z<22&&z>-6)||(x>-18&&x<5&&z<-65))continue;
   const angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);fence.box(x,.28,z,len/n,.55,.2,'paving',angle);fence.box(x,1.25,z,.08,1.5,.08,'trim');fence.box(x,1.7,z,len/n,.06,.07,'trim',angle);
  }
 }
 group.add(fence.finish());
 return {group,vegetation};
}
