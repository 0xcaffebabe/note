/** RPC 的可辨识失败，界面可区分超时、断连和桌面端业务错误。 */
export class AiBridgeRpcError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'AiBridgeRpcError'
  }
}
