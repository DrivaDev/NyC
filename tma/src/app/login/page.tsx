import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background py-16 px-4">
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl p-10"
        style={{
          border: "1px solid #a8dbde",
          boxShadow: "0 4px 24px rgba(30,35,82,0.08)",
        }}
      >
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Nicholson & Cano" className="h-10" />
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
