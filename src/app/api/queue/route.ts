import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock queue data for development
const mockQueueItems = [
  {
    id: '1',
    type: 'call' as const,
    priority: 'high' as const,
    status: 'pending' as const,
    customer: {
      id: 'cust-1',
      name: 'John Smith',
      phone: '+1234567890',
      email: 'john@example.com'
    },
    metadata: {
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      source: 'inbound_call'
    },
    sla: {
      deadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      type: 'callback'
    },
    assignedTo: null,
    description: 'Customer called about billing inquiry'
  },
  {
    id: '2',
    type: 'voicemail' as const,
    priority: 'medium' as const,
    status: 'pending' as const,
    customer: {
      id: 'cust-2',
      name: 'Sarah Johnson',
      phone: '+1234567891',
      email: 'sarah@example.com'
    },
    metadata: {
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      source: 'voicemail'
    },
    sla: {
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      type: 'callback'
    },
    assignedTo: null,
    description: 'Voicemail about service upgrade'
  },
  {
    id: '3',
    type: 'message' as const,
    priority: 'urgent' as const,
    status: 'pending' as const,
    customer: {
      id: 'cust-3',
      name: 'Mike Davis',
      phone: '+1234567892',
      email: 'mike@example.com'
    },
    metadata: {
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      updatedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      source: 'sms'
    },
    sla: {
      deadline: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      type: 'response'
    },
    assignedTo: null,
    description: 'Urgent SMS about service outage'
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    // Filter items based on query parameters
    let filteredItems = [...mockQueueItems];

    if (assignedTo && assignedTo !== 'undefined') {
      filteredItems = filteredItems.filter(item => item.assignedTo === assignedTo);
    }

    if (type) {
      const types = type.split(',');
      filteredItems = filteredItems.filter(item => types.includes(item.type));
    }

    if (priority) {
      const priorities = priority.split(',');
      filteredItems = filteredItems.filter(item => priorities.includes(item.priority));
    }

    if (status) {
      const statuses = status.split(',');
      filteredItems = filteredItems.filter(item => statuses.includes(item.status));
    }

    // Sort items
    filteredItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = a.metadata.createdAt;
          bValue = b.metadata.createdAt;
          break;
        case 'updatedAt':
          aValue = a.metadata.updatedAt;
          bValue = b.metadata.updatedAt;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'sla':
          aValue = a.sla?.deadline || new Date(0);
          bValue = b.sla?.deadline || new Date(0);
          break;
        case 'customer':
          aValue = a.customer.name;
          bValue = b.customer.name;
          break;
        default:
          aValue = a.metadata.createdAt;
          bValue = b.metadata.createdAt;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate stats
    const stats = {
      total: filteredItems.length,
      pending: filteredItems.filter(item => item.status === 'pending').length,
      inProgress: filteredItems.filter(item => item.status === 'in_progress').length,
      completed: filteredItems.filter(item => item.status === 'completed').length,
      overdue: filteredItems.filter(item => {
        if (!item.sla) return false;
        return item.sla.deadline < new Date();
      }).length,
      approaching: filteredItems.filter(item => {
        if (!item.sla) return false;
        const timeDiff = item.sla.deadline.getTime() - new Date().getTime();
        return timeDiff > 0 && timeDiff <= 15 * 60 * 1000; // 15 minutes
      }).length
    };

    return NextResponse.json({
      items: filteredItems,
      stats,
      pagination: {
        page: 1,
        limit: 50,
        total: filteredItems.length,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Here you would typically create a new queue item in the database
    // For now, we'll just return a success response
    
    return NextResponse.json({
      success: true,
      message: 'Queue item created successfully'
    });

  } catch (error) {
    console.error('Queue creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
