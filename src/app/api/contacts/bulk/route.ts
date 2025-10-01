import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contactBulkActionSchema } from "@/lib/validations/contact";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, contactIds, data } = contactBulkActionSchema.parse(body);

    let updatedCount = 0;

    switch (action) {
      case 'update_status': {
        const { projectStatus } = data || {};
        const res = await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: {
            projectStatus: projectStatus ?? undefined,
          },
        });
        updatedCount = res.count;
        break;
      }
      case 'assign_pc': {
        const { projectCoordinatorId } = data || {};
        if (!projectCoordinatorId) return NextResponse.json({ error: 'projectCoordinatorId required' }, { status: 400 });
        const res = await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: { projectCoordinatorId },
        });
        updatedCount = res.count;
        break;
      }
      // mark_stale action disabled; staleness is computed by DB logic
      case 'update_sla': {
        const { voicemailCallbackDue, textResponseDue, missedCallFollowupDue } = data || {};
        const res = await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: {
            voicemailCallbackDue: voicemailCallbackDue ? new Date(voicemailCallbackDue) : undefined,
            textResponseDue: textResponseDue ? new Date(textResponseDue) : undefined,
            missedCallFollowupDue: missedCallFollowupDue ? new Date(missedCallFollowupDue) : undefined,
          },
        });
        updatedCount = res.count;
        break;
      }
      case 'delete': {
        const res = await prisma.contact.deleteMany({ where: { id: { in: contactIds } } });
        updatedCount = res.count;
        break;
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    revalidateTag('contacts');

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Bulk contacts operation failed:', error);
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
  }
}


