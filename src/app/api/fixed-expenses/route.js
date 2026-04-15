import prisma from "@/lib/prisma"

export async function GET() {
  const fixedExpenses = await prisma.fixedExpense.findMany({
    include: {
      payments: true
    }
  })
  return Response.json(fixedExpenses)
}