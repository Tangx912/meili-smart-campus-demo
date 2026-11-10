import * as THREE from 'three';
function lightTrace(points,{closed=false,color=0x54dbea,radius=.055}={}){
 const curve=new THREE.CurvePath(),vertices=points.map(p=>new THREE.Vector3(...p));if(closed)vertices.push(vertices[0]);for(let i=1;i<vertices.length;i++)curve.add(new THREE.LineCurve3(vertices[i-1],vertices[i]));
 const group=new THREE.Group();
 for(const[scale,opacity]of [[11,.035],[5,.10],[2.3,.22],[1,.94]]){const geometry=new THREE.TubeGeometry(curve,Math.max(12,vertices.length*5),radius*scale,5,false);const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});const mesh=new THREE.Mesh(geometry,material);mesh.raycast=()=>{};group.add(mesh);}
 return group;
}
export function createSceneEffects(site){
 const group=new THREE.Group();group.name='campus-light-effects';const perimeter=lightTrace(site.boundary.map(([x,z])=>[x,.18,z]),{closed:true,radius:.085});perimeter.name='boundary-light';group.add(perimeter);
 const routes=new THREE.Group();routes.name='path-lights';for(const x of [1.65,37.7])routes.add(lightTrace([[x+.45,.12,20],[x+.45,.12,88]],{radius:.055}));group.add(routes);
 const roofs=new THREE.Group();roofs.name='roof-lights';for(const b of site.buildings){const height=b.id===11?25.31:b.mainHeight+.14;const edge=lightTrace(b.footprint.map(([x,z])=>[x,height,z]),{closed:true,radius:.045});edge.userData.buildingId=b.id;roofs.add(edge);}group.add(roofs);
 const field=new THREE.Group();field.name='site-light-field';
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(340,278),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 glowUV; void main(){glowUV=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 glowUV; void main(){vec2 p=(glowUV-.5)*2.0;float a=exp(-dot(p,p)*2.2)*.17;gl_FragColor=vec4(.05,.48,.68,a);}',toneMapped:false}));glow.rotation.x=-Math.PI/2;glow.position.set(-15,.085,0);field.add(glow);
 field.add(lightTrace([[-185,-.57,-139],[155,-.57,-139],[155,-.57,139],[-185,-.57,139]],{closed:true,color:0x399ac7,radius:.075}));
 for(const b of site.buildings){const trace=lightTrace(b.footprint.map(([x,z])=>[x,.16,z]),{closed:true,radius:.07});trace.userData.buildingId=b.id;field.add(trace);}group.add(field);
 const moving=[];for(const x of [1.65,37.7])for(let i=0;i<3;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),new THREE.MeshBasicMaterial({color:0xc0fbff,toneMapped:false}));dot.raycast=()=>{};routes.add(dot);moving.push({dot,x:x+.45,offset:i/3});}
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 return {group,update(time){if(reduced||!group.visible)return;for(const p of moving)p.dot.position.set(p.x,.34,20+((time*.00006+p.offset)%1)*68);},setView(name){const floor=['floor','floorsAll','floorTop'].includes(name),inspection=name.startsWith('dorm'),facade=['dorm','dormNorth','dormWest','dormEast'].includes(name);group.visible=!floor;perimeter.visible=!inspection||facade;routes.visible=!inspection||facade;field.visible=!inspection||facade;for(const roof of roofs.children)roof.visible=!inspection||roof.userData.buildingId===11;}};
}
