/**
 * The one import for everything visual.
 *
 *   import { Button, Card, Stat, Label } from '@/design'
 *
 * Primitives live in src/design/ui (shadcn, editable). Composed Grid Smash
 * components live beside them. Colour comes from src/design/theme.css only.
 */

// Identity
export { BRAND } from './brand'
export { Wordmark } from './Wordmark'

// Palette for charts and maps
export { AXIS_PROPS, CHART, CHART_SERIES } from './tokens'

// Helpers
export { cn } from './utils'

// shadcn primitives, re-exported so tracks never reach into ./ui themselves
export { Badge, badgeVariants } from './ui/badge'
export {
  Card as UICard,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
export { Progress } from './ui/progress'
export { Separator } from './ui/separator'
export { Switch } from './ui/switch'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

// Composed components
export { Button, buttonVariants } from './Button'
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button'
export { Card } from './Card'
export type { CardProps } from './Card'
export { Chip } from './Chip'
export type { ChipProps } from './Chip'
export { Counter } from './Counter'
export type { CounterProps } from './Counter'
export { Footer } from './Footer'
export { Label } from './Label'
export type { LabelKind, LabelProps } from './Label'
export { Navbar } from './Navbar'
export { Section } from './Section'
export type { SectionProps } from './Section'
export { Stat } from './Stat'
export type { StatProps } from './Stat'
export { Stepper } from './Stepper'
export type { StepperProps } from './Stepper'
export { Surface } from './Surface'
export type { SurfaceProps, SurfaceRadius, SurfaceVariant } from './Surface'
export { Toggle } from './Toggle'
export type { ToggleProps } from './Toggle'
