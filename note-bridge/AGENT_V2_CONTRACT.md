# Agent v2 implementation contract

Implementation target agreed 2026-10-24. Fresh AI storage only; no import of old browser histories. Retain existing pairing grants/configuration. New chat protocol v2 only, with an explicit upgrade error for v1.

## Website WebSocket

All frames have v:2. Keep pair/auth/auth.forget/ping and auth.ok/providers.updated/pong (provider metadata unchanged). auth.ok adds capabilities:["persistent_sessions","knowledge_tools"].

Client RPC: `{v:2,type:"request",id,method,params}`.
Response: `{v:2,type:"response",id,result}` or `{v:2,type:"response",id,error:{code,message}}`.
Push: `{v:2,type:"session.updated",sessionId,revision,session,turn?}`. session is a summary; turn is the complete bounded current/changed turn, replaced by id. Updates are committed projections, throttled; they are not raw Pi events. Reconnect resubscribes and reloads latest page; no message resubmission. Also `{v:2,type:"sessions.changed"}` for list refresh.

RPC methods:
- sessions.list {cursor?,limit?} => {sessions: SessionSummary[],nextCursor?}; newest first; default/max 20/50.
- sessions.create {providerId,model,effort?} => SessionSummary. Knowledge origin comes from authenticated socket, never browser params.
- sessions.get {sessionId,cursor?,limit?} => {session:SessionSummary,turns:ChatTurn[],nextCursor?}; latest page chronological, cursor loads earlier page; default/max 20/50.
- sessions.archive {sessionId} => {ok:true}; reject if active, archival persistent.
- session.subscribe {sessionId} => {ok:true}; followed by committed updates; UI subscribe before get to avoid race and reconcile revisions.
- session.unsubscribe {sessionId} => {ok:true}.
- messages.send {sessionId,clientRequestId,text,providerId,model,effort?,attachments?:[{docId,headingIds?:string[],contentHash?:string}]} => {runId,turnId}; defaults max question 20k chars, attachments 3. Same id+same normalized payload returns same ids; conflict rejects. Busy rejects. Runtime binds current site manifest revision per run.
- runs.cancel {sessionId} => {ok:true}; terminal cancellation is durable, only explicit cancel stops a connected/disconnected run.
- knowledge.document {docId} => {docId,title,url,contentHash,headings:[{id,title}]}; optional attachment picker reads bridge-approved current site metadata.

SessionSummary: {id,title,providerId,model,effort,createdAt,updatedAt,status:"idle"|"running"|"error",revision:number}.
ChatTurn: {id,question,answer,status:"running"|"complete"|"cancelled"|"error",sources:Citation[],toolCalls:ToolCallRecord[],error?:string,contextNotice?:string,createdAt:number}.
Citation: {sourceId,title,url,contentHash?,revision?}; url is site-relative canonical .html link with optional anchor.
ToolCallRecord: {callId,name,status:"running"|"complete"|"error",message?,overview?:{input:[{label,value}],summary?,items?:string[],note?}}.
Keep existing markdown and tool overview rendering styles. Website does not execute tools, compose model history, save chat content, or cancel on close/navigation/disconnect. Only grant token/port/UI preferences remain in localStorage.

## Private Rust / Node IPC

JSONL UTF-8 on stdin/stdout, no stdout logs. Replies `{id,result}` or `{id,error:{code,message}}`. Limit individual IPC lines 16 MiB; bounded queues and timeouts. Async push `{event:"session.updated"|"sessions.changed",connectionId,data}` maps to the WebSocket push above. stderr must be sanitized.

Rust requests:
- initialize {dataDir,providers:RuntimeProvider[],authorizations:[{id,origin}]} => {ready:true,version:2}. Rust supplies only enabled providers, reads credentials from Keychain and transmits via this private pipe, never command line. RuntimeProvider uses existing Rust Provider fields (id,name,protocol,baseUrl,model,models,authKind,enabled) plus optional secret. No credentials go into SQLite/checkpoints.
- configure {providers,authorizations} => {ok:true}; updates runtime configuration, revocation aborts affected runs. All requests/compactions/tool boundaries recheck authorization/config and hard budget.
- request {connectionId,authorizationId,origin,request:{id,method,params}} => RPC result; exact auth grant must match origin. Rust forwards only allowlisted RPC methods.
- detach {connectionId} => {ok:true}; drops subscriptions only, never aborts generation.
- shutdown {} => {ok:true}; closes Pi storage preserving interrupted tasks; explicit cancellation remains cancelled.

Node entry point builds to agent/dist/index.js; package owns independent pinned package-lock. Rust launches a packaged Node runtime + entry, or explicit developer path. Package Pi durable/ai/chord 1.4.0 after checking installed API (main differs). Worker owns SQLite, no other process writes it. Runtime exports testable service and accepts injected provider/mock fetch where useful.

## Site knowledge contract

Knowledge data stays site-hosted, independently published. Runtime GETs authenticated origin + /ai/manifest.json; only fixed root path, no browser/model supplied origin. Node knowledge adapter pins manifest revision for a run and validates data schemas and hashes. All resource paths same origin and under /ai/, redirects rejected. No full-corpus download requirement.

Site/knowledge agent owns exact manifest/doc schema and sends it to runtime implementer. It must publish catalog, graph, clusters and structured doc sections with original site anchors, resource hashes and version, plus optional public search descriptor. Use immutable hash paths within current site build; if old assets disappear during an update return explicit stale revision instead of mixing versions. Browser SW must not cache manifest with generic stale-while-revalidate policy.

Knowledge adapter exposes a small plain TypeScript class/service and six tools usable by runtime without browser/core source imports. Use only local package dependencies or node builtins. Knowledge tool result `{data,sources?,overview?}`; bounded ~192KiB UTF-8 incl metadata, paginated text/TOC/list. Runtime maps data into Pi output and overview/sources into durable details.

Knowledge adapter interface to coordinate: `KnowledgeClient(origin, options?)`, `pin(signal?):Promise<KnowledgeSnapshot>`, snapshot `execute(name,args,signal):Promise<{data,sources?,overview?}>`, `document(docId,signal?):Promise<{docId,title,url,contentHash,headings}>`; export `KNOWLEDGE_TOOL_DEFINITIONS` with name,description,inputSchema. Tools names unchanged. Registry schema conversion is runtime-owned.
