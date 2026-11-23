import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  History,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { UserAccount, UserRole, Employee, AuditLogItem } from '../types';
import { db } from '../services/db';
import { ConfirmModal } from './ConfirmModal';
import { generateRandomSalt, hashPasswordWithSalt } from '../services/authCrypto';

interface UserManagementViewProps {
  currentUser: UserAccount | null;
  employees: Employee[];
  auditLogs: AuditLogItem[];
  onRefresh: () => void;
}

const ROLES: UserRole[] = [
  'Super Administrator',
  'Manager',
  'HR',
  'Accountant',
  'Receptionist',
  'Service Employee',
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  employees,
  auditLogs,
  onRefresh,
}) => {
  const users = db.getUsers();

  // Create User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Receptionist');
  const [newLinkedEmpId, setNewLinkedEmpId] = useState('');
  const [newInitialPassword, setNewInitialPassword] = useState('');
  const [newForceChange, setNewForceChange] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Receptionist');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive' | 'Locked'>('Active');
  const [editLinkedEmpId, setEditLinkedEmpId] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminForceChange, setAdminForceChange] = useState(true);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Delete Confirm
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);

  // Filter audit logs for auth & user actions
  const authAuditLogs = auditLogs.filter((log) =>
    [
      'USER_BOOTSTRAP',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'PASSWORD_CHANGED',
      'ADMIN_PASSWORD_RESET',
      'PASSWORD_RESET_TOKEN_GENERATED',
      'PASSWORD_RESET_COMPLETE',
      'USERNAME_RECOVERY_REQUESTED',
    ].includes(log.action)
  );

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newUsername.trim()) {
      setAddError('Username is required.');
      return;
    }
    if (newInitialPassword.length < 6) {
      setAddError('Initial password must be at least 6 characters.');
      return;
    }

    try {
      const salt = generateRandomSalt(16);
      const hash = await hashPasswordWithSalt(newInitialPassword, salt);

      const user: UserAccount = {
        id: `USR-${Date.now().toString(36)}`,
        username: newUsername.trim(),
        fullName: newFullName.trim() || newUsername.trim(),
        email: newEmail.trim() || 'cosmosbeautyqatar@gmail.com',
        role: newRole,
        employeeId: newLinkedEmpId || undefined,
        passwordHash: hash,
        salt,
        status: 'Active',
        mustChangePassword: newForceChange,
        createdAt: new Date().toISOString(),
      };

      await db.saveUser(user);
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewInitialPassword('');
      onRefresh();
    } catch (err: unknown) {
      setAddError((err as Error).message || 'Failed to create user account.');
    }
  };

  // Handle Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    // Guard: Prevent deactivating the last active super admin
    if (
      editingUser.role === 'Super Administrator' &&
      (editRole !== 'Super Administrator' || editStatus !== 'Active')
    ) {
      const activeSuperAdmins = users.filter(
        (u) => u.role === 'Super Administrator' && u.status === 'Active' && u.id !== editingUser.id
      );
      if (activeSuperAdmins.length === 0) {
        setEditError('Cannot demote or deactivate the only active Super Administrator account.');
        return;
      }
    }

    try {
      const updated: UserAccount = {
        ...editingUser,
        role: editRole,
        email: editEmail.trim(),
        status: editStatus,
        employeeId: editLinkedEmpId || undefined,
      };

      await db.saveUser(updated);
      setEditingUser(null);
      onRefresh();
    } catch (err: unknown) {
      setEditError((err as Error).message || 'Failed to update user.');
    }
  };

  // Handle Admin Reset Password
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);
    setResetSuccess(null);

    if (adminNewPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    const res = await db.adminSetPassword(
      resetTargetUser.id,
      adminNewPassword,
      adminForceChange
    );
    if (res.success) {
      setResetSuccess(
        `Password updated for ${resetTargetUser.username}. Next login requires password change: ${adminForceChange ? 'YES' : 'NO'}.`
      );
      setTimeout(() => {
        setResetTargetUser(null);
        setAdminNewPassword('');
        setResetSuccess(null);
        onRefresh();
      }, 1500);
    } else {
      setResetError(res.error || 'Password reset failed.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const res = await db.deleteUser(deleteConfirmUser.id);
    if (res.success) {
      setDeleteConfirmUser(null);
      onRefresh();
    } else {
      alert(res.error || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                User Account Management & Access Control
              </h2>
              <p className="text-xs text-slate-500">
                Manage staff credentials, assigned roles, password security, and account recovery.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setAddError(null);
            setIsAddUserOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Staff User</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Accounts
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Active Accounts
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {users.filter((u) => u.status === 'Active').length}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
            Super Admins
          </p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">
            {users.filter((u) => u.role === 'Super Administrator').length}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
            Reset Required
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {users.filter((u) => u.mustChangePassword).length}
          </p>
        </div>
      </div>

      {/* Designated Administrative Recovery Email Notice */}
      <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200/80 flex items-start gap-3 text-xs text-purple-900">
        <Mail className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">
            Designated Recovery Email: <span className="font-mono text-purple-800">cosmosbeautyqatar@gmail.com</span>
          </p>
          <p className="text-purple-700/90 text-[11px]">
            This email address is authorized for receiving username & password recovery notifications, system security alerts, and administrative override tokens.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Configured User Accounts</span>
          </h3>
          <span className="text-xs text-slate-500">{users.length} accounts registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Username & Name</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Recovery Email</th>
                <th className="py-3 px-4">Linked Staff</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Password Policy</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const linkedStaff = employees.find((e) => e.employeeId === u.employeeId);
                const isCurrent = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-purple-700">{u.username}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-sans">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{u.fullName}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.role === 'Super Administrator'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'Manager'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : u.role === 'Accountant'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : u.role === 'HR'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {linkedStaff ? (
                        <div>
                          <p className="font-medium text-slate-900">{linkedStaff.employeeName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {linkedStaff.employeeId} · {linkedStaff.position}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None linked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : u.status === 'Locked'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.status === 'Active' ? (
                          <Unlock className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Lock className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{u.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.mustChangePassword ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Reset on login</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Normal</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setResetTargetUser(u);
                            setAdminNewPassword('');
                            setAdminForceChange(true);
                            setResetError(null);
                            setResetSuccess(null);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditRole(u.role);
                            setEditEmail(u.email);
                            setEditStatus(u.status);
                            setEditLinkedEmpId(u.employeeId || '');
                            setEditError(null);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          disabled={u.role === 'Super Administrator' && users.filter((x) => x.role === 'Super Administrator' && x.status === 'Active').length <= 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            <span>Authentication & User Activity Audit Log</span>
          </h3>
          <span className="text-xs text-slate-500">{authAuditLogs.length} events recorded</span>
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
          {authAuditLogs.length === 0 ? (
            <p className="p-6 text-center text-slate-400">No security audit records logged yet.</p>
          ) : (
            authAuditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-700 font-mono text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{log.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---------------- Add User Modal ---------------- */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span>Create New Staff Account</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. receptionist1"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maryam Al-Kuwari"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Job Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Link Employee Record</label>
                  <select
                    value={newLinkedEmpId}
                    onChange={(e) => setNewLinkedEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                  >
                    <option value="">None (Standalone Account)</option>
                    {employees.map((e) => (
                      <option key={e.employeeId} value={e.employeeId}>
                        {e.employeeName} ({e.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Recovery Email (Default: cosmosbeautyqatar@gmail.com)
                </label>
                <input
                  type="email"
                  placeholder="cosmosbeautyqatar@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Initial Setup Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password"
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="forceChangeNew"
                  checked={newForceChange}
                  onChange={(e) => setNewForceChange(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="forceChangeNew" className="text-slate-700 text-xs">
                  Require password change at first login (Recommended)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Edit User Modal ---------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Account: {editingUser.username}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive' | 'Locked')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Recovery Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Linked Employee</label>
                <select
                  value={editLinkedEmpId}
                  onChange={(e) => setEditLinkedEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600"
                >
                  <option value="">None (Standalone)</option>
                  {employees.map((e) => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.employeeName} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Admin Reset Password Modal ---------------- */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <span>Admin Reset Password: {resetTargetUser.username}</span>
              </h3>
              <button
                onClick={() => setResetTargetUser(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="Set new password for staff"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="adminForce"
                  checked={adminForceChange}
                  onChange={(e) => setAdminForceChange(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="adminForce" className="text-slate-700 text-xs">
                  Require user to change password at next login
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  Apply New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {deleteConfirmUser && (
        <ConfirmModal
          isOpen={true}
          title={`Delete User Account "${deleteConfirmUser.username}"?`}
          message={`Are you sure you want to delete the user account for ${deleteConfirmUser.fullName} (${deleteConfirmUser.username})? This action cannot be undone.`}
          confirmText="Yes, Delete Account"
          cancelText="Cancel"
          isDanger={true}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteConfirmUser(null)}
        />
      )}
    </div>
  );
};
