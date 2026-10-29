import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { assignTechnician } from '@/api/assign-technician'
import type { ServiceOrder } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTeam } from '@/hooks/use-team'
import { ROLE_LABELS } from '@/lib/roles'

import { updateServiceOrderCache } from './service-order-cache'

interface AssignTechnicianDialogProps {
  serviceOrder: ServiceOrder
  onDone: () => void
}

// The content of a <Dialog>
export function AssignTechnicianDialog({
  serviceOrder,
  onDone,
}: AssignTechnicianDialogProps) {
  const queryClient = useQueryClient()
  const { technicians } = useTeam()
  const [technicianId, setTechnicianId] = useState(
    serviceOrder.technicianId ?? '',
  )

  const { mutate: assign, isPending } = useMutation({
    mutationFn: assignTechnician,
    onSuccess: (updated) => {
      updateServiceOrderCache(queryClient, updated)
      toast.success('Técnico atribuído.')
      onDone()
    },
    onError: () => {
      toast.error('Não foi possível atribuir o técnico. Tente de novo.')
    },
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Técnico responsável</DialogTitle>
        <DialogDescription>
          Quem vai cuidar do conserto. A troca fica no histórico.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="technician">Técnico</Label>
        <Select value={technicianId} onValueChange={setTechnicianId}>
          <SelectTrigger id="technician" className="w-full">
            <SelectValue placeholder="Escolha quem vai fazer o serviço" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((technician) => (
              <SelectItem key={technician.id} value={technician.id}>
                {technician.name} · {ROLE_LABELS[technician.role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button
          disabled={
            !technicianId ||
            technicianId === serviceOrder.technicianId ||
            isPending
          }
          onClick={() =>
            assign({ serviceOrderId: serviceOrder.id, technicianId })
          }
        >
          Atribuir
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
