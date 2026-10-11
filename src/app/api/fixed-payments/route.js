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

    const { fixedExpenseId, date, paid, amount } = validation.data

    let finalAmount = amount
    if (paid && (finalAmount === null || finalAmount === undefined)) {
      const expense = await prisma.fixedExpense.findUnique({
        where: { id: fixedExpenseId },
        select: { cost: true },
      })
      if (expense) {
        finalAmount = expense.cost
      }
    }

    const updateData = { paid }
    if (finalAmount !== null && finalAmount !== undefined) {
      updateData.amount = finalAmount
    }

    const payment = await prisma.fixedPayment.upsert({
      where: {
        fixedExpenseId_date: {
          fixedExpenseId,
          date,
        },
      },
      update: updateData,
      create: {
        fixedExpenseId,
        date,
        paid,
        amount: finalAmount,
      },
    })

    return success(payment)
  } catch (error) {
    return serverError(error.message)
  }
}