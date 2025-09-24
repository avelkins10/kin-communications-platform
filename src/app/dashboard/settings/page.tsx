import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Profile and preferences coming soon.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Admin Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">System configuration coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}


