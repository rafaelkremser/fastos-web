import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { changePassword } from '@/api/change-password'
import { getErrorStatus } from '@/lib/api-error'
import { z } from '@/lib/zod'

import { FormField } from './form-field'
import { Button } from './ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'

// The same minimum as when someone is added to the team
const changePasswordForm = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(6, 'A senha precisa de pelo menos 6 caracteres.'),
    confirmation: z.string(),
  })
  .refine((data) => data.confirmation === data.newPassword, {
    path: ['confirmation'],
    message: 'A confirmação está diferente da nova senha.',
  })

type ChangePasswordForm = z.infer<typeof changePasswordForm>

interface ChangePasswordDialogProps {
  onDone: () => void
}

// The content of a <Dialog>
export function ChangePasswordDialog(props: ChangePasswordDialogProps) {
  return (
    <DialogContent>
      <ChangePasswordDialogContent {...props} />
    </DialogContent>
  )
}

// Inside <DialogContent>, which is only mounted while the dialog is open, so
// the passwords typed are gone once it closes
function ChangePasswordDialogContent({ onDone }: ChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordForm),
    defaultValues: { currentPassword: '', newPassword: '', confirmation: '' },
  })

  const { mutateAsync: changePasswordFn } = useMutation({
    mutationFn: changePassword,
  })

  async function handleChange({
    currentPassword,
    newPassword,
  }: ChangePasswordForm) {
    try {
      await changePasswordFn({ currentPassword, newPassword })
      toast.success('Senha trocada. Use a nova na próxima vez que entrar.')
      onDone()
    } catch (error) {
      const status = getErrorStatus(error)

      if (status === 403) {
        setError('currentPassword', {
          message: 'A senha atual está incorreta.',
        })
      } else if (status === 429) {
        toast.error('Muitas tentativas. Aguarde um minuto e tente de novo.')
      } else {
        toast.error('Não foi possível trocar a senha. Tente de novo.')
      }
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Trocar senha</DialogTitle>
        <DialogDescription>
          Quem está com a loja aberta em outro aparelho continua conectado até a
          sessão vencer.
        </DialogDescription>
      </DialogHeader>

      <form
        id="change-password-form"
        onSubmit={handleSubmit(handleChange)}
        className="space-y-4"
      >
        <FormField
          label="Senha atual"
          htmlFor="currentPassword"
          error={errors.currentPassword?.message}
        >
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </FormField>

        <FormField
          label="Nova senha"
          htmlFor="newPassword"
          error={errors.newPassword?.message}
        >
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
        </FormField>

        <FormField
          label="Repita a nova senha"
          htmlFor="confirmation"
          error={errors.confirmation?.message}
        >
          <Input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmation}
            {...register('confirmation')}
          />
        </FormField>
      </form>

      <DialogFooter>
        <Button
          type="submit"
          form="change-password-form"
          disabled={isSubmitting}
        >
          Trocar senha
        </Button>
      </DialogFooter>
    </>
  )
}
