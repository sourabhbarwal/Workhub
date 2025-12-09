// frontend/src/components/Layout.jsx
import logo from "../assets/ft.png";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { logout } from "../firebase";
import { api } from "../api";

const navLinkBase =
  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition";
const navLinkInactive = "text-slate-300 hover:bg-slate-700/60";
const navLinkActive = "bg-slate-700 text-white shadow";

function NavLinks({ onNavigate }) {
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
    </nav>
  );
}

export default function Layout({ children }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  const displayName = user?.displayName || user?.name || user?.email || "User";
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

  // 🔥 Daily streak calculation
  useEffect(() => {
    if (!user?.uid) return;

    const fetchStreak = async () => {
      try {
        const res = await api.get("/tasks/stats", {
          params: { userId: user.uid },
        });
        const stats = res.data || [];

        const daysWithTasks = new Set(
          stats
            .filter((d) => d.tasksCompleted > 0)
            .map((d) => d.date)
        );

        let count = 0;
        const cursor = new Date();

        function toLocalKey(date) {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        }

        while (true) {
          const key = toLocalKey(cursor);
          if (daysWithTasks.has(key)) {
            count += 1;
            cursor.setDate(cursor.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(count);
      } catch (err) {
        console.error("Streak fetch error:", err);
      }
    };

    fetchStreak();
  }, [user?.uid]);

  const todayLabel = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen w-screen flex bg-slate-900 text-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950/70 shrink-0">
        {/* Profile section */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="relative">
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
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{displayName}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {user?.email}
            </div>
            <div className="text-[10px] text-slate-500 italic mt-0.5">
              Edit photo in your Google account
            </div>
          </div>
        </div>

        <NavLinks onNavigate={() => {}} />

        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center justify-between mb-1">
            <span>🔥 Streak</span>
            <span className="text-amber-300 font-semibold">{streak}</span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
        {/* Top bar (app name here only) */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          {/* Left: hamburger + app name */}
          <div className="flex items-center gap-3">
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

            <div className="font-semibold text-base md:text-lg flex items-center">
              <img
                src={logo}
                alt="FocusTrack logo"
                className="w-8 h-8 object-contain"
              />
              Focus<span className="text-indigo-400">Track</span>
            </div>  
          </div>

          {/* Center/right: date + streak + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs md:text-sm text-slate-400">
              <span>
                Today:{" "}
                <span className="text-slate-100 font-medium">
                  {todayLabel}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px]">
                🔥
                <span className="text-amber-300 font-semibold">{streak}</span>
              </span>
            </div>

            
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-slate-900">
          {children}
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
          ></div>

          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
            {/* Profile section */}
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
            />

            <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-between mb-2">
                <span>🔥 Streak</span>
                <span className="text-amber-300 font-semibold">{streak}</span>
              </div>
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
