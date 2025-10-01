import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mock team member data for development
const mockTeamMembers = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'manager',
    status: 'online',
    activity: 'available',
    workload: 3,
    slaCompliance: 98.5,
    efficiency: 92.3,
    lastActive: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  },
  {
    id: 'user-2',
    name: 'Mike Chen',
    email: 'mike@company.com',
    role: 'employee',
    status: 'online',
    activity: 'busy',
    workload: 5,
    slaCompliance: 96.2,
    efficiency: 88.7,
    lastActive: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
  },
  {
    id: 'user-3',
    name: 'Emily Davis',
    email: 'emily@company.com',
    role: 'employee',
    status: 'online',
    activity: 'available',
    workload: 2,
    slaCompliance: 99.1,
    efficiency: 95.4,
    lastActive: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
  },
  {
    id: 'user-4',
    name: 'David Wilson',
    email: 'david@company.com',
    role: 'employee',
    status: 'offline',
    activity: 'unavailable',
    workload: 0,
    slaCompliance: 94.8,
    efficiency: 89.2,
    lastActive: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  }
];

const mockTeamMetrics = {
  totalAgents: 4,
  availableAgents: 2,
  busyAgents: 1,
  offlineAgents: 1,
  totalWorkload: 10,
  averageSlaCompliance: 97.2,
  teamEfficiency: 91.4,
  peakHours: ['10:00', '14:00', '15:00']
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    // Filter team members based on parameters
    let filteredMembers = mockTeamMembers;

    if (status) {
      filteredMembers = filteredMembers.filter(member => member.status === status);
    }

    if (role) {
      filteredMembers = filteredMembers.filter(member => member.role === role);
    }

    return NextResponse.json({
      members: filteredMembers,
      metrics: mockTeamMetrics,
      total: filteredMembers.length
    });
  } catch (error) {
    console.error('Error in /api/team/members:', error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
