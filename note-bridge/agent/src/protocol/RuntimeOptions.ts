import type { RuntimeProvider, Authorization, Push, LIMITS } from '../types.js';

/** 进程内运行时依赖；fetch/时钟/预算可替换以测试边界，secret 仅驻留内存。 */
export type RuntimeOptions = {
  dataDir: string;
  providers: RuntimeProvider[];
  authorizations: Authorization[];
  emit?: (push: Push) => void;
  fetch?: typeof fetch;
  now?: () => number;
  limits?: Partial<typeof LIMITS>;
};
