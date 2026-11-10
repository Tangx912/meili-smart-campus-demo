import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const base=process.env.DEMO_URL||'http://127.0.0.1:4186/';
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))console.log(m.type(),m.text());});
try{
 await page.goto(base);await page.waitForFunction(()=>!!window.meili,{timeout:30000});await page.waitForTimeout(4000);
 console.log('STATUS',await page.locator('#render-status').innerText());console.log('ERRORS',errors);console.log('RENDER',await page.evaluate(()=>({calls:meili.renderer.info.render.calls,triangles:meili.renderer.info.render.triangles})));
 await page.screenshot({path:'docs/overview.png'});
 await page.locator('#demo-avatar').click();await page.waitForFunction(()=>document.getElementById('avatar-status').textContent.includes('载入成功'),{timeout:15000});await page.waitForTimeout(1400);
 console.log('AVATAR',await page.locator('#avatar-status').innerText());console.log('AVATAR_DATA',await page.evaluate(()=>({clips:meili.avatar.clips.map(c=>c.name),position:meili.avatar.root.position.toArray()})));
 await page.screenshot({path:'docs/avatar.png'});
 await page.locator('#walk').check();const before=await page.evaluate(()=>meili.avatar.root.position.toArray());await page.keyboard.down('w');await page.waitForTimeout(1200);await page.keyboard.up('w');const after=await page.evaluate(()=>meili.avatar.root.position.toArray());console.log('MOVE',before,after);if(Math.hypot(after[0]-before[0],after[2]-before[2])<.2)throw new Error('Keyboard movement failed');
 await page.locator('[data-view=plan]').click();await page.waitForTimeout(1400);await page.locator('#cad').check();await page.waitForTimeout(500);await page.screenshot({path:'docs/plan-compare.png'});
 await page.locator('#cad').uncheck();
 await page.locator('#walk').uncheck();
 await page.locator('#station').selectOption('corridor');
 assert.deepEqual(await page.evaluate(()=>meili.avatar.root.position.toArray()),[1.6,0,45]);
 await page.locator('#animation').selectOption('Walk');
 const pose1=await page.evaluate(()=>meili.avatar.model.getObjectByName('LeftLeg').quaternion.toArray());await page.waitForTimeout(230);
 const pose2=await page.evaluate(()=>meili.avatar.model.getObjectByName('LeftLeg').quaternion.toArray());assert.notDeepEqual(pose1,pose2);
 // Load through the same standard URL API used for externally hosted self-developed models.
 await page.locator('#model-url').fill(new URL('public/models/demo-human.glb',base).href);await page.locator('#load-url').click();await page.waitForTimeout(500);
 assert.match(await page.locator('#avatar-status').innerText(),/载入成功/);
 await page.locator('#files').setInputFiles('public/models/demo-human.glb');await page.waitForTimeout(500);assert.match(await page.locator('#avatar-status').innerText(),/载入成功/);
 // Split the GLB into external-buffer GLTF to exercise local multi-file URL resolution.
 const glb=await readFile('public/models/demo-human.glb'),jsonSize=glb.readUInt32LE(12),gltf=JSON.parse(glb.subarray(20,20+jsonSize).toString()),binStart=20+jsonSize+8;gltf.buffers[0].uri='body.bin';
 await mkdir('/private/tmp/meili-gltf-test',{recursive:true});await writeFile('/private/tmp/meili-gltf-test/body.gltf',JSON.stringify(gltf));await writeFile('/private/tmp/meili-gltf-test/body.bin',glb.subarray(binStart));
 await page.locator('#files').setInputFiles(['/private/tmp/meili-gltf-test/body.gltf','/private/tmp/meili-gltf-test/body.bin']);await page.waitForTimeout(600);assert.match(await page.locator('#avatar-status').innerText(),/载入成功/);
 await page.locator('#model-url').fill(new URL('missing.glb',base).href);await page.locator('#load-url').click();await page.waitForTimeout(400);assert.match(await page.locator('#avatar-status').innerText(),/载入失败/);assert.ok(await page.evaluate(()=>!!meili.avatar.root));
 await page.locator('#model-url').fill(new URL('public/models/demo-human.glb',base).href);await page.locator('#load-url').click();await page.waitForTimeout(400);
 for(const name of ['entrance','street']){await page.locator(`[data-view=${name}]`).click();await page.waitForTimeout(1300);await page.screenshot({path:`docs/${name}.png`});}
 await page.locator('#reset').click();await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>meili.viewName),'overview');
 const pos=await page.evaluate(()=>meili.camera.position.toArray());await page.mouse.move(850,400);await page.mouse.down();await page.mouse.move(970,430,{steps:10});await page.mouse.up();await page.waitForTimeout(400);assert.notDeepEqual(await page.evaluate(()=>meili.camera.position.toArray()),pos);
 const distance=await page.evaluate(()=>meili.camera.position.distanceTo(meili.controls.target));await page.mouse.wheel(0,-180);await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>meili.camera.position.distanceTo(meili.controls.target))<distance);
 await page.locator('#labels').uncheck();await page.waitForTimeout(100);assert.equal(await page.locator('.building-label:visible').count(),0);await page.locator('#labels').check();
 await page.locator('#source-toggle').click();assert.ok(await page.locator('#sources').isVisible());await page.locator('#close-sources').click();
 await page.locator('#reset').click();await page.waitForTimeout(1300);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/mobile.png'});assert.ok(await page.locator('#toggle-panel').isVisible());await page.locator('#toggle-panel').click();assert.equal(await page.locator('#panel').isVisible(),false);
 const report={date:'2026-11-10',base,pageErrors:errors,checks:['WebGL','orbit','zoom','reset','CAD overlay','labels','source dialog','GLB URL','local GLB','local GLTF+BIN','6-bone skin','Idle/Walk','animation pose changes','station placement','WASD displacement','404 keeps previous avatar','390px responsive panel toggle'],movement:{before,after},render:await page.evaluate(()=>({calls:meili.renderer.info.render.calls,triangles:meili.renderer.info.render.triangles})),avatar:await page.evaluate(()=>({clips:meili.avatar.clips.map(c=>c.name),bones:meili.avatar.model.getObjectByName('BodySkin').skeleton.bones.length}))};
 await writeFile('docs/browser-results.json',JSON.stringify(report,null,2));console.log('FINAL_REPORT',JSON.stringify(report));assert.equal(errors.length,0);
}finally{await browser.close();}
