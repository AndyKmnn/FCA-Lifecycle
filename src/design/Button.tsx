import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  // Navy on amber is ~7:1 contrast.
  primary: 'bg-accent text-ink nm-raised-sm hover:brightness-[1.04] active:nm-pressed',
  secondary: 'bg-surface text-ink nm-raised-sm hover:brightness-[1.02] active:nm-pressed',
  ghost: 'bg-transparent text-ink-muted hover:text-ink nm-flat',
}

const SIZE: Record<ButtonSize, string> = {
  md: 'px-5 py-2.5 text-[15px] rounded-[16px]',
  lg: 'px-8 py-4 text-lg rounded-[20px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-[filter,box-shadow] duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
