import * as THREE from 'three';
import {builder} from './geometry.js';
function extrude(poly,height){
 const shape=new THREE.Shape(poly.outline.map(([x,z])=>new THREE.Vector2(x,-z)));
 for(const h of poly.holes||[])shape.holes.push(new THREE.Path(h.map(([x,z])=>new THREE.Vector2(x,-z))));
 const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);return geo;
}
export function buildFloorSection(floor){
 const cut=1.1,root=new THREE.Group();root.name=`${floor.name}-section`;
 const slab=builder();slab.box(floor.width/2,-.12,floor.depth/2,floor.width+.3,.2,floor.depth+.3,'paving');const slabGroup=slab.finish();slabGroup.name='slab';root.add(slabGroup);
 const walls=builder();for(const p of floor.section.wallSolids){
  const xs=p.outline.map(v=>v[0]),zs=p.outline.map(v=>v[1]);
  if(Math.max(...xs)-Math.min(...xs)<1.1&&Math.max(...zs)-Math.min(...zs)<1.1)continue;
  walls.add(extrude(p,cut),'wall');
 }
 // In the abstract plan, window apertures read as continuous low walls.
 for(const w of floor.section.windows){const[x,z]=w.center;walls.box(x,cut/2,z,w.length,cut,.2,'wall',-Math.atan2(w.direction[1],w.direction[0]));}
 const wallGroup=walls.finish();wallGroup.name='walls';root.add(wallGroup);
 root.userData={cutHeight:cut,columnCount:0,doorCount:0,windowCount:0,abstract:true};return root;
}
