# note-bridge WebSocket protocol v1

The website and desktop application implement this contract independently. No note source files, Node modules, or build artifacts are shared with bridge-core.

The listener binds **127.0.0.1 only**, default port **19661**, path **/ws**. The port can be changed in the desktop application. The client must use that literal loopback address. A handshake requires an exact allowed `Origin` and `Host: 127.0.0.1:<port>`; missing or `null` origins are rejected. Allowlisting an origin does not authenticate it.

All messages are UTF-8 JSON objects with `v: 1` and a `type`. Frames/messages are limited to 512 KiB. Unknown protocol versions fail authentication. At most eight sockets can remain connected (including sockets waiting for authentication). No HTTP forwarding, credential export, file access, or configuration-management operations are exposed over WebSocket. An authenticated website can revoke only its own remembered authorization.

## Pairing

1. Start the service and open pairing in the desktop application. It displays a six-digit code, valid for two minutes. Ten failed attempts invalidate the code.
2. The website opens a socket and sends its first message within ten seconds:

   ```json
   {"v":1,"type":"pair","code":"123456"}
   ```

3. A correct code is consumed once and authenticates the website immediately. No additional desktop approval is required. The website receives the following frame directly. The provider list contains only enabled providers and no endpoint, key, source file, or credential reference:

   ```json
   {"v":1,"type":"auth.ok","connectionId":"socket-uuid","authorizationId":"authorization-uuid","token":"opaque-random-token","providers":[{"id":"uuid","name":"My model","protocol":"responses","model":"configured-model","efforts":["default","high"],"models":[{"id":"configured-model","name":"Default model","efforts":["default","high"]},{"id":"vendor/custom-model","name":"Custom model","efforts":["default","xhigh"],"defaultEffort":"xhigh"}]}]}
   ```

Successful pairing creates a persistent authorization bound to the exact origin and a high-entropy opaque token. The desktop persists only the token hash and authorization metadata in its application data directory; raw tokens are never included in desktop snapshots, UI, or logs. The note website stores `{version: 1, port, token}` under `note:ai-bridge:v1` in origin-scoped `localStorage`, so a refresh or subsequent visit can authenticate again. Up to 32 remembered authorizations are retained, with no automatic expiry; explicitly revoke unused authorizations to make room for another pairing. This is a local bridge authorization, not an upstream model API key. Provider API keys remain in the operating system credential store and are never sent to the website. Tokens must not be put in URL query parameters.

## Model lists and live updates

Each provider keeps `model` as its default and includes `models: [{id,name,efforts,defaultEffort?}]`. IDs are scoped to the provider; two services may use the same model ID. At most 200 models per provider and 400 across all providers are stored. No endpoint, local path or credential is included. The legacy provider-level `efforts` describes its default model.

Saving, enabling, disabling or deleting a provider in the native application pushes the complete enabled list to authenticated sockets:

```json
{"v":1,"type":"providers.updated","providers":[{"id":"provider-uuid","name":"Gateway","protocol":"responses","model":"vendor/default","models":[{"id":"vendor/default","name":"Default","efforts":["default"]},{"id":"vendor/reasoner","name":"Reasoner","efforts":["default","high","xhigh"]}]}]}
```

This is a metadata update, not a connection state change. Clients update selectors without cancelling an active answer; subsequent requests validate against the current saved list. A question still preparing context must not silently switch to another provider if its submitted selection disappears. Histories persist provider ID, model ID and effort independently.

Only native IPC exposes `fetch_provider_models(id)`: it queries the saved provider endpoint/auth with a 15-second total timeout, 1-MiB response bound, no redirects, and bounded pagination. It returns candidates without modifying storage. Users select or manually configure models, then save. Websites cannot request configuration scans, model-list network fetches, edits or credentials.

## Reconnection and revocation

On refresh or after a lost connection, the website opens a new socket and sends this as its first frame within ten seconds:

```json
{"v":1,"type":"auth","token":"opaque-random-token"}
```

A successful authentication returns `auth.ok` with the same `authorizationId` and token, a new socket-specific `connectionId`, and the current enabled providers. The token does not rotate. Multiple tabs may authenticate using the same token concurrently; one tab reconnecting does not replace another tab's connection. The eight-socket limit still applies.

