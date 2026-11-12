import test from 'node:test';
import assert from 'node:assert/strict';
import {searchSpaces} from '../src/property-search-data.js';
test('找房按用途和面积过滤，不把CAD公共空间当作库存',()=>{
 assert.deepEqual(searchSpaces('500到800平方米的研发空间').map(r=>r.id),['demo-a','demo-c']);
 assert.deepEqual(searchSpaces('900平方米以上的研发空间'),[]);
 assert.equal(searchSpaces('办公').length,1);
 assert.ok(searchSpaces('').every(r=>r.demo&&r.buildingId===null));
});
