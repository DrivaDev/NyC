import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { casoSchema } from "@/lib/validations"
import mongoose from "mongoose"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  await connectDB()
  const casos = await Caso.find().sort({ fechaVencimiento: 1 }).lean()
  return NextResponse.json(casos)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const result = casoSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: result.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  const caso = await Caso.create({
    nombre: result.data.nombre,
    responsable: result.data.responsable,
    fechaIngreso: new Date(result.data.fechaIngreso + "T12:00:00"),
    fechaVencimiento: new Date(result.data.fechaVencimiento + "T12:00:00"),
  })
  return NextResponse.json(caso, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  await connectDB()
  const deleted = await Caso.findByIdAndDelete(id)
  if (!deleted) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
