// export default Layout;
import { useAuth } from "../context/AuthContext.jsx";
import { NavLink } from "react-router-dom";
import { logout } from "../firebase";

const navLinkBase =
  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition";
const navLinkInactive = "text-slate-300 hover:bg-slate-700/60";
const navLinkActive = "bg-slate-700 text-white shadow";

export default function Layout({ children }) {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Could not log out. Please try again.");
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950/70 shrink-0">
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold tracking-tight">
            WorkHub <span className="text-indigo-400">Lite</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Focus • Track • Improve
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive} w-full block`
            }
          >
            <span>📋</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/focus"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive} w-full block`
            }
          >
            <span>🎯</span>
            <span>Focus Mode</span>
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive} w-full block`
            }
          >
            <span>📊</span>
            <span>Stats</span>
          </NavLink>
        </nav>

       <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex flex-col gap-1">
            <div>
              Logged in as{" "}
              <span className="text-slate-200 font-medium">
                {user?.displayName ||  user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="self-start text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-950/80 backdrop-blur">
          <div className="md:hidden font-semibold">
            WorkHub <span className="text-indigo-400">Lite</span>
          </div>
          <div className="text-xs md:text-sm text-slate-400">
            Today is{" "}
            <span className="text-slate-100 font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden md:inline text-xs text-slate-400">
                {user?.displayName || user?.name || user?.email}
              </span>
            )}
            <button className="hidden sm:inline text-[11px] px-3 py-1 rounded-full border border-slate-600 hover:border-indigo-400 hover:text-indigo-300 transition">
              ⏱ Daily Streak: <span className="font-semibold">0</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1 rounded-full border border-slate-600 hover:border-red-400 hover:text-red-300">
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-slate-900">{children}</main>
      </div>
    </div>
  );
}
