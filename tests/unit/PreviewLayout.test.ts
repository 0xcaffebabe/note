import { describe, expect, it } from 'vitest'
import { readPreviewLayout } from '@/platform/web/pages/doc/PreviewLayout'

describe('preview layout preferences', () => {
  it('restores finite geometry even from a larger or differently positioned viewport', () => {
    const layout = { left: -20, top: 1400, width: 1800, height: 900 }
    expect(readPreviewLayout(JSON.stringify(layout))).toEqual(layout)
  })

  it.each([
    null, '', '{broken', 'null', '[]', 'true',
    '{"left":0,"top":0,"width":"400","height":300}',
    '{"left":0,"top":0,"width":400}',
    '{"left":0,"top":0,"width":0,"height":300}',
    '{"left":0,"top":0,"width":400,"height":-1}',
    '{"left":1e400,"top":0,"width":400,"height":300}',
  ])('ignores invalid stored geometry: %s', value => {
    expect(readPreviewLayout(value)).toBeNull()
  })
})
