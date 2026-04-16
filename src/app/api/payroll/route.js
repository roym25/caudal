import prisma from "@/lib/prisma"

export async function GET() {
  const payrolls = await prisma.payroll.findMany()
  return Response.json(payrolls)
}

export async function POST(request) {
  const body = await request.json()
  const payroll = await prisma.payroll.create({
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