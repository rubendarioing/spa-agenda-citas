import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type PlaceholderPageProps = {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">Próximamente.</p>

      <Card className="mt-6 max-w-sm">
        <CardHeader>
          <CardTitle>Design system</CardTitle>
          <CardDescription>
            Vista provisional para validar colores, tipografía y componentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Badge>Pendiente</Badge>
            <Badge variant="secondary">Confirmada</Badge>
          </div>
          <Input placeholder="Nombre del cliente" />
          <div className="flex gap-2">
            <Button>Reservar cita</Button>
                        <Dialog>
              <DialogTrigger render={<Button variant="outline">Ver detalle</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Detalle de cita</DialogTitle>
                  <DialogDescription>
                    Contenido de ejemplo para probar el Dialog.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
