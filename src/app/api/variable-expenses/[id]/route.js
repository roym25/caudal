import prisma from "@/lib/prisma"
import { validateVariableExpense } from "@/lib/validate"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    const body = await request.json()
    const validation = validateVariableExpense(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const expense = await prisma.variableExpense.update({
      where: { id: parsedId },
      data: validation.data,
    })
    return success(expense)
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Variable expense not found")
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

    await prisma.variableExpense.delete({
      where: { id: parsedId },
    })
    return success({ message: "Deleted successfully" })
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Variable expense not found")
    }
    return serverError(error.message)
  }
}