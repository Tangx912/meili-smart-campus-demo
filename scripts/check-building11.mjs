import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('ERROR',m.text());});
try{
 await page.goto(process.env.DEMO_URL||'http://127.0.0.1:4186/');await page.waitForFunction(()=>!!window.meili);await page.waitForTimeout(3000);
 assert.equal(errors.length,0);console.log('CAMPUS',await page.locator('#render-status').innerText());
 for(const name of ['dorm','dormNorth','dormWest','dormRoof']){
  await page.evaluate(name=>meili.view(name),name);await page.waitForTimeout(1600);await page.screenshot({path:`docs/building11/${name}.png`});
  await writeFile(`docs/building11/${name}-clean.png`,Buffer.from((await page.evaluate(()=>meili.renderer.domElement.toDataURL('image/png'))).split(',')[1],'base64'));
  const visible=await page.evaluate(()=>meili.scene.children.find(g=>g.children.some(c=>c.userData?.building))?.children.filter(c=>c.visible&&c.userData.building).map(c=>c.userData.building.id));assert.deepEqual(visible,[11]);
 }
 await page.locator('[data-view=overview]').first().click();await page.waitForTimeout(1500);
 assert.equal(await page.locator('#building11-controls').isVisible(),false);
 const visible=await page.evaluate(()=>meili.scene.children.find(g=>g.children.some(c=>c.userData?.building))?.children.filter(c=>c.visible&&c.userData.building).length);assert.equal(visible,11);
 await page.screenshot({path:'docs/building11/campus.png'});
 await page.locator('#station').selectOption('dorm');await page.locator('#demo-avatar').click();await page.waitForFunction(()=>document.getElementById('avatar-status').textContent.includes('载入成功'));await page.waitForTimeout(1400);
 await page.locator('#walk').check();const before=await page.evaluate(()=>meili.avatar.root.position.toArray());await page.keyboard.down('d');await page.waitForTimeout(700);await page.keyboard.up('d');const after=await page.evaluate(()=>meili.avatar.root.position.toArray());assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>.2);assert.equal(await page.evaluate(()=>meili.avatar.clips.length),2);
 const stats=await page.evaluate(()=>({source:meili.site.buildings.find(b=>b.id===11).detail.source,drawCalls:meili.renderer.info.render.calls,triangles:meili.renderer.info.render.triangles,windows:meili.site.buildings.find(b=>b.id===11).detail.views.south.windows.length}));
 const result={date:'2026-11-10',pageErrors:errors,checks:['four detailed views','only building11 visible in inspection','all eleven restored','skinned avatar loaded','Idle/Walk preserved','walking at dorm station'],movement:{before,after},stats};await writeFile('docs/building11/browser-results.json',JSON.stringify(result,null,2));console.log('RESULT',JSON.stringify(result));assert.equal(errors.length,0);
}finally{await browser.close();}
