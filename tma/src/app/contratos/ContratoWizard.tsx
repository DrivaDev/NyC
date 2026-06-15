"use client"

import { useReducer, useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  FileText,
  FilePen,
  FileCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Upload,
  X,
} from "lucide-react"
import { getModelsByGroup, type ContractModel } from "@/lib/contracts/models"

// ── Types ──────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4

interface GenerationResult {
  blob: Blob
  completedCount: number
  totalCount: number
}

interface LocadorEntry {
  id: string      // local React key (crypto.randomUUID())
  files: File[]
  open: boolean   // collapsible open/closed state
}

interface WizardState {
  step: WizardStep
  model: ContractModel | null
  siteFiles: File[]
  locadores: LocadorEntry[]
  facturacion: string
  notes: string
  result: GenerationResult | null
  error: string | null
}

type WizardAction =
  | { type: "SELECT_MODEL"; model: ContractModel }
  | { type: "SET_SITE_FILES"; files: File[] }
  | { type: "ADD_LOCADOR" }
  | { type: "REMOVE_LOCADOR"; id: string }
  | { type: "SET_LOCADOR_FILES"; id: string; files: File[] }
  | { type: "TOGGLE_LOCADOR"; id: string }
  | { type: "SET_FACTURACION"; facturacion: string }
  | { type: "SET_NOTES"; notes: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "START_PROCESSING" }
  | { type: "SET_RESULT"; result: GenerationResult }
  | { type: "SET_ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "RESET" }

const initialState: WizardState = {
  step: 1,
  model: null,
  siteFiles: [],
  locadores: [{ id: crypto.randomUUID(), files: [], open: true }],
  facturacion: "",
  notes: "",
  result: null,
  error: null,
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SELECT_MODEL":
      return { ...state, model: action.model }
    case "SET_SITE_FILES":
      return { ...state, siteFiles: action.files }
    case "ADD_LOCADOR":
      return { ...state, locadores: [...state.locadores, { id: crypto.randomUUID(), files: [], open: true }] }
    case "REMOVE_LOCADOR":
      return { ...state, locadores: state.locadores.filter(l => l.id !== action.id) }
    case "SET_LOCADOR_FILES":
      return { ...state, locadores: state.locadores.map(l => l.id === action.id ? { ...l, files: action.files } : l) }
    case "TOGGLE_LOCADOR":
      return { ...state, locadores: state.locadores.map(l => l.id === action.id ? { ...l, open: !l.open } : l) }
    case "SET_FACTURACION":
      return { ...state, facturacion: action.facturacion }
    case "SET_NOTES":
      return { ...state, notes: action.notes }
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, 4) as WizardStep }
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) as WizardStep }
    case "START_PROCESSING":
      return { ...state, step: 3, error: null, result: null }
    case "SET_RESULT":
      return { ...state, step: 4, result: action.result, error: null }
    case "SET_ERROR":
      return { ...state, error: action.error }
    case "RETRY":
      return { ...state, error: null }
    case "RESET":
      return { ...initialState, locadores: [{ id: crypto.randomUUID(), files: [], open: true }], facturacion: "", notes: "" }
    default:
      return state
  }
}

// ── Processing messages ────────────────────────────────────────────────────────

const PROCESSING_MESSAGES = [
  "Analizando documentación...",
  "Identificando campos del contrato...",
  "Procesando información...",
  "Completando el documento...",
]

// ── Accepted file types ────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",")

// ── Icon mapping ───────────────────────────────────────────────────────────────

function getGroupIcon(group: string) {
  if (group === "Anexo AC") return FileText
  if (group === "Adenda Carta Oferta") return FilePen
  return FileCheck
}

function getBadgeLabel(group: string) {
  if (group === "Anexo AC") return "Anticorrupción"
  if (group === "Adenda Carta Oferta") return "Carta Oferta"
  return "Contrato Tradicional"
}

// ── Card style ─────────────────────────────────────────────────────────────────

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #a8dbde",
  boxShadow: "0 1px 3px rgba(30,35,82,0.06), 0 1px 2px -1px rgba(30,35,82,0.04)",
}

// ── FileUploadZone ─────────────────────────────────────────────────────────────

interface FileUploadZoneProps {
  label: string
  files: File[]
  onChange: (files: File[]) => void
  required?: boolean
}

