import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const materials={
 ground:new THREE.MeshStandardMaterial({color:0x102b3d,roughness:1}),
 structure:new THREE.MeshStandardMaterial({color:0xcdd4cf,roughness:.9}),
 wall:new THREE.MeshStandardMaterial({color:0xe5e6e0,roughness:.72}),trim:new THREE.MeshStandardMaterial({color:0x3f4e55,roughness:.62}),
 glass:new THREE.MeshPhysicalMaterial({color:0x647f8b,metalness:.12,roughness:.14,transmission:.14,thickness:.05,ior:1.45,transparent:true,opacity:.88,envMapIntensity:1.2,depthWrite:false}),orange:new THREE.MeshStandardMaterial({color:0xe85b22,roughness:.65}),
 solar:new THREE.MeshStandardMaterial({color:0x284a60,roughness:.3,metalness:.3}),
 roof:new THREE.MeshStandardMaterial({color:0xb4bcb9,roughness:.84}),road:new THREE.MeshStandardMaterial({color:0x626b6b,roughness:1}),
 paving:new THREE.MeshStandardMaterial({color:0xb0b6af,roughness:1}),grass:new THREE.MeshStandardMaterial({color:0x6c894d,roughness:1}),
 leaf:new THREE.MeshStandardMaterial({color:0x4d7345,roughness:1}),bark:new THREE.MeshStandardMaterial({color:0x807564,roughness:1}),
 white:new THREE.MeshStandardMaterial({color:0xeee9d2}),yellow:new THREE.MeshStandardMaterial({color:0xd8bd69}),blue:new THREE.MeshStandardMaterial({color:0x2d777c})
};
export function builder(){
 const buckets=new Map();
 function add(g,key,matrix){if(matrix)g.applyMatrix4(matrix);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(g);}
 function box(x,y,z,w,h,d,key='wall',angle=0){
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle),new THREE.Vector3(1,1,1));
  add(new THREE.BoxGeometry(w,h,d),key,m);
 }
 function polygon(points,y,h,key){
  const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(p[0],-p[1])));
  const g=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:1});
  g.rotateX(-Math.PI/2);g.translate(0,y,0);g.deleteAttribute('uv');add(g,key);
 }
 function finish(){
  const group=new THREE.Group();
  for(const[key,geos]of buckets){for(const g of geos){g.deleteAttribute('uv');g.clearGroups();}
   const merged=mergeGeometries(geos.map(g=>g.index?g.toNonIndexed():g));
   const mesh=new THREE.Mesh(merged,materials[key]);mesh.castShadow=!['grass','road','glass'].includes(key);mesh.receiveShadow=true;group.add(mesh);for(const g of geos)g.dispose();
  }
  return group;
 }
 return {box,polygon,add,finish};
}
export function linework(lines,color,y=.04){
 const vertices=[];
 for(const q of lines){const p=q.points;for(let i=1;i<p.length;i++)vertices.push(p[i-1][0],y,p[i-1][1],p[i][0],y,p[i][1]);if(q.closed)vertices.push(p.at(-1)[0],y,p.at(-1)[1],p[0][0],y,p[0][1]);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color}));
}
export function textSprite(text,{color='#253c3e',background='#fffffff0',size=8}={}){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,1024,128);ctx.fillStyle=color;ctx.font='600 48px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,64,960);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(size*8,size,1);return sprite;
}
