import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translations } from '../locales/translations'

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, fallback) => fallback || key,
})

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('appsc_language')
      if (saved === 'en' || saved === 'te') return saved
      return 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('appsc_language', language)
      document.documentElement.setAttribute('lang', language)
    } catch {}
  }, [language])

  const setLanguage = useCallback((newLang) => {
    if (newLang === 'en' || newLang === 'te') {
      setLanguageState(newLang)
    }
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'te' : 'en'))
  }, [])

  /**
   * Helper to retrieve translated text using dot notation (e.g. 'nav.dashboard' or 'prelims.title')
   */
  const t = useCallback(
    (keyPath, fallback = '') => {
      if (!keyPath) return fallback
      const parts = keyPath.split('.')
      
      let current = translations[language]
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part]
        } else {
          current = undefined
          break
        }
      }

      if (current !== undefined && typeof current === 'string') {
        return current
      }

      // Fallback to English if missing in target language
      if (language !== 'en') {
        let enCurrent = translations.en
        for (const part of parts) {
          if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
            enCurrent = enCurrent[part]
          } else {
            enCurrent = undefined
            break
          }
        }
        if (enCurrent !== undefined && typeof enCurrent === 'string') {
          return enCurrent
        }
      }

      return fallback || keyPath
    },
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
export default LanguageContext
