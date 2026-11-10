import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('.',import.meta.url)));
const port=Number(process.env.PORT)||4186;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const file=(await stat(p)).isDirectory()?path.join(p,'index.html'):p;
  const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已被占用，请设置 PORT=4187 或关闭原服务。`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${port}`;console.log(`梅李产业中心 Demo1 → ${url}`);if(process.argv.includes('--open')){const cmd=process.platform==='darwin'?'open':process.platform==='win32'?'cmd':'xdg-open';spawn(cmd,process.platform==='win32'?['/c','start','',url]:[url],{stdio:'ignore'}).on('error',()=>console.log('请手动在浏览器打开上述地址'));}});
