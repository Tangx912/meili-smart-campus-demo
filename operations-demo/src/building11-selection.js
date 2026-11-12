import * as THREE from 'three';
export function createFloorSelection(building,floors){
 const group=new THREE.Group();group.name='11号楼选层';group.visible=false;const [x,z,X,Z]=building.bounds;
 for(const floor of floors.floors){const material=new THREE.MeshBasicMaterial({color:0x67b8ad,transparent:true,opacity:0,depthWrite:false,depthTest:false});const mesh=new THREE.Mesh(new THREE.BoxGeometry(X-x+.12,floor.height-.06,Z-z+.12),material);mesh.position.set((x+X)/2,floor.level+floor.height/2,(z+Z)/2);mesh.userData.floorNumber=floor.number;mesh.renderOrder=10;const outline=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x8ffaff,depthTest:false,transparent:true,opacity:1,toneMapped:false}));outline.visible=false;outline.renderOrder=11;mesh.add(outline);group.add(mesh);}
 return {group,highlight(number){for(const mesh of group.children){const active=mesh.userData.floorNumber===number;mesh.material.opacity=active?.43:0;mesh.children[0].visible=active;}}};
}
