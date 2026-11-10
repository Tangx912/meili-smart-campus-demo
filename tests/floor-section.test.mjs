import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {buildFloorSection} from '../src/floor-section-geometry.js';
const floors=JSON.parse(readFileSync(new URL('../data/building11-floors.json',import.meta.url))).floors;
test('六层抽象剖视只展示1.1米低墙和底板，不展示柱、玻璃及门窗框',()=>{for(const f of floors){const root=buildFloorSection(f);assert.deepEqual(root.children.map(c=>c.name),['slab','walls']);assert.equal(root.userData.cutHeight,1.1);const bounds=new THREE.Box3().setFromObject(root);assert.ok(Math.abs(bounds.max.y-1.1)<.001);assert.ok(bounds.min.x>=-.2&&bounds.max.x<=f.width+.2);assert.ok(bounds.min.z>=-.2&&bounds.max.z<=f.depth+.2);root.traverse(o=>{if(o.isMesh)assert.equal(o.material.transparent,false);});}});
