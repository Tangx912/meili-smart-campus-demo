export function inside(x,z,polygon){
 let hit=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;
 }
 return hit;
}
function distance(x,z,a,b){
 const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
 return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}
export function createNavigation(site){
 const blocked=[...site.buildings.map(b=>b.footprint),...(site.obstacles||[]).map(b=>b.footprint)];
 function canStand(x,z,radius=.35){
  if(!inside(x,z,site.boundary))return false;
  if(site.boundary.some((a,i)=>distance(x,z,a,site.boundary[(i+1)%site.boundary.length])<radius))return false;
  return !blocked.some(p=>inside(x,z,p)||p.some((a,i)=>distance(x,z,a,p[(i+1)%p.length])<radius));
 }
 function move(from,to){
  const steps=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/.15));let last=[...from];
  for(let i=1;i<=steps;i++){
   const x=from[0]+(to[0]-from[0])*i/steps,z=from[1]+(to[1]-from[1])*i/steps;
   if(!canStand(x,z))break;last=[x,z];
  }
  return last;
 }
 return {canStand,move,groundHeight:(x,z)=>canStand(x,z)?0:null};
}
