'use strict';
const{spawn}=require('node:child_process'),{create}=require('./weekly-dev-server.cjs');
if(process.env.GCLOUD_PROJECT!=='demo-factorfactor-tower'||process.env.FIREBASE_DATABASE_EMULATOR_HOST!=='127.0.0.1:9000')throw Error('DEMO_LOOPBACK_REQUIRED');
const server=create().listen(4173,'127.0.0.1'),worker=spawn(process.execPath,['server/next-authority/worker.cjs'],{stdio:'inherit',env:{...process.env,HTTP_PROXY:'',http_proxy:''}});let closing=false;
function stop(){if(closing)return;closing=true;worker.kill('SIGTERM');server.close()};process.on('SIGINT',stop);process.on('SIGTERM',stop);worker.on('exit',code=>{server.close();if(!closing)process.exitCode=code||1});
