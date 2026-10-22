import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

export const STORAGE_KEY = 'zeno-theme'

export const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'light',
  setTheme: () => { },
})

export const useTheme = () => useContext(ThemeContext)

export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch (error) {
    console.error("error while setting initial theme", error)
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
