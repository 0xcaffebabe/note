# note-bridge WebSocket protocol v1

The website and desktop application implement this contract independently. No note source files, Node modules, or build artifacts are shared with bridge-core.

The listener binds **127.0.0.1 only**, default port **19661**, path **/ws**. The port can be changed in the desktop application. The client must use that literal loopback address. A handshake requires an exact allowed `Origin` and `Host: 127.0.0.1:<port>`; missing or `null` origins are rejected. Allowlisting an origin does not authenticate it.

All messages are UTF-8 JSON objects with `v: 1` and a `type`. Frames/messages are limited to 512 KiB. Unknown protocol versions fail authentication. At most eight sockets can remain connected (including sockets waiting for authentication). No HTTP forwarding, credential export, file access, or configuration-management operations are exposed over WebSocket.

## Pairing

1. Start the service and open pairing in the desktop application. It displays a six-digit code, valid for two minutes. Ten failed attempts invalidate the code.
2. The website opens a socket and sends its first message within ten seconds:

   ```json
   {"v":1,"type":"pair","code":"123456"}
   ```

3. A correct code is consumed once. The website receives `pair.pending` with `pairingId`; the desktop shows the exact requesting origin. The user must approve it within one minute. Denial, expiry, or shutdown ends the pairing.
4. Approval returns the following frame. The provider list contains only enabled providers and no endpoint, key, source file, or credential reference:

   ```json
   {"v":1,"type":"auth.ok","connectionId":"uuid","token":"opaque-random-token","providers":[{"id":"uuid","name":"My model","protocol":"responses","model":"configured-model"}]}
   ```

Tokens are bound to the origin and held only in memory. They are revoked when the connection ends, when the desktop revokes the connection, or when the service stops. An `auth` first frame with an active token can replace its existing connection; it rotates the token and disconnects the previous socket. The note client asks the user to pair again after disconnection and never persists tokens. Secrets must not be put in URL query parameters or local storage.

Authentication/connection errors use `{v:1,type:"error",code,message}`. Messages contain sanitized descriptions. Clients should end the connection on these errors. The browser API cannot reliably distinguish CSP, local-network permission, and mixed-content blocking, so the UI presents these as possible connection causes rather than guessing one.

## Text generation

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
- `providerId` must reference an enabled local provider. `model` must equal that provider's configured model. Websites cannot override the endpoint, authorization, or protocol.
- `messages` contains 1–40 user/assistant messages and ends with a user message. User-provided system messages and tool calls are unsupported.
- `context.documents` contains 1–3 documents, each with 1–256 sources. Source IDs are unique across the request, at most 100 ASCII letters/digits or `_ - : .`.
- Serialized context plus message text is limited to 100,000 Unicode characters; the note UI uses a smaller 24,000-character context budget and bounded recent history. `maxOutputTokens` is 1–8192, default 2048. These are bounds, not claims of model-specific token counting.
- Document content is reference material, not authority to invoke tools. The adapter adds grounding instructions and asks the model to cite `[sourceId]`. The website resolves only IDs present in the supplied context to its own document/heading links.

The server sends monotonically increasing `seq` values per request:

```json
{"v":1,"type":"chat.delta","requestId":"unique-id","seq":1,"delta":"Answer [D1S1]"}
{"v":1,"type":"chat.done","requestId":"unique-id","seq":2,"finishReason":"stop"}
```

Each accepted request receives one terminal `chat.done` or `chat.error` while the connection remains open. Early failures may have sequence 0. A failure is `{v:1,type:"chat.error",requestId,seq,code,message}`. Duplicate IDs or invalid/busy requests return a connection-level `error` instead of a second terminal event for the same ID.

Cancel with `{v:1,type:"chat.cancel",requestId}`. It aborts the upstream operation and ends with `chat.done` / `finishReason:"cancelled"`. Cancelling an unknown or already completed request has no effect. Closing/revoking the socket cancels its upstream request. A disconnected client must not replay generation automatically: partial answers can already have incurred provider charges.

The response path has bounded queues and a 512-KiB text-output cap. Upstream connections use a 15-second connect timeout, a 45-second stream-idle timeout, and a three-minute total request timeout. Downstream writes are bounded; slow or disconnected clients release their request resources.

Send `{v:1,type:"ping"}` periodically (the note client uses 25 seconds); expect `{v:1,type:"pong"}`. Sockets without inbound activity for 90 seconds close. Heartbeat does not start or repeat model calls.

## Upstream adapters

| protocol | baseURL example | request endpoint | authentication |
| --- | --- | --- | --- |
| `anthropic` | `https://api.anthropic.com` or gateway prefix | append `/v1/messages`; if prefix ends in `/v1`, append `/messages` | `apiKey`: `x-api-key`; `bearer`: Authorization Bearer |
| `responses` | `https://api.openai.com/v1` | append `/responses` | Authorization Bearer |
| `chatCompletions` | `https://gateway.example/v1` | append `/chat/completions` | Authorization Bearer |

`none` is available for explicitly configured unauthenticated providers. Remote endpoints require HTTPS; HTTP is restricted to loopback. Redirects are rejected so credentials cannot silently move to a different upstream. Endpoints are API prefixes, not complete request URLs. Streaming requires `text/event-stream`. SSE comments, CRLF, fragmented UTF-8, and multi-line data are supported. Only text deltas are exposed; reasoning/tool payloads are not forwarded. Upstream error bodies are never echoed to the website or logs.

## Compatibility and verification

Localhost development success does not prove that an HTTPS website can reach this listener. Production CSP, browser versions, mixed-content rules, and local-network permission affect availability. The default `ws://127.0.0.1` transport deliberately does not install certificates, disable protections, expose a LAN listener, or add a cloud relay. The browser matrix and outstanding manual checks are in README.md. A WSS or extension transport would need its own compatibility and deployment design.

Rust integration tests exercise real sockets and fake local upstreams, without reading installed CLI configuration or contacting paid models. Frontend tests mock the same protocol and cover pairing, streaming, cancellation, document changes, and citation navigation.
