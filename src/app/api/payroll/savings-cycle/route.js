import prisma from "@/lib/prisma"
import { success, badRequest, serverError } from "@/lib/api-response"

export async function POST(request) {
  try {
    const body = await request.json()
    const action = body?.action || "close"

    if (action === "close") {
      const now = new Date()
      const result = await prisma.payroll.updateMany({
        where: { savingsPaidAt: null },
        data: { savingsPaidAt: now },
      })
      return success({ updated: result.count, savingsPaidAt: now })
    }

    if (action === "undo") {
      const latestPaid = await prisma.payroll.findFirst({
        where: { NOT: { savingsPaidAt: null } },
        orderBy: { savingsPaidAt: "desc" },
        select: { savingsPaidAt: true },
      })

      if (!latestPaid?.savingsPaidAt) {
        return badRequest(["No previous payout cycle found to undo"])
      }

      const result = await prisma.payroll.updateMany({
        where: { savingsPaidAt: latestPaid.savingsPaidAt },
        data: { savingsPaidAt: null },
      })
      return success({ restored: result.count })
    }

    return badRequest(["Invalid action. Expected 'close' or 'undo'"])
  } catch (error) {
    return serverError(error.message)
  }
}
