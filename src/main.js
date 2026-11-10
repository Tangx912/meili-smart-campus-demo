import * as THREE from 'three';
import {CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildBuildings} from './buildings.js';
import {buildSite} from './site.js';
import {createSceneEffects} from './scene-effects.js';
import {createFloorSelection} from './building11-selection.js';
import {linework} from './geometry.js';
import {createNavigation} from './navigation.js';
import {FloorViewer11} from './floors11.js';
import {setupAssistant} from './assistant.js';
import {setupDashboard} from './dashboard.js';
import {AvatarController} from './avatar.js';
const $=id=>document.getElementById(id);
async function boot(){
 const [site,lines,building11,floorData]=await Promise.all(['./data/site.json','./data/site-lines.json','./data/building11.json','./data/building11-floors.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`资料加载失败: ${url}`);return r.json();}));
 site.buildings.find(b=>b.id===11).detail=building11;
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b2132);scene.fog=new THREE.Fog(0x0b2132,620,1150);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;$('viewport').append(renderer.domElement);
 const labelRenderer=new CSS2DRenderer();labelRenderer.setSize(innerWidth,innerHeight);Object.assign(labelRenderer.domElement.style,{position:'absolute',top:'0',pointerEvents:'none'});$('viewport').append(labelRenderer.domElement);
 const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.15,1800);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=2;controls.maxDistance=750;controls.maxPolarAngle=Math.PI*.491;controls.target.set(-10,0,0);
 scene.add(new THREE.HemisphereLight(0xd5efff,0x334a60,2.2));const sun=new THREE.DirectionalLight(0xe4f5ff,3);sun.position.set(-100,210,110);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-195,right:195,top:190,bottom:-190,near:1,far:500});sun.shadow.normalBias=.18;sun.shadow.bias=-.00025;scene.add(sun);scene.add(sun.target);
 const buildings=buildBuildings(site),land=buildSite(site,lines);scene.add(buildings.group,buildings.labels,land.group);
 const sceneEffects=createSceneEffects(site);scene.add(sceneEffects.group);
 const floorSelection=createFloorSelection(site.buildings.find(b=>b.id===11),floorData);scene.add(floorSelection.group);
 const inspectionBase=new THREE.Mesh(new THREE.BoxGeometry(74,.3,36),new THREE.MeshStandardMaterial({color:0x102b3d,roughness:1}));inspectionBase.position.set(36.813,-.35,-87.7114);inspectionBase.visible=false;scene.add(inspectionBase);
 const floorViewer=new FloorViewer11(floorData,site.buildings.find(b=>b.id===11));scene.add(floorViewer.group);
 const nav=createNavigation(site),avatar=new AvatarController(scene,nav,site.stations),markers=new THREE.Group();
 for(const p of site.stations){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.075,8,40),new THREE.MeshBasicMaterial({color:0xe16d38}));ring.rotation.x=-Math.PI/2;ring.position.fromArray(p.position);ring.position.y=.15;markers.add(ring);
  const dot=new THREE.Mesh(new THREE.CircleGeometry(.16,16),new THREE.MeshBasicMaterial({color:0xe16d38}));dot.rotation.x=-Math.PI/2;dot.position.copy(ring.position);markers.add(dot);
 }
 scene.add(markers);markers.visible=false;
 const cadLayer=new THREE.Group();cadLayer.add(linework(lines,0x216762,.18));cadLayer.add(linework(site.buildings.map(b=>({points:b.footprint,closed:true})),0xc95e2b,.19));cadLayer.add(linework([{points:site.boundary,closed:true}],0xc95e2b,.2));cadLayer.visible=false;scene.add(cadLayer);
 const stations=$('station');for(const p of site.stations)stations.add(new Option(p.name,p.id));
 const views={overview:{eye:[-330,303,368],target:[-12,0,0]},entrance:{eye:[-126,9,8],target:[-40,10,-4]},street:{eye:[1.65,2.4,91],target:[1.65,5.5,30]},dorm:{eye:[36.813,13.95,22.2886],target:[36.813,13.95,-87.7114]},dormNorth:{eye:[36.813,13.95,-197.7114],target:[36.813,13.95,-87.7114]},dormWest:{eye:[-43.187,13.95,-87.7114],target:[36.813,13.95,-87.7114]},dormEast:{eye:[116.813,13.95,-87.7114],target:[36.813,13.95,-87.7114]},dormSelect:{eye:[-28,44,-22],target:[36.813,12,-87.7114]},dormRoof:{eye:[-4,63,-47],target:[34,21,-87]},floor:{eye:[36.8,64,-40],target:[36.8,0,-87]},floorsAll:{eye:[69,156,25],target:[69,0,-58]},floorTop:{eye:[36.8,83,-87],target:[36.8,0,-87.01]},plan:{eye:[-15,600,.1],target:[-15,0,0]}};
 let transition=null,viewName='overview',selectedFloor=1;
 function showFloor(number){selectedFloor=number;floorViewer.show(number);view(number==='all'?'floorsAll':'floor');$('floor-room-info').hidden=number==='all';$('floor-room-title').textContent=number==='all'?'全部楼层展开':`${number}F · ${number===1?'食堂 / 大堂':number===2?'物业办公 / 活动室':'宿舍层'}`;$('floor-room-body').textContent='鼠标移入房间可点亮并查看名称，移开后自动隐藏。手机可轻点查看。';document.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',b.dataset.floor===String(number)));}
 floorViewer.onSelect=(room,floor,active,count)=>{$('floor-room-info').hidden=false;$('floor-room-title').textContent=`${floor.name} · ${room.name}`;$('floor-room-body').textContent=`${room.name} · ${floor.name}\n移开鼠标后自动熄灭并隐藏名称。`;$('floor-active-count').textContent=`已点亮 ${count} 个空间`;$('floor-room-note').textContent=`空间编号 ${room.id} · 色块依据原CAD房间分区，面积仅示意`;};
 floorViewer.onHoverEnd=()=>{$('floor-active-count').textContent='当前高亮 0 个空间';$('floor-room-title').textContent=selectedFloor==='all'?'全部楼层':`${selectedFloor}F · 空间预览`;$('floor-room-body').textContent='鼠标移入房间查看名称，移开后自动隐藏。';};
 function view(name,immediate=false){let v=views[name];if(name==='floorTop'){if(!floorViewer.group.visible)floorViewer.show(selectedFloor);if(floorViewer.mode==='all')v={eye:[69,175,-58],target:[69,0,-58.01]};}const isFloor=['floor','floorsAll','floorTop'].includes(name),inspection=name.startsWith('dorm')||isFloor,isFacade=['dorm','dormNorth','dormWest','dormEast'].includes(name),isolated=inspection;
  sceneEffects.setView(name);
  controls.maxPolarAngle=inspection&&!isFloor?Math.PI/2:Math.PI*.491;
  if(!isFloor)floorViewer.hide();
  if(inspection&&!isFloor&&innerWidth/innerHeight<1){const target=new THREE.Vector3(...v.target),eye=new THREE.Vector3(...v.eye),factor=Math.max(1,(name==='dormEast'||name==='dormWest'?.8:1.5)/(innerWidth/innerHeight));v={eye:eye.sub(target).multiplyScalar(factor).add(target).toArray(),target:v.target};}
  renderer.domElement.style.cursor='';camera.clearViewOffset();if(name==='plan'||name==='entrance')camera.setViewOffset(innerWidth,innerHeight,0,-innerHeight*(name==='plan'?.10:.065),innerWidth,innerHeight);
  if(name==='plan'&&innerWidth<1000){const distance=600*Math.max(1,1000/innerWidth);v={eye:[-15,distance,.1],target:[-15,0,0]};}

  land.group.visible=!isFloor&&(!isolated||isFacade);inspectionBase.visible=isolated&&!isFloor&&!isFacade;floorSelection.group.visible=name==='dormSelect';$('building11-selection').hidden=name!=='dormSelect';document.body.classList.toggle('inspection-mode',inspection&&!isFloor);buildings.group.visible=!isFloor;for(const object of buildings.group.children)if(!object.userData.building)object.visible=!isFloor&&(!inspection||isFacade);cadLayer.visible=!isFloor&&$('cad').checked;markers.visible=!isFloor&&$('markers').checked;if(avatar.root)avatar.root.visible=!isFloor;
  $('floor-room-info').hidden=!isFloor;document.body.classList.toggle('floor-mode',isFloor);
  $('building11-controls').hidden=!inspection;
  for(const group of buildings.pickables)group.visible=!isFloor&&(!isolated||group.userData.building.id===11);
  for(const label of buildings.labels.children)label.visible=!isFloor&&(!isolated||label.userData.buildingId===11);
  renderer.shadowMap.needsUpdate=true;viewName=name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(isFloor&&innerWidth>900){
   const eye=new THREE.Vector3(...v.eye),target=new THREE.Vector3(...v.target),forward=target.clone().sub(eye).normalize(),right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
   const sidebar=document.body.classList.contains('assistant-open')?$('xiaozhi-chat').getBoundingClientRect().width+44:334;
   const shift=eye.distanceTo(target)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*sidebar/innerHeight;
   eye.addScaledVector(right,shift);target.addScaledVector(right,shift);v={eye:eye.toArray(),target:target.toArray()};
  }
  if(immediate){camera.position.fromArray(v.eye);controls.target.fromArray(v.target);controls.update();}else transition={start:performance.now(),from:camera.position.clone(),to:new THREE.Vector3(...v.eye),tf:controls.target.clone(),tt:new THREE.Vector3(...v.target)};
 }
 function focusAvatar(){if(!avatar.root)return;const p=avatar.root.position;transition={start:performance.now(),from:camera.position.clone(),to:p.clone().add(new THREE.Vector3(-6,4.5,9)),tf:controls.target.clone(),tt:p.clone().add(new THREE.Vector3(0,1,0))};}
 view('overview',true);
 for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
 for(const b of document.querySelectorAll('[data-floor]'))b.onclick=()=>showFloor(b.dataset.floor==='all'?'all':Number(b.dataset.floor));
 for(const b of document.querySelectorAll('#building11-selection [data-floor]')){b.onpointerenter=()=>floorSelection.highlight(Number(b.dataset.floor));b.onpointerleave=()=>floorSelection.highlight(null);}
 $('clear-room-lights').onclick=()=>{floorViewer.clear();$('floor-active-count').textContent='已点亮 0 个空间';};
 const assistant=setupAssistant({site,floors:floorData,onAction:a=>{if(a.service){document.dispatchEvent(new CustomEvent('meili:service',{detail:a.service}));return;}if(a.floor==='all'||[1,2,3,4,5,6].includes(a.floor))showFloor(a.floor);else if(Object.hasOwn(views,a.view))view(a.view);if(a.room){const room=floorViewer.visiblePickables().find(m=>m.userData.room.id===a.room);if(room&&!floorViewer.active.has(a.room))floorViewer.toggle(room);}}});
 document.addEventListener('meili:assistant-layout',()=>{if(['floor','floorTop','floorsAll'].includes(viewName))view(viewName);});
 $('reset').onclick=()=>view('overview');$('toggle-panel').onclick=()=>document.body.classList.toggle('panels-hidden');
 $('labels').onchange=e=>buildings.labels.visible=e.target.checked;$('green').onchange=e=>{land.vegetation.visible=e.target.checked;renderer.shadowMap.needsUpdate=true;};$('markers').onchange=e=>markers.visible=e.target.checked;
 $('cad').onchange=e=>{
  cadLayer.visible=e.target.checked;
  buildings.group.traverse(o=>{if(!o.isMesh)return;if(!o.userData.originalMaterial){o.userData.originalMaterial=o.material;o.userData.cadMaterial=o.material.clone();o.userData.cadMaterial.transparent=true;o.userData.cadMaterial.opacity=.22;o.userData.cadMaterial.depthWrite=false;}
   o.material=e.target.checked?o.userData.cadMaterial:o.userData.originalMaterial;
  });
 };
 $('source-toggle').onclick=()=>$('sources').showModal();$('close-sources').onclick=()=>$('sources').close();
 $('capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='梅李产业中心-Demo1.png';a.href=renderer.domElement.toDataURL('image/png');a.click();};
 const status=t=>$('avatar-status').textContent=t;
 let loading=false;
 async function loadModel(url,files=null){
  if(loading)return;loading=true;status('正在载入模型与动画…');$('demo-avatar').disabled=true;$('load-url').disabled=true;
  try{const result=await avatar.load(url,{height:Number($('height').value)||1.75,station:stations.value,files});
   $('animation').replaceChildren();for(const name of result.animations)$('animation').add(new Option(name,name));if(!result.animations.length)$('animation').add(new Option('无动画',''));
   renderer.shadowMap.needsUpdate=true;status(`载入成功 · ${result.skinnedMeshes} 个蒙皮网格 · ${result.animations.length} 个动画`);focusAvatar();
  }catch(e){status(`载入失败：${e.message}。URL 需允许跨域；GLTF 请一并选择 bin 和贴图。`);}
  finally{loading=false;$('demo-avatar').disabled=false;$('load-url').disabled=false;}
 }
 $('demo-avatar').onclick=()=>loadModel('./public/models/demo-human.glb');$('upload-avatar').onclick=()=>$('files').click();
 $('files').onchange=async e=>{const files=[...e.target.files],main=files.find(f=>/\.(glb|gltf)$/i.test(f.name));if(!main){status('请选择 GLB，或 GLTF 及其配套文件');return;}const url=URL.createObjectURL(main);try{await loadModel(url,files);}finally{URL.revokeObjectURL(url);e.target.value='';}};
 $('load-url').onclick=()=>{const value=$('model-url').value.trim();if(value)loadModel(value);else status('请输入可访问的 GLB / GLTF 地址');};
 stations.onchange=()=>{try{avatar.setStation(stations.value);renderer.shadowMap.needsUpdate=true;focusAvatar();status(`已移至${avatar.currentStation.name}`);}catch(e){status(e.message);}};
 $('height').onchange=e=>avatar.resize(Number(e.target.value));$('animation').onchange=e=>avatar.setAnimation(e.target.value);
 const keys=new Set();window.addEventListener('keydown',e=>{if((/TEXTAREA|SELECT/.test(e.target.tagName)||(e.target.tagName==='INPUT'&&!['checkbox','radio'].includes(e.target.type)))||$('sources').open)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D','Shift'].includes(e.key)){if($('walk').checked)e.preventDefault();keys.add(e.key.toLowerCase());}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 $('walk').onchange=e=>{keys.clear();if(e.target.checked&&!avatar.root){e.target.checked=false;status('先载入人物，再启用行走');}else status(e.target.checked?'行走已开启 · WASD / 方向键 · 建筑轮廓碰撞生效':'行走已关闭');};
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
  pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);
  if(floorSelection.group.visible){const hit=ray.intersectObjects(floorSelection.group.children,false)[0];if(hit)showFloor(hit.object.userData.floorNumber);return;}
  if(floorViewer.group.visible){const hit=ray.intersectObjects(floorViewer.visiblePickables(),false)[0];if(hit)floorViewer.hover(hit.object);return;}
  const hit=ray.intersectObjects(buildings.pickables.filter(g=>g.visible),true)[0];if(!hit)return;let o=hit.object;while(o&&!o.userData.building)o=o.parent;const b=o?.userData.building;if(!b)return;
  const[x,z,X,Z]=b.bounds;$('detail').replaceChildren();const title=document.createElement('b'),p=document.createElement('p');title.textContent=b.name;p.textContent=`占地外包 ${(X-x).toFixed(2)} × ${(Z-z).toFixed(2)} m · 主体屋面 ${b.mainHeight.toFixed(2)} m · 机房最高点 ${b.height.toFixed(2)} m。层高 ${b.floors.join(' / ')} m。${b.geometryStatus}。`;$('detail').append(title,p);if(b.id===11){const button=document.createElement('button');button.className='text-button';button.textContent='精看综合楼 / 拆出楼层 ↗';button.onclick=()=>view('dorm');$('detail').append(button);}
 });
 renderer.domElement.addEventListener('dblclick',e=>{
  if(floorViewer.group.visible||floorSelection.group.visible)return;
  pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(buildings.pickables.filter(g=>g.visible),true)[0];let object=hit?.object;while(object&&!object.userData.building)object=object.parent;if(object?.userData.building.id===11)view('dormSelect');
 });
 renderer.domElement.addEventListener('pointerleave',()=>{if(floorViewer.group.visible)floorViewer.clear();});
 renderer.domElement.addEventListener('pointermove',e=>{if(floorViewer.group.visible){pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(floorViewer.visiblePickables(),false)[0];floorViewer.hover(hit?.object);return;}if(!floorSelection.group.visible)return;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(floorSelection.group.children,false)[0];floorSelection.highlight(hit?.object.userData.floorNumber);renderer.domElement.style.cursor=hit?'pointer':'';});
 controls.addEventListener('start',()=>transition=null);
 window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);labelRenderer.setSize(innerWidth,innerHeight);});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('render-status').textContent='WebGL 上下文丢失，请刷新页面';});
 const labelRay=new THREE.Ray();let lastLabelCheck=0;
 const labelMasses=buildings.pickables.map(group=>{const b=group.userData.building,[x,z,X,Z]=b.bounds;return {group,id:b.id,box:new THREE.Box3(new THREE.Vector3(x,0,z),new THREE.Vector3(X,b.mainHeight,Z))};});
 function updateLabelOcclusion(now){if(now-lastLabelCheck<100)return;lastLabelCheck=now;
  const inspection=['dormSelect','dormRoof'].includes(viewName),floorMode=floorViewer.group.visible,occluders=labelMasses.filter(m=>m.group.visible);
  function nearest(target){const direction=target.clone().sub(camera.position),limit=direction.length();labelRay.set(camera.position,direction.normalize());let distance=limit+1,id=null;for(const m of occluders){const hit=labelRay.intersectBox(m.box,new THREE.Vector3());if(hit){const d=hit.distanceTo(camera.position);if(d<distance){distance=d;id=m.id;}}}return id;}
  for(const label of buildings.labels.children){const id=label.userData.buildingId;label.visible=!floorMode&&(!inspection||id===11);if(!label.visible)continue;
   const blocker=nearest(label.position);if(blocker!==null&&blocker!==id){label.visible=false;continue;}
   const building=site.buildings.find(b=>b.id===id),[x,z,X,Z]=building.bounds;
   label.visible=[[.5,.5],[.15,.15],[.85,.15],[.15,.85],[.85,.85]].some(([u,v])=>nearest(new THREE.Vector3(x+(X-x)*u,building.mainHeight-.3,z+(Z-z)*v))===id);
  }
 }
 let previous=performance.now(),fpsStart=previous,frames=0,movingLast=false;
 function render(now){
  requestAnimationFrame(render);const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(transition){const t=Math.min(1,(now-transition.start)/1100),ease=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.tf,transition.tt,ease);if(t===1)transition=null;}
  let moved=false;
  if($('walk').checked&&avatar.root){
   const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3(-forward.z,0,forward.x),delta=new THREE.Vector3();
   if(keys.has('w')||keys.has('arrowup'))delta.add(forward);if(keys.has('s')||keys.has('arrowdown'))delta.sub(forward);if(keys.has('d')||keys.has('arrowright'))delta.add(right);if(keys.has('a')||keys.has('arrowleft'))delta.sub(right);
   if(delta.lengthSq()){delta.normalize().multiplyScalar(dt*(keys.has('shift')?4:1.6));const before=avatar.root.position.clone();moved=avatar.move(delta.x,delta.z);const actual=avatar.root.position.clone().sub(before);camera.position.add(actual);controls.target.add(actual);}
   if(moved!==movingLast){const name=moved?'Walk':'Idle';if(avatar.setAnimation(name))$('animation').value=name;movingLast=moved;}
  }
  sceneEffects.update(now);avatar.update(dt);if(moved)renderer.shadowMap.needsUpdate=true;controls.update();updateLabelOcclusion(now);renderer.render(scene,camera);labelRenderer.render(scene,camera);frames++;
  if(now-fpsStart>1000){$('render-status').textContent=`场景就绪 · ${Math.round(frames*1000/(now-fpsStart))} FPS · 米制坐标`;frames=0;fpsStart=now;}
 }
 requestAnimationFrame(render);
 // Stable extension entry point for custom digital humans and future navigation.
 window.meili={site,scene,camera,renderer,controls,navigation:nav,avatar,loadAvatar:(url,options)=>avatar.load(url,options),stations:site.stations,view,showFloor,floorViewer,assistant,setAssistantProvider:fn=>assistant.setProvider(fn),focusAvatar,get viewName(){return viewName;}};
 window.meili.dashboard=setupDashboard({site,floors:floorData,assistant});
 $('render-status').textContent='场景就绪 · 11 栋建筑 · CAD 米制';
}
boot().catch(e=>{$('render-status').textContent=`启动失败：${e.message}`;console.error(e);});
