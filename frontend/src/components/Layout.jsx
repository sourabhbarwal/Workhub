// import { Link } from "react-router-dom";
// import "./Layout.css";

// function Layout({ children }) {
//   return (
//     <div className="layout">
//       <nav className="sidebar">
//         <h2>WorkHub Lite</h2>
//         <ul>
//           <li>
//             <Link to="/dashboard">Dashboard</Link>
//           </li>
//           <li>
//             <Link to="/focus">Focus Mode</Link>
//           </li>
//           <li>
//             <Link to="/stats">Stats</Link>
//           </li>
//         </ul>
//       </nav>
//       <main className="content">
//         {children}
//       </main>
//     </div>
//   );
// }

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
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950/70">
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold tracking-tight">
            WorkHub <span className="text-indigo-400">Lite</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Focus • Track • Improve
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
            }
          >
            <span>📋</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/focus"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
            }
          >
            <span>🎯</span>
            <span>Focus Mode</span>
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
            }
          >
            <span>📊</span>
            <span>Stats</span>
          </NavLink>
        </nav>

       <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
        Logged in as{" "}
        <span className="text-slate-200 font-medium">
          {user?.name || user?.email}
        </span>
      </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
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
          <div className="flex items-center gap-2 text-xs md:text-sm">
            {user && (
              <span className="hidden sm:inline text-slate-300">
                {user.name || user.email}
              </span>
            )}
            <button className="hidden sm:inline text-[11px] px-3 py-1 rounded-full border border-slate-600 hover:border-indigo-400 hover:text-indigo-300 transition">
              ⏱ Daily Streak: <span className="font-semibold">0</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-full border border-slate-600 hover:border-red-400 hover:text-red-300 text-[11px] md:text-xs transition">
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
