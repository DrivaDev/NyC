import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { casoSchema } from "@/lib/validations"
import mongoose from "mongoose"

export const dynamic = "force-dynamic"

function parseDDMMYYYY(s: string): Date {
  const [dd, mm, yyyy] = s.split("/")
  return new Date(`${yyyy}-${mm}-${dd}T12:00:00`)
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const soloArchivados = searchParams.get("archivados") === "1"

  await connectDB()
  const filter = soloArchivados ? { archivado: true } : { archivado: { $ne: true } }
  const casos = await Caso.find(filter).sort({ fechaVencimiento: 1 }).lean()
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
    fechaIngreso: parseDDMMYYYY(result.data.fechaIngreso),
    fechaVencimiento: parseDDMMYYYY(result.data.fechaVencimiento),
  })
  return NextResponse.json(caso, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
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
  const updated = await Caso.findByIdAndUpdate(
    id,
    {
      nombre: result.data.nombre,
      responsable: result.data.responsable,
      fechaIngreso: parseDDMMYYYY(result.data.fechaIngreso),
      fechaVencimiento: parseDDMMYYYY(result.data.fechaVencimiento),
    },
    { new: true }
  )
  if (!updated) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const body = await request.json()
  const { archivado } = body as { archivado: boolean }
  if (typeof archivado !== "boolean") {
    return NextResponse.json({ error: "Campo archivado requerido" }, { status: 400 })
  }

  await connectDB()
  const updated = await Caso.findByIdAndUpdate(id, { archivado }, { new: true })
  if (!updated) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
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
