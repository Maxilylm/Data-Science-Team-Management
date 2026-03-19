import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentTitle } from '../useDocumentTitle'

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = ''
  })

  it('sets the document title to the app name when activeCount is 0', () => {
    renderHook(() => useDocumentTitle(0))
    expect(document.title).toBe('Agent Team Dashboard')
  })

  it('prepends notification count when activeCount is greater than 0', () => {
    renderHook(() => useDocumentTitle(3))
    expect(document.title).toBe('(3) Agent Team Dashboard')
  })

  it('updates title when activeCount changes from 0 to a positive number', () => {
    const { rerender } = renderHook(({ count }: { count: number }) => useDocumentTitle(count), {
      initialProps: { count: 0 }
    })

    expect(document.title).toBe('Agent Team Dashboard')

    rerender({ count: 5 })
    expect(document.title).toBe('(5) Agent Team Dashboard')
  })

  it('removes notification count when activeCount drops back to 0', () => {
    const { rerender } = renderHook(({ count }: { count: number }) => useDocumentTitle(count), {
      initialProps: { count: 2 }
    })

    expect(document.title).toBe('(2) Agent Team Dashboard')

    rerender({ count: 0 })
    expect(document.title).toBe('Agent Team Dashboard')
  })

  it('handles a count of 1 correctly', () => {
    renderHook(() => useDocumentTitle(1))
    expect(document.title).toBe('(1) Agent Team Dashboard')
  })
})
