import * as THREE from 'three';
import {buildFloorSection} from './floor-section-geometry.js';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
const palette={corridor:0x81b8a4,dorm:0xcfae78,office:0x76a9ce,dining:0xdf975a,service:0x9e9dbf,balcony:0xc6d5b7,support:0xbac6b8};
function shapeGeometry(poly,height=.045){
 const shape=new THREE.Shape(poly.outline.map(([x,z])=>new THREE.Vector2(x,-z)));
 for(const hole of poly.holes||[])shape.holes.push(new THREE.Path(hole.map(([x,z])=>new THREE.Vector2(x,-z))));
 const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});geo.rotateX(-Math.PI/2);return geo;
}
export class FloorViewer11{
 constructor(data,b){this.data=data;this.building=b;this.group=new THREE.Group();this.group.visible=false;this.layers=[];this.pickables=[];this.active=new Map();this.onSelect=null;
  for(const floor of data.floors){
   const layer=new THREE.Group(),boundaryPoints=[];layer.userData.floor=floor;layer.add(buildFloorSection(floor));
   for(const room of floor.rooms){
    const material=new THREE.MeshStandardMaterial({color:palette[room.kind]||palette.support,roughness:.95,emissive:0xffa94b,emissiveIntensity:0});const roomGroup=new THREE.Group();roomGroup.userData.room=room;roomGroup.userData.floor=floor;
    for(const p of room.displayPolygons||room.polygons){for(const ring of [p.outline,...(p.holes||[])])for(let i=1;i<ring.length;i++)boundaryPoints.push(ring[i-1][0],.075,ring[i-1][1],ring[i][0],.075,ring[i][1]);const mesh=new THREE.Mesh(shapeGeometry(p),material);mesh.position.y=.012;mesh.receiveShadow=true;mesh.userData.room=room;mesh.userData.floor=floor;roomGroup.add(mesh);this.pickables.push(mesh);}
    const el=document.createElement('div');el.className='room-tag';el.textContent=room.name;const label=new CSS2DObject(el);label.position.set(room.center[0],1.5,room.center[1]);label.visible=false;roomGroup.add(label);roomGroup.userData.material=material;roomGroup.userData.label=label;layer.add(roomGroup);
   }
   const borders=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(boundaryPoints,3)),new THREE.LineBasicMaterial({color:0x36565d,transparent:true,opacity:.8}));borders.name='room-boundaries';layer.add(borders);
   const el=document.createElement('div');el.className='floor-tag';el.textContent=`${floor.name} · ${floor.number===1?'食堂 / 大堂':floor.number===2?'物业办公 / 活动室':'宿舍层'} · 原标高 ${floor.level.toFixed(2)}m`;const label=new CSS2DObject(el);label.position.set(-2,1,10);layer.add(label);
   this.layers.push(layer);this.group.add(layer);
  }
 }
 show(number='all'){
  const[x,z]=this.building.bounds;this.mode=number;this.group.visible=true;
  this.layers.forEach((layer,i)=>{layer.visible=number==='all'||i+1===Number(number);layer.position.set(x+(number==='all'?(i%2)*65:0),0,z+(number==='all'?Math.floor(i/2)*29:0));});
 }
 hide(){this.clear();this.group.visible=false;}
 hover(mesh){if(this.hovered===mesh?.parent)return;this.clear();if(mesh){this.hovered=mesh.parent;this.toggle(mesh);}}
 visiblePickables(){return this.pickables.filter(m=>m.parent.parent.visible&&this.group.visible);}
 toggle(mesh){const room=mesh.userData.room,group=mesh.parent,active=!this.active.has(room.id);group.userData.material.emissiveIntensity=active?.68:0;group.userData.material.color.setHex(active?0xf0a33a:palette[room.kind]||palette.support);group.userData.label.visible=active;
  if(active)this.active.set(room.id,group);else this.active.delete(room.id);this.onSelect?.(room,mesh.userData.floor,active,this.active.size);return active;
 }
 clear(){for(const group of this.active.values()){group.userData.material.emissiveIntensity=0;group.userData.material.color.setHex(palette[group.userData.room.kind]||palette.support);group.userData.label.visible=false;}this.active.clear();this.hovered=null;this.onHoverEnd?.();}
}
