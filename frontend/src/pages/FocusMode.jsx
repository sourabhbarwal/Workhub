//frontend/src/pages/FocusMode.jsx
import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

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
  const uid = user?.uid;

  const [tasks, setTasks] = useState([]);
  const [seconds, setSeconds] = useState(1500);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!uid) return;

    const fetchTasks = async () => {
      try {
        const res = await api.get("/tasks", { params: { userFirebaseUid: uid } });
        setTasks(res.data);
      } catch (err) {
        console.error("FocusMode fetch tasks error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [uid]);

  const focusTasks = tasks.filter(
    (t) => t.status !== "done" && isTodayOrPast(t.dueDate)
  );
  const current = tasks.find((t) => t.status !== "done");
  const remainingTasks = focusTasks.slice(1);

  const handleMarkDone = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}`, { status: "done" });
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
    } catch (err) {
      console.error("Mark done error:", err);
    }
  };

  const start = () => {
    if (timer.current) return;
    setRunning(true);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          timer.current = null;
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const stop = () => {
    clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  const resetTimer = () => {
    stop();
    setSeconds(25 * 60);
  };
  useEffect(() => {
    const interval= intervalRef.current;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-300 via-purple-200 to-blue-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-4"
      >
        <h1 className="text-2xl font-bold text-indigo-700">
          Focus Mode
        </h1>

        <div className=" backdrop-blur-xl bg-white/40 rounded-2xl p-6 text-center">
          <div className="text-5xl font-semibold text-indigo-600">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
              onClick={start}
              className="rounded-xl px-6 py-2 bg-indigo-600 hover:bg-indigo-400 font-medium transition cursor-pointer"
            >
              Start
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
              onClick={stop}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-400 font-medium transition cursor-pointer"
            >
              Pause
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
              onClick={resetTimer}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-400 font-medium transition cursor-pointer"
            >
              Reset
            </motion.button>
          </div>
        </div>

        {current && (
        <section className="bg-white/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2 tracking-wide text-emerald-500 mb-3">
              Current focus
            </div>
            <div className="font-medium text-indigo-500 text-sm">
                  {current.title}
                </div>
            {current.description && (
              <p className="text-xs text-indigo-500 mt-1">
                {current.description}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {current.dueDate
                ? `Due: ${new Date(
                    current.dueDate
                  ).toLocaleDateString()}`
                : "No due date"}
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={start}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-400 font-medium transition cursor-pointer"
            >
              Start session
            </button>
            <button
              onClick={() => handleMarkDone(current._id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-400 font-medium transition cursor-pointer"
            >
              Mark done
            </button>
          </div>
        </section>
        )}
        <section className="bg-white/40 rounded-2xl p-4">
           <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
             TODAY&apos;S & OVERDUE TASKS
           </h2>

           {loading ? (
            <div className="text-xs text-gray-500">Loading tasks…</div>
          ) : focusTasks.length === 0 ? (
            <div className="text-xs text-gray-500">
              No due or overdue tasks. You can plan new ones from the dashboard.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {remainingTasks.length === 0 && (
                <div className="text-[11px] text-gray-500">
                  No more tasks after the current one.
                </div>
              )}
              {remainingTasks.map((task) => (
                <div
                  key={task._id}
                  // className="bg-white/60 border border-gray-200 rounded-xl px-3 py-2.5 flex items-start justify-between gap-3"
                  className="border border-indigo-600/60 bg-indigo-200 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:border-indigo-600/60 hover:bg-indigo-300 transition"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-800 flex items-center gap-3 py-1">
                      {task.title}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {task.dueDate
                        ? `Due: ${new Date(
                            task.dueDate
                          ).toLocaleDateString()}`
                        : "No due date"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkDone(current._id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-400 font-medium transition cursor-pointer"
                  >
                    Mark done
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
