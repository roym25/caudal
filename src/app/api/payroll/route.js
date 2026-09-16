import prisma from "@/lib/prisma"
import { validatePayroll } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: { date: "desc" },
    })
    return success(payrolls)
  } catch (error) {
    return serverError(error.message)
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = validatePayroll(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const payroll = await prisma.payroll.create({
      data: validation.data,
    })
    return created(payroll)
  } catch (error) {
    return serverError(error.message)
  }
}