import prisma from "@/lib/prisma"
import { validateInvestmentPocket } from "@/lib/validate"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    const body = await request.json()
    const validation = validateInvestmentPocket(body, { requireAccount: false })
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const pocket = await prisma.investmentPocket.update({
      where: { id: parsedId },
      data: validation.data,
    })
    return success(pocket)
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Investment pocket not found")
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

    await prisma.investmentPocket.delete({
      where: { id: parsedId },
    })
    return success({ message: "Deleted successfully" })
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Investment pocket not found")
    }
    return serverError(error.message)
  }
}
