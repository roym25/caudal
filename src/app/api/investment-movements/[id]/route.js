import prisma from "@/lib/prisma"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId)) {
      return badRequest(["Invalid ID"])
    }

    await prisma.investmentMovement.delete({
      where: { id: parsedId },
    })
    return success({ message: "Deleted successfully" })
  } catch (error) {
    if (error.code === "P2025") {
      return notFound("Movement not found")
    }
    return serverError(error.message)
  }
}
