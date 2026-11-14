import prisma from "@/lib/prisma"
import { validateInvestmentAccount } from "@/lib/validate"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    const body = await request.json()
    const validation = validateInvestmentAccount(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const account = await prisma.investmentAccount.update({
      where: { id: parsedId },
      data: validation.data,
      include: {
        pockets: true,
        movements: { orderBy: [{ date: "desc" }, { id: "desc" }] },
      },
    })
    return success(account)
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Investment account not found")
    }
    return serverError(error.message)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    // Pockets are removed automatically (onDelete: Cascade)
    await prisma.investmentAccount.delete({
      where: { id: parsedId },
    })
    return success({ message: "Deleted successfully" })
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Investment account not found")
    }
    return serverError(error.message)
  }
}
