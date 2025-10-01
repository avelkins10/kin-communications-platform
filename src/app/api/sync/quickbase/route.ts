import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock QuickBase sync response
    const mockSyncData = {
      lastSync: new Date().toISOString(),
      recordsUpdated: 0,
      recordsCreated: 0,
      recordsDeleted: 0,
      status: 'success',
      message: 'QuickBase sync completed successfully (mock)'
    };

    return NextResponse.json(mockSyncData);
  } catch (error) {
    console.error('Error in QuickBase sync:', error);
    return NextResponse.json(
      { error: "Failed to sync with QuickBase" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Mock QuickBase sync response
    const mockSyncData = {
      lastSync: new Date().toISOString(),
      recordsUpdated: action === 'full' ? 15 : 3,
      recordsCreated: action === 'full' ? 2 : 0,
      recordsDeleted: action === 'full' ? 1 : 0,
      status: 'success',
      message: `QuickBase ${action} sync completed successfully (mock)`
    };

    return NextResponse.json(mockSyncData);
  } catch (error) {
    console.error('Error in QuickBase sync:', error);
    return NextResponse.json(
      { error: "Failed to sync with QuickBase" },
      { status: 500 }
    );
  }
}
