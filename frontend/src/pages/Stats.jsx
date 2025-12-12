// frontend/src/pages/Stats.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCompletionInfo(task) {
  const createdAt =
    task.createdAt || task.created_at ? new Date(task.createdAt || task.created_at) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  // Prefer explicit completedAt if backend sets it,
  // otherwise fall back to updatedAt for done tasks.
  let completedAt = null;
  if (task.completedAt) {
    completedAt = new Date(task.completedAt);
  } else if (task.status === "done" && task.updatedAt) {
    completedAt = new Date(task.updatedAt);
  }

  let completedAfterDue = null; // null = not applicable
  if (completedAt && dueDate) {
    const completedDay = new Date(
      completedAt.getFullYear(),
      completedAt.getMonth(),
      completedAt.getDate()
    );
    const dueDay = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );
    completedAfterDue = completedDay > dueDay;
  }

  // Score logic
  let score = 0;
  if (completedAt) {
    if (!dueDate) {
      score = 8; // completed but no due date
    } else {
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysLate = Math.floor(
        (completedAt.setHours(0, 0, 0, 0) - dueDate.setHours(0, 0, 0, 0)) /
          msPerDay
      );
      if (daysLate <= 0) {
        score = 10; // on time or early
      } else {
        const s = 10 - daysLate;
        score = Math.max(2, s); // never go below 2 for completed tasks
      }
    }
  } else {
    score = 0; // not completed
  }

  return {
    createdAt,
    dueDate,
    completedAt,
    completedAfterDue,
    score,
  };
}

