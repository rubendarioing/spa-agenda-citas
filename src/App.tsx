import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Spa / Nail Salon</CardTitle>
          <CardDescription>Proyecto en construcción — Sprint 0.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Reservar cita</Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
