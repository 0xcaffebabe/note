/** 模型适配公开入口；目录校验、HTTP 边界和 Pi 流分别维护。 */
export { makeModels } from './model/createModelRegistry.js';
export { modelOptions, selectedModel } from './model/ModelCatalog.js';
export type { ModelGuard, RequestPermit } from './model/RequestPermit.js';
