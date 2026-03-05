import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const mockChangeLanguage = vi.fn()
const mockUseLanguage = vi.fn()

// Path resolved from this test file location to hooks/useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => mockUseLanguage(),
}))

import { LanguageSwitcher } from '../LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear()
    mockUseLanguage.mockReturnValue({
      language: 'en',
      changeLanguage: mockChangeLanguage,
      supportedLanguages: [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
      ],
    })
  })

  it('renders a language selector', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByRole('combobox')).toBeTruthy()
  })

  it('shows all supported languages as options', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByText('English')).toBeTruthy()
    expect(screen.getByText('Español')).toBeTruthy()
    expect(screen.getByText('Français')).toBeTruthy()
  })

  it('displays the current language as selected', () => {
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('en')
  })

  it('calls changeLanguage when a new language is selected', () => {
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'es' } })
    expect(mockChangeLanguage).toHaveBeenCalledWith('es')
  })
})
