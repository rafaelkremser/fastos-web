import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createUser } from '@/api/create-user'
import type { User, UserRole } from '@/api/types'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorStatus } from '@/lib/api-error'
import { getAssignableRoles, ROLE_LABELS } from '@/lib/roles'

// Same limits as the API
const userForm = z.object({
  name: z.string().trim().min(2, 'Informe o nome.'),
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha precisa de pelo menos 6 caracteres.'),
  role: z.enum(['ADMIN', 'TECHNICIAN', 'RECEPTIONIST']),
})

type UserForm = z.infer<typeof userForm>

interface UserDialogProps {
  // Decides which roles can be given
  creatorRole: UserRole | undefined
}

// The content of a <Dialog>. After saving it shows how the new person signs
// in, since the store's address is not obvious to someone new
export function UserDialog(props: UserDialogProps) {
  return (
    <DialogContent>
      <UserDialogContent {...props} />
    </DialogContent>
  )
}

// Inside <DialogContent>, which is only mounted while the dialog is open, so
// each opening starts over from the current data
function UserDialogContent({ creatorRole }: UserDialogProps) {
  const queryClient = useQueryClient()
  const [created, setCreated] = useState<User | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const roles = getAssignableRoles(creatorRole)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(userForm),
    defaultValues: { name: '', email: '', password: '', role: 'TECHNICIAN' },
  })

  const { mutateAsync: saveUser } = useMutation({
    mutationFn: createUser,
    // The team list and the technicians in the orders' selects
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  async function handleSave(data: UserForm) {
    try {
      setCreated(await saveUser(data))
    } catch (error) {
      const status = getErrorStatus(error)

      if (status === 409) {
        setError('email', {
          message: 'Já existe alguém com esse e-mail na loja.',
        })
      } else if (status === 403) {
        toast.error('Você não pode dar esse papel.')
      } else {
        toast.error('Não foi possível cadastrar. Tente de novo.')
      }
    }
  }

  if (created) {
    const signInUrl = `${window.location.origin}/sign-in`

    async function handleCopy() {
      try {
        await navigator.clipboard.writeText(
          `Endereço: ${signInUrl}\nE-mail: ${created!.email}`,
        )
        toast.success('Acesso copiado.')
      } catch {
        toast.error('Não foi possível copiar.')
      }
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>{created.name} entrou na equipe</DialogTitle>
          <DialogDescription>
            Passe o acesso para a pessoa. A senha é a que você definiu.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 rounded-md border p-4 text-sm">
          <div className="space-y-1">
            <dt className="text-muted-foreground">Endereço para entrar</dt>
            <dd className="font-medium break-all">{signInUrl}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium break-all">{created.email}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-muted-foreground">Papel</dt>
            <dd className="font-medium">{ROLE_LABELS[created.role]}</dd>
          </div>
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="size-4" />
            Copiar acesso
          </Button>
          <DialogClose asChild>
            <Button>Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo usuário</DialogTitle>
        <DialogDescription>
          A pessoa entra na loja com este e-mail e esta senha.
        </DialogDescription>
      </DialogHeader>

      <form
        id="user-form"
        onSubmit={handleSubmit(handleSave)}
        className="space-y-4"
      >
        <FormField label="Nome" htmlFor="name" error={errors.name?.message}>
          <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
        </FormField>

        <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Senha"
          htmlFor="password"
          error={errors.password?.message}
        >
          <div className="relative">
            <Input
              id="password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={
                isPasswordVisible ? 'Esconder senha' : 'Mostrar senha'
              }
            >
              {isPasswordVisible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </Button>
          </div>
        </FormField>

        <FormField label="Papel" htmlFor="role">
          <Controller
            name="role"
            control={control}
            render={({ field: { name, onChange, value } }) => (
              <Select name={name} value={value} onValueChange={onChange}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </form>

      <DialogFooter>
        <Button type="submit" form="user-form" disabled={isSubmitting}>
          Cadastrar usuário
        </Button>
      </DialogFooter>
    </>
  )
}
