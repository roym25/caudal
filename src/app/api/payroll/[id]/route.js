import prisma from "@/lib/prisma"
import { validatePayroll } from "@/lib/validate"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    const body = await request.json()
    const validation = validatePayroll(body)
    if (!validation.valid) {
      return badRequest(validation.errors)
    }

    const payroll = await prisma.payroll.update({
      where: { id: parsedId },
      data: validation.data,
    })
    return success(payroll)
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Payroll not found")
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

    await prisma.payroll.delete({
      where: { id: parsedId },
    })
    return success({ message: "Deleted successfully" })
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Payroll not found")
    }
    return serverError(error.message)
  }
}