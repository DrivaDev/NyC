import mongoose, { Schema, Document } from "mongoose"

export interface ICaso extends Document {
  nombre: string
  fechaIngreso: Date
  fechaVencimiento: Date
  responsable: string
  createdAt: Date
}

const CasoSchema = new Schema<ICaso>({
  nombre: { type: String, required: true, trim: true },
  fechaIngreso: { type: Date, required: true },
  fechaVencimiento: { type: Date, required: true },
  responsable: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Caso || mongoose.model<ICaso>("Caso", CasoSchema)