export default function Stats() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedScope, setSelectedScope] = useState("personal"); // "personal" or teamId
  const [tableFilter, setTableFilter] = useState("all"); // all | completed | pending | overdue
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  // Fetch teams where this user is a member
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user?.uid) return;
      try {
        const res = await api.get("/teams/forUser", {
          params: { firebaseUid: user.uid },
        });
        setTeams(res.data || []);
      } catch (err) {
        console.error("Stats teams fetch error:", err);
      }
    };
    fetchTeams();
  }, [user]);

  // Fetch tasks depending on scope (personal or team)
  useEffect(() => {
    const fetchStatsTasks = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorText("");

      try {
        const params =
          selectedScope === "personal"
            ? { userId: user.uid }
            : { teamId: selectedScope };

        const res = await api.get("/tasks", { params });
        setTasks(res.data || []);
      } catch (err) {
        console.error("Stats tasks fetch error:", err);
        setErrorText("Could not load stats. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatsTasks();
  }, [user, selectedScope]);

  const scopeLabel =
    selectedScope === "personal"
      ? "Personal tasks"
      : `Team: ${
          teams.find((t) => t._id === selectedScope)?.name || "Unknown team"
        }`;

  const {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
    averageScore,
    tasksWithMeta,
    filteredTasksWithMeta,
    last7DaysData,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const withMeta = tasks.map((t) => ({
      ...t,
      _meta: getCompletionInfo(t),
    }));

    const completed = withMeta.filter((t) => t.status === "done");
    const pending = withMeta.filter((t) => t.status !== "done");

    const overdue = pending.filter((t) => {
      const due = t._meta.dueDate;
      if (!due) return false;
      const dueDay = new Date(due);
      dueDay.setHours(0, 0, 0, 0);
      return dueDay < today;
    });

    const rate =
      withMeta.length > 0
        ? Math.round((completed.length / withMeta.length) * 100)
        : 0;

    const scores = withMeta.map((t) => t._meta.score);
    const avgScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10
          ) / 10
        : 0;

    // last 7 days completion data
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const count = completed.filter((t) => {
        const c = t._meta.completedAt;
        if (!c) return false;
        const cd = new Date(c);
        cd.setHours(0, 0, 0, 0);
        return sameDay(cd, d);
      }).length;

      last7.push({
        date: new Date(d),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      });
    }

    // Table filter logic
    let filtered;
    switch (tableFilter) {
      case "completed":
        filtered = completed;
        break;
      case "pending":
        filtered = pending;
        break;
      case "overdue":
        filtered = overdue;
        break;
      case "all":
      default:
        filtered = withMeta;
    }

    return {
      totalTasks: withMeta.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      overdueTasks: overdue.length,
      completionRate: rate,
      averageScore: avgScore,
      tasksWithMeta: withMeta,
      filteredTasksWithMeta: filtered,
      last7DaysData: last7,
    };
  }, [tasks, tableFilter]);

  if (!user) {
    return (
      <div className="text-sm text-gray-500">
        Please log in to view your stats.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-300">
            Stats & Insights
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            See how you&apos;ve been working over time and how efficiently you
            complete tasks.
          </p>
        </div>

        {/* Scope selector: personal vs team */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-300">Scope:</span>
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-2 py-1 rounded-lg border border-gray-100 text-gray-300 text-xs"
          >
            <option value="personal">Personal</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                Team: {t.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="text-[11px] text-gray-300">
        Currently viewing stats for{" "}
        <span className="text-gray-300 text-[11px]">{scopeLabel}</span>.
      </div>

      {errorText && (
        <div className="text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2">
          {errorText}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-gray-500">Loading stats…</div>
      ) : (
        <>
          {/* Top summary cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="  border border-gray-200/80 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-900">
                Total tasks
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {totalTasks}
              </span>
            </div>

            <div className=" border border-emerald-500/80 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-emerald-900/80">
                Completed
              </span>
              <span className="text-lg font-semibold text-emerald-900">
                {completedTasks}
              </span>
            </div>

            <div className=" border border-amber-500/80 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-amber-900/80">
                Pending
              </span>
              <span className="text-lg font-semibold text-amber-900">
                {pendingTasks}
              </span>
            </div>

            <div className="border border-rose-500/80 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-rose-900/80">
                Overdue
              </span>
              <span className="text-lg font-semibold text-rose-900">
                {overdueTasks}
              </span>
            </div>
          </section>

          {/* Completion & score */}
          <section className="grid md:grid-cols-2 gap-3">
            <div className=" border border-gray-500/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Completion rate
                </span>
                <span className="text-xs text-gray-300">
                  {completedTasks}/{totalTasks} tasks done
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-2 bg-emerald-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <div className="text-xl font-semibold text-gray-900">
                {completionRate}%
              </div>
              <p className="text-xs text-gray-500">
                Try to keep your completion rate above{" "}
                <span className="text-gray-500 font-bold ">70%</span> for a
                strong productivity streak.
              </p>
            </div>

            <div className=" border border-gray-500/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Average completion score
                </span>
                <span className="text-xs text-gray-300">
                  (based on how early or late you finish)
                </span>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-3xl font-semibold text-indigo-800 leading-none">
                    {averageScore}
                  </div>
                  <div className="text-[11px] text-indigo-200 mt-1">
                    out of 10
                  </div>
                </div>
                <div className="flex-1 text-xs text-gray-500">
                  Tasks finished on or before their due date get a{" "}
                  <span className="text-gray-500 font-bold">
                    higher score
                  </span>
                  . Late completions gradually reduce the score.
                </div>
              </div>
            </div>
          </section>

          {/* Last 7 days activity */}
          <section className="border border-gray-500/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                Last 7 days activity
              </span>
              <span className="text-xs text-gray-300">
                Completed tasks per day
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {last7DaysData.map((d) => {
                const maxCount = Math.max(
                  ...last7DaysData.map((x) => x.count || 0),
                  1
                );
                const height = (d.count / maxCount) * 40; // up to 40px

                return (
                  <div
                    key={d.date.toISOString()}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="h-10 flex items-end">
                      <div
                        className="w-3 rounded-full bg-indigo-800"
                        style={{ height: `${height}px` }}
                        title={`${d.count} completed`}
                      ></div>
                    </div>
                    <span className="text-[10px] text-gray-300">
                      {d.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Detailed task table with filter */}
          <section className=" border border-gray-500/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  Detailed task timeline
                </span>
                <p className="text-[11px] text-gray-500">
                  How each task moved from creation to completion.
                </p>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-gray-300 mr-1">Filter:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "completed", label: "Completed" },
                  { id: "pending", label: "Pending" },
                  { id: "overdue", label: "Overdue" },
                ].map((f) => {
                  const active = tableFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTableFilter(f.id)}
                      className={`px-2 py-1 rounded-full border text-[11px] ${
                        active
                          ? "bg-indigo-600 border-indigo-500 text-gray-900"
                          : " border-gray-500/80 text-gray-300 hover:border-indigo-500/60"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredTasksWithMeta.length === 0 ? (
              <div className="text-xs text-gray-500">
                No tasks match this filter in the current scope.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs md:text-sm text-left border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-[11px] uppercase text-gray-300">
                      <th className="px-3 py-1">Task</th>
                      <th className="px-3 py-1">Added on</th>
                      <th className="px-3 py-1">Due date</th>
                      <th className="px-3 py-1">Completed on</th>
                      <th className="px-3 py-1">On time?</th>
                      <th className="px-3 py-1 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasksWithMeta
                      .slice()
                      .sort((a, b) => {
                        const aDate = a._meta.createdAt || 0;
                        const bDate = b._meta.createdAt || 0;
                        return (bDate || 0) - (aDate || 0);
                      })
                      .map((t) => {
                        const m = t._meta;

                        let onTimeLabel = "—";
                        let onTimeClass =
                          "px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]";

                        if (t.status !== "done") {
                          onTimeLabel = "Not completed";
                          onTimeClass =
                            "px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]";
                        } else if (!m.dueDate) {
                          onTimeLabel = "No due date";
                          onTimeClass =
                            "px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]";
                        } else if (m.completedAfterDue === false) {
                          onTimeLabel = "On time";
                          onTimeClass =
                            "px-2 py-0.5 rounded-full text-emerald-400 border border-emerald-500/80 text-[10px]";
                        } else if (m.completedAfterDue === true) {
                          onTimeLabel = "Late";
                          onTimeClass =
                            "px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-200 border border-rose-500/60 text-[10px]";
                        }

                        return (
                          <tr
                            key={t._id}
                            className="bg-gray-700 border border-gray-500/80 rounded-xl"
                          >
                            <td className="px-3 py-2 rounded-l-xl max-w-xs">
                              <div className="font-medium text-gray-300 truncate">
                                {t.title}
                              </div>
                              {t.description && (
                                <div className="text-[11px] text-gray-500 line-clamp-1">
                                  {t.description}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-300">
                              {formatDate(m.createdAt)}
                            </td>
                            <td className="px-3 py-2 text-gray-300">
                              {formatDate(m.dueDate)}
                            </td>
                            <td className="px-3 py-2 text-gray-300">
                              {formatDate(m.completedAt)}
                            </td>
                            <td className="px-3 py-2">
                              <span className={onTimeClass}>{onTimeLabel}</span>
                            </td>
                            <td className="px-3 py-2 rounded-r-xl text-right">
                              <span className="inline-flex items-center justify-end gap-1 text-gray-300">
                                <span className="font-semibold">
                                  {m.score}
                                </span>
                                <span className="text-[11px] text-gray-9000">
                                  /10
                                </span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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