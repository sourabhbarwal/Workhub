//frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

function Column({ title, tasks, accent, onStatusChange, onDelete }) {
  return (
    <div className="flex-1 backdrop-blur-2xl bg-white/40 rounded-2xl p-4">
      <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${accent}`} />
        {title}
        <span className="ml-auto text-xs text-gray-600">
          {tasks.length}
        </span>
      </h2>

      <div className="space-y-2">
        {tasks.map((task) => (
          <motion.div
            whileHover={{scale : 1.01}}
            key={task._id}
            layout
            className=" rounded-xl bg-indigo-200 border border-indigo-600/60 px-3 py-2 shadow-blue-xs hover:border-indigo-600/60 hover:bg-indigo-300 transition cursor-pointer"
            //className="border border-indigo-600/60 bg-indigo-200 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:border-indigo-600/60 hover:bg-indigo-300 transition"
          >
            <div className="flex justify-between">
              <div>
                <div className="font-medium text-indigo-500 text-sm">
                  {task.title}
                </div>
              </div>
              <button
                onClick={() => onDelete(task._id)}
                className="text-xs cursor-pointer text-gray-800 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex justify-between items-center text-xs">
              <span className="text-gray-500">
                {task.dueDate &&
                  new Date(task.dueDate).toLocaleDateString()}
              </span>

              <motion.select
                whileFocus={{ scale: 1.02 }}
                value={task.status}
                onChange={(e) =>
                  onStatusChange(task._id, e.target.value)
                }
                className=" text-indigo-900 rounded-lg px-2 py-1 cursor-pointer"
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </motion.select>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const firebaseUid = user?.uid;

  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("personal");
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!firebaseUid) return;

    api
      .get("/teams/forUser", { params: { firebaseUid } })
      .then((res) => setTeams(res.data));
  }, [firebaseUid]);

  useEffect(() => {
    if (!firebaseUid) return;

    const params =
      selectedBoard === "personal"
        ? { userFirebaseUid: firebaseUid }
        : { teamId: selectedBoard };

    api.get("/tasks", { params }).then((res) => setTasks(res.data));
  }, [firebaseUid, selectedBoard]);

  const createTask = async () => {
    if (!newTitle || !newDue) {
      setError("Title and due date required");
      return;
    }

    await api.post("/tasks", {
      title: newTitle,
      dueDate: newDue,
      status: "todo",
      userFirebaseUid: firebaseUid,
      ...(selectedBoard !== "personal" && { teamId: selectedBoard }),
    });

    setNewTitle("");
    setNewDue("");
    setError("");
    window.location.reload();
  };

  const updateStatus = async (id, status) => {
    const res = await api.put(`/tasks/${id}`, {
      status,
      updatedByFirebaseUid: firebaseUid,
    });
    setTasks((t) => t.map((x) => (x._id === id ? res.data : x)));
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((t) => t.filter((x) => x._id !== id));
  };

  const todo = tasks.filter((t) => t.status === "todo");
  const progress = tasks.filter((t) => t.status === "in-progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-300 via-purple-200 to-blue-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-4"
      >
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">
            Dashboard
          </h1>

          <motion.select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="rounded-xl px-4 py-2 bg-white/40 text-indigo-600 cursor-pointer"
            whileFocus={{ scale: 1.05 }}
          >
            <option value="personal">Personal</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </motion.select>
        </header>

        {/* Quick Add */}
        <div className=" backdrop-blur-xl bg-white/40 rounded-2xl p-4">
          <p className="px-3 py-2 font-bold text-gray-700">Add Task</p>
          <div className="flex gap-3">
            <motion.input
              whileFocus={{ scale: 1.0 }} 
              transition={{ duration: 0.15 }}
              required
              placeholder="Task title"
              className="w-full px-4 py-2 rounded-xl border  text-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="date"
              className="rounded-xl border px-4 py-2 border-indigo-500 text-indigo-300 focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
              onClick={createTask}
              className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-400 font-medium transition cursor-pointer"
            >
              Add
            </motion.button>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
        </div>

        {/* Columns */}
        <div className="grid md:grid-cols-3 gap-4 text-indigo-400">
          <Column
            title="TO DO"
            tasks={todo}
            accent="bg-sky-500"
            onStatusChange={updateStatus}
            onDelete={deleteTask}
          />
          <Column
            title="IN PROGRESS"
            tasks={progress}
            accent="bg-amber-500"
            onStatusChange={updateStatus}
            onDelete={deleteTask}
          />
          <Column
            title="DONE"
            tasks={done}
            accent="bg-emerald-500"
            onStatusChange={updateStatus}
            onDelete={deleteTask}
          />
        </div>
      </motion.div>
    </div>
  );
}
