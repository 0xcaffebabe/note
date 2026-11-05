/** 原生网关认证的上下文；authorizationId 与精确 Origin 必须同时匹配。 */
export type RpcContext = {
  connectionId: string;
  authorizationId: string;
  origin: string;
};

/** 面向单一连接的 v2 推送；订阅发布器负责按 Origin 隔离。 */
export type Push = {
  event: 'session.updated' | 'sessions.changed';
  connectionId: string;
  data: Record<string, unknown>;
};
