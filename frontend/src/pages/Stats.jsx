// import { useEffect, useState } from "react";
// import { api } from "../api";
// import { useAuth } from "../context/AuthContext.jsx";

// function getHeatClass(score) {
//   if (score === 0) return "bg-slate-800";
//   if (score <= 20) return "bg-emerald-700/60";
//   if (score <= 40) return "bg-emerald-600";
//   return "bg-emerald-500";
// }

// function getLast7Days() {
//   const days = [];
//   const today = new Date();
//   for (let i = 6; i >= 0; i--) {
//     const d = new Date(today);
//     d.setDate(today.getDate() - i);
//     const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
//     const label = d.toLocaleDateString(undefined, { weekday: "short" });
//     days.push({ key, label });
//   }
//   return days;
// }

// export default function Stats() {
//   const { user } = useAuth();
//   const userId = user?.uid;

//   const [stats, setStats] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!userId) return;

//     const fetchStats = async () => {
//       try {
//         const res = await api.get("/tasks/stats", { params: { userId } });
//         setStats(res.data);
//       } catch (err) {
//         console.error("Stats fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStats();
//   }, [userId]);

//   const totalScore = stats.reduce((sum, d) => sum + d.score, 0);
//   const totalTasks = stats.reduce((sum, d) => sum + d.tasksCompleted, 0);

//   const last7 = getLast7Days();

//   const statsMap = {};
//   stats.forEach((s) => {
//     statsMap[s.date] = s;
//   });

//   return (
//     <div className="space-y-4 max-w-4xl mx-auto">
//       <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//         <div>
//           <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
//             Stats & Insights
//           </h1>
//           <p className="text-xs md:text-sm text-slate-400 mt-1">
//             See how consistently you&apos;re completing tasks over the week.
//           </p>
//         </div>
//         <div className="flex gap-2 text-xs">
//           <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
//             Weekly score:{" "}
//             <span className="font-semibold text-emerald-400">
//               {totalScore}
//             </span>
//           </div>
//           <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
//             Tasks done:{" "}
//             <span className="font-semibold text-slate-100">
//               {totalTasks}
//             </span>
//           </div>
//         </div>
//       </header>

//       {loading ? (
//         <div className="text-xs text-slate-400">Loading stats…</div>
//       ) : (
//         <>
//           <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
//             <h2 className="text-sm font-semibold text-slate-100 mb-3">
//               Last 7 days completion heatmap
//             </h2>
//             <div className="flex gap-2">
//               {last7.map((d) => {
//                 const s = statsMap[d.key] || { score: 0, tasksCompleted: 0 };
//                 return (
//                   <div key={d.key} className="flex flex-col items-center gap-1">
//                     <div
//                       className={`w-8 h-8 rounded-lg ${getHeatClass(
//                         s.score
//                       )} border border-slate-800`}
//                     ></div>
//                     <span className="text-[11px] text-slate-400">
//                       {d.label}
//                     </span>
//                   </div>
//                 );
//               })}
//             </div>
//             <p className="mt-3 text-[11px] text-slate-500">
//               Darker squares mean more completed tasks on that day.
//             </p>
//           </section>

//           <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
//             <h2 className="text-sm font-semibold text-slate-100 mb-3">
//               Daily breakdown (all recorded days)
//             </h2>
//             {stats.length === 0 ? (
//               <div className="text-xs text-slate-500">
//                 No completed tasks yet. Finish tasks to see stats.
//               </div>
//             ) : (
//               <div className="overflow-x-auto text-xs">
//                 <table className="w-full border border-slate-800 border-collapse">
//                   <thead className="bg-slate-900">
//                     <tr>
//                       <th className="border border-slate-800 px-2 py-1.5 text-left">
//                         Date
//                       </th>
//                       <th className="border border-slate-800 px-2 py-1.5 text-left">
//                         Tasks completed
//                       </th>
//                       <th className="border border-slate-800 px-2 py-1.5 text-left">
//                         Score
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {stats.map((d) => (
//                       <tr key={d.date}>
//                         <td className="border border-slate-800 px-2 py-1.5">
//                           {d.date}
//                         </td>
//                         <td className="border border-slate-800 px-2 py-1.5">
//                           {d.tasksCompleted}
//                         </td>
//                         <td className="border border-slate-800 px-2 py-1.5">
//                           {d.score}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </section>
//         </>
//       )}
//     </div>
//   );
// }

// frontend/src/pages/Stats.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

export default function Stats() {
  const { user } = useAuth();
  const userId = user?.uid;

  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      setLoading(true);
      setErrorText("");
      try {
        const res = await api.get("/tasks/stats", {
          params: { userId },
        });
        setStats(res.data || []);
      } catch (err) {
        console.error("Stats fetch error:", err);
        setErrorText("Could not load stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const totalCompleted = stats.reduce(
    (sum, d) => sum + (d.tasksCompleted || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <header>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
          Stats
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          See how consistently you&apos;ve been completing tasks.
        </p>
      </header>

      {loading && (
        <div className="text-xs text-slate-400">Loading stats…</div>
      )}

      {errorText && (
        <div className="text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2">
          {errorText}
        </div>
      )}

      {!loading && !errorText && (
        <>
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
            <div className="text-sm text-slate-300">
              Total tasks completed
            </div>
            <div className="text-2xl font-semibold text-emerald-400">
              {totalCompleted}
            </div>
          </section>

          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Daily completion history
            </h2>
            {stats.length === 0 ? (
              <div className="text-xs text-slate-500">
                No completed tasks yet. Finish a task to see your stats.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-right py-2 pr-4">
                        Tasks completed
                      </th>
                      <th className="text-right py-2">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.map((row) => (
                      <tr key={row.date}>
                        <td className="py-2 pr-4 text-slate-200">
                          {row.date}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {row.tasksCompleted}
                        </td>
                        <td className="py-2 text-right text-amber-300">
                          {row.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
