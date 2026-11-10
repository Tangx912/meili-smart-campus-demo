import {mkdir,copyFile,cp,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),dest=path.join(root,'dist');
// Only the disposable build directory is replaced. Original CAD and source files stay local.
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});
for(const name of ['src','public'])await cp(path.join(root,name),path.join(dest,name),{recursive:true});
await copyFile(path.join(root,'index.html'),path.join(dest,'index.html'));
await mkdir(path.join(dest,'data'),{recursive:true});for(const name of ['site.json','site-lines.json','building11.json','building11-floors.json'])await copyFile(path.join(root,'data',name),path.join(dest,'data',name));
await mkdir(path.join(dest,'docs'),{recursive:true});await copyFile(path.join(root,'docs/SOURCES.md'),path.join(dest,'docs/SOURCES.md'));
await copyFile(path.join(root,'docs/SMART_SCREEN.md'),path.join(dest,'docs/SMART_SCREEN.md'));
await mkdir(path.join(dest,'docs/building11'),{recursive:true});await copyFile(path.join(root,'docs/building11/DETAILS.md'),path.join(dest,'docs/building11/DETAILS.md'));await copyFile(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(dest,'THIRD_PARTY_NOTICES.md'));
await mkdir(path.join(dest,'node_modules/three'),{recursive:true});for(const name of ['build','examples/jsm','LICENSE'])await cp(path.join(root,'node_modules/three',name),path.join(dest,'node_modules/three',name),{recursive:true});
await writeFile(path.join(dest,'.nojekyll'),'');
console.log('Built dist/: offline static assets, no raw DWG / personal documents.');
