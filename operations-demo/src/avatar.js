import * as THREE from 'three';
import {resolveFileURL} from './model-files.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export class AvatarController{
 constructor(scene,navigation,stations){this.scene=scene;this.navigation=navigation;this.stations=stations;this.root=null;this.clips=[];this.mixer=null;this.action=null;this.request=0;this.currentStation=stations[0];}
 async load(url,{height=1.75,station=this.currentStation.id,files=null}={}){
  const token=++this.request,manager=new THREE.LoadingManager(),blobs=[];let model;
  if(files){const map=new Map();for(const file of files){const blob=URL.createObjectURL(file);map.set(file.name,blob);blobs.push(blob);}
   manager.setURLModifier(path=>resolveFileURL(path,map));
  }
  try{const gltf=await new GLTFLoader(manager).loadAsync(url);model=gltf.scene;
   if(token!==this.request){this.disposeModel(model);return null;}
   const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.y)||size.y<.00001)throw new Error('模型没有有效的三维几何');
   const root=new THREE.Group(),scaled=new THREE.Group();scaled.add(model);root.add(scaled);this.scene.add(root);
   const scale=Number(height)/size.y;scaled.scale.setScalar(scale);
   scaled.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
   this.clear();this.root=root;this.model=model;this.scaled=scaled;this.baseHeight=size.y;this.height=Number(height);this.clips=gltf.animations;this.mixer=new THREE.AnimationMixer(model);
   model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   this.setStation(station);if(this.clips.length)this.setAnimation(this.clips[0].name);
   return {animations:this.clips.map(c=>c.name),skinnedMeshes:(()=>{let n=0;model.traverse(o=>{if(o.isSkinnedMesh)n++;});return n;})()};
  }finally{for(const blob of blobs)URL.revokeObjectURL(blob);}
 }
 setStation(id){const p=this.stations.find(s=>s.id===id);if(!p)throw new Error('未找到站位');if(!this.navigation.canStand(p.position[0],p.position[2]))throw new Error('站位落在碰撞区域');this.currentStation=p;if(this.root){this.root.position.fromArray(p.position);this.root.rotation.y=p.yaw||0;}}
 setAnimation(name){const clip=this.clips.find(c=>c.name===name);if(!clip)return false;this.action?.fadeOut(.2);this.action=this.mixer.clipAction(clip);this.action.reset().fadeIn(.2).play();return true;}
 resize(height){if(!this.root||!Number.isFinite(height)||height<.3||height>5)return;const ratio=height/this.height;this.scaled.scale.multiplyScalar(ratio);this.scaled.position.multiplyScalar(ratio);this.height=height;}
 move(dx,dz){if(!this.root)return false;const p=this.root.position,old=[p.x,p.z],next=this.navigation.move(old,[p.x+dx,p.z+dz]);p.set(next[0],0,next[1]);if(Math.hypot(next[0]-old[0],next[1]-old[1])>.001){this.root.rotation.y=Math.atan2(dx,dz);return true;}return false;}
 update(dt){this.mixer?.update(dt);}
 disposeModel(model){model.traverse(o=>{if(o.isMesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});}
 clear(){if(this.root){this.mixer?.stopAllAction();this.mixer?.uncacheRoot(this.model);this.scene.remove(this.root);this.disposeModel(this.model);}this.root=null;this.mixer=null;this.clips=[];}
}
