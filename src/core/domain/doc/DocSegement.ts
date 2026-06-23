interface DocSegement {
  title: string
  id: string
  level: number
  content: string
  children?: DocSegement[]
}

export default DocSegement