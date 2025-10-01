import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contactSearchSchema, createContactSchema } from "@/lib/validations/contact";
import { unstable_cache, revalidateTag } from "next/cache";

// Helper: map sortBy to Prisma field
const sortFieldMap: Record<string, any> = {
  firstName: "firstName",
  lastName: "lastName",
  phone: "phone",
  email: "email",
  type: "type",
  department: "department",
  createdAt: "createdAt",
  projectStatus: "projectStatus",
  statusCategory: "statusCategory",
  lastContactDate: "lastContactDate",
  projectCoordinatorId: "projectCoordinatorId",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate search parameters
    const searchParamsObj = {
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      department: searchParams.get("department") || undefined,
      isFavorite: searchParams.get("isFavorite") === "true" ? true : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
      // Enhanced search parameters
      sectionType: searchParams.get("sectionType") || undefined,
      projectStatus: searchParams.get("projectStatus") || undefined,
      statusCategory: searchParams.get("statusCategory") || undefined,
      isStale: searchParams.get("isStale") === "true" ? true : undefined,
      projectCoordinatorId: searchParams.get("projectCoordinatorId") || undefined,
      slaViolation: searchParams.get("slaViolation") === "true" ? true : undefined,
      lastContactDateFrom: searchParams.get("lastContactDateFrom") || undefined,
      lastContactDateTo: searchParams.get("lastContactDateTo") || undefined,
    };

    // Validate search parameters
    const validatedParams = contactSearchSchema.parse(searchParamsObj);

    const makeWhere = () => {
      const where: any = {};
      if (validatedParams.search) {
        const search = validatedParams.search;
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { organization: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ];
      }
      if (validatedParams.sectionType === "CUSTOMERS") {
        where.type = "CUSTOMER";
      } else if (validatedParams.sectionType === "EMPLOYEES") {
        where.type = { in: ["FIELD_CREW", "SALES_REP", "VENDOR"] };
      }
      if (validatedParams.type) where.type = validatedParams.type;
      if (validatedParams.department) where.department = validatedParams.department;
      if (validatedParams.isFavorite !== undefined) where.isFavorite = validatedParams.isFavorite;
      if (validatedParams.projectStatus) where.projectStatus = validatedParams.projectStatus;
      if (validatedParams.statusCategory) where.statusCategory = validatedParams.statusCategory;
      if (validatedParams.isStale !== undefined) where.isStale = validatedParams.isStale;
      if (validatedParams.projectCoordinatorId) where.projectCoordinatorId = validatedParams.projectCoordinatorId;
      if (validatedParams.lastContactDateFrom || validatedParams.lastContactDateTo) {
        where.lastContactDate = {};
        if (validatedParams.lastContactDateFrom) (where.lastContactDate as any).gte = new Date(validatedParams.lastContactDateFrom);
        if (validatedParams.lastContactDateTo) (where.lastContactDate as any).lte = new Date(validatedParams.lastContactDateTo);
      }
      // SLA violation filter: any due date < now
      if (validatedParams.slaViolation !== undefined) {
        const now = new Date();
        const violationCondition = {
          OR: [
            { voicemailCallbackDue: { lt: now } },
            { textResponseDue: { lt: now } },
            { missedCallFollowupDue: { lt: now } },
          ],
        };
        if (validatedParams.slaViolation) Object.assign(where, violationCondition);
      }
      return where;
    };

    const orderBy: any = {};
    orderBy[sortFieldMap[validatedParams.sortBy] ?? "createdAt"] = validatedParams.sortOrder;

    const sectionType = validatedParams.sectionType ?? "ALL";

    const fetchContacts = unstable_cache(async () => {
      const [total, contacts] = await prisma.$transaction([
        prisma.contact.count({ where: makeWhere() }),
        prisma.contact.findMany({
          where: makeWhere(),
          orderBy,
          skip: (validatedParams.page - 1) * validatedParams.limit,
          take: validatedParams.limit,
          include: {
            projectCoordinator: {
              select: { id: true, name: true, email: true, department: true },
            },
            lastContactByUser: {
              select: { id: true, name: true, email: true },
            },
            groups: {
              include: { group: true },
            },
          },
        }),
      ]);

      const serialized = contacts.map((c: any) => ({
        id: c.id,
        organization: c.organization,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        email: c.email,
        type: c.type,
        department: c.department,
        notes: c.notes,
        tags: c.tags,
        quickbaseId: c.quickbaseId,
        isFavorite: c.isFavorite,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        ownerId: c.ownerId,
        groups: (c.groups || []).map((g: any) => g.group),
        projectStatus: c.projectStatus,
        statusCategory: c.statusCategory,
        isStale: c.isStale,
        lastContactDate: c.lastContactDate,
        lastContactBy: c.lastContactBy,
        lastContactByUser: c.lastContactByUser,
        lastContactDepartment: c.lastContactDepartment,
        lastContactType: c.lastContactType,
        voicemailCallbackDue: c.voicemailCallbackDue,
        textResponseDue: c.textResponseDue,
        missedCallFollowupDue: c.missedCallFollowupDue,
        unreadCount: c.unreadCount,
        projectCoordinatorId: c.projectCoordinatorId,
        projectCoordinator: c.projectCoordinator,
      }));

      return { total, contacts: serialized };
    }, [
      JSON.stringify({
        ...searchParamsObj,
      }),
    ], { tags: ["contacts", String(sectionType)] });

    const { total, contacts } = await fetchContacts();

    return NextResponse.json({
      contacts,
      total,
      page: validatedParams.page,
      limit: validatedParams.limit,
      totalPages: Math.ceil(total / validatedParams.limit),
      sectionType: validatedParams.sectionType,
      filters: {
        projectStatus: validatedParams.projectStatus,
        statusCategory: validatedParams.statusCategory,
        isStale: validatedParams.isStale,
        slaViolation: validatedParams.slaViolation,
      }
    });
  } catch (error) {
    console.error('Error in /api/contacts:', error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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
    // Validate the request body
    const validatedData = createContactSchema.parse(body);

    const created = await prisma.contact.create({
      data: {
        organization: validatedData.organization,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        email: validatedData.email || null,
        type: validatedData.type as any,
        department: validatedData.department || null,
        notes: validatedData.notes || null,
        tags: validatedData.tags || [],
        quickbaseId: validatedData.quickbaseId || null,
        isFavorite: validatedData.isFavorite ?? false,
        projectStatus: validatedData.projectStatus as any,
        lastContactDate: validatedData.lastContactDate ? new Date(validatedData.lastContactDate) : null,
        lastContactBy: validatedData.lastContactBy || null,
        lastContactDepartment: validatedData.lastContactDepartment || null,
        lastContactType: validatedData.lastContactType || null,
        voicemailCallbackDue: validatedData.voicemailCallbackDue ? new Date(validatedData.voicemailCallbackDue) : null,
        textResponseDue: validatedData.textResponseDue ? new Date(validatedData.textResponseDue) : null,
        missedCallFollowupDue: validatedData.missedCallFollowupDue ? new Date(validatedData.missedCallFollowupDue) : null,
        unreadCount: validatedData.unreadCount ?? 0,
        projectCoordinatorId: validatedData.projectCoordinatorId || null,
      },
    });

    revalidateTag('contacts');
    if (created.type === 'CUSTOMER') revalidateTag('CUSTOMERS');

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid contact data", details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
