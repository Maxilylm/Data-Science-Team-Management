import React from 'react'
import { useLanguage } from '../../hooks/useLanguage'

/**
 * A select dropdown that lets users switch the UI language.
 */
export function LanguageSwitcher() {
  const { language, changeLanguage, supportedLanguages } = useLanguage()

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    changeLanguage(event.target.value)
  }

  return (
    <select
      value={language}
      onChange={handleChange}
      aria-label="Select language"
    >
      {supportedLanguages.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  )
}