Closing a socket, stopping the listener, or quitting/restarting the desktop application cancels active requests and closes sockets but retains remembered authorizations. After the listener restarts, clients can authenticate with their saved token without another pairing code, provided their exact origin is still allowed. The note client retries connection failures after 1, 2, 4, 8, 16, then 30 seconds, keeping a 30-second cap, including when the desktop service is not running yet. The website navigation displays green “已连接” only after receiving `auth.ok`; a saved token by itself does not imply a live connection. `auth_failed` clears the rejected local credential and stops retrying; a new pairing is required. The website’s “断开” action pauses the current page’s connection and retries while retaining the saved credential; refreshing the page enables automatic authentication again. Reconnection never replays a generation request.

The desktop lists remembered authorizations even when all their sockets are offline. Revoking an authorization deletes the stored grant and closes every socket using it, cancelling their active requests. The old token can no longer authenticate. Desktop `revoke_connection` also revokes the entire authorization associated with that connection; `revoke_authorization` uses the persistent authorization ID and works while offline.

An authenticated website can send the following frame to revoke its own authorization, including the connections from other tabs using that token:

```json
{"v":1,"type":"auth.forget"}
```

`auth.forget` does not take an authorization ID or token; the server resolves the grant from the authenticated socket. On success the connection closes after revocation, without a separate acknowledgment. If persisting the deletion fails, the server returns an `error` with code `forget_failed` and retains the grant; it can be revoked later from the desktop. The note website's “忘记连接” action clears its saved bridge token and port and, while connected, sends `auth.forget`. If the website is offline, forgetting clears only browser storage; the retained desktop authorization can be revoked in the desktop application. A new connection then requires pairing. Clearing browser data similarly removes its local token without removing the desktop grant.

Authentication/connection errors use `{v:1,type:"error",code,message}`. Messages contain sanitized descriptions. Clients should end the connection on these errors. The browser API cannot reliably distinguish CSP, local-network permission, and mixed-content blocking, so the UI presents these as possible connection causes rather than guessing one.

## Generation and document tools

```json
{
  "v":1,"type":"chat.start","requestId":"unique-id",
  "providerId":"provider-uuid","model":"configured-model",
  "messages":[{"role":"user","content":"Explain the example."}],
  "maxOutputTokens":2048,
  "context":{"documents":[{
    "docId":"example","title":"Example","url":"/example.html",
    "contentHash":"local-content-fingerprint","metadata":{"tags":["sample"]},
    "headings":[{"id":"example-heading","title":"Example heading"}],
    "relatedLinks":[],
    "sources":[{"sourceId":"D1S1","headingId":"example-heading","title":"Example heading","text":"Reference content."}]
  }]}
}
```

