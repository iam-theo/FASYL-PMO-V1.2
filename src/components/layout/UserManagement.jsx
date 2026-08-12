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

/**
 * User Management (Head of Operations only).
 *
 * Consumes the XNETT staff directory, auto-fills the fields when an employee
 * is picked, and creates a PROJECTMANAGER account with a default password.
 * The new manager is emailed the credentials and must change the password on
 * first login.
 */
function UserManagement() {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [projectManagers, setProjectManagers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [resendingId, setResendingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    staffId: "",
    designation: "",
    password: "",
  });
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

    const loadStaff = async () => {
      try {
        const staffRes = await getStaff();
        if (mounted) {
          setStaff(Array.isArray(staffRes?.data) ? staffRes.data : []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    load();
    loadStaff();
    loadProjectManagers();
    return () => {
      mounted = false;
    };
  }, []);

  const registeredPmEmails = useMemo(
    () =>
      new Set(
        projectManagers.map((pm) => String(pm.email || "").trim().toLowerCase()),
      ),
    [projectManagers],
  );

  const handleSelectEmployee = (recordId) => {
    const employee = employees.find(
      (e) => String(e.recordId || e.id) === String(recordId),
    );
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
    const ok = window.confirm(
      `Remove ${user.fullName} (${user.email})?\n\nThe account will be deactivated immediately — they can no longer sign in and will be removed from all lists. This cannot be undone from the portal.`,
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
      await loadProjectManagers();
      const staffRes = await getStaff();
      setStaff(Array.isArray(staffRes?.data) ? staffRes.data : []);
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

      setForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        staffId: "",
        designation: "",
        password: "",
      });
      setSelectedEmployee(null);
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

  const inputClass =
    "w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909]";
  const labelClass = "font-medium text-[14px]/[20px] text-[#090909]";

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-1.5 text-[13px]/[20px] text-ink-muted">
          <span>User Management</span>
        </div>
        <h1 className="text-[22px]/[30px] font-semibold tracking-tight text-ink">
          User Management
        </h1>
        <p className="mt-1 text-[14px]/[22px] text-ink-soft">
          Create Project Manager accounts from the staff directory. The default
          password is emailed to the manager and must be changed on first
          login.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ============ CREATE PM ============ */}
        <div className="rounded-xl border border-line bg-[#FFFFFF] p-6 shadow-popover">
          <h3 className="text-[18px]/[26px] font-semibold tracking-tight text-ink">
            Create Project Manager
          </h3>
          <p className="mb-5 mt-1 text-[13px]/[20px] text-ink-soft">
            Pick an employee from the directory — their details are filled in
            automatically.
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Select employee from directory</label>
              <select
                value={
                  selectedEmployee
                    ? String(selectedEmployee.recordId || selectedEmployee.id)
                    : ""
                }
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className={inputClass}
                disabled={employeesLoading}
              >
                <option value="">
                  {employeesLoading
                    ? "Loading staff directory..."
                    : employees.length === 0
                      ? "Directory unavailable — enter details manually"
                      : "Select an employee"}
                </option>
                {employees.map((employee) => (
                  <option
                    key={employee.recordId || employee.id}
                    value={employee.recordId || employee.id}
                  >
                    {employee.fullName} — {employee.email}
                    {employee.designation ? ` (${employee.designation})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>
                Full name <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                onChange={handleChange}
                placeholder="e.g. Welcome123"
                className={inputClass}
              />
              <p className="font-normal text-[12px]/[18px] text-[#667085]">
                This password is emailed to the manager and must be changed on
                their first login.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
            >
              <i className="fa-solid fa-user-plus text-[#FFFFFF]"></i>
              {loading ? "Creating..." : "Create Project Manager"}
            </button>
          </form>
        </div>

        {/* ============ EXISTING ACCOUNTS ============ */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-line bg-[#FFFFFF] p-6 shadow-popover">
            <h3 className="text-[18px]/[26px] font-semibold tracking-tight text-ink">
              Project Managers
            </h3>
            <p className="mb-4 mt-1 text-[13px]/[20px] text-ink-soft">
              Accounts that can be assigned to projects.
            </p>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[520px] text-left">
                <thead className="bg-line-soft/60">
                  <tr>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Name
                    </th>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Email
                    </th>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Created
                    </th>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {projectManagers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-[13px]/[20px] text-ink-muted"
                      >
                        No project managers yet.
                      </td>
                    </tr>
                  ) : (
                    projectManagers.map((pm) => (
                      <tr key={pm.id} className="hover:bg-line-soft/40">
                        <td className="px-3 py-2.5 text-[13px]/[20px] font-medium text-ink">
                          {pm.fullName}
                        </td>
                        <td className="px-3 py-2.5 text-[13px]/[20px] text-ink-soft">
                          {pm.email}
                        </td>
                        <td className="px-3 py-2.5 text-[13px]/[20px] text-ink-soft">
                          {pm.createdAt
                            ? new Date(pm.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={resendingId === pm.id}
                              onClick={() => handleResend(pm)}
                              className="rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] px-3 py-1.5 text-[12px]/[18px] font-medium text-[#1B3C4A] cursor-pointer hover:bg-line-soft disabled:opacity-60"
                            >
                              {resendingId === pm.id ? "Sending..." : "Resend credentials"}
                            </button>
                            <button
                              type="button"
                              disabled={removingId === pm.id}
                              onClick={() => handleRemove(pm)}
                              className="rounded-lg border border-[#FECDCA] bg-[#FFFBFB] px-3 py-1.5 text-[12px]/[18px] font-medium text-[#D20019] cursor-pointer hover:bg-[#FEE4E2] disabled:opacity-60"
                            >
                              {removingId === pm.id ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-[#FFFFFF] p-6 shadow-popover">
            <h3 className="text-[18px]/[26px] font-semibold tracking-tight text-ink">
              Staff Accounts
            </h3>
            <p className="mb-4 mt-1 text-[13px]/[20px] text-ink-soft">
              Staff created through the Add Resource flow.
            </p>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[520px] text-left">
                <thead className="bg-line-soft/60">
                  <tr>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Name
                    </th>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Email
                    </th>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Created
                    </th>
                    <th className="px-3 py-2.5 text-[12px]/[18px] font-semibold uppercase tracking-wide text-ink-muted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {staff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-[13px]/[20px] text-ink-muted"
                      >
                        No staff accounts yet.
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => (
                      <tr key={member.id} className="hover:bg-line-soft/40">
                        <td className="px-3 py-2.5 text-[13px]/[20px] font-medium text-ink">
                          {member.fullName}
                        </td>
                        <td className="px-3 py-2.5 text-[13px]/[20px] text-ink-soft">
                          {member.email}
                        </td>
                        <td className="px-3 py-2.5 text-[13px]/[20px] text-ink-soft">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={resendingId === member.id}
                              onClick={() => handleResend(member)}
                              className="rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] px-3 py-1.5 text-[12px]/[18px] font-medium text-[#1B3C4A] cursor-pointer hover:bg-line-soft disabled:opacity-60"
                            >
                              {resendingId === member.id ? "Sending..." : "Resend credentials"}
                            </button>
                            <button
                              type="button"
                              disabled={removingId === member.id}
                              onClick={() => handleRemove(member)}
                              className="rounded-lg border border-[#FECDCA] bg-[#FFFBFB] px-3 py-1.5 text-[12px]/[18px] font-medium text-[#D20019] cursor-pointer hover:bg-[#FEE4E2] disabled:opacity-60"
                            >
                              {removingId === member.id ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
