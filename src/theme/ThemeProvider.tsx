import { useEffect, useState, type ReactNode } from 'react'
import { STORAGE_KEY, ThemeContext, initialTheme, type Theme } from './context'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  // layout effect so tokens are in place before children (e.g. the chart) read them
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch (error) {
      console.error("error occured in theme toggle", error)
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
