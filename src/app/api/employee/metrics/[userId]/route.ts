import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Mock employee metrics data
    const mockMetrics = {
      userId,
      period: 'today',
      stats: {
        assigned: 12,
        completed: 8,
        overdue: 1,
        efficiency: 85,
        averageHandleTime: 4.5, // minutes
        slaCompliance: 92, // percentage
        customerSatisfaction: 4.2, // out of 5
        firstCallResolution: 78 // percentage
      },
      goals: {
        daily: {
          target: 20,
          completed: 8,
          percentage: 40
        },
        weekly: {
          target: 100,
          completed: 45,
          percentage: 45
        },
        monthly: {
          target: 400,
          completed: 180,
          percentage: 45
        }
      },
      streak: {
        current: 5, // days
        longest: 12 // days
      },
      trends: {
        efficiency: {
          current: 85,
          previous: 82,
          change: 3.7 // percentage increase
        },
        handleTime: {
          current: 4.5,
          previous: 5.2,
          change: -13.5 // percentage decrease (good)
        },
        slaCompliance: {
          current: 92,
          previous: 89,
          change: 3.4 // percentage increase
        }
      },
      activities: [
        {
          id: '1',
          type: 'call_completed',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          duration: 4.2,
          customer: 'John Smith',
          satisfaction: 5
        },
        {
          id: '2',
          type: 'voicemail_callback',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          duration: 3.8,
          customer: 'Sarah Johnson',
          satisfaction: 4
        },
        {
          id: '3',
          type: 'message_response',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          duration: 2.1,
          customer: 'Mike Davis',
          satisfaction: 5
        }
      ]
    };

    return NextResponse.json(mockMetrics);

  } catch (error) {
    console.error('Employee metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
