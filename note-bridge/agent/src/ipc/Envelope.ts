/** 仅限原生宿主与 worker 的私有 JSONL 信封；id 按原样回显，不属于站点协议。 */
export type Envelope = {
  id?: unknown;
  method: string;
  params?: Record<string, unknown>;
};
