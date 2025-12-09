// // export default Layout;
// import { useAuth } from "../context/AuthContext.jsx";
// import { NavLink } from "react-router-dom";
// import { logout } from "../firebase";
// import { useState, useEffect } from "react";
// import { api } from "../api";


// const navLinkBase =
//   "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition";
// const navLinkInactive = "text-slate-300 hover:bg-slate-700/60";
// const navLinkActive = "bg-slate-700 text-white shadow";

// function NavLinks({ onNavigate }) {
//   return (
//     <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
//       <NavLink
//         to="/dashboard"
//         onClick={onNavigate}
//         className={({ isActive }) =>
//           `${navLinkBase} ${
//             isActive ? navLinkActive : navLinkInactive
//           } w-full block`
//         }
//       >
//         📋 Dashboard
//       </NavLink>

//       <NavLink
//         to="/focus"
//         onClick={onNavigate}
//         className={({ isActive }) =>
//           `${navLinkBase} ${
//             isActive ? navLinkActive : navLinkInactive
//           } w-full block`
//         }
//       >
//         🎯 Focus Mode
//       </NavLink>

//       <NavLink
//         to="/stats"
//         onClick={onNavigate}
//         className={({ isActive }) =>
//           `${navLinkBase} ${
//             isActive ? navLinkActive : navLinkInactive
//           } w-full block`
//         }
//       >
//         📊 Stats
//       </NavLink>
//     </nav>
//   );
// }

// export default function Layout({ children }) {
//   const { user } = useAuth();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const handleLogout = async () => {
//     try {
//       await logout();
//     } catch (err) {
//       console.error("Logout error:", err);
//       alert("Could not log out. Please try again.");
//     }
//   };

//   const closeMobile = () => setMobileOpen(false);
  
//   return (
//     <div className="w-screen h-screen flex bg-slate-900 text-slate-100 overflow-hidden">
//       {/* Desktop sidebar */}
//       <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950/70 shrink-0">
//         <div className="px-5 py-4 border-b border-slate-800">
//           <h1 className="text-lg font-semibold tracking-tight">
//             WorkHub <span className="text-indigo-400">Lite</span>
//           </h1>
//           <p className="text-xs text-slate-400 mt-1">Focus • Track • Improve</p>
//         </div>

//         <NavLinks onNavigate={() => {}} />

//         <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
//           <div className="flex flex-col gap-1">
//             <div>
//               Logged in as{" "}
//               <span className="text-slate-200 font-medium">
//                 {user?.displayName || user?.name || user?.email}
//               </span>
//             </div>
//             <button
//               onClick={handleLogout}
//               className="self-start text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main content */}
//       <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
//         {/* Top bar */}
//         <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur z-10">
//           {/* Left side: logo + hamburger on mobile */}
//           <div className="flex items-center gap-3">
//             <button
//               className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 hover:border-slate-500"
//               onClick={() => setMobileOpen(true)}
//             >
//               {/* Hamburger icon */}
//               <span className="sr-only">Open sidebar</span>
//               <div className="space-y-1">
//                 <span className="block w-4 h-[2px] bg-slate-200"></span>
//                 <span className="block w-4 h-[2px] bg-slate-200"></span>
//                 <span className="block w-4 h-[2px] bg-slate-200"></span>
//               </div>
//             </button>

//             <div className="font-semibold">
//               WorkHub <span className="text-indigo-400">Lite</span>
//             </div>
//           </div>

//           {/* Center: date */}
//           <div className="hidden md:block text-xs md:text-sm text-slate-400">
//             Today:{" "}
//             <span className="text-slate-100 font-medium">
//               {new Date().toLocaleDateString()}
//             </span>
//           </div>

//           {/* Right: user + logout */}
//           <div className="flex items-center gap-2">
//             {user && (
//               <span className="hidden md:inline text-xs text-slate-400">
//                 {user.displayName || user.email}
//               </span>
//             )}
//             <button
//               onClick={handleLogout}
//               className="text-xs px-3 py-1 rounded-full border border-slate-600 hover:border-red-400 hover:text-red-300"
//             >
//               Logout
//             </button>
//           </div>
//         </header>

