/** 桌面管理页面；仅影响视图切换，不改变桥接服务的运行状态。 */
export type DesktopTab = 'connection' | 'providers' | 'logs';

export const desktopPages = {
  connection: {
    title: '连接你的知识与模型',
    subtitle: '启动本地桥接，让知识助手使用你已有的模型服务。',
  },
  providers: {
    title: '管理模型服务',
    subtitle: '导入本机 CLI 配置，或添加兼容 API 的模型服务。',
  },
  logs: {
    title: '查看运行状态',
    subtitle: '排查连接和模型请求；日志不会记录密钥或问答正文。',
  },
};
