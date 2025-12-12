// frontend/src/pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api";

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

      {/* Background content with smooth zoom + blur when modal open */}
      <div
        className="max-w-5xl mx-auto space-y-4"
        style={{
          transform: anyModalOpen ? "scale(0.98)" : "scale(1)",
          filter: anyModalOpen ? "blur(1px)" : "none",
          transition: "transform 180ms ease-out, filter 180ms ease-out",
        }}
      >
        <header>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Admin Panel
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Manage users, teams and see an overview of activity.
          </p>
        </header>

        {errorText && (
          <div className="text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2">
            {errorText}
          </div>
        )}
        {successText && (
          <div className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/40 rounded-xl px-3 py-2">
            {successText}
          </div>
        )}

        {loading ? (
          <div className="text-xs text-gray-500">
            Loading users and teams…
          </div>
        ) : (
          <>
            {/* Create team from users */}
            <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <h2 className="text-1xl font-bold text-gray-700 mb-2">
                CREATE TEAM FROM REGISTERED USERS
              </h2>

              <form
                className="space-y-3 text-xs md:text-sm"
                onSubmit={handleCreateTeam}
              >
                <div className="space-y-1">
                  <label className="block text-gray-700">Team name</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 text-xs md:text-sm"
                    placeholder="e.g. Final Year Project Squad"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-shadow-amber-50 md:text-sm">
                      Select members
                    </span>
                    <span className="text-[14px] text-gray-500">
                      {selected.size} selected
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                    {users.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500">
                        No users registered yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-300 text-xs md:text-sm">
                        {users.map((u) => (
                          <li
                            key={u.firebaseUid}
                            className="flex items-center gap-4 px-4 py-2 hover:bg-gray-300/60"
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={selected.has(u.firebaseUid)}
                              onChange={() => toggleSelect(u.firebaseUid)}
                              disabled={u.firebaseUid === adminFirebaseUid}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-700 truncate">
                                  {u.name || u.email}
                                </span>
                                {u.role === "admin" && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-white text-[10px] text-indigo-800 border border-indigo-800/50">
                                    admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">
                                {u.email}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-gray-200 font-medium text-xs md:text-sm"
                >
                  {creating ? "Creating team…" : "Create team"}
                </button>
              </form>
            </section>

            {/* Team list – all teams visible to every admin */}
            <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
              <h2 className="text-1xl font-bold text-gray-700 mb-1">
                ALL TEAMS
              </h2>
              {teams.length === 0 ? (
                <div className="text-xs text-gray-500">
                  No teams have been created yet.
                </div>
              ) : (
                <ul className="space-y-2 text-xs md:text-sm">
                  {teams.map((t) => (
                    <li
                      key={t._id}
                      className="border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:border-indigo-900/90 hover:bg-white transition"
                      onClick={() => openTeamDetails(t)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {t.name}
                          {t.adminFirebaseUid === adminFirebaseUid && (
                            <span className="px-1.5 py-0.5 rounded-full bg-white text-[10px] text-indigo-800 border border-indigo-800/50">
                              you are admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Team ID:{" "}
                          <span className="font-mono">{t._id}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 text-right">
                        <div>
                          Created:{" "}
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────
          Team details popup (VIEW ONLY)
          ───────────────────────────────────── */}
      {showDetailsModal && (
        <div
          onClick={closeTeamModal}
          className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 modal-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-gray-300 rounded-2xl shadow-2xl w-full max-w-4xl p-6 modal-slide-up"
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
                    <h2 className="text-2xl font-bold text-gray-700">
                      {teamDetails.team?.name || "Team"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Team ID:{" "}
                      <span className="font-light">
                        {teamDetails.team?._id}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEditActiveTeam && (
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-gray-200 text-xs md:text-sm"
                      >
                        Edit details
                      </button>
                    )}
                    <button
                      onClick={closeTeamModal}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-white text-gray-200 text-sm"
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
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-2 bg-emerald-500"
                      style={{
                        width: `${
                          teamDetails.stats?.progressPercent || 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Members list */}
                  <div>
                    <h3 className="text-1x1 font-bold text-gray-800 mb-2">
                      MEMBERS
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
                            className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-1.5"
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900">
                                {m.name || m.email}
                              </span>
                              <span className="text-gray-500">
                                {m.email}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-white text-gray-800 text-[10px]">
                              {m.role}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Team tasks with creator + completer */}
                  <div>
                    <h3 className="text-1x1 font-bold text-gray-800 mb-2">
                      TEAM TASKS
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
                                className="border border-gray-200 rounded-lg px-3 py-2 flex flex-col gap-1"
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
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : t.status === "in-progress"
                                        ? "bg-amber-500/20 text-amber-300"
                                        : "bg-gray-200/50 text-gray-700"
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
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────
          Edit Team popup (name + members)
          ───────────────────────────────────── */}
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
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-60 modal-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-gray-300 rounded-2xl shadow-2xl w-full max-w-lg p-6 modal-scale-in"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit team details
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-200 text-gray-700 text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs md:text-sm">
          <div className="space-y-1">
            <label className="block text-gray-700">Team name</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 text-xs md:text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Edit members</span>
              <span className="text-[11px] text-gray-500">
                {selectedMembers.size} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
              <ul className="divide-y divide-slate-800 text-xs md:text-sm">
                {allUsers.map((u) => {
                  const checked = selectedMembers.has(u.firebaseUid);
                  return (
                    <li
                      key={u.firebaseUid}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-200/60"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={() => toggleMember(u.firebaseUid)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {u.name || u.email}
                          </span>
                          {u.role === "admin" && (
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/50">
                              admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {u.email}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-200 text-gray-900 text-xs md:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-gray-900 font-medium text-xs md:text-sm"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
