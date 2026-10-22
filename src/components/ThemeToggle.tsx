import { Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '../theme/context'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Colour theme">
      <span className="theme-toggle-thumb" data-pos={theme} aria-hidden="true" />
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button key={value} role="radio" aria-checked={theme === value} className={theme === value ? 'active' : ''} onClick={() => setTheme(value)} title={`${label} theme`}>
          <Icon size={15} strokeWidth={2} aria-hidden="true" />
          <span className="theme-toggle-label">{label}</span>
        </button>
      ))}
    </div>
  )
}
