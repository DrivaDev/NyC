"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

function LoginView({
  signingIn,
  onSignIn,
}: {
  signingIn: boolean;
  onSignIn: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-sm w-full mx-4">
        <h1 className="text-4xl font-bold text-gray-900 text-center">
          The Annex
        </h1>
        <p className="text-xl font-bold text-gray-500 text-center mt-2">
          Candidaturas Val Thorens
        </p>
        <div className="mt-8">
          <button
            onClick={onSignIn}
            disabled={signingIn}
            className="w-full bg-white border border-gray-300 rounded-lg py-3 px-6 flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Iniciar sesion con Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12">
      <div
        className="bg-white shadow-md rounded-2xl p-8 max-w-lg w-full mx-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="animate-spin text-french-blue w-10 h-10 mx-auto" />
        <p className="text-base text-gray-600 mt-4">Iniciando proceso...</p>
        <p className="text-sm text-gray-400 text-center mt-1">
          Esto puede tardar varios minutos.
        </p>
      </div>
    </div>
  );
}

function FormView({
  session,
  onSubmitComplete,
}: {
  session: Session;
  onSubmitComplete: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-lg w-full mx-4">
        {/* Card header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">The Annex</h2>
            <p className="text-sm text-gray-500">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm text-french-blue hover:underline"
          >
            Cerrar sesion
          </button>
        </div>

        {/* TODO: Form fields — implemented in PLAN-03 */}

        {/* TODO: Submit button — implemented in PLAN-03 */}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Home() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<"login" | "form" | "loading">("login");
  const [signingIn, setSigningIn] = useState(false);

  if (status === "loading") return null;

  // Authenticated → show form or loading
  if (status === "authenticated") {
    if (view === "loading") {
      return <LoadingView />;
    }
    return (
      <FormView
        session={session}
        onSubmitComplete={() => setView("loading")}
      />
    );
  }

  // Unauthenticated → login
  return (
    <LoginView
      signingIn={signingIn}
      onSignIn={() => {
        setSigningIn(true);
        signIn("google");
      }}
    />
  );
}
