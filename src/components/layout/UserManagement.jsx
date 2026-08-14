import { useEffect, useMemo, useState } from "react";
import {
  api,
  createUserAccount,
  getEmployees,
  getStaff,
  removeUser,
  resendCredentials,
} from "../../api";
import { useNotification } from "../NotificationContext";
import EmployeeDirectoryPicker from "./EmployeeDirectoryPicker";

const ROLE_FILTERS = [
  { value: "ALL", label: "All accounts" },
  { value: "PROJECTMANAGER", label: "Project Managers" },
  { value: "STAFF", label: "Staff" },
];

const ROLE_BADGE = {
  PROJECTMANAGER: {
    label: "Project Manager",
    className: "bg-[#EEF2FF] text-[#4338CA]",
  },
  STAFF: {
    label: "Staff",
    className: "bg-[#ECFDF3] text-[#027A48]",
  },
};

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phoneNumber: "",
  staffId: "",
  designation: "",
  password: "",
};

/**
 * User Management (Head of Operations only).
 *
 * Consumes the XNETT staff directory and lets the HOPS create PROJECTMANAGER
 * accounts with a default password. All accounts (PM + Staff) appear in one
 * filterable table with per-row actions (resend credentials / remove).
 */
function UserManagement() {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [projectManagers, setProjectManagers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [resendingId, setResendingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const loadProjectManagers = async () => {
    try {
      const { data } = await api.get("/auth/project-managers");
      setProjectManagers(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadStaff = async () => {
    try {
      const staffRes = await getStaff();
      setStaff(Array.isArray(staffRes?.data) ? staffRes.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const employeesRes = await getEmployees();
        if (mounted) {
          setEmployees(
            Array.isArray(employeesRes?.data) ? employeesRes.data : [],
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setEmployeesLoading(false);
      }
    };

    load();
    loadStaff();
    loadProjectManagers();
    return () => {
      mounted = false;
    };
  }, []);

  const combinedAccounts = useMemo(() => {
    const all = [
      ...projectManagers.map((user) => ({ ...user, role: "PROJECTMANAGER" })),
      ...staff.map((user) => ({ ...user, role: "STAFF" })),
    ];

    if (roleFilter === "PROJECTMANAGER") {
      return all.filter((user) => user.role === "PROJECTMANAGER");
    }

    if (roleFilter === "STAFF") {
      return all.filter((user) => user.role === "STAFF");
    }

    return all;
  }, [projectManagers, staff, roleFilter]);

  const registeredPmEmails = useMemo(
    () =>
      new Set(
        projectManagers.map((pm) =>
          String(pm.email || "").trim().toLowerCase(),
        ),
      ),
    [projectManagers],
  );

  const handleSelectEmployee = (employee) => {
    if (!employee) {
      setSelectedEmployee(null);
      return;
    }

    setSelectedEmployee(employee);

    setForm((prev) => ({
      ...prev,
      fullName: employee.fullName || "",
      email: employee.email || "",
      phoneNumber: employee.phoneNumber || "",
      staffId: employee.staffId || "",
      designation: employee.designation || "",
      password: "",
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Removal is a soft delete: the account is deactivated (no sign-in, removed
  // from every list) but historical references stay intact.
  const handleRemove = async (user) => {
    setOpenActionMenuId(null);

    const ok = window.confirm(
      `Remove ${user.fullName} (${user.email})?\n\nThey can no longer sign in and will be removed from all lists. This cannot be undone from the portal.`,
    );
    if (!ok) return;

    try {
      setRemovingId(user.id);
      const response = await removeUser(user.id);
      showNotification({
        type: "success",
        title: "Account removed",
        message: response?.message || "The account has been deactivated.",
      });
      await Promise.all([loadProjectManagers(), loadStaff()]);
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Failed to remove account",
        message: error.response?.data?.error || "Unable to remove the account.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  // Resending rotates the account to a freshly generated temporary password
  // (plaintext passwords are never stored), so it also invalidates whatever
  // password the user currently knows.
  const handleResend = async (user) => {
    setOpenActionMenuId(null);

    const ok = window.confirm(
      `Resend credentials to ${user.fullName} (${user.email})?\n\nA new temporary password will be generated and emailed — their current password will stop working and must be changed on first login.`,
    );
    if (!ok) return;

    try {
      setResendingId(user.id);
      const response = await resendCredentials(user.id);
      showNotification({
        type: "success",
        title: "Credentials resent",
        message:
          response?.message ||
          "A new temporary password was generated and emailed.",
      });
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Failed to resend credentials",
        message:
          error.response?.data?.error || "Unable to resend credentials.",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email) {
      showNotification({
        type: "error",
        title: "Missing details",
        message: "Full name and email are required.",
      });
      return;
    }

    if (registeredPmEmails.has(String(form.email).trim().toLowerCase())) {
      showNotification({
        type: "error",
        title: "Account already exists",
        message: "A project manager account already exists for this email.",
      });
      return;
    }

    if (!form.password || form.password.length < 6) {
      showNotification({
        type: "error",
        title: "Password required",
        message: "Set a default password of at least 6 characters.",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await createUserAccount({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "PROJECTMANAGER",
      });

      showNotification({
        type: "success",
        title: "Project Manager Created!",
        message: `${response?.data?.fullName || form.fullName} now has a PROJECTMANAGER account. Credentials were emailed with a first-login password change.`,
      });

      setForm(INITIAL_FORM);
      setSelectedEmployee(null);
      setCreateModalOpen(false);
      await loadProjectManagers();
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Failed to create account",
        message: error.response?.data?.error || "Unable to create account.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[13px]/[20px] text-ink-muted">
            <span>User Management</span>
          </div>
          <h1 className="text-[22px]/[30px] font-semibold tracking-tight text-ink">
            User Management
          </h1>
          <p className="mt-1 text-[14px]/[22px] text-ink-soft">
            Create Project Manager accounts from the staff directory and manage
            every portal account from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#1B3C4A] px-4 font-medium text-[14px]/[20px] text-[#FFFFFF] cursor-pointer hover:bg-[#16313D]"
        >
          <i className="fa-solid fa-user-plus text-[#FFFFFF]"></i>
          Add Project Manager
        </button>
      </div>

      <div className="rounded-xl border border-line bg-[#FFFFFF] shadow-popover">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 w-56 appearance-none rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] pl-3.5 pr-10 text-[13px]/[20px] font-medium text-ink outline-none cursor-pointer"
            >
              {ROLE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-muted"></i>
          </div>

          <p className="text-[13px]/[20px] text-ink-soft">
            {combinedAccounts.length}{" "}
            {combinedAccounts.length === 1 ? "account" : "accounts"}
            {roleFilter !== "ALL"
              ? ` · ${ROLE_FILTERS.find((f) => f.value === roleFilter)?.label.toLowerCase()}`
              : ""}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line-soft bg-line-soft/60">
                <th className="px-5 py-3 text-[11px]/[16px] font-semibold uppercase tracking-wider text-ink-muted">
                  Name
                </th>
                <th className="px-5 py-3 text-[11px]/[16px] font-semibold uppercase tracking-wider text-ink-muted">
                  Email
                </th>
                <th className="px-5 py-3 text-[11px]/[16px] font-semibold uppercase tracking-wider text-ink-muted">
                  Role
                </th>
                <th className="px-5 py-3 text-[11px]/[16px] font-semibold uppercase tracking-wider text-ink-muted">
                  Created
                </th>
                <th className="px-5 py-3 text-right text-[11px]/[16px] font-semibold uppercase tracking-wider text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {combinedAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-[13px]/[20px] text-ink-muted"
                  >
                    No{" "}
                    {roleFilter !== "ALL"
                      ? ROLE_FILTERS.find((f) => f.value === roleFilter)?.label.toLowerCase()
                      : "accounts"}{" "}
                    yet.
                  </td>
                </tr>
              ) : (
                combinedAccounts.map((user) => {
                  const badge = ROLE_BADGE[user.role] ?? {
                    label: user.role,
                    className: "bg-[#F2F4F7] text-[#475467]",
                  };
                  const initials = String(user.fullName || user.email || "?")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("");

                  const busy = resendingId === user.id || removingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-line-soft/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B3C4A] text-[12px]/[16px] font-semibold text-[#FFFFFF]">
                            {initials || "—"}
                          </span>
                          <span className="text-[13px]/[20px] font-medium text-ink">
                            {user.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px]/[20px] text-ink-soft">
                        {user.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px]/[16px] font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px]/[20px] text-ink-soft">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="relative px-5 py-3.5 text-right">
                        {busy ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px]/[18px] text-ink-muted">
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            {removingId === user.id ? "Removing..." : "Sending..."}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId((prev) =>
                                  prev === user.id ? null : user.id,
                                )
                              }
                              aria-label={`Actions for ${user.fullName}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted cursor-pointer hover:bg-line-soft"
                            >
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>

                            {openActionMenuId === user.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-4 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-[#FFFFFF] py-1.5 text-left shadow-popover">
                                  <button
                                    type="button"
                                    onClick={() => handleResend(user)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px]/[20px] font-medium text-ink cursor-pointer hover:bg-line-soft/60"
                                  >
                                    <i className="fa-solid fa-envelope-circle-check text-[#1B3C4A]"></i>
                                    Resend credentials
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemove(user)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px]/[20px] font-medium text-[#D20019] cursor-pointer hover:bg-[#FEF3F2]"
                                  >
                                    <i className="fa-solid fa-user-minus text-[#D20019]"></i>
                                    Remove account
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createModalOpen && (
        <CreatePmModal
          employees={employees}
          employeesLoading={employeesLoading}
          selectedEmployee={selectedEmployee}
          form={form}
          loading={loading}
          onSelectEmployee={handleSelectEmployee}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

function CreatePmModal({
  employees,
  employeesLoading,
  selectedEmployee,
  form,
  loading,
  onSelectEmployee,
  onChange,
  onSubmit,
  onClose,
}) {
  const inputClass =
    "w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909]";
  const labelClass = "font-medium text-[14px]/[20px] text-[#090909]";

  return (
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center bg-[#00000080] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto no-scrollbar rounded-2xl border border-line bg-[#FFFFFF] p-6 shadow-popover"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px]/[26px] font-semibold tracking-tight text-ink">
              Add Project Manager
            </h3>
            <p className="mt-1 text-[13px]/[20px] text-ink-soft">
              Pick an employee from the directory — their details are filled in
              automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted cursor-pointer hover:bg-line-soft"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Select employee from directory</label>
            <EmployeeDirectoryPicker
              employees={employees}
              loading={employeesLoading}
              value={selectedEmployee}
              onSelect={onSelectEmployee}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Full name <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              placeholder="e.g. Nkechi Ijoma"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Email <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="e.g. nkechi.ijoma@fasylng.com"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Phone number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChange}
                placeholder="e.g. 08012345678"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Staff ID</label>
              <input
                type="text"
                name="staffId"
                value={form.staffId}
                onChange={onChange}
                placeholder="e.g. FNG23156"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Designation / title</label>
              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={onChange}
                placeholder="e.g. Business Analyst"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Default password <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="text"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="e.g. Welcome123"
              className={inputClass}
            />
            <p className="font-normal text-[12px]/[18px] text-[#667085]">
              This password is emailed to the manager and must be changed on
              their first login.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] font-medium text-[14px]/[20px] text-ink cursor-pointer hover:bg-line-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 flex-1 rounded-lg bg-[#1B3C4A] font-medium text-[14px]/[20px] text-[#FFFFFF] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
            >
              <i className="fa-solid fa-user-plus text-[#FFFFFF]"></i>
              {loading ? "Creating..." : "Create Project Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
