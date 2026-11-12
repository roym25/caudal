import prisma from "@/lib/prisma"
import { validateInvestmentAccount } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

const INITIAL_BANK_DEFAULTS = [
  { match: "openbank", rate: 13, maxAmount: 30000, color: "green" },
  { match: "mercado", rate: 12, maxAmount: 25000, color: "yellow" },
  { match: "didi", rate: 15, maxAmount: 10000, color: "orange" },
]

export async function GET() {
  try {
    const accounts = await prisma.investmentAccount.findMany({
      include: {
        pockets: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })

    // Upgrade legacy Quick Setup banks once if they were created before rate/maxAmount/color existed
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i]
      if (acc.rate === null && acc.maxAmount === null && acc.color === null) {
        const norm = String(acc.name || "").toLowerCase().replace(/\s+/g, "")
        const def = INITIAL_BANK_DEFAULTS.find((d) => norm.includes(d.match))
        if (def) {
          accounts[i] = await prisma.investmentAccount.update({
            where: { id: acc.id },
            data: { rate: def.rate, maxAmount: def.maxAmount, color: def.color },
            include: { pockets: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
          })
        }
      }
    }

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
