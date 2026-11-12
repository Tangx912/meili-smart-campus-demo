import * as THREE from 'three';
// Procedural daylight reflection: no new external assets or scene geometry.
export function applyDaylight(scene,renderer){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d'),sky=ctx.createLinearGradient(0,0,0,256);
 for(const[stop,color]of [[0,'#a5bfd2'],[.46,'#e4e9e6'],[.53,'#b5beb0'],[1,'#6c796b']])sky.addColorStop(stop,color);ctx.fillStyle=sky;ctx.fillRect(0,0,512,256);
 const sun=ctx.createRadialGradient(105,64,0,105,64,88);sun.addColorStop(0,'rgba(255,251,238,1)');sun.addColorStop(.2,'rgba(255,251,238,.7)');sun.addColorStop(1,'rgba(255,251,238,0)');ctx.fillStyle=sun;ctx.fillRect(0,0,512,256);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.mapping=THREE.EquirectangularReflectionMapping;const generator=new THREE.PMREMGenerator(renderer);scene.environment=generator.fromEquirectangular(texture).texture;scene.environmentIntensity=.35;texture.dispose();generator.dispose();
}
