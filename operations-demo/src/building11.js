import * as THREE from 'three';
import {builder} from './geometry.js';
// Facade coordinates u,y are directly extracted from the supplied elevations.
// This builder creates openings and balcony cavities, not decals on a solid box.
export function buildBuilding11(b,data){
 const g=builder(),[x,z]=b.bounds,w=data.width,d=data.depth,levels=data.floorLevels;
 function patch(face,u,y,U,Y,offset,thickness,key='wall'){
  if(U-u<.001||Y-y<.001)return;
  const c=(u+U)/2,cy=(y+Y)/2;
  if(face==='south')g.box(x+c,cy,z+d+offset,U-u,Y-y,thickness,key);
  if(face==='north')g.box(x+c,cy,z-offset,U-u,Y-y,thickness,key);
  if(face==='west')g.box(x-offset,cy,z+c,thickness,Y-y,U-u,key);
  if(face==='east')g.box(x+w+offset,cy,z+c,thickness,Y-y,U-u,key);
 }
 function wall(face,rect,holes,offset,depth,key='wall'){
  const[u,y,U,Y]=rect,ys=[y,Y,...holes.flatMap(h=>[Math.max(y,h[1]),Math.min(Y,h[3])]).filter(v=>y<v&&v<Y)].sort((a,b)=>a-b);
  for(let i=1;i<ys.length;i++){
   const lo=ys[i-1],hi=ys[i];if(hi-lo<.002)continue;
   const intervals=holes.filter(h=>h[1]<hi-.001&&h[3]>lo+.001&&h[2]>u&&h[0]<U).map(h=>[Math.max(u,h[0]),Math.min(U,h[2])]).sort((a,b)=>a[0]-b[0]);let cursor=u;
   for(const[a,c]of intervals){if(a>cursor)patch(face,cursor,lo,a,hi,offset,depth,key);cursor=Math.max(cursor,c);}
   if(cursor<U)patch(face,cursor,lo,U,hi,offset,depth,key);
  }
 }
 function frameLines(face,feature,offset,key='trim'){
  const r=feature.rect;
  patch(face,r[0],r[1],r[2],r[3],offset,.045,'glass');
  // Only orthogonal CAD mullion segments become mesh bars; drafting diagonals are omitted.
  for(const[a,c]of feature.lines){
   const du=Math.abs(a[0]-c[0]),dy=Math.abs(a[1]-c[1]);
   if(du>.02&&dy<.012)patch(face,Math.min(a[0],c[0]),a[1]-.012,Math.max(a[0],c[0]),a[1]+.012,offset+.028,.055,key);
   else if(dy>.02&&du<.012)patch(face,a[0]-.012,Math.min(a[1],c[1]),a[0]+.012,Math.max(a[1],c[1]),offset+.028,.055,key);
  }
  if(!feature.lines.length){
   for(const u of [r[0],r[2]])patch(face,u-.028,r[1],u+.028,r[3],offset+.03,.06,key);
   for(const y of [r[1],r[3],r[3]-.9])patch(face,r[0],y-.025,r[2],y+.025,offset+.03,.06,key);
   for(let u=r[0]+.9;u<r[2];u+=.9)patch(face,u-.023,r[1],u+.023,r[3],offset+.03,.06,key);
  }
 }
 for(const y of levels)g.box(x+w/2,y-.09,z+d/2,w,.18,d,y===23.4?'roof':'wall');
 for(const[face,v]of Object.entries(data.views)){
  const bodyWindows=v.windows.filter(a=>a.rect[1]<23.4&&a.rect[3]<25),roofWindows=v.windows.filter(a=>a.rect[1]>=23.4);
  const balconyHoles=v.balconies.map(a=>[a.rect[0],a.rect[1],a.rect[2],a.rect[1]+2.9]);
  const isBalcony=a=>['south','north'].includes(face)&&a.rect[1]>=9&&a.rect[1]<23.4&&balconyHoles.some(h=>Math.abs(h[1]-a.rect[1])<.25&&a.rect[0]<h[2]&&a.rect[2]>h[0]);
  // Two fifth-storey railings were drawn without reusable block references.
  // Their recess bounds follow the corresponding window and adjacent 3.05m modules.
  if(face==='south')for(const a of bodyWindows.filter(a=>a.rect[1]>=9&&a.rect[1]<23.4&&!isBalcony(a))){const[u,y,U]=a.rect;balconyHoles.push([u,y,Math.min(w,U+.65),y+2.9]);}
  const apertures=bodyWindows.map(a=>a.rect);
  if(['south','north'].includes(face)){
   wall(face,[0,0,w,9],apertures,-.1,.2);
   const direct=bodyWindows.filter(a=>a.rect[1]>=9&&!isBalcony(a)).map(a=>a.rect);
   wall(face,[0,9,w,23.4],[...balconyHoles,...direct],-.9,1.8);
   wall(face,[0,9,w,23.4],apertures,-1.9,.2);
   for(const a of bodyWindows)frameLines(face,a,isBalcony(a)?-1.77:.025);
   for(const a of v.balconies){
    const[u,y,U,Y]=a.rect;
    // Same source centre lines and spacing; use lightweight box rails rather than dozens of cylinders.
    for(const[p,q]of a.lines){const du=Math.abs(p[0]-q[0]),dy=Math.abs(p[1]-q[1]);if(du>.1&&dy<.012)patch(face,Math.min(p[0],q[0]),p[1]-.012,Math.max(p[0],q[0]),p[1]+.012,-.08,.035,'trim');else if(dy>.1&&du<.012)patch(face,p[0]-.01,Math.min(p[1],q[1]),p[0]+.01,Math.max(p[1],q[1]),-.08,.035,'trim');}
    patch(face,u,y-.05,U,y,-.1,.2,'roof');
   }
  }else{
   wall(face,[0,0,d,23.4],apertures,-.1,.2);
   for(const a of bodyWindows)frameLines(face,a,.025);
  }
  // Original solid hatch fields are material regions, with actual openings cut out.
  for(const a of v.cladding){
   const r=a.rect;
   if(r[1]>23.4||a.material==='orange')continue;
   if(a.material==='louver'){
    patch(face,...r,.018,.04,'trim');
    for(let y=r[1]+.08;y<r[3]-.04;y+=.12)patch(face,r[0],y,r[2],y+.025,.052,.05,'roof');
   }else wall(face,r,apertures,.012,.024,'trim');
  }
  if(face==='south'||face==='north'){
   const breaks=face==='south'?[0,32.3,40.1,w]:[8.3,w];
   for(let i=1;i<breaks.length;i++){const height=face==='south'&&i===2?24.3:25.2;wall(face,[breaks[i-1],23.4,breaks[i],height],[], -.1,.2);patch(face,breaks[i-1],height-.07,breaks[i],height,.025,.26,'trim');}
  }else{wall(face,[face==='west'?8.9:0,23.4,d,25.2],[], -.1,.2);patch(face,face==='west'?8.9:0,25.13,d,25.2,.025,.26,'trim');}
  // Small roof core: use the real roof footprint, not the full building depth.
  const machineOffset=face==='south'?-(d-8.9):0;
  if(face==='north'||face==='south')wall(face,[0,23.4,8.3,27.9],roofWindows.map(a=>a.rect),machineOffset-.1,.2);
  if(face==='west')wall(face,[0,23.4,8.9,27.9],roofWindows.map(a=>a.rect),-.1,.2);
  for(const a of roofWindows)frameLines(face,a,machineOffset+.025);
 }
 // Sparse room/corridor partitions stop translucent glass from reading as an empty shell.
 for(let floor=0;floor<6;floor++){
  const base=levels[floor],height=levels[floor+1]-base-.18;
  for(const zz of [8.8,11.4])g.box(x+w/2,base+height/2,z+zz,w-.4,height,.12,'wall');
  if(floor>=2)for(let u=4.2;u<w-2;u+=4)for(const[a,c]of [[1.8,8.8],[11.4,18.4]])g.box(x+u,base+height/2,z+(a+c)/2,.12,height,c-a,'wall');
 }
 // East wall and roof of the stair/lift enclosure, 8.3 x 8.9 m from handle3445.
 g.box(x+8.2,25.65,z+4.45,.2,4.5,8.9,'wall');g.box(x+4.15,27.81,z+4.45,8.3,.18,8.9,'roof');
 // Main orange entrance frame: outer width 12.8m, glazing 7.4 x 3.6m.
 wall('south',[21.8,-.2,34.6,4.5],[[22,-.2,34.4,4.3]],.59,1.2,'trim');
 wall('south',[22,-.2,34.4,4.3],[[23,-.2,33.4,3.9]],.6,1.2,'orange');
 // Source side frames 1882/1887 and 1970/1973: 1.2m projection, with open centres.
 for(const face of ['west','east']){
  const v=data.views[face];
  for(const a of v.cladding.filter(a=>a.material==='orange'&&a.rect[2]-a.rect[0]>3)){
   const[u,y,U,Y]=a.rect,inner=a.holes?.length?a.holes:[[u+.6,y+.6,U-.6,Y-.6]];wall(face,a.rect,inner,.6,1.2,'orange');
  }
 }
 // Roof hot-water plant: CAD positions retained, equipment height/tilt schematic.
 for(const panel of data.solar){const[u,v,U,V]=panel.rect,cx=x+(u+U)/2,cz=z+(v+V)/2;
  g.box(cx,23.65,cz,.08,.45,Math.max(.1,V-v-.2),'trim');
  const matrix=new THREE.Matrix4().makeRotationX(-Math.PI/6);matrix.setPosition(cx,24.05,cz);
  g.add(new THREE.BoxGeometry(Math.max(.1,U-u-.08),.065,Math.max(.1,V-v-.08)),'solar',matrix);
 }
 const[u,v,U,V]=data.tank.rect;g.box(x+(u+U)/2,24.6,z+(v+V)/2,U-u,2.4,V-v,'roof');
 for(let xx=u+.5;xx<U;xx+=1)g.box(x+xx,24.6,z+v-.02,.025,2.4,.04,'trim');
 // Peripheral rainwater pipes; tube section is schematic, no complex drainage network.
 for(const[xx,zz]of [[.2,.25],[w-.2,.25],[.2,d-.25],[w-.2,d-.25]]){
  const pipe=new THREE.CylinderGeometry(.045,.045,23.4,8);pipe.translate(x+xx,11.7,z+zz);g.add(pipe,'roof');
 }
 const group=g.finish();group.name='11号综合楼 · 单体CAD精细化';group.userData.building=b;group.userData.detailSource=data.source;group.userData.detailStats={windows:Object.values(data.views).reduce((n,v)=>n+v.windows.length,0),balconyBlocks:Object.values(data.views).reduce((n,v)=>n+v.balconies.length,0),solar:data.solar.length};return group;
}
