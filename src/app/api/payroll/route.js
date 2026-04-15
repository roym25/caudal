import prisma from "@/lib/prisma"

export async function GET() {
  const payrolls = await prisma.payroll.findMany()
  return Response.json(payrolls)
}