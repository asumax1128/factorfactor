'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
function create(){return http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep)||/\/(?:\.|server|node_modules|firebase|tests|scripts)/.test(u.pathname)){res.writeHead(404);return res.end()}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end()}
 const ext=path.extname(file),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'};res.setHeader('Content-Type',mime[ext]||'application/octet-stream');res.setHeader('Cache-Control','no-store');if(ext==='.html')return res.end(fs.readFileSync(file,'utf8').replace('</head>','<script src="ui-next/emulator-bootstrap.js"></script></head>'));fs.createReadStream(file).pipe(res);
 })}
module.exports={create};if(require.main===module)create().listen(4173,'127.0.0.1',()=>console.log('Weekly development UI listening on loopback port 4173'));
