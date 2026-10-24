/** 桥接入站数据校验的兼容入口，具体投影按职责分别实现。 */
export { isRecord } from './aiBridge/protocol/ProtocolValueReader'
export { readSession, readTurn, readSessionPage, readTurnPage } from './aiBridge/protocol/SessionProjectionReader'
export { readDocumentMetadata } from './aiBridge/protocol/DocumentProjectionReader'
