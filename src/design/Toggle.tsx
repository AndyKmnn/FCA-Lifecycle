import { Switch } from './ui/switch'
import { cn } from './utils'

export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-3 select-none', className)}>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
    </label>
  )
}
