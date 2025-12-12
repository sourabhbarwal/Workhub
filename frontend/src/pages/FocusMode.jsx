//frontend/src/pages/FocusMode.jsx
import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function isTodayOrPast(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d <= today;
}

export default function FocusMode() {
  const { user } = useAuth();
  const userId = user?.uid;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 min
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const fetchTasks = async () => {
      try {
        const res = await api.get("/tasks", { params: { userId } });
        setTasks(res.data);
      } catch (err) {
        console.error("FocusMode fetch tasks error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  const focusTasks = tasks.filter(
    (t) => t.status !== "done" && isTodayOrPast(t.dueDate)
  );

  const currentTask = focusTasks[0] || null;
  const remainingTasks = focusTasks.slice(1);

  const handleMarkDone = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}`, { status: "done" });
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
    } catch (err) {
      console.error("Mark done error:", err);
    }
  };

  const startTimer = () => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setSecondsLeft(25 * 60);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
            Focus Mode
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            See only what matters today. One session at a time.
          </p>
        </div>
        <div className="text-xs md:text-sm text-slate-400">
          Suggested session:{" "}
          <span className="text-slate-100 font-medium">25 minutes</span>
        </div>
      </header>

      {/* Current focus task */}
      {currentTask && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-emerald-300 mb-1">
              Current focus
            </div>
            <h2 className="text-sm md:text-base font-semibold text-slate-50">
              {currentTask.title}
            </h2>
            {currentTask.description && (
              <p className="mt-1 text-[11px] md:text-xs text-slate-400">
                {currentTask.description}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-500">
              {currentTask.dueDate
                ? `Due: ${new Date(
                    currentTask.dueDate
                  ).toLocaleDateString()}`
                : "No due date"}
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={startTimer}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium"
            >
              ▶ Start session
            </button>
            <button
              onClick={() => handleMarkDone(currentTask._id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 font-medium"
            >
              ✓ Mark done
            </button>
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-[2fr,1fr] gap-4">
        {/* Left: other focus tasks */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-100 mb-1">
            Today&apos;s & overdue tasks
          </h2>

          {loading ? (
            <div className="text-xs text-slate-400">Loading tasks…</div>
          ) : focusTasks.length === 0 ? (
            <div className="text-xs text-slate-500">
              No due or overdue tasks. You can plan new ones from the dashboard.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {remainingTasks.length === 0 && (
                <div className="text-[11px] text-slate-500">
                  No more tasks after the current one.
                </div>
              )}
              {remainingTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-slate-100">
                      {task.title}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {task.dueDate
                        ? `Due: ${new Date(
                            task.dueDate
                          ).toLocaleDateString()}`
                        : "No due date"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkDone(task._id)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-slate-50"
                  >
                    Mark done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: timer */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Focus Session
          </div>
          <div className="text-4xl md:text-5xl font-semibold text-slate-50">
            {minutes}:{seconds}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 text-center">
            Start a deep work sprint. Avoid switching tabs until the timer ends.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={startTimer}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium"
            >
              ▶ {isRunning ? "Running" : "Start"}
            </button>
            <button
              onClick={pauseTimer}
              className="px-4 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:border-slate-500"
            >
              ⏸ Pause
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:border-slate-500"
            >
              ⟲ Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}