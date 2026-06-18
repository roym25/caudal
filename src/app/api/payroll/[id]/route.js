import prisma from "@/lib/prisma"

export async function PUT(request, { params }) {
  const { id } = await params
  const body = await request.json()
  const payroll = await prisma.payroll.update({
    where: { id: parseInt(id) },
    data: {
      date: new Date(body.date),
      week: body.week,
      amountReceived: body.amountReceived,
      isr: body.isr,
      notes: body.notes
    }
  })
  return Response.json(payroll)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  await prisma.payroll.delete({
    where: { id: parseInt(id) }
  })
  return Response.json({ message: 'Deleted successfully' })
}