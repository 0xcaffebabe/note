// Only the Rust IPC/gateway fixture. Real Pi persistence and upstream protocols are tested in agent/test.
import {createInterface} from 'node:readline';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
let config={}, file, sessions=[];
const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
const save=()=>writeFile(file,JSON.stringify(sessions));
for await(const line of createInterface({input:process.stdin})) {
 let frame;try { frame=JSON.parse(line);const {id,method,params:p}=frame;let result={ok:true};
 if(method==='initialize'){config=p;await mkdir(p.dataDir,{recursive:true});file=join(p.dataDir,'fixture.json');sessions=await readFile(file,'utf8').then(JSON.parse).catch(()=>[]);result={ready:true,version:2};}
 else if(method==='configure'){config=p;}
 else if(method==='shutdown'){send({id,result});break;}
 else if(method==='request'){
  if(!config.authorizations.some(a=>a.id===p.authorizationId&&a.origin===p.origin))throw Error('auth_required');
  const {method:m,params:q}=p.request;
  const current=sessions.find(s=>s.id===q.sessionId&&s.origin===p.origin);
  if(m==='sessions.list')result={sessions:sessions.filter(s=>s.origin===p.origin)};
  else if(m==='sessions.create'){const s={id:`s${sessions.length+1}`,origin:p.origin,title:'New',turns:[]};sessions.push(s);await save();result=s;}
  else if(m==='sessions.get'){if(!current)throw Error('session_not_found');result={session:current,turns:current.turns};}
  else if(m==='messages.send'){if(!current)throw Error('session_not_found');let t=current.turns.find(t=>t.id===q.clientRequestId);if(!t){t={id:q.clientRequestId,question:q.text,status:'running'};current.turns.push(t);await save();}result={runId:t.id,turnId:t.id};}
  else if(m==='runs.cancel'){for(const t of current.turns)t.status='cancelled';await save();}
 }
 send({id,result});
 }catch(error){send({id:frame?.id,error:{code:error.message,message:'Fixture operation failed'}});}
}
