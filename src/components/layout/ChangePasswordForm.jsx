import { useState } from "react";
import { changePassword } from "../../api";
import { useNotification } from "../NotificationContext";

/**
 * Shared change-password form used by the Settings page and the mandatory
 * first-login gate. Verifies the current password, then clears the
 * mustChangePassword flag on the backend.
 */
function ChangePasswordForm({
  onSuccess,
  title = "Change your password",
  subtitle = "Enter your current password and choose a new one.",
  submitLabel = "Change password",
  showCurrent = true,
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!showCurrent && !form.currentPassword) {
      // Unused branch guard — the current field is always rendered today.
    }

    if (showCurrent && !form.currentPassword) {
      showNotification({
        type: "error",
        title: "Current password required",
        message: "Please enter your current password.",
      });
      return;
    }

    if (!form.newPassword) {
      showNotification({
        type: "error",
        title: "New password required",
        message: "Please choose a new password.",
      });
      return;
    }

    if (form.newPassword.length < 6) {
      showNotification({
        type: "error",
        title: "Password too short",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showNotification({
        type: "error",
        title: "Passwords do not match",
        message: "The new password and its confirmation must match.",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      showNotification({
        type: "success",
        title: "Password changed!",
        message: response?.message || "Your password has been updated.",
      });

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Failed to change password",
        message: error.response?.data?.error || "Unable to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909]";
  const labelClass = "font-medium text-[14px]/[20px] text-[#090909]";

  return (
    <div className="w-full max-w-120 rounded-xl border border-line bg-[#FFFFFF] p-6 shadow-popover">
      <div className="mb-5">
        <h3 className="text-[18px]/[26px] font-semibold tracking-tight text-ink">
          {title}
        </h3>
        <p className="mt-1 text-[13px]/[20px] text-ink-soft">{subtitle}</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {showCurrent && (
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Current password <span className="text-[#B42318]">*</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Your current password"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            New password <span className="text-[#B42318]">*</span>
          </label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="At least 6 characters"
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Confirm new password <span className="text-[#B42318]">*</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat the new password"
            className={inputClass}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
        >
          <i className="fa-solid fa-key text-[#FFFFFF]"></i>
          {loading ? "Saving..." : submitLabel}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordForm;
