export function Footer() {
  return (
    <footer className="w-full py-3 text-center" style={{ height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className="text-[11px] font-normal text-brand-text/60">
        Desarrollado por{" "}
        <a
          href="https://drivadev.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary hover:text-brand-title font-medium underline-offset-2 hover:underline transition-colors"
        >
          Driva Dev
        </a>
      </p>
    </footer>
  )
}