- One active generation per connection. Request IDs must be new within the connection, at most 80 ASCII letters/digits or `_ - : .`; reconnect after 1,000 requests.
- `providerId` must reference an enabled local provider. `model` must be one of that provider's configured `models` (legacy providers without a list use their single configured model). Websites cannot override the endpoint, authorization, or protocol.
- `messages` contains 1–40 user/assistant messages and ends with a user message. User-provided system messages and fabricated tool-call history are unsupported; the bridge constructs tool turns only from the current upstream response.
- `context.scope` may be `knowledge_base`. In that scope `context.documents` may be empty when both `get_document` and at least one discovery tool (`search_documents` or `get_knowledge_overview`) are registered. Otherwise it contains 1–3 documents, each with at most 256 sources. Without registered tools each document requires at least one source, preserving the original text-only contract. With tools, `sources: []` is allowed so the initial request can carry just document metadata. Source IDs are unique across the initial request, at most 100 ASCII letters/digits or `_ - : .`.
- Serialized context plus message text is limited to 100,000 Unicode characters; the note UI uses a smaller 24,000-character context budget and bounded recent history. `maxOutputTokens` is 1–8192, default 2048. These are bounds, not claims of model-specific token counting.
- Document content and tool results are untrusted reference material. The adapter asks the model to read necessary documents using registered tools and cite only supplied `[sourceId]` values. The website resolves only IDs from its initial context or locally executed tool results to verified site links.
- Optional `effort` is `default`, `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, or `ultra`; omission means `default`. Each model advertises its configured `efforts` and optional `defaultEffort`; the server rejects undeclared explicit values. Missing capability information means default-only for newly discovered models. Legacy single-model configurations preserve low/medium/high for compatibility. `default` omits the upstream effort parameter. Explicit values map to Responses `reasoning.effort`, Chat Completions `reasoning_effort`, or Anthropic `output_config.effort`. Declared metadata is not proof that a gateway accepts every setting; parameter rejection remains a sanitized error.

### Knowledge-base scope

The website starts global questions with `context: {"scope":"knowledge_base","documents":[]}` and registered discovery/read tools. The prompt directs the model to discover relevant documents, read their contents, compare sources across topics, and distinguish index failures or truncated results from exhaustive coverage. Optional attached documents are reference material and never restrict the tool catalog. Legacy requests with attached documents remain supported.

`get_knowledge_overview` accepts optional `category`, `offset`, `limit`, `categoryOffset` and `categoryLimit`, returning paginated catalog references and category counts. `get_knowledge_network` now permits omitted `docId` for a global graph and uses `offset`/`nextOffset` for edges; a supplied ID retains one-hop filtering. `search_documents` accepts optional `scope: all|catalog|fulltext` (default `all`). Full-text results come through the existing site search service, with at most 200 candidates and three 480-character snippets per document; URLs must resolve through the catalog whitelist. Results include `requestedScope`, actual `scope`, and `fulltext.status` (`not_requested`, `ok`, `unavailable`, `failed`). Failed full-text queries explicitly fall back to title/path results. These tools never fetch the full raw corpus upfront or follow arbitrary model-supplied URLs.

Histories are knowledge-base conversations, including legacy document histories. Navigation updates only the optional attachment, retaining active conversation and in-flight generation. Each turn carries its own optional context; recent completed turns can inform a follow-up across topics. Source IDs are stable across attachment order and section selection, using the same document/section identity as tool results.

### Read-only function calling

The website can append `tools` to `chat.start`, for example:

```json
{
  "effort":"medium",
  "tools":[{
    "name":"get_document",
    "description":"Read a section of a site document; cite returned sourceId values.",
    "inputSchema":{
      "type":"object",
      "properties":{"docId":{"type":"string","minLength":1,"maxLength":512}},
      "required":["docId"],
      "additionalProperties":false
    }
  }]
}
```

Only `get_document`, `get_toc`, `get_knowledge_network`, `get_related_documents`, `search_documents`, and `get_knowledge_overview` are allowed. Definitions must have distinct names; at most eight definitions, 2,048 description bytes and 8,192 schema bytes per tool are accepted. Schemas use a bounded local subset: `type` (object/array/string/integer/number/boolean/null), `description`, `properties`, `required`, `additionalProperties` (boolean), `items`, `enum`, `minimum`, `maximum`, `minLength`, `maxLength`, `minItems`, `maxItems`, and `default`. Nesting is limited to eight levels and each properties/required/enum list to 32 entries. References, code, remote schema retrieval and other schema keywords are unsupported. Both the bridge and website validate call arguments; arguments must be JSON objects of at most 16 KiB.

After assembling streamed function arguments and validating the entire round, the bridge sends one call at a time. `callId` is generated by the bridge and is independent of the upstream's identifier:

```json
{"v":1,"type":"tool.call","requestId":"unique-id","callId":"bridge-call-uuid","seq":1,"name":"get_document","arguments":{"docId":"example"}}
```

The authenticated website dispatches only its registered read APIs against catalog-verified documents. No URLs, code, local files, bridge configuration APIs or credentials are executed/accessed by the bridge. Successful results contain `data` and optional `sources`:

```json
{"v":1,"type":"tool.result","requestId":"unique-id","callId":"bridge-call-uuid","result":{"data":{"text":"Reference content."},"sources":[{"sourceId":"D1S1","title":"Example heading","url":"/example.html#heading"}]}}
```

For a tool failure, send `isError: true` with a JSON result object describing the failure; the model may choose another permitted call or explain the unavailable context. Result JSON is limited to 64 KiB, including citation metadata, with at most 256 source records. The website uses a smaller 48-KiB budget. Results must match the current socket, request and outstanding call; unrequested, duplicate, stale and other-socket results return `tool_result_rejected` and are never forwarded. A matched malformed/oversized result ends that generation with an error.

At most eight upstream rounds and 16 total tool calls are allowed per generation. Calls execute sequentially, with a 30-second result deadline per call and a three-minute deadline for the entire generation including tool waits. An eighth response requesting further tools returns `tool_limit` rather than another request. Accumulated upstream transcript is limited to 2 MiB and total received upstream bytes to 8 MiB. Cancelling, disconnecting, revoking authorization or stopping the bridge drops both the upstream and pending tool waits. Tools are not replayed on reconnect. Tool call frames and text deltas share one increasing `seq`; a tool stop reason is intermediate and never produces its own `chat.done`.

The server sends monotonically increasing `seq` values per request:

```json
{"v":1,"type":"chat.delta","requestId":"unique-id","seq":1,"delta":"Answer [D1S1]"}
{"v":1,"type":"chat.done","requestId":"unique-id","seq":2,"finishReason":"stop"}
```

Each accepted request receives one terminal `chat.done` or `chat.error` while the connection remains open. Early failures may have sequence 0. A failure is `{v:1,type:"chat.error",requestId,seq,code,message}`. Duplicate IDs or invalid/busy requests return a connection-level `error` instead of a second terminal event for the same ID.

Cancel with `{v:1,type:"chat.cancel",requestId}`. It aborts the upstream operation and ends with `chat.done` / `finishReason:"cancelled"`. Cancelling an unknown or already completed request has no effect. Closing/revoking the socket cancels its upstream request. A disconnected client must not replay generation automatically: partial answers can already have incurred provider charges.

The response path has bounded queues and a 512-KiB text-output cap across all rounds. Upstream connections use a 15-second connect timeout and 45-second stream-idle timeout; the complete generation, including all upstream rounds and browser tool waits, has a three-minute deadline. Downstream writes are bounded; slow or disconnected clients release their request resources.

Send `{v:1,type:"ping"}` periodically (the note client uses 25 seconds); expect `{v:1,type:"pong"}`. Sockets without inbound activity for 90 seconds close. Heartbeat does not start or repeat model calls.

## Upstream adapters

| protocol | baseURL example | request endpoint | authentication |
| --- | --- | --- | --- |
| `anthropic` | `https://api.anthropic.com` or gateway prefix | append `/v1/messages`; if prefix ends in `/v1`, append `/messages` | `apiKey`: `x-api-key`; `bearer`: Authorization Bearer |
| `responses` | `https://api.openai.com/v1` | append `/responses` | Authorization Bearer |
| `chatCompletions` | `https://gateway.example/v1` | append `/chat/completions` | Authorization Bearer |

