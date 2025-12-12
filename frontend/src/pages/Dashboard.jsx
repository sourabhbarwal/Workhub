// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

function Column({ title, tasks, accent, onStatusChange, onDelete }) {
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
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs hover:border-indigo-400/70 hover:shadow-md transition group"
          >
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
                onClick={() => onDelete && onDelete(task._id)}
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
  const firebaseUid = user?.firebaseUid || user?.uid || null;

  const [tasks, setTasks] = useState([]);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [teams, setTeams] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("personal"); // "personal" or teamId

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // ─────────────────────────
  // Suggestion helper
  // ─────────────────────────
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

  // ─────────────────────────
  // Fetch tasks for current board
  // ─────────────────────────
  const fetchTasks = async () => {
    try {
      if (!firebaseUid) return;

      setLoading(true);
      setErrorText("");

      let params;
      if (selectedBoard === "personal") {
        params = { userFirebaseUid: firebaseUid };
      } else {
        params = { teamId: selectedBoard };
      }

      const res = await api.get("/tasks", { params });
      const list = res.data || [];
      setTasks(list);
      updateSuggestion(list);
    } catch (err) {
      console.error("Fetch tasks error", err);
      setErrorText(
        err?.response?.data?.message || "Could not load tasks for this board."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────
  // Fetch teams for this user
  // ─────────────────────────
  const fetchTeams = async () => {
    try {
      if (!firebaseUid) return;
      const res = await api.get("/teams/forUser", {
        params: { firebaseUid },
      });
      setTeams(res.data || []);
    } catch (err) {
      console.error("Dashboard teams fetch error:", err);
    }
  };

  // initial load when user known
  useEffect(() => {
    if (!firebaseUid) return;
    fetchTeams();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUid]);

  // when board changes
  useEffect(() => {
    if (!firebaseUid) return;
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard]);

  // ─────────────────────────
  // Quick add task
  // ─────────────────────────
  const handleCreateTask = async () => {
    try {
      setErrorText("");

      if (!firebaseUid) {
        setErrorText("You must be logged in to create tasks.");
        return;
      }

      if (!newTaskTitle.trim()) {
        setErrorText("Task title is required.");
        return;
      }

      if (!newTaskDueDate) {
        setErrorText("Due date is required.");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(newTaskDueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        setErrorText(
          "Due date cannot be in the past. Please choose today or a future date."
        );
        return;
      }

      const payload = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        status: "todo",
        dueDate: newTaskDueDate,
        userFirebaseUid: firebaseUid, // ALWAYS send creator
      };

      if (selectedBoard !== "personal") {
        payload.teamId = selectedBoard; // team board
      }

      await api.post("/tasks", payload);

      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");

      fetchTasks();
    } catch (err) {
      console.error("Quick add task error", err);
      setErrorText(
        err?.response?.data?.message ||
          "Could not create task. Please check the details and try again."
      );
      if (err?.response?.data) {
        console.log("Server says:", err.response.data);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/tasks/${id}`, {
        status: newStatus,
        updatedByFirebaseUid: firebaseUid || undefined,
      });
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

  const handleDeleteTask = async (id) => {
    const ok = window.confirm("Delete this task?");
    if (!ok) return;
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

  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in-progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 mb-4 w-full">
          <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>

          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-slate-400">Board:</span>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
            >
              <option value="personal">Personal</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {suggestion && (
        <div className="text-xs md:text-sm text-amber-200 bg-amber-500/10 border border-amber-400/40 rounded-xl px-3 py-2">
          💡 {suggestion}
        </div>
      )}

      {/* Quick add task */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Quick add task
        </h2>
        <div className="flex flex-col md:flex-row gap-2 text-xs">
          <input
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
            placeholder="Task title (required)…"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <input
            type="date"
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
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
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
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
