import { NavLink } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-6 px-6 py-4 sm:px-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              OPUS Assessment
            </span>
          </div>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            {[
              { to: "/uploads", label: "Uploads" },
              { to: "/upload", label: "Upload" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                    isActive
                      ? "bg-teal-600 text-white shadow-sm"
                      : "border border-slate-300 bg-white text-slate-800 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <span aria-current={isActive ? "page" : undefined}>
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto">
          <AppRoutes />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500 sm:px-10">
        OPUS Assessment Data Imports
      </footer>
    </div>
  );
}

export default App;
