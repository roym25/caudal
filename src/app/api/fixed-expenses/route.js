import prisma from "@/lib/prisma"

export async function GET() {
  const fixedExpenses = await prisma.fixedExpense.findMany({
    include: {
      payments: true
    }
  })
  return Response.json(fixedExpenses)
}

import prisma from "@/lib/prisma"

export async function GET() {
  const fixedExpenses = await prisma.fixedExpense.findMany({
    include: {
      payments: true
    }
  })
  return Response.json(fixedExpenses)
}

export async function POST(request) {
  const body = await request.json()
  const fixedExpense = await prisma.fixedExpense.create({
    data: {
      name: body.name,
      cost: body.cost,
      dueDay: body.dueDay
    }
  })
  return Response.json(fixedExpense)
}