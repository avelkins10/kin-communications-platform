import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Contact list coming soon.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quick Dial</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Dialer UI will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}


