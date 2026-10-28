import { cn } from '@/lib/utils'

import { FormError } from './form-error'
import { Label } from './ui/label'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FormError message={error} />
    </div>
  )
}
