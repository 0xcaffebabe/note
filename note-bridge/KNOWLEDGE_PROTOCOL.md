# Site knowledge data v1

The knowledge site publishes these static resources independently of Note Bridge. No document corpus is packaged with the desktop application. The Node agent only fetches catalog metadata and the individual resources needed by a run.

## Manifest and immutable resources

`GET <authorized-origin>/ai/manifest.json` returns:

```json
{
  "schemaVersion": 1,
  "knowledgeBaseId": "note",
  "revision": "<64 lowercase hex characters>",
  "capabilities": ["catalog", "document", "toc", "graph", "related", "search"],
  "resources": {
    "catalog": { "path": "/ai/objects/<sha256>.json", "sha256": "<sha256>", "bytes": 123 },
    "graph": { "path": "/ai/objects/<sha256>.json", "sha256": "<sha256>", "bytes": 123 },
    "clusters": { "path": "/ai/objects/<sha256>.json", "sha256": "<sha256>", "bytes": 123 }
  },
  "search": {
    "type": "algolia",
    "applicationId": "<public application ID>",
    "indexName": "note",
    "searchOnlyApiKey": "<public search-only key>",
    "revisionConsistency": "live"
  }
}
```

`search` is optional. It contains only the public query configuration already shipped by the site's browser search adapter. Never put an Algolia admin/write key here. The supported adapter constructs a fixed Algolia host from the validated application ID; a manifest cannot declare an arbitrary search endpoint.

Every resource has `schemaVersion: 1`. Hashes cover the exact UTF-8 response bytes, including JSON punctuation; the resource URL must match its hash exactly. `bytes` is the uncompressed JSON body size. Additive fields are allowed. An unsupported schema version causes an explicit upgrade error. No legacy unversioned adapter is used.

The site computes `revision` from its deterministic manifest content before adding the revision field. A content update changes only affected immutable resources, the catalog reference and the manifest revision. No timestamp introduces a spurious revision.

## Resource shapes

- Catalog: `{schemaVersion, documents:[{docId,title,url,category,contentHash,resource}]}`. `resource` uses the descriptor above; `contentHash` is `sha256:<resource.sha256>`. `url` is the site's canonical encoded `.html` path. Category is the first directory name, or `(root)`.
- Document: `{schemaVersion,docId,title,url,headings:[{id,title}],sections:[{headingId,title,text}]}`. Sections preserve original code indentation and table boundaries. An introduction may have an empty `headingId`. The build uses the same document renderer, heading slugger and related-content extraction as the site reader. Tool `section` is the zero-based index of `sections`.
- Graph: `{schemaVersion,edges:[{from,to,title}]}`; both IDs belong to the catalog and duplicate directed edges are removed.
- Clusters: `{schemaVersion,related:[{docId,docIds:[]}]}`; the site precomputes the existing similarity-tree neighborhood, so Bridge does not require clustering libraries or a complete text corpus.

The runtime creates stable `D<64-bit-doc-hash>S<section+1>` citation IDs (`S0` for catalog references). Citations preserve `contentHash` and `revision`; heading links use the site's `?headingId=` route parameter. Actual retrieved text is stored by the Agent together with these evidence fields.

## Run consistency and publication

Each run pins the manifest plus its catalog. The persisted manifest can be restored after a worker restart without replacing it with the latest publication. Old resources that disappear return `stale_revision`; a response with the wrong hash fails validation. The runtime never silently combines old and new bodies.

Publish immutable resources before switching the manifest. Hosts that can retain old hash resources should do so; this repository's clean static builds do not guarantee cross-deployment retention, so an active run may need a new question after an old resource is removed. Existing evidence and completed chat history remain available in Bridge.

The Vite plugin also serves the same contract in development and invalidates it when Markdown files change. Production emits `/ai/manifest.json` and `/ai/objects/*.json`. The service worker uses `NetworkOnly` for the manifest and bounded `CacheFirst` for hash resources, ahead of its generic JSON cache rule. A hosting layer should likewise serve the manifest with revalidation/no-cache and hash resources as immutable.

## Bounded reads and discovery

Only exact same-origin `/ai/objects/<sha256>.json` resources are fetched; redirects are rejected, and tools cannot supply URLs or filesystem paths. Manifest responses are at most 256 KiB, individual resources 16 MiB, and full-text responses 4 MiB. Parsing rejects nesting beyond 64 levels or more than one million JSON values. Each request has a deadline and abort signal. Document caches are bounded to an 8 MiB working set per run.

All six tools execute in Bridge. Results including citations and UI overviews are at most 192 KiB in UTF-8. Body reads default to 16,000 and cap at 64,000 characters, shrinking further when needed to fit the complete result. `nextOffset` never skips characters or splits a surrogate pair. TOC, catalog, graph and related results are paginated. Attachment snapshots use the same evidence IDs and result bound; partial evidence explicitly reports `truncated`.

An attachment with omitted or empty `headingIds` contains only document metadata and a bounded first page of its TOC, with `sections: []`; it never implicitly includes body text. The TOC preserves section indexes, citation IDs, `contentHash` and `revision`, and reports `nextOffset` and `truncated` for continuation through `get_toc`. Empty documents still yield metadata and a document citation. A nonempty `headingIds` selection includes only the selected section bodies, rejects unknown headings, and explicitly reports body truncation.

Algolia is an independently updated live index: search status includes `revisionConsistency: live` and query time. Its snippets are discovery hints, not pinned document evidence. At most 200 candidates are accepted, and all result IDs must occur in the pinned catalog. The model must read the actual document before treating a snippet as evidence. Missing/failed full-text search explicitly reports catalog-only fallback; it does not claim to search the body.

`KnowledgeClient.pin()` and `restore()` return `KnowledgeSnapshot`, which exposes `manifest`, `revision`, `knowledgeBaseId`, `execute()`, attachment metadata via `document()`, and bounded `attachment()`. These types live wholly inside the Bridge agent package and do not import website source code.
