import prisma from "@/lib/prisma"
import { validateFixedExpense } from "@/lib/validate"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    const body = await request.json()
    const validation = validateFixedExpense(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const expense = await prisma.fixedExpense.update({
      where: { id: parsedId },
      data: validation.data,
    })
    return success(expense)
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Fixed expense not found")
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

    await prisma.fixedPayment.deleteMany({
      where: { fixedExpenseId: parsedId },
    })

    await prisma.fixedExpense.delete({
      where: { id: parsedId },
    })

    return success({ message: "Deleted successfully" })
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Fixed expense not found")
    }
    return serverError(error.message)
  }
}