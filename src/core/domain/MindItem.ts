export default class MindItem {
  id: string = ''
  topic: string = ''
  children: MindItem[] = []
  direction?: string = 'right'
  expanded?: boolean = false
}