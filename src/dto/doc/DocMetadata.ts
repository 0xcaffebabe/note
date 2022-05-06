
interface Book {
  name: string
  chapters: string[]
}

export interface DocMetadata {
  tags: string[],
  books: Book[]
  name: string
}

export const EMPTY_DOC_METADATA = {
  tags:[],
  books:[],
  name: ''
} as DocMetadata