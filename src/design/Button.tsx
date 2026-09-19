import type { ComponentProps } from 'react'
import { Button as UIButton } from './ui/button'

type UIButtonProps = ComponentProps<typeof UIButton>

/** Legacy alias kept so older call sites using variant="primary" still work. */
export type ButtonVariant = NonNullable<UIButtonProps['variant']> | 'primary'
export type ButtonSize = NonNullable<UIButtonProps['size']>

export interface ButtonProps extends Omit<UIButtonProps, 'variant'> {
  variant?: ButtonVariant
}

export function Button({ variant = 'default', ...rest }: ButtonProps) {
  return <UIButton variant={variant === 'primary' ? 'default' : variant} {...rest} />
}

export { buttonVariants } from './ui/button'
