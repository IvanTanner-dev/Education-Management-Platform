import React, { useState, useEffect } from "react";
import api from "../api";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/users/");
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      role: user.role || user.profile?.role || "student",
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        profile: { role: editFormData.role },
      };
      const response = await api.patch(
        `/api/admin/users/${editingUser.id}/`,
        payload,
      );
      setUsers(
        users.map((u) => (u.id === editingUser.id ? response.data : u)),
      );
      handleCloseEditModal();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update user. Please check permissions.");
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      await api.delete(`/api/admin/users/${userId}/`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to remove user.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const userRole = user.role || user.profile?.role || "student";
    const matchesRole = filterRole === "all" || userRole === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Admin Control Center
          </h1>
          <p className="text-slate-500 font-medium">
            Manage platform users and roles.
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or username..."
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "admin", "teacher", "student"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                filterRole === role
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* USER LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const userRole = user.role || user.profile?.role || "student";
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            @{user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          userRole === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : userRole === "teacher"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {userRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors text-xl"
                          aria-label={`Edit ${user.username}`}
                          title="Edit User"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors text-xl"
                          aria-label={`Remove ${user.username}`}
                          title="Remove User"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && !loading && (
          <div className="py-20 text-center text-slate-400 font-medium">
            No users found matching your criteria.
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">
                Edit User: @{editingUser.username}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="first_name"
                    className="block text-xs font-bold text-slate-400 uppercase mb-1"
                  >
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={editFormData.first_name}
                    onChange={handleEditFormChange}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label 
                    htmlFor="last_name"
                    className="block text-xs font-bold text-slate-400 uppercase mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    value={editFormData.last_name}
                    onChange={handleEditFormChange}
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label 
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-400 uppercase mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label 
                  htmlFor="role"
                  className="block text-xs font-bold text-slate-400 uppercase mb-1"
                >
                  System Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditFormChange}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminPanel;
