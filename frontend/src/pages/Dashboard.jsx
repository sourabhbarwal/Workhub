import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function Column({ title, tasks, accent, onStatusChange }) {
  return (
    <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 md:p-4 flex flex-col min-h-[260px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${accent}`}></span>
          {title}
        </h2>
        <span className="text-[11px] text-slate-500">
          {tasks.length} task{tasks.length !== 1 && "s"}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs hover:border-indigo-400/70 hover:shadow-md transition">
            {/* <div className="font-medium text-slate-100 truncate">
              {task.title}
            </div> */}
            <div className="flex justify-between gap-2 items-start">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-100 truncate">
                  {task.title}
                </div>
                {task.description && (
                  <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                    {task.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => onDelete(task._id)}
                className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-500 hover:text-red-400 transition"
                title="Delete task"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 gap-2">
              <span className="truncate">
                {task.dueDate
                  ? `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                  : "No due date"}
              </span>
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task._id, e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5 text-[10px] text-slate-300"
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-xs text-slate-500 italic">
            No tasks here yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.uid;

  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const updateSuggestion = (allTasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdueCount = 0;
    let todayCount = 0;

    allTasks.forEach((t) => {
      if (!t.dueDate || t.status === "done") return;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      if (d < today) overdueCount++;
      if (d.getTime() === today.getTime()) todayCount++;
    });

    if (overdueCount > 5) {
      setSuggestion(
        "You have many overdue tasks. Use Focus Mode to clear your backlog."
      );
    } else if (overdueCount === 0 && todayCount === 0 && allTasks.length > 0) {
      setSuggestion(
        "You are ahead of schedule. Plan tasks for the next few days."
      );
    } else if (todayCount > 3) {
      setSuggestion(
        "You have a packed day. Prioritize the most important tasks first."
      );
    } else if (allTasks.length === 0) {
      setSuggestion("No tasks yet. Start by adding your first task!");
    } else {
      setSuggestion("You are on track. Keep your streak going!");
    }
  };

  const fetchTasks = async () => {
    if (!userId) return;
    setLoading(true);
    setErrorText("");
    try {
      const res = await api.get("/tasks", {
        params: { userId },
      });
      setTasks(res.data);
      updateSuggestion(res.data);
    } catch (err) {
      console.error("Fetch tasks error", err);
      setErrorText("Could not load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleCreateTask = async () => {
    // console.log("▶ handleCreateTask clicked");
    // console.log("newTitle =", newTitle);
    // console.log("userId =", userId);

    // if (!newTitle.trim() || !userId) {
    //   console.log("❌ Missing title or userId, not sending request");
    //   return;
    // }
    setErrorText("");
    if (!newTitle.trim()) {
      setErrorText("Task title is required.");
      return;
    }
    if (!userId) {
      setErrorText("User not found. Please log in again.");
      return;
    }
    try {
      const res = await api.post("/tasks", {
        title: newTitle,
        description: newDescription.trim() || null,
        userId,
        status: "todo",
        dueDate: newDueDate || null,
      });
      console.log("✅ Task created:", res.data);
      setTasks((prev) => {
        const updated = [res.data, ...prev];
        updateSuggestion(updated);
        return updated;
      });
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
    } catch (err) {
      console.error("Create task error", err);
      setErrorText("Could not create task. Please try again.");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => {
        const updated = prev.filter((t) => t._id !== id);
        updateSuggestion(updated);
        return updated;
      });
    } catch (err) {
      console.error("Delete task error", err);
      setErrorText("Could not delete task.");
    }
  };


  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/tasks/${id}`, { status: newStatus });
      setTasks((prev) => {
        const updated = prev.map((t) => (t._id === id ? res.data : t));
        updateSuggestion(updated);
        return updated;
      });
    } catch (err) {
      console.error("Update status error", err);
      setErrorText("Could not update task status.");
    }
  };

  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in-progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Plan your work across boards and track today&apos;s progress.
          </p>
        </div>
        {/* <div className="flex flex-wrap gap-2 text-xs items-center">
          <input
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 w-40"
            placeholder="New task title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button
            onClick={handleCreateTask}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-50 font-medium"
          >
            + Add Task
          </button>
        </div> */}
      </header>

      {suggestion && (
        <div className="text-xs md:text-sm text-amber-200 bg-amber-500/10 border border-amber-400/40 rounded-xl px-3 py-2">
          💡 {suggestion}
        </div>
      )}

      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Quick add task
        </h2>
        <div className="flex flex-col md:flex-row gap-2 text-xs">
          <input
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
            placeholder="Task title (required)…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <button
            onClick={handleCreateTask}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-50 font-medium"
          >
            + Add
          </button>
        </div>
        <textarea
          className="mt-2 w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-xs"
          rows={2}
          placeholder="Optional description…"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        {errorText && (
          <div className="text-[11px] text-red-300 mt-1">{errorText}</div>
        )}
      </section>

      {/* Columns */}
      {loading ? (
        <div className="text-xs text-slate-400">Loading tasks…</div>
      ) : (
        <section className="grid md:grid-cols-3 gap-3 md:gap-4">
          <Column
            title="To Do"
            tasks={todo}
            accent="bg-sky-400"
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
          />
          <Column
            title="In Progress"
            tasks={inProgress}
            accent="bg-amber-400"
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
          />
          <Column
            title="Done"
            tasks={done}
            accent="bg-emerald-400"
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
          />
        </section>
      )}
    </div>
  );
}
