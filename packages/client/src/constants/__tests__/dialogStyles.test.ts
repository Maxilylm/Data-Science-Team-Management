import { describe, it, expect } from 'vitest'
import { overlayStyle } from '../dialogStyles'

describe('overlayStyle', () => {
  it('is fixed positioned to cover the entire viewport', () => {
    expect(overlayStyle.position).toBe('fixed')
    expect(overlayStyle.top).toBe(0)
    expect(overlayStyle.left).toBe(0)
    expect(overlayStyle.right).toBe(0)
    expect(overlayStyle.bottom).toBe(0)
  })

  it('has a semi-transparent dark background', () => {
    expect(overlayStyle.backgroundColor).toBe('rgba(0,0,0,0.5)')
  })

  it('centers its children with flexbox', () => {
    expect(overlayStyle.display).toBe('flex')
    expect(overlayStyle.alignItems).toBe('center')
    expect(overlayStyle.justifyContent).toBe('center')
  })

  it('has a high z-index', () => {
    expect(overlayStyle.zIndex).toBeGreaterThanOrEqual(1000)
  })
})
