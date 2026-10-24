# note-bridge WebSocket protocol v2

The website is a thin client of the desktop-owned Pi agent. All frames use UTF-8 JSON with `v: 2`. v1 chat generation and browser-executed tool results are no longer supported; incompatible clients receive an upgrade error. Old browser chat histories are neither read nor imported. Existing pairing grants and model configuration remain usable.

## Connection and authentication

The listener binds only `127.0.0.1`, default port `19661`, path `/ws`. An exact allowed Origin and `Host: 127.0.0.1:<port>` are required; missing/null origins fail. Authentication must arrive within ten seconds. At most eight connections are admitted. Each frame is bounded to 16 MiB.

Pair with `{v:2,type:"pair",code:"123456"}`. A correct six-digit code authenticates immediately, is consumed once, and expires after two minutes; ten failed attempts invalidate it. Reconnect with `{v:2,type:"auth",token:"opaque-token"}`. The successful response is:

```json
{"v":2,"type":"auth.ok","connectionId":"socket-id","authorizationId":"grant-id","token":"opaque-token","capabilities":["persistent_sessions","knowledge_tools"],"providers":[{"id":"provider-id","name":"Gateway","protocol":"responses","model":"custom-model","models":[{"id":"custom-model","name":"My model","efforts":["default","high"],"contextWindowTokens":1000000,"maxOutputTokens":16384}]}]}
```

Only provider/model display metadata is exposed, never endpoint, secret or local source path. Desktop provider edits push `{v:2,type:"providers.updated",providers:[...]}`. Browser pairing storage remains `{version:1,port,token}` under `note:ai-bridge:v1`; this storage version is independent of the wire protocol. The bridge stores only token hashes, bound to exact Origin. Up to 32 grants persist until revoked. Multiple tabs may use one grant concurrently.

`auth.forget` revokes only the caller's grant and closes its sockets. Native revocation also aborts the grant's active work. Ordinary disconnection drops subscriptions, not Pi tasks. A saved token alone never means connected. The browser retries transport failures with 1/2/4/8/16/30 second backoff, and does not resend model requests automatically. `auth_failed` clears the rejected token.

Send `{v:2,type:"ping"}` periodically; the response is `pong`. Silent sockets close after 90 seconds. Connection failures use `{v:2,type:"error",code,message}`.

## Session RPC

Request and responses:

```json
{"v":2,"type":"request","id":"rpc-id","method":"sessions.list","params":{"limit":20}}
{"v":2,"type":"response","id":"rpc-id","result":{"sessions":[]}}
{"v":2,"type":"response","id":"rpc-id","error":{"code":"busy","message":"此对话正在生成回答"}}
```

RPC IDs contain 1–80 ASCII letters/digits or `_ - : .`. Params must be an object, at most 128 KiB; at most 16 RPCs per connection and 64 private IPC calls are outstanding. Private calls have a 45-second response deadline; a timeout does not imply a generation was not accepted. Read the session before resubmitting. `clientRequestId` provides durable generation idempotency.

| Method | Params | Result |
| --- | --- | --- |
| sessions.list | cursor?, limit? | sessions, nextCursor? |
| sessions.create | providerId, model, effort? | SessionSummary |
| sessions.get | sessionId, cursor?, limit? | session, turns, nextCursor? |
| sessions.archive | sessionId | ok; active sessions must first be stopped |
| session.subscribe | sessionId | ok; later committed pushes |
| session.unsubscribe | sessionId | ok; does not cancel |
| messages.send | sessionId, clientRequestId, text, providerId, model, effort?, attachments? | runId, turnId |
| runs.cancel | sessionId | ok; durably cancels the active run |
| knowledge.document | docId | docId, title, url, contentHash, headings |

List/page sizes default to 20, maximum 50. Session lists are newest first. Turn pages are chronological; the first page holds newest turns and nextCursor requests earlier ones. The server also bounds serialized page bytes. A session summary contains id, title, providerId, model, effort, createdAt, updatedAt, status (`idle/running/error`) and revision.

