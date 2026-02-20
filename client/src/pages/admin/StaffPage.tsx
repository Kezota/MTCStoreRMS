import { useMemo, useState } from "react";
import { Loader2, Pencil, Trash2, UserPlus, Eye, EyeOff } from "lucide-react";
import { isAxiosError } from "axios";
import { showToast } from "../../lib/toast";
import { useGetUsers } from "../../hooks/queries";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../hooks/mutations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "../../lib/types";

const emptyForm = {
  username: "",
  nama: "",
  password: "",
  role: "STAFF" as "ADMIN" | "STAFF",
};

export const StaffPage = () => {
  const { data: users, isLoading } = useGetUsers();
  const createUser = useCreateUserMutation();
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const sortedUsers = useMemo(() => {
    return [...(users ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [users]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      nama: user.nama,
      password: "",
      role: user.role,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setShowPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.username || !form.nama || (!editingUser && !form.password)) {
      showToast.error("Username, nama, dan password wajib diisi");
      return;
    }

    try {
      if (editingUser) {
        const payload = {
          username: form.username,
          nama: form.nama,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        };

        const response = await updateUser.mutateAsync({
          id: editingUser.id,
          payload,
        });
        showToast.success(response.message || "User berhasil diperbarui");
      } else {
        const response = await createUser.mutateAsync({
          username: form.username,
          nama: form.nama,
          password: form.password,
          role: form.role,
        });
        showToast.success(response.message || "User berhasil dibuat");
      }

      closeForm();
    } catch (error) {
      if (isAxiosError(error)) {
        showToast.error(error.response?.data?.message || "Terjadi kesalahan");
      } else {
        showToast.error("Terjadi kesalahan");
      }
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(
      `Hapus user ${user.nama} (${user.username})?`,
    );
    if (!confirmed) return;

    try {
      const response = await deleteUser.mutateAsync(user.id);
      showToast.success(response.message || "User berhasil dihapus");
    } catch (error) {
      if (isAxiosError(error)) {
        showToast.error(error.response?.data?.message || "Terjadi kesalahan");
      } else {
        showToast.error("Terjadi kesalahan");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Memuat data staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Staff
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Kelola user dan akses sistem
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden bg-white/90">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="px-6 text-slate-600">Nama</TableHead>
              <TableHead className="px-6 text-slate-600 border-l border-slate-200/70">
                Username
              </TableHead>
              <TableHead className="px-6 text-slate-600 border-l border-slate-200/70">
                Role
              </TableHead>
              <TableHead className="px-6 text-slate-600 border-l border-slate-200/70">
                Dibuat
              </TableHead>
              <TableHead className="px-6 text-right text-slate-600 border-l border-slate-200/70">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow
                key={user.id}
                className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
              >
                <TableCell className="px-6 font-medium text-slate-900">
                  {user.nama}
                </TableCell>
                <TableCell className="px-6 text-slate-600 border-l border-slate-200/70">
                  {user.username}
                </TableCell>
                <TableCell className="px-6 border-l border-slate-200/70">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="px-6 text-slate-600 border-l border-slate-200/70">
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell className="px-6 border-l border-slate-200/70">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Table - Scrollable */}
      <div className="md:hidden overflow-x-auto rounded-lg border border-slate-200/80 bg-white/90">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="px-1.5 py-1 text-[10px] text-slate-600">
                Nama
              </TableHead>
              <TableHead className="px-1.5 py-1 text-[10px] text-slate-600 border-l border-slate-200/70">
                Username
              </TableHead>
              <TableHead className="px-1.5 py-1 text-[10px] text-slate-600 border-l border-slate-200/70">
                Role
              </TableHead>
              <TableHead className="px-1.5 py-1 text-[10px] text-slate-600 border-l border-slate-200/70">
                Dibuat
              </TableHead>
              <TableHead className="px-1.5 py-1 text-[10px] text-slate-600 border-l border-slate-200/70">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow
                key={user.id}
                className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/40"
              >
                <TableCell className="px-1.5 py-1 text-[10px] font-medium text-slate-900">
                  {user.nama}
                </TableCell>
                <TableCell className="px-1.5 py-1 text-[10px] text-slate-600 border-l border-slate-200/70">
                  {user.username}
                </TableCell>
                <TableCell className="px-1.5 py-1 text-[10px] border-l border-slate-200/70">
                  <span
                    className={`px-0.5 py-0.5 rounded text-[8px] font-medium ${
                      user.role === "ADMIN"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="px-1.5 py-1 text-[10px] text-slate-600 border-l border-slate-200/70 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell className="px-1.5 py-1 text-[10px] border-l border-slate-200/70">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => openEdit(user)}
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 text-blue-600 hover:bg-blue-50 rounded text-[8px] transition"
                    >
                      <Pencil className="w-2 h-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 text-red-600 hover:bg-red-50 rounded text-[8px] transition"
                    >
                      <Trash2 className="w-2 h-2" />
                      Hapus
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={closeForm}
        >
          <div
            className="bg-white w-full max-w-lg rounded-xl shadow-xl p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingUser ? "Edit User" : "Tambah User"}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        role: e.target.value as "ADMIN" | "STAFF",
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Password {editingUser ? "(opsional)" : ""}
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending || updateUser.isPending}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-60"
                >
                  {editingUser ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
