export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
        <span>© {new Date().getFullYear()} Kris Korich</span>
        <span>Built with React, Vite, and Tailwind.</span>
      </div>
    </footer>
  );
}
