export function resolveFileURL(path,files){
 if(path.startsWith('data:'))return path;
 const name=decodeURIComponent(path.split('/').pop().split('?')[0]);
 return files.get(name)||path;
}
