import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  // Temporarily disable auth for testing
  // const session = await getServerSession(authOptions);
  // if (!session?.user) {
  //   redirect("/login");
  // }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage workers, tasks, and system settings
        </p>
      </div>

      <AdminDashboard />
    </div>
  );
}