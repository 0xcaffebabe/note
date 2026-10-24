export type Protocol = 'anthropic' | 'responses' | 'chatCompletions';
export type AuthKind = 'apiKey' | 'bearer' | 'none';
export type Effort =
  | 'default'
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max'
  | 'ultra';
export interface ModelOption {
  id: string;
  name: string;
  efforts: Effort[];
  defaultEffort?: Effort;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
}

export interface Provider {
  id: string;
  name: string;
  protocol: Protocol;
  baseUrl: string;
  model: string;
  models?: ModelOption[];
  authKind: AuthKind;
  enabled: boolean;
  source?: string;
}

export interface ProviderInput extends Omit<Provider, 'id'> {
  id?: string;
  apiKey?: string;
}

export interface DiscoveredProvider {
  id: string;
  name: string;
  protocol: Protocol;
  baseUrl: string;
  model: string;
  models?: ModelOption[];
  authKind: AuthKind;
  source: string;
  status: 'ready' | 'missingCredential' | 'unsupported' | 'invalid';
  message: string;
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  providerId?: string;
  model?: string;
  durationMs?: number;
}

export interface Snapshot {
  running: boolean;
  port: number;
  allowedOrigins: string[];
  providers: Provider[];
  pairing: { code: string; expiresAt: number } | null;
  authorizations: {
    id: string;
    origin: string;
    createdAt: number;
    lastConnectedAt: number;
    connected: boolean;
  }[];
  connections: { id: string; origin: string; connectedAt: number }[];
  logs: LogEntry[];
}
