import prisma from "@/lib/prisma"

export async function GET() {
  const variableExpenses = await prisma.variableExpense.findMany()
  return Response.json(variableExpenses)
}


export async function POST(request) {
  const body = await request.json()
  const variableExpense = await prisma.variableExpense.create({
    data: {
      description: body.description,
      date: new Date(body.date),
      amount: body.amount
    }
  })
  return Response.json(variableExpense)
}