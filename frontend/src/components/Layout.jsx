// frontend/src/components/Layout.jsx
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { logout } from "../firebase";
import { api } from "../api";

const navLinkBase =
  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition";
const navLinkInactive = "text-slate-300 hover:bg-slate-700/60";
const navLinkActive = "bg-slate-700 text-white shadow";

function NavLinks({ onNavigate, isAdmin }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <NavLink
        to="/dashboard"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${navLinkBase} ${
            isActive ? navLinkActive : navLinkInactive
          } w-full block`
        }
      >
        📋 Dashboard
      </NavLink>

      <NavLink
        to="/focus"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${navLinkBase} ${
            isActive ? navLinkActive : navLinkInactive
          } w-full block`
        }
      >
        🎯 Focus Mode
      </NavLink>

      <NavLink
        to="/stats"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${navLinkBase} ${
            isActive ? navLinkActive : navLinkInactive
          } w-full block`
        }
      >
        📊 Stats
      </NavLink>

      {isAdmin && (
        <NavLink
          to="/admin"
          onClick={onNavigate}
          className={({ isActive }) =>
            `${navLinkBase} ${
              isActive ? navLinkActive : navLinkInactive
            } w-full block`
          }
        >
          🛠 Admin Panel
        </NavLink>
      )}
    </nav>
  );
}

export default function Layout({ children }) {
  // ✅ get auth safely
  const auth = useAuth();
  const user = auth?.user || null;
  const isAdmin = user?.role === "admin";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  const displayName =
    user?.displayName || user?.name || user?.email || "User";
  const avatarUrl = user?.photoURL || null;
  const initials = (displayName[0] || "U").toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Could not log out. Please try again.");
    }
  };

  const closeMobile = () => setMobileOpen(false);
  const todayLabel = new Date().toLocaleDateString();
  return (
    <div className="min-h-screen w-screen flex bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950/70 shrink-0">
        {/* Profile */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-500/80 flex items-center justify-center text-sm font-semibold border border-indigo-300/60">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{displayName}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {user?.email}
            </div>
            {user?.role && (
              <div className="text-[10px] text-emerald-300 mt-0.5">
                Role: {user.role}
              </div>
            )}
          </div>
        </div>

        <NavLinks onNavigate={() => {}} isAdmin={isAdmin} />

        {/* Bottom area */}
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          
          <button
            onClick={handleLogout}
            className="mt-2 text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 hover:border-slate-500"
              onClick={() => setMobileOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <div className="space-y-1">
                <span className="block w-4 h-0.5 bg-slate-200"></span>
                <span className="block w-4 h-0.5 bg-slate-200"></span>
                <span className="block w-4 h-0.5 bg-slate-200"></span>
              </div>
            </button>

            <div className="flex items-center gap-2 font-semibold text-base md:text-lg">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/60 text-xs">
                🎯
              </span>
              <span>
                Focus<span className="text-indigo-400">Track</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs md:text-sm text-slate-400">
              <span>
                Today:{" "}
                <span className="text-slate-100 font-medium">
                  {todayLabel}
                </span>
              </span>
              
            </div>            
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-slate-900">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
          ></div>

          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500/80 flex items-center justify-center text-sm font-semibold border border-indigo-300/60">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {displayName}
                </div>
                {user?.role && (
                  <div className="text-[10px] text-emerald-300 mt-0.5">
                    Role: {user.role}
                  </div>
                )}
                <div className="text-[11px] text-slate-400 truncate">
                  {user?.email}
                </div>
              </div>
              <button
                className="text-slate-400 hover:text-slate-100 text-xl"
                onClick={closeMobile}
              >
                ✕
              </button>
            </div>

            <NavLinks
              onNavigate={() => {
                closeMobile();
              }}
              isAdmin={isAdmin}
            />

            <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
              
              <button
                onClick={() => {
                  closeMobile();
                  handleLogout();
                }}
                className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}