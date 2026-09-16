import prisma from "@/lib/prisma"
import { validateVariableExpense } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")

    let where = {}
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split("-").map(Number)
      const start = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0))
      const end = new Date(Date.UTC(year, m, 1, 0, 0, 0))
      where = { date: { gte: start, lt: end } }
    }

    const expenses = await prisma.variableExpense.findMany({
      where,
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