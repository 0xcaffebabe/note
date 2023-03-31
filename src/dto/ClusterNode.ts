class ClusterNode {
  name: string = ''
  children: ClusterNode[] = []
  all(): string[] {
    return [this.name, ...this.children.map(v => v.all()).flatMap(v => v)].filter(v => v)
  }
}

export default ClusterNode