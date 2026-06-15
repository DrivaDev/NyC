"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Period = "1m" | "3m" | "1y"

interface CasoData {
  _id: string
  createdAt: string
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: "1m", label: "Último mes", days: 30 },
  { value: "3m", label: "Últimos 3 meses", days: 90 },
  { value: "1y", label: "Último año", days: 365 },
]

export function CasosEstadisticas() {
  const [casos, setCasos] = useState<CasoData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("1m")

  useEffect(() => {
    fetch("/api/casos")
      .then(r => r.json())
      .then((data: CasoData[]) => { setCasos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const selectedPeriod = PERIODS.find(p => p.value === period)!
  const cutoff = new Date(now.getTime() - selectedPeriod.days * 86_400_000)
  const casosInPeriod = casos.filter(c => new Date(c.createdAt) >= cutoff).length

  const currentYear = now.getFullYear()
  const chartData = MONTHS_ES.map((mes, i) => ({
    mes,
    cantidad: casos.filter(c => {
      const d = new Date(c.createdAt)
      return d.getFullYear() === currentYear && d.getMonth() === i
    }).length,
  }))

  return (
    <div className="bg-brand-background min-h-[calc(100vh-3.5rem)] py-10 px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-[860px] mx-auto flex flex-col gap-8"
      >
        <h1 className="text-[28px] font-bold text-brand-title">Estadísticas</h1>

        {/* Card: asuntos en período */}
        <div
          className="rounded-2xl bg-white p-6 flex flex-col gap-5"
          style={{
            border: "1px solid #FECBA1",
            boxShadow: "0 1px 3px 0 rgba(154,52,18,0.06)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-[14px] text-brand-text/60 flex-1">
              Asuntos creados en el período
            </p>
            {/* Selector de período */}
            <div className="flex gap-1 p-1 rounded-lg bg-[#FFF7ED] border border-[#FECBA1]">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={[
                    "px-3 py-1.5 rounded-md text-[12px] transition-colors duration-150",
                    period === p.value
                      ? "bg-white text-brand-primary font-medium shadow-sm border border-[#FECBA1]"
                      : "text-brand-text/60 hover:text-brand-title",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-16 rounded-xl bg-brand-accent/30 animate-pulse" />
          ) : (
            <div className="flex items-end gap-3">
              <span className="text-[52px] font-bold text-brand-title leading-none">
                {casosInPeriod}
              </span>
              <span className="text-[14px] text-brand-text/50 mb-2">
                {casosInPeriod === 1 ? "asunto" : "asuntos"}
              </span>
            </div>
          )}
        </div>

        {/* Gráfico de barras — ingresados por mes */}
        <div
          className="rounded-2xl bg-white p-6 flex flex-col gap-4"
          style={{
            border: "1px solid #FECBA1",
            boxShadow: "0 1px 3px 0 rgba(154,52,18,0.06)",
          }}
        >
          <p className="text-[14px] text-brand-text/60">
            Asuntos ingresados por mes — {currentYear}
          </p>

          {loading ? (
            <div className="h-52 rounded-xl bg-brand-accent/30 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FECBA1" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#FED7AA", opacity: 0.4 }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #FECBA1",
                    fontSize: "13px",
                    color: "#1C1917",
                  }}
                  formatter={(value) => [Number(value ?? 0), "asuntos"]}
                />
                <Bar dataKey="cantidad" fill="#EA580C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  )
}