A turn contains id, question, answer, status (`running/complete/cancelled/error`), sources, toolCalls, createdAt, optional error and contextNotice. Tool records contain callId, name, status (`running/complete/error`), optional message and overview. Overviews are display metadata with input label/value pairs, summary, items and note; raw opaque provider reasoning is not exposed to the webpage. Citations carry sourceId, title, canonical site-relative URL and optional contentHash/revision.

A message sends only current user text and document references; it never submits full model history or tool schemas. Text is bounded to 20,000 characters; attachments are at most three `{docId,headingIds?,contentHash?}` references. The bridge binds the website origin from authentication, obtains the current manifest and validates attachment hashes. It persists a normalized request hash: identical clientRequestId+payload returns the original IDs, conflicting reuse fails. Busy sessions reject a second unrelated send.

## Committed updates and reconnect

```json
{"v":2,"type":"session.updated","sessionId":"123","revision":456,"session":{"id":"123","title":"Question","providerId":"provider-id","model":"custom-model","effort":"default","createdAt":1,"updatedAt":2,"status":"running","revision":456},"turn":{"id":"turn-id","question":"Question","answer":"Partial answer","createdAt":2,"status":"running","sources":[],"toolCalls":[]}}
{"v":2,"type":"sessions.changed"}
```

A push replaces the specified turn by ID; it is a bounded projection of committed state, not a raw Pi delta or a second transcript. Clients subscribe before reading the newest page and use revision to avoid overwriting newer updates with older RPC snapshots. Reconnect performs subscribe/get again. Slow downstreams, lost internal events and a restarted worker close the socket so reconnect obtains a fresh snapshot. A disconnected page never replays messages.send automatically.

Closing the assistant, navigating and changing sessions only unsubscribe. Explicit runs.cancel is the only website operation that stops generation. SQLite and tasks belong to the worker, independent of connectionId. On bridge service restart, valid unfinished tasks resume subject to persisted authorization, model, deadline and budgets. This may resend an interrupted model HTTP request; it is not exact network-stream continuation. Explicitly cancelled tasks stay cancelled.

## Knowledge data and execution

Knowledge content remains independently published on the core website. Bridge reads `/ai/manifest.json` at the authenticated Origin and only hash-verified resources under `/ai/`. Manifest schema version and content revision are independent of desktop release and chat protocol. The six registered tools are get_knowledge_overview, search_documents, get_toc, get_document, get_knowledge_network and get_related_documents. No arbitrary URL, local file, shell or config tools are available. Results are paginated and bounded; source evidence and UI overview metadata persist with the turn.

Search may use a public, read-only site index such as Algolia. Index revisions may differ from the content snapshot; results are discovery candidates, and canonical references are validated through the pinned catalog and document content. Failures and directory-only fallback are explicit.

Pi owns the loop, transcript, compression and task recovery. Bridge enforces 32 normal model requests plus one final tools-disabled synthesis, 128 tool executions, 20-minute total deadline, 60-second tool deadline and 180-second upstream wait budget. Requests for retry/compaction count toward persisted budgets. Model context/output defaults are 1,000,000/16,384 tokens, overridable per model; Pi compresses older context without deleting its original transcript. Raw upstream input is bounded to 16 MiB, cumulative response to 64 MiB and visible answer projection to 200,000 characters.

## Native and private boundary

Desktop configuration discovery, model-list fetch and credential editing remain native-only. The three model protocols are Anthropic Messages, OpenAI Responses and Chat Completions, with arbitrary configured model IDs and compatible custom endpoints. `default` effort omits the upstream parameter; it is not `none`. Unsupported explicit settings fail rather than silently degrading.

Rust launches its bundled Node process using private stdin/stdout JSONL. It injects enabled provider configuration and credentials, and current exact-origin grants. Neither executable arguments nor browser frames contain API keys. Pi credential environment/file discovery is disabled. Secrets enter only actual HTTP auth headers, never persistent stream options, compaction or generation checkpoints. No Node execution endpoint is exposed on another port.

The private methods are initialize/configure/request/detach/shutdown. They are not website RPC methods. The gateway supplies connectionId, authorizationId and Origin itself. Configuration failures shut down the stale worker before automatic recovery. One worker owns one SQLite database; saved model transcript is the sole message truth. Browser storage holds only pairing information/UI preferences.
