import prisma from "@/lib/prisma"
import { validateInvestmentAccount } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const accounts = await prisma.investmentAccount.findMany({
      include: {
        pockets: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })
    return success(accounts)
  } catch (error) {
    return serverError(error.message)
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = validateInvestmentAccount(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const account = await prisma.investmentAccount.create({
      data: validation.data,
      include: { pockets: true },
    })
    return created(account)
  } catch (error) {
    return serverError(error.message)
  }
}
