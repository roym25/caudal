import prisma from "@/lib/prisma"
import { validateInvestmentAccount } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

const INITIAL_BANK_DEFAULTS = [
  { match: "openbank", rate: 13, maxAmount: 30000, color: "green" },
  { match: "mercado", rate: 12, maxAmount: 25000, color: "yellow" },
  { match: "didi", rate: 15, maxAmount: 10000, color: "orange" },
]

const ACCOUNT_INCLUDE = {
  pockets: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  movements: { orderBy: [{ date: "desc" }, { id: "desc" }] },
}

export async function GET() {
  try {
    const accounts = await prisma.investmentAccount.findMany({
      include: ACCOUNT_INCLUDE,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    })

    // Upgrade legacy Quick Setup banks once and backfill initial movements for pre-existing pockets
    for (let i = 0; i < accounts.length; i++) {
      let acc = accounts[i]
      if (acc.rate === null && acc.maxAmount === null && acc.color === null) {
        const norm = String(acc.name || "").toLowerCase().replace(/\s+/g, "")
        const def = INITIAL_BANK_DEFAULTS.find((d) => norm.includes(d.match))
        if (def) {
          acc = await prisma.investmentAccount.update({
            where: { id: acc.id },
            data: { rate: def.rate, maxAmount: def.maxAmount, color: def.color },
            include: ACCOUNT_INCLUDE,
          })
          accounts[i] = acc
        }
      }

      if ((acc.movements?.length || 0) === 0 && (acc.pockets?.length || 0) > 0) {
        const positivePockets = acc.pockets.filter((p) => (p.amount || 0) > 0)
        if (positivePockets.length > 0) {
          await prisma.investmentMovement.createMany({
            data: positivePockets.map((p) => ({
              accountId: acc.id,
              pocketId: p.id,
              pocketName: p.name,
              type: "deposit",
              amount: p.amount,
              date: p.createdAt || new Date(),
            })),
          })
          accounts[i] = await prisma.investmentAccount.findUnique({
            where: { id: acc.id },
            include: ACCOUNT_INCLUDE,
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
      include: ACCOUNT_INCLUDE,
    })
    return created(account)
  } catch (error) {
    return serverError(error.message)
  }
}
