import prisma from "@/lib/prisma"
import { validateFixedPayment } from "@/lib/validate"
import { success, badRequest, serverError } from "@/lib/api-response"

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = validateFixedPayment(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const { fixedExpenseId, date, paid } = validation.data

    const payment = await prisma.fixedPayment.upsert({
      where: {
        fixedExpenseId_date: {
          fixedExpenseId,
          date,
        },
      },
      update: { paid },
      create: {
        fixedExpenseId,
        date,
        paid,
      },
    })

    return success(payment)
  } catch (error) {
    return serverError(error.message)
  }
}