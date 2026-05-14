import prisma from "@/lib/prisma"

export async function PUT(request, { params }) {
  const { id } = await params
  const body = await request.json()
  const expense = await prisma.fixedExpense.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      cost: body.cost,
      dueDay: body.dueDay
    }
  })
  return Response.json(expense)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const expenseId = parseInt(id)

  await prisma.fixedPayment.deleteMany({
    where: { fixedExpenseId: expenseId }
  })

  await prisma.fixedExpense.delete({
    where: { id: expenseId }
  })

  return Response.json({ message: 'Deleted successfully' })
}