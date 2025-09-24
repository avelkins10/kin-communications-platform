import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QueuePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Waiting Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No calls waiting.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active calls.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Voicemails</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No voicemails.</p>
        </CardContent>
      </Card>
    </div>
  );
}


