import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation} from '../src/navigation.js';
const site={boundary:[[-10,-10],[10,-10],[10,10],[-10,10]],buildings:[{footprint:[[-1,-2],[1,-2],[1,2],[-1,2]]}],obstacles:[]};
test('building interiors and boundary reject movement',()=>{const n=createNavigation(site);assert.equal(n.canStand(0,0),false);assert.equal(n.canStand(11,0),false);assert.equal(n.canStand(5,5),true);assert.equal(n.canStand(1.1,0),false)});
test('continuous movement cannot tunnel through buildings',()=>{const n=createNavigation(site);const p=n.move([-5,0],[5,0]);assert.ok(p[0]<-1.3);assert.equal(n.groundHeight(0,0),null);assert.equal(n.groundHeight(5,5),0)});
