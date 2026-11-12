import prisma from "@/lib/prisma"
import { validateInvestmentPocket } from "@/lib/validate"
import { created, badRequest, notFound, serverError } from "@/lib/api-response"

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = validateInvestmentPocket(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const pocket = await prisma.investmentPocket.create({
      data: validation.data,
    })
    return created(pocket)
  } catch (error) {
    if (error.code === "P2003") {
      return notFound("Investment account not found")
    }
    return serverError(error.message)
  }
}
