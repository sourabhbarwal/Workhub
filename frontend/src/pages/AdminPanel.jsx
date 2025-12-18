// frontend/src/pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";
import {motion, AnimatePresence} from "framer-motion";

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [activeTeam, setActiveTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isAdmin = user?.role === "admin";
  const adminFirebaseUid = user?.uid;

  // ─────────────────────────────────────
  // Fetch users & ALL teams (for any admin)
  // ─────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!adminFirebaseUid || !isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorText("");
      setSuccessText("");

      try {
        const [usersRes, teamsRes] = await Promise.all([
          api.get("/users"),
          // ✅ all teams, not only ones created by this admin
          api.get("/teams/adminList"),
        ]);

        setUsers(usersRes.data || []);
        setTeams(teamsRes.data || []);
      } catch (err) {
        console.error("AdminPanel fetch error:", err);
        setErrorText("Could not load users or teams.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminFirebaseUid, isAdmin]);

  const toggleSelect = (firebaseUid) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(firebaseUid)) copy.delete(firebaseUid);
      else copy.add(firebaseUid);
      return copy;
    });
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!adminFirebaseUid) return;

    if (!teamName.trim()) {
      setErrorText("Team name is required.");
      return;
    }
    if (selected.size === 0) {
      setErrorText("Select at least one member to add to the team.");
      return;
    }

    setErrorText("");
    setSuccessText("");
    setCreating(true);

    try {
      const memberFirebaseUids = Array.from(selected);

      const res = await api.post("/teams/createFromUsers", {
        adminFirebaseUid,
        name: teamName.trim(),
        memberFirebaseUids,
      });

      // push newly created team into the ALL teams list
      setTeams((prev) => [res.data, ...prev]);
      setTeamName("");
      setSelected(new Set());
      setSuccessText("Team created successfully!");
    } catch (err) {
      console.error("Create team error:", err);
      setErrorText(
        err?.response?.data?.message || "Failed to create team. Try again."
      );
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────
  // Open team details modal
  // ─────────────────────────────────────
  const openTeamDetails = async (team) => {
    setActiveTeam(team);
    setTeamDetails(null);
    setShowDetailsModal(true);
    setDetailsLoading(true);

    try {
      const res = await api.get("/teams/details", {
        params: { teamId: team._id },
      });
      setTeamDetails(res.data);
    } catch (err) {
      console.error("Team details error:", err);
      setErrorText("Could not load team details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeTeamModal = () => {
    setShowDetailsModal(false);
    setTeamDetails(null);
    setActiveTeam(null);
    setShowEditModal(false);
  };

  if (!user) {
    return (
      <div className="text-sm text-gray-500">
        Please log in to view the admin panel.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-sm text-gray-500">
        You are logged in as{" "}
        <span className="font-semibold">{user.email}</span> with role{" "}
        <span className="font-semibold">{user.role || "member"}</span>. Only
        admins can access this panel.
      </div>
    );
  }

  // CSS for animations (self-contained)
  const modalAnimations = `
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes modalScaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-fade-in {
      animation: modalFadeIn 0.18s ease-out;
    }
    .modal-slide-up {
      animation: modalSlideUp 0.2s ease-out;
    }
    .modal-scale-in {
      animation: modalScaleIn 0.2s ease-out;
    }
  `;

  const anyModalOpen = showDetailsModal || showEditModal;

  // Helper: whether current admin can edit the active team
  const canEditActiveTeam =
    teamDetails?.team?.adminFirebaseUid === adminFirebaseUid;

  return (
    <>
      <style>{modalAnimations}</style>
      <div className="min-h-screen bg-linear-to-br from-indigo-300 via-purple-200 to-blue-200 p-6">
      {/* Background content with smooth zoom + blur when modal open */}
      <motion.div
        className="max-w-5xl mx-auto space-y-4 "
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          transform: anyModalOpen ? "scale(0.98)" : "scale(1)",
          filter: anyModalOpen ? "blur(1px)" : "none",
          transition: "transform 180ms ease-out, filter 180ms ease-out",
        }}
      >
        <header>
          <h1 className="text-2xl font-bold text-indigo-700">
            Admin Panel
          </h1>
          <p className="text-xs text-gray-600 mt-3">
            Manage users, teams and see an overview of activity.
          </p>
        </header>

        {errorText && (
          <motion.div
            className="text-xs text-red-500 bg-red-200 border border-red-700/50 rounded-xl px-3 py-2"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errorText}
          </motion.div>
        )}
        {successText && (
          <motion.div
            className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/40 rounded-xl px-3 py-2"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successText}
          </motion.div>
        )}

        {loading ? (
          <div className="text-xs text-gray-500">
            Loading users and teams…
          </div>
        ) : (
          <>
            {/* Team list – all teams visible to every admin */}
            <motion.section 
              className="bg-white/40 rounded-2xl p-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <h2 className="text-[15px] font-bold text-indigo-400 mb-2">
                All Teams
              </h2>
              {teams.length === 0 ? (
                <div className="text-xs text-gray-500">
                  No teams have been created yet.
                </div>
              ) : (
                <ul className="space-y-2 text-xs md:text-sm">
                  {teams.map((t,index) => (
                    <motion.li
                      key={t._id}
                        className="border border-indigo-600/60 bg-indigo-200 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:border-indigo-600/60 hover:bg-indigo-300 transition"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.18,
                          delay: 0.03 * index,
                        }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => openTeamDetails(t)}
                    >
                      <div>
                        <div className="font-medium text-gray-700 flex items-center gap-3 py-1">
                          {t.name}
                          {t.adminFirebaseUid === adminFirebaseUid && (
                            <span className="px-1.5 py-0.5 rounded-full bg-white/50 text-[10px] text-indigo-800 border border-indigo-900/90">
                              you are admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-600">
                          Team ID:{" "}
                          <span className="font-mono">{t._id}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-600 text-right">
                        <div>
                          Created:{" "}
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.section>

            {/* Create team from users */}
            <motion.section 
              className="bg-white/40 rounded-2xl p-4 space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <h2 className="text-[15px] font-bold text-indigo-400 mb-2">
                Create Team from Registered Users
              </h2>

              <motion.form
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.75 }}
                className="space-y-4 text-sm"
                onSubmit={handleCreateTeam}
              >
                <div className="space-y-1">
                  <label className="block font-bold text-gray-500">Team name</label>
                  <motion.input
                    whileFocus={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                    type="text"
                    placeholder="Enter a Team Name"
                    required
                    className="w-full px-4 py-2 rounded-xl border  text-indigo-500 focus:ring focus:ring-indigo-400 "
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 block font-bold">
                      Select members
                    </span>
                    <span className="text-[14px] font-bold text-gray-500">
                      {selected.size} selected
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-xl">
                    {users.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500">
                        No users registered yet.
                      </div>
                    ) : (
                      <ul className="text-xs md:text-sm">
                        {users.map((u) => (
                          <label
                            key={u.firebaseUid}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-200/60 cursor-pointer"
                            //className="flex items-center gap-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={selected.has(u.firebaseUid)}
                              onChange={() => toggleSelect(u.firebaseUid)}
                              disabled={u.firebaseUid === adminFirebaseUid}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600 truncate">
                                  {u.name}
                                </span>
                                {u.role === "admin" && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-400/20 text-[10px] text-indigo-600 border border-indigo-500/50">
                                    admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 1 }}
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-400 font-medium transition md:text-sm cursor-pointer"
                >
                  {creating ? "Creating team…" : "Create team"}
                </motion.button>
              </motion.form>
            </motion.section>

          </>
        )}
      </motion.div>

      {/* ─────────────────────────────────────
          Team details popup (VIEW ONLY)
          ───────────────────────────────────── */}
      <AnimatePresence>
      {showDetailsModal && (
        <motion.div
          key="details-modal"
            onClick={closeTeamModal}
            className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
              className="bg-white/70 rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {detailsLoading || !teamDetails ? (
              <div className="text-sm text-gray-500">
                Loading team details…
              </div>
            ) : (
              <>
                {/* Header – Edit + Close on right, no overlap */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-indigo-600">
                      {teamDetails.team?.name || "Team"}
                    </h2>
                    <p className="text-xs text-gray-600">
                      Team ID:{" "}
                      <span >
                        {teamDetails.team?._id}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEditActiveTeam && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 1 }}
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-400 font-medium transition md:text-sm cursor-pointer"
                      >
                        Edit details
                      </motion.button>
                    )}
                    <button
                      onClick={closeTeamModal}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 text-gray-900 text-sm cursor-pointer"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-700">
                    <span>Progress</span>
                    <span>
                      {teamDetails.stats?.completedTasks || 0}/
                      {teamDetails.stats?.totalTasks || 0} tasks done (
                      {teamDetails.stats?.progressPercent || 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white overflow-hidden">
                    <motion.div
                      className="h-2 bg-emerald-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          teamDetails.stats?.progressPercent || 0
                        }%`,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Members list */}
                  <div>
                    <h3 className="text-1x1 font-bold text-gray-600 mb-2">
                      Members
                    </h3>
                    {teamDetails.users?.length === 0 ? (
                      <div className="text-[11px] text-gray-500">
                        No user records for this team.
                      </div>
                    ) : (
                      <ul className="space-y-1 text-[11px] md:text-xs">
                        {teamDetails.users.map((m) => (
                          <li
                            key={m.firebaseUid}
                            className="flex items-center justify-between bg-indigo-200 rounded-xl px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900">
                                {m.name}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full border bg-white/60 text-gray-700 text-[11px]">
                              {m.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Team tasks with creator + completer */}
                  <div>
                    <h3 className="text-1x1 font-bold text-gray-600 mb-2">
                      Team Tasks
                    </h3>
                    {(() => {
                      const tasks = teamDetails.tasks || [];
                      if (tasks.length === 0) {
                        return (
                          <div className="text-[11px] text-gray-500">
                            No tasks found for this team.
                          </div>
                        );
                      }

                      const memberMap = new Map(
                        (teamDetails.users || []).map((u) => [
                          u.firebaseUid,
                          u,
                        ])
                      );

                      return (
                        <ul className="space-y-1 text-[11px] md:text-xs">
                          {tasks.map((t) => {
                            const creatorUser =
                              t.createdByFirebaseUid &&
                              memberMap.get(t.createdByFirebaseUid);
                            const completerUser =
                              t.completedByFirebaseUid &&
                              memberMap.get(t.completedByFirebaseUid);

                            const createdBy =
                              t.createdByName ||
                              creatorUser?.name ||
                              creatorUser?.email ||
                              "Unknown";

                            const completedBy =
                              t.completedByName ||
                              completerUser?.name ||
                              completerUser?.email ||
                              null;

                            const createdOn = t.createdAt
                              ? new Date(
                                  t.createdAt
                                ).toLocaleString()
                              : null;

                            const completedOn = t.completedAt
                              ? new Date(
                                  t.completedAt
                                ).toLocaleString()
                              : null;

                            const due = t.dueDate
                              ? new Date(
                                  t.dueDate
                                ).toLocaleDateString()
                              : "No due date";

                            return (
                              <li
                                key={t._id}
                                className="bg-indigo-200 rounded-lg px-3 py-2 flex flex-col gap-1"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="text-gray-900 font-medium">
                                      {t.title}
                                    </div>
                                    {t.description && (
                                      <div className="text-[11px] text-gray-500">
                                        {t.description}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full self-start ${
                                      t.status === "done"
                                        ? "bg-emerald-500/20 text-emerald-700 border"
                                        : t.status === "in-progress"
                                        ? "bg-amber-500/20 text-amber-700 border"
                                        : "bg-gray-900/60 text-gray-300 border"
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </div>

                                <div className="text-[11px] text-gray-500">
                                  <div>
                                    Created by{" "}
                                    <span className="text-gray-800">
                                      {createdBy}
                                    </span>
                                    {createdOn && (
                                      <>
                                        {" "}
                                        on{" "}
                                        <span className="text-gray-800">
                                          {createdOn}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div>
                                    Due on{" "}
                                    <span className="text-gray-800">
                                      {due}
                                    </span>
                                  </div>

                                  {t.status === "done" && (
                                    <div className="mt-0.5">
                                      {completedBy ? (
                                        <>
                                          Completed by{" "}
                                          <span className="text-gray-800">
                                            {completedBy}
                                          </span>
                                        </>
                                      ) : (
                                        "Completed"
                                      )}
                                      {completedOn && (
                                        <>
                                          {" "}
                                          on{" "}
                                          <span className="text-gray-800">
                                            {completedOn}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ─────────────────────────────────────
          Edit Team popup (name + members)
          ───────────────────────────────────── */}
      <AnimatePresence>
      {showEditModal && teamDetails && canEditActiveTeam && (
        <TeamEditModal
          details={teamDetails}
          allUsers={users}
          adminFirebaseUid={adminFirebaseUid}
          onClose={() => setShowEditModal(false)}
          onUpdated={async (updatedDetails) => {
            // Update local team details object
            setTeamDetails(updatedDetails);

            // Update main teams list with new team data
            setTeams((prev) =>
              prev.map((t) =>
                t._id === updatedDetails.team._id ? updatedDetails.team : t
              )
            );

            setShowEditModal(false);
            setSuccessText("Team updated successfully.");
          }}
        />
      )}
      </AnimatePresence>
      </div>
    </>
  );
}

/**
 * ✏️ Separate Edit Modal for team name + members
 */
function TeamEditModal({
  adminFirebaseUid,
  allUsers,
  details,
  onClose,
  onUpdated,
}) {
  const [name, setName] = useState(details.team.name);
  const [saving, setSaving] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(
    new Set(details.team.memberFirebaseUids || [])
  );

  useEffect(() => {
    setName(details.team.name);
    setSelectedMembers(new Set(details.team.memberFirebaseUids || []));
  }, [details]);

  const toggleMember = (firebaseUid) => {
    setSelectedMembers((prev) => {
      const copy = new Set(prev);
      if (copy.has(firebaseUid)) copy.delete(firebaseUid);
      else copy.add(firebaseUid);
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // First update the team
      await api.put(`/teams/${details.team._id}`, {
        adminFirebaseUid,
        name,
        memberFirebaseUids: Array.from(selectedMembers),
      });

      // Then re-fetch fresh details (team + users + stats + tasks)
      const refreshed = await api.get("/teams/details", {
        params: { teamId: details.team._id },
      });

      onUpdated && onUpdated(refreshed.data);
    } catch (err) {
      console.error("Update team error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      onClick={onClose}
      className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white/80 backdrop-blur-sm inset-0 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
        //className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit team details
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 text-gray-900 text-sm cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs md:text-sm">
          <div className="space-y-1">
            <label className="block text-gray-700">Team name</label>
            <input
              whilefocus={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              type="text"
              placeholder="Enter a Team Name"
              required
              className="w-full px-4 py-2 rounded-xl border  text-indigo-500 focus:ring focus:ring-indigo-400 "
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Edit members</span>
              <span className="text-[11px] text-gray-700">
                {selectedMembers.size} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto  rounded-xl">
              <ul className="divide-y text-xs md:text-sm">
                {allUsers.map((u) => {
                  const checked = selectedMembers.has(u.firebaseUid);
                  return (
                    <label
                      key={u.firebaseUid}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-200/60 cursor-pointer"
                      //className="flex items-center gap-3 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={() => toggleMember(u.firebaseUid)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600 truncate">
                            {u.name}
                          </span>
                          {u.role === "admin" && (
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-400/20 text-[10px] text-indigo-600 border border-indigo-500/50">
                              admin
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-600 hover:bg-gray-400 font-medium transitionmd:text-sm cursor-pointer"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 1 }}
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-400 font-medium transition md:text-sm cursor-pointer"
            >
              {saving ? "Saving…" : "Save changes"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}