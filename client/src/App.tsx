import { NavLink } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              OPUS Assessment
            </span>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Data Imports
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/uploads"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-teal-200 bg-teal-50 text-teal-700"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                }`
              }
            >
              Uploads
            </NavLink>
            <NavLink
              to="/upload"
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-teal-200 bg-teal-50 text-teal-700"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                }`
              }
            >
              Upload
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto ">
          <AppRoutes />
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400 sm:px-10">
        OPUS Assessment Data Imports
      </footer>
    </div>
  );
}

export default App;
