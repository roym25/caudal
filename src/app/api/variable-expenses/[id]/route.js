import prisma from "@/lib/prisma"

export async function PUT(request, { params }) {
  const { id } = await params
  const body = await request.json()
  const variableExpense = await prisma.variableExpense.update({
    where: { id: parseInt(id) },
    data: {
      description: body.description,
      date: new Date(body.date),
      amount: body.amount
    }
  })
  return Response.json(variableExpense)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  await prisma.variableExpense.delete({
    where: { id: parseInt(id) }
  })
  return Response.json({ message: 'Deleted successfully' })
}