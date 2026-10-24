/** 桌面协议类型的公开导出；类型定义按模型服务和桥接快照分别维护。 */
export type {
  AuthKind,
  DiscoveredProvider,
  DiscoveryPaths,
  Effort,
  ModelOption,
  Protocol,
  Provider,
  ProviderInput,
} from './core/domain/Provider';
export type {
  LogEntry,
  PairingWindow,
  SiteAuthorization,
  SiteConnection,
  Snapshot,
} from './core/domain/BridgeSnapshot';
