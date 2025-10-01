import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

export type AdminHandler = (req: NextRequest, context?: any) => Promise<Response>;

const ADMIN_ROLES = ["admin", "supervisor"] as const;

export function withAdminAuth(handler: AdminHandler): AdminHandler {
	return async function adminAuthWrapper(req: NextRequest, context?: any): Promise<Response> {
		try {
			const session = await getServerSession(authOptions);

			if (!session) {
				Sentry.addBreadcrumb({
					category: "auth",
					message: "Unauthorized access attempt",
					level: "warning",
				});
				return NextResponse.json({ error: "Unauthorized", requestId: Sentry.getCurrentHub().getScope()?.getTransaction()?.spanId }, { status: 401 });
			}

			const userRole = (session.user as any)?.role as string | undefined;
			const userEmail = (session.user as any)?.email as string | undefined;

			Sentry.addBreadcrumb({
				category: "auth",
				message: `Admin route access by ${userEmail ?? "unknown"} (${userRole ?? "no-role"})`,
				level: "info",
			});

			if (!userRole || !ADMIN_ROLES.includes(userRole as (typeof ADMIN_ROLES)[number])) {
				Sentry.addBreadcrumb({
					category: "auth",
					message: `Forbidden for role ${userRole ?? "none"}`,
					level: "warning",
				});
				return NextResponse.json({ error: "Forbidden", requestId: Sentry.getCurrentHub().getScope()?.getTransaction()?.spanId }, { status: 403 });
			}

			return await handler(req, context);
		} catch (error) {
			Sentry.captureException(error);
			return NextResponse.json({ error: "Internal server error", requestId: Sentry.getCurrentHub().getScope()?.getTransaction()?.spanId }, { status: 500 });
		}
	};
}

export default withAdminAuth;

