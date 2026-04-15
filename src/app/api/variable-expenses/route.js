import prisma from "@/lib/prisma"

export async function GET() {
  const variableExpenses = await prisma.variableExpense.findMany()
  return Response.json(variableExpenses)
}