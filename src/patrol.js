import * as THREE from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
export const patrolWaypoints=[[-135,95],[95,94],[109,25],[111,-100],[6,-102],[2,-95],[2,-88],[2,-75],[-14,-58],[-36,-32],[-65,10],[-69,22],[-138,22]];
export function createPatrolCurve(){
 const curve=new THREE.CurvePath(),points=patrolWaypoints.map(([x,z])=>new THREE.Vector3(x,.16,z)),radius=3.5;
 const corners=points.map((p,i)=>{const previous=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];return {p,start:p.clone().addScaledVector(previous.clone().sub(p).normalize(),radius),end:p.clone().addScaledVector(next.clone().sub(p).normalize(),radius)};});
 for(let i=0;i<corners.length;i++){const c=corners[i],next=corners[(i+1)%corners.length];curve.add(new THREE.QuadraticBezierCurve3(c.start,c.p,c.end));curve.add(new THREE.LineCurve3(c.end,next.start));}return curve;
}
export function patrolDirection(curve,t){return curve.getPointAt((t+.001)%1).sub(curve.getPointAt((t-.001+1)%1)).normalize();}
export function createPatrol({onFocus}){
 const group=new THREE.Group();group.name='robot-patrol-demo';const curve=createPatrolCurve(),length=curve.getLength();let distance=0,running=true,allowed=true,time=0,following=false;
 const additive={transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false};
 const flow=new THREE.ShaderMaterial({...additive,uniforms:{time:{value:0}},vertexShader:'varying vec2 flowUV;void main(){flowUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float time;varying vec2 flowUV;void main(){float p=fract(flowUV.x*35.0-time*.72);float a=smoothstep(.1,.35,p)*(1.0-smoothstep(.65,.92,p));gl_FragColor=vec4(.22,.94,1.0,a*.95);}'});
 for(const[radius,material]of [[.62,new THREE.MeshBasicMaterial({color:0x15a7e7,opacity:.08,...additive})],[.23,new THREE.MeshBasicMaterial({color:0x31dbe9,opacity:.25,...additive})],[.14,flow]]){const trace=new THREE.Mesh(new THREE.TubeGeometry(curve,320,radius,6,false),material);trace.raycast=()=>{};group.add(trace);}
 const robot=new THREE.Group();robot.name='R-01-inspection-robot';group.add(robot);
 const shell=new THREE.MeshStandardMaterial({color:0xddeef6,roughness:.3,metalness:.25}),dark=new THREE.MeshStandardMaterial({color:0x102b40,roughness:.35,metalness:.4}),cyan=new THREE.MeshBasicMaterial({color:0x8dfaff,toneMapped:false});
 function box(w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);robot.add(m);return m;}
 box(1.6,.5,2,0,.55,0,dark);box(1.35,1.4,1.5,0,1.35,0,shell);box(1.4,.55,.07,0,1.65,.78,dark);box(.65,.12,.09,0,1.68,.83,cyan);box(1.42,.10,1.54,0,.92,0,cyan);
 const wheels=[];for(const x of [-.9,.9])for(const z of [-.65,.65]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.25,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.35,z);robot.add(wheel);wheels.push(wheel);}
 const lidar=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.2,16),dark);lidar.position.y=2.2;robot.add(lidar);box(.12,.13,.7,0,2.33,0,cyan);
 const halo=new THREE.Mesh(new THREE.RingGeometry(2.2,2.4,64),new THREE.MeshBasicMaterial({color:0x50eeff,side:THREE.DoubleSide,opacity:.7,...additive}));halo.rotation.x=-Math.PI/2;halo.position.y=.025;robot.add(halo);
 const scan=new THREE.Mesh(new THREE.CircleGeometry(6,40,0,Math.PI*.36),new THREE.MeshBasicMaterial({color:0x45daff,side:THREE.DoubleSide,opacity:.10,...additive}));scan.rotation.x=-Math.PI/2;scan.position.y=.03;robot.add(scan);
 const radar=new THREE.Mesh(new THREE.RingGeometry(3.8,3.88,64),new THREE.MeshBasicMaterial({color:0x36ccf3,side:THREE.DoubleSide,opacity:.35,...additive}));radar.rotation.x=-Math.PI/2;radar.position.y=.04;robot.add(radar);
 const label=document.createElement('div');label.className='patrol-label';label.textContent='R-01 · 虚拟巡检';const tag=new CSS2DObject(label);tag.position.y=4;robot.add(tag);
 const panel=document.getElementById('patrol-controls'),toggle=document.getElementById('patrol-toggle'),status=document.getElementById('patrol-status'),progress=document.getElementById('patrol-progress');
 toggle.onclick=()=>{running=!running;toggle.textContent=running?'暂停巡检':'继续巡检';};document.getElementById('patrol-reset').onclick=()=>{distance=0;time=0;update(0);};document.getElementById('patrol-focus').onclick=()=>onFocus();const followButton=document.getElementById('patrol-follow');function cancelFollow(){following=false;followButton.textContent='跟随机器人';}followButton.onclick=()=>{following=!following;followButton.textContent=following?'退出跟随':'跟随机器人';if(following)onFocus();};
 function update(dt){if(!allowed)return;if(running){distance=(distance+dt*10)%length;time+=dt;}const t=distance/length,p=curve.getPointAt(t),direction=patrolDirection(curve,t);robot.position.copy(p);robot.rotation.y=Math.atan2(direction.x,direction.z);lidar.rotation.y=time*2.5;scan.rotation.z=-time*.8;radar.scale.setScalar(.7+(time*.4%1)*.6);radar.material.opacity=.5*(1-time*.4%1);flow.uniforms.time.value=time;for(const wheel of wheels)wheel.rotation.x=-distance/.33;const names=['南侧外围环道','东侧外围环道','北侧外围环道','西侧外围环道'];status.textContent=`${names[Math.min(3,Math.floor(t*4))]} · ${Math.round(t*100)}% · ${running?'巡检演示中':'已暂停'}`;progress.style.width=`${t*100}%`;}
 update(0);
 return {group,robot,curve,update,cancelFollow,get following(){return following;},setView(name){if(name!=='patrol')cancelFollow();allowed=!name.startsWith('dorm')&&!['floor','floorsAll','floorTop'].includes(name);group.visible=allowed;panel.hidden=!allowed;},get running(){return running;},get distance(){return distance;}};
}