`none` is available for explicitly configured unauthenticated providers. Remote endpoints require HTTPS; HTTP is restricted to loopback. Redirects are rejected so credentials cannot silently move to a different upstream. Endpoints are API prefixes, not complete request URLs. Streaming requires `text/event-stream`. SSE comments, CRLF, fragmented UTF-8 and fragmented JSON arguments are supported. Only visible text and validated document calls are exposed to the website. Private reasoning and upstream error bodies are never echoed to the website or logs.

Responses sends `store: false`, requests `reasoning.encrypted_content` when tools are registered, and replays returned output items followed by `function_call_output` in `input`; it does not depend on `previous_response_id`. Chat Completions replays the assistant's `tool_calls` followed by messages with `role: "tool"`, and uses `max_completion_tokens` for requests with tools or explicit effort; legacy text-only requests with default effort retain `max_tokens`. Anthropic replays assistant `tool_use` blocks followed by user `tool_result` blocks, preserving thinking/redacted-thinking blocks and streamed signatures only in the transient upstream transcript. None of the upstream transcripts or tool data are persisted by bridge-core.

## Compatibility and verification

Localhost development success does not prove that an HTTPS website can reach this listener. Production CSP, browser versions, mixed-content rules, and local-network permission affect availability. The default `ws://127.0.0.1` transport deliberately does not install certificates, disable protections, expose a LAN listener, or add a cloud relay. The browser matrix and outstanding manual checks are in README.md. A WSS or extension transport would need its own compatibility and deployment design.

Rust integration tests exercise real sockets and fake local upstreams, including full tool/result/final-answer rounds for all three protocols, explicit effort fields, opaque reasoning preservation, fragmented UTF-8 arguments, wrong-socket/request/call isolation, replay rejection, unknown tools, result size limits, round limits and cancellation/revocation during a tool wait. These tests neither read installed CLI configuration nor contact paid models. Frontend tests mock the same protocol and cover pairing, saved authorization and automatic reconnection, revocation, streaming, cancellation, document changes, and citation navigation. Desktop IPC tests also verify online/offline remembered websites and offline revocation.