function FileUploadZone({ label, files, onChange, required = false }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [typeError, setTypeError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const valid = arr.filter(f => ACCEPTED_TYPES.includes(f.type))
    const invalid = arr.filter(f => !ACCEPTED_TYPES.includes(f.type))
    if (invalid.length > 0) setTypeError("Tipo de archivo no soportado. Usá jpg, png, pdf o docx")
    else setTypeError(null)
    if (valid.length > 0) onChange([...files, ...valid])
  }

  const removeFile = (index: number) => onChange(files.filter((_, i) => i !== index))

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[14px] font-bold text-brand-text">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <p className="text-[11px] text-brand-text/60">Aceptá jpg, png, pdf o docx</p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
        className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-xl transition-colors"
        style={{
          minHeight: 88,
          padding: 16,
          border: isDragOver ? "1.5px solid #78ccd0" : "1.5px dashed #a8dbde",
          background: isDragOver ? "rgba(120,204,208,0.06)" : "#f0f9fa",
        }}
      >
        <Upload size={24} style={{ color: "#a8dbde" }} />
        <span className="text-[14px] text-brand-text/60">Hacé clic o arrastrá archivos</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={e => e.target.files && addFiles(e.target.files)}
      />

      {typeError && (
        <p className="text-[11px] text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {typeError}
        </p>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {files.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1 text-[11px] rounded-full px-2 py-1"
              style={{ backgroundColor: "#a8dbde", color: "#1e2352" }}
            >
              <span className="truncate max-w-[120px]">
                {f.name.length > 24 ? f.name.slice(0, 21) + "..." : f.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Quitar ${f.name}`}
                className="cursor-pointer hover:opacity-70 transition-opacity"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── WizardStepIndicator ────────────────────────────────────────────────────────

const STEP_LABELS = ["Selección", "Documentación", "Procesamiento", "Descarga"]

function WizardStepIndicator({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(step => {
          const isActive = step === currentStep
          const isCompleted = step < currentStep
          return (
            <div
              key={step}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: isCompleted ? "#1e2352" : isActive ? "#78ccd0" : "#a8dbde",
                opacity: isActive || isCompleted ? 1 : 0.6,
              }}
            />
          )
        })}
      </div>
      <div className="flex gap-4">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className="text-[11px] text-brand-text/60"
            style={{ fontWeight: i + 1 === currentStep ? 700 : 400 }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main ContratoWizard ────────────────────────────────────────────────────────

export function ContratoWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState)
  const [msgIndex, setMsgIndex] = useState(0)
  const modelGroups = getModelsByGroup()

  // Dynamic processing messages: per-locador for AC multi-locador
  const processingMessages = (state.model?.type === "ac" && state.locadores.length > 1)
    ? state.locadores.flatMap((_, i) => [
        `Analizando documentación del Locador ${i + 1}...`,
        `Completando datos del Locador ${i + 1}...`,
      ])
    : PROCESSING_MESSAGES

  // Cycle processing messages while generating.
  // msgIndex resets to 0 on unmount via the cleanup; step 3 is entered once per flow.
  useEffect(() => {
    const isLoading = state.step === 3 && !state.error
    if (!isLoading) return
    const interval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, processingMessages.length - 1))
    }, 4000)
    return () => {
      clearInterval(interval)
      setMsgIndex(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.error])

  // Auto-run generate when entering step 3
  useEffect(() => {
    if (state.step === 3 && !state.result && !state.error) {
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step])

  async function handleGenerate() {
    const fd = new FormData()
    fd.append("modelId", state.model!.id)
    fd.append("notes", state.notes)
    fd.append("facturacion", state.facturacion)
    state.siteFiles.forEach(f => fd.append("siteFiles", f))
    fd.append("locadorCount", String(state.locadores.length))
    state.locadores.forEach((loc, i) => {
      loc.files.forEach(f => fd.append(`personFiles_${i}`, f))
    })

    try {
      const res = await fetch("/api/contracts/generate", { method: "POST", body: fd })
      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const b = await res.json(); if (b?.error) msg = b.error } catch { /* ignore */ }
        throw new Error(msg)
      }
      const blob = await res.blob()
      const header = res.headers.get("X-Fields-Completed") ?? "0/0"
      const [comp, total] = header.split("/").map(Number)
      dispatch({ type: "SET_RESULT", result: { blob, completedCount: comp || 0, totalCount: total || 0 } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      dispatch({ type: "SET_ERROR", error: msg })
    }
  }

  function downloadDocx() {
    if (!state.result) return
    const url = URL.createObjectURL(state.result.blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contrato.docx"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Step 1: Model selection ───────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="flex flex-col gap-8">
      <h2 className="text-[20px] font-bold text-brand-title text-center">
        Seleccioná el modelo de contrato
      </h2>

      {Array.from(modelGroups.entries()).map(([group, models], groupIdx) => {
        const GroupIcon = getGroupIcon(group)
        const badgeLabel = getBadgeLabel(group)
        return (
          <div key={group}>
            {groupIdx > 0 && <div className="h-px bg-brand-accent/30 mb-6" />}
            <p className="text-[14px] font-bold text-brand-title mb-4">{group}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {models.map((m, cardIdx) => {
                const isSelected = state.model?.id === m.id
                return (
                  <motion.button
                    key={m.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut", delay: groupIdx * models.length * 0.05 + cardIdx * 0.05 }}
                    whileHover={{ scale: 1.025, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { dispatch({ type: "SELECT_MODEL", model: m }); dispatch({ type: "NEXT_STEP" }) }}
                    className="text-left h-full p-6 flex flex-col gap-4 rounded-2xl focus:outline-none"
                    style={{ ...cardStyle, outline: isSelected ? "2px solid #78ccd0" : "none", outlineOffset: isSelected ? 2 : 0 }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isSelected ? "#78ccd0" : "#a8dbde" }}
                    >
                      <GroupIcon size={20} style={{ color: isSelected ? "#FFFFFF" : "#1e2352" }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-brand-title leading-snug mb-1">{m.label}</p>
                      <p className="text-[11px] text-brand-text/70 leading-relaxed">{m.description}</p>
                    </div>
                    <span
                      className="self-start text-[11px] font-bold rounded-full"
                      style={{ backgroundColor: "#a8dbde", color: "#1e2352", padding: "4px 8px" }}
                    >
                      {badgeLabel}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}

    </div>
  )

  // ── Step 2: Document upload ───────────────────────────────────────────────

  const isAdenda = state.model?.type === "adenda"
  const allLocadoresFilled = state.locadores.every(l => l.files.length > 0)
  const step2RequiredFulfilled = isAdenda
    ? state.siteFiles.length > 0 && allLocadoresFilled
    : allLocadoresFilled

  const renderStep2 = () => (
    <div className="p-8 rounded-2xl flex flex-col gap-6" style={cardStyle}>
      <h2 className="text-[20px] font-bold text-brand-title">
        Cargá la documentación del asunto
      </h2>

      {isAdenda && (
        <FileUploadZone
          label="Información del sitio"
          files={state.siteFiles}
          onChange={files => dispatch({ type: "SET_SITE_FILES", files })}
          required
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-brand-text">Locadores</label>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_LOCADOR" })}
            className="text-[12px] font-bold rounded-lg px-3 py-1.5 transition-colors"
            style={{ backgroundColor: "#78ccd0", color: "#FFFFFF" }}
          >
            + Agregar locador
          </button>
        </div>

        <AnimatePresence initial={false}>
          {state.locadores.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #a8dbde", background: "#f0f9fa" }}
            >
              <div className="flex items-center justify-between px-4 py-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "TOGGLE_LOCADOR", id: loc.id })}
                  className="text-[13px] font-bold text-brand-title"
                >
                  {loc.open ? "▾" : "▸"} Locador {i + 1}
                </button>
                {state.locadores.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_LOCADOR", id: loc.id })}
                    aria-label={`Quitar Locador ${i + 1}`}
                    className="text-[12px] rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "#a8dbde", color: "#1e2352" }}
                  >
                    −
                  </button>
                )}
              </div>
              {loc.open && (
                <div className="px-4 pb-4">
                  <FileUploadZone
                    label="Personas relacionadas"
                    files={loc.files}
                    onChange={files => dispatch({ type: "SET_LOCADOR_FILES", id: loc.id, files })}
                    required
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-bold text-brand-text">Facturación</label>
        <p className="text-[11px] text-brand-text/60">
          Datos de Alta de Usuario Mercurio – Proveedores (nombre, apellido, DNI, CUIL, móvil, mail, CUIT empresa, razón social)
        </p>
        <textarea
          rows={5}
          value={state.facturacion}
          onChange={e => dispatch({ type: "SET_FACTURACION", facturacion: e.target.value })}
          placeholder={"Ej:\nNombre: Roberto\nApellido: Zanet\nDNI: 22213175\nCUIL: 20222131759\nMóvil: 1150114359\nMail: vanina_z@hotmail.com\nCUIT empresa: 27252640555\nRazón Social: VANINA ANDREA ZANET"}
          className="resize-y rounded-xl font-[Sora] text-[13px] text-brand-text focus:outline-none transition-colors"
          style={{ minHeight: 112, padding: "12px 16px", border: "1px solid #a8dbde", background: "#f0f9fa" }}
          onFocus={e => { e.target.style.borderColor = "#78ccd0" }}
          onBlur={e => { e.target.style.borderColor = "#a8dbde" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-bold text-brand-text">Notas</label>
        <textarea
          rows={4}
          value={state.notes}
          onChange={e => dispatch({ type: "SET_NOTES", notes: e.target.value })}
          placeholder="Información adicional relevante para completar el contrato (opcional)"
          className="resize-y rounded-xl font-[Sora] text-[14px] text-brand-text focus:outline-none transition-colors"
          style={{ minHeight: 96, padding: "12px 16px", border: "1px solid #a8dbde", background: "#f0f9fa" }}
          onFocus={e => { e.target.style.borderColor = "#78ccd0" }}
          onBlur={e => { e.target.style.borderColor = "#a8dbde" }}
        />
      </div>

      <div className="flex justify-between items-center mt-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="text-[14px] text-brand-text/70 hover:text-brand-title transition-colors"
        >
          Volver
        </button>
        <button
          type="button"
          disabled={!step2RequiredFulfilled}
          onClick={() => dispatch({ type: "START_PROCESSING" })}
          className="px-6 py-3 rounded-xl text-[14px] font-bold text-white transition-all duration-200"
          style={{ backgroundColor: "#78ccd0", opacity: step2RequiredFulfilled ? 1 : 0.45, cursor: step2RequiredFulfilled ? "pointer" : "not-allowed" }}
        >
          Generar contrato
        </button>
      </div>
    </div>
  )

  // ── Step 3: Generating ─────────────────────────────────────────────────────

  const renderStep3 = () => {
    if (state.error) {
      return (
        <div className="p-12 rounded-2xl flex flex-col items-center gap-6 text-center" style={cardStyle}>
          <AlertCircle size={48} className="text-red-600" />
          <p className="text-[14px] font-bold text-brand-text">{state.error}</p>
          <p className="text-[11px] text-brand-text/60">
            Los archivos se mantienen cargados — no necesitás volver a subirlos.
          </p>
          <button
            type="button"
            onClick={() => { dispatch({ type: "RETRY" }); handleGenerate() }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold text-white max-w-[240px] w-full justify-center"
            style={{ backgroundColor: "#78ccd0" }}
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "PREV_STEP" })}
            className="text-[11px] text-brand-text/70 hover:text-brand-title transition-colors"
          >
            Volver a Documentación
          </button>
        </div>
      )
    }

    return (
      <div className="p-12 rounded-2xl flex flex-col items-center gap-6 text-center" style={cardStyle}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        >
          <Loader2 size={48} style={{ color: "#78ccd0" }} />
        </motion.div>

        <div style={{ minHeight: 44 }} className="flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-[14px] text-brand-text"
            >
              {processingMessages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="text-[11px] text-brand-text/50">Esto puede demorar hasta 60 segundos</p>
      </div>
    )
  }

  // ── Step 4: Download ──────────────────────────────────────────────────────

  const renderStep4 = () => {
    const { completedCount = 0, totalCount = 0 } = state.result ?? {}

    return (
      <div className="p-12 rounded-2xl flex flex-col items-center gap-6 text-center" style={cardStyle}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <CheckCircle size={48} style={{ color: "#1e2352" }} />
        </motion.div>

        <span
          className="text-[11px] font-bold rounded-full"
          style={{ backgroundColor: "#a8dbde", color: "#1e2352", padding: "4px 12px" }}
        >
          {completedCount} de {totalCount} campos completados
        </span>

        <p className="text-[20px] font-bold text-brand-title">
          Tu contrato está listo
        </p>

        <motion.button
          type="button"
          onClick={downloadDocx}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold text-white w-full max-w-[280px] justify-center"
          style={{ backgroundColor: "#78ccd0" }}
        >
          <Download size={18} />
          Descargar .docx
        </motion.button>

        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="text-[11px] text-brand-text/60 hover:text-brand-title hover:underline transition-colors mt-2"
        >
          Generar otro contrato
        </button>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-background py-16 px-4">
      <div className="w-full max-w-[720px] mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <h1 className="text-[30px] font-bold text-brand-title mb-2 tracking-tight">
            Contratos TMA
          </h1>
          <p className="text-[14px] text-brand-text/60">
            Generá contratos completados automáticamente
          </p>
        </motion.div>

        <div className="mb-8">
          <WizardStepIndicator currentStep={state.step} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
