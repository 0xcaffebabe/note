

/**
 *
 * 思维导图节点
 * @export
 * @interface MindNode
 */
export default interface MindNode{
  id: string
  topic: string
  children: MindNode[]
  expanded: boolean,
  direction: 'right' | 'left'
}