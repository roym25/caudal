import prisma from "@/lib/prisma"

export async function POST(request) {
  const body = await request.json()
  const date = new Date(body.date)

  const existing = await prisma.fixedPayment.findFirst({
    where: {
      fixedExpenseId: body.fixedExpenseId,
      date: date
    }
  })

  let payment

  if (existing) {
    payment = await prisma.fixedPayment.update({
      where: { id: existing.id },
      data: { paid: body.paid }
    })
  } else {
    payment = await prisma.fixedPayment.create({
      data: {
        fixedExpenseId: body.fixedExpenseId,
        date: date,
        paid: body.paid
      }
    })
  }

  return Response.json(payment)
}