//         {/* Page content */}
//         <main className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 bg-slate-900">
//           {children}
//         </main>
//       </div>

//       {/* Mobile sidebar drawer */}
//       {mobileOpen && (
//         <div className="fixed inset-0 z-40 md:hidden">
//           {/* Backdrop */}
//           <div
//             className="absolute inset-0 bg-black/50"
//             onClick={closeMobile}
//           ></div>

//           {/* Drawer */}
//           <aside className="absolute inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
//             <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
//               <div>
//                 <h1 className="text-lg font-semibold tracking-tight">
//                   WorkHub <span className="text-indigo-400">Lite</span>
//                 </h1>
//                 <p className="text-xs text-slate-400 mt-1">
//                   Focus • Track • Improve
//                 </p>
//               </div>
//               <button
//                 className="text-slate-400 hover:text-slate-100 text-xl"
//                 onClick={closeMobile}
//               >
//                 ✕
//               </button>
//             </div>

//             <NavLinks onNavigate={closeMobile} />

//             <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
//               <div className="flex flex-col gap-1">
//                 <div>
//                   Logged in as{" "}
//                   <span className="text-slate-200 font-medium">
//                     {user?.displayName || user?.name || user?.email}
//                   </span>
//                 </div>
//                 <button
//                   onClick={() => {
//                     closeMobile();
//                     handleLogout();
//                   }}
//                   className="self-start text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
//                 >
//                   Logout
//                 </button>
//               </div>
//             </div>
//           </aside>
//         </div>
//       )}
//     </div>
//   );
// }

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
            .map((d) => d.date) // YYYY-MM-DD
        );

        let count = 0;
        const cursor = new Date();
        // count backwards from today
        while (true) {
          const key = cursor.toISOString().slice(0, 10);
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
    <div className="w-screen h-screen flex bg-slate-900 text-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-800 bg-slate-950/70 shrink-0">
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold tracking-tight">
            Focus<span className="text-indigo-400">Track</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Focus • Track • Improve</p>
        </div>

        <NavLinks onNavigate={() => {}} />

        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex flex-col gap-1">
            <div>
              Logged in as{" "}
              <span className="text-slate-200 font-medium">
                {user?.displayName || user?.name || user?.email}
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

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur z-10">
          {/* Left: logo + hamburger */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 hover:border-slate-500"
              onClick={() => setMobileOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <div className="space-y-1">
                <span className="block w-4 h-[2px] bg-slate-200"></span>
                <span className="block w-4 h-[2px] bg-slate-200"></span>
                <span className="block w-4 h-[2px] bg-slate-200"></span>
              </div>
            </button>

            <div className="font-semibold">
              Focus<span className="text-indigo-400">Track</span>
            </div>
          </div>

          {/* Center/right: date + streak */}
          <div className="hidden md:flex items-center gap-3 text-xs md:text-sm text-slate-400">
            <span>
              Today:{" "}
              <span className="text-slate-100 font-medium">{todayLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px]">
              🔥 Streak:
              <span className="text-amber-300 font-semibold">{streak}</span>
            </span>
          </div>

          {/* Right: user + logout (mobile also sees streak small) */}
          <div className="flex items-center gap-2">
            <span className="md:hidden inline-flex items-center gap-1 text-[11px] text-slate-300">
              🔥 {streak}
            </span>
            {user && (
              <span className="hidden md:inline text-xs text-slate-400">
                {user.displayName || user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1 rounded-full border border-slate-600 hover:border-red-400 hover:text-red-300"
            >
              Logout
            </button>
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
          ></div>

          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Focus<span className="text-indigo-400">Track</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Focus • Track • Improve
                </p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-100 text-xl"
                onClick={closeMobile}
              >
                ✕
              </button>
            </div>

            <NavLinks onNavigate={closeMobile} />

            <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex flex-col gap-1">
                <div>
                  Logged in as{" "}
                  <span className="text-slate-200 font-medium">
                    {user?.displayName || user?.name || user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    closeMobile();
                    handleLogout();
                  }}
                  className="self-start text-[11px] px-2 py-1 rounded-lg border border-slate-700 hover:border-red-400 hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
