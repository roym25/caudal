import prisma from "@/lib/prisma"
import { validateVariableExpense } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const expenses = await prisma.variableExpense.findMany({
      orderBy: { date: "desc" },
    })
    return success(expenses)
  } catch (error) {
    return serverError(error.message)
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = validateVariableExpense(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const expense = await prisma.variableExpense.create({
      data: validation.data,
    })
    return created(expense)
  } catch (error) {
    return serverError(error.message)
  }
}