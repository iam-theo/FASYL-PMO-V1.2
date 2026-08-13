import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bgSignIn from "../../assets/bgSignIn.jpg";
import bgSignInTwo from "../../assets/bgSignInTwo.jpg";
import { resetPassword } from "../../api";
import { useNotification } from "../NotificationContext";

/**
 * Landing page for the emailed password reset link. The token arrives in the
 * query string; a successful reset returns the user to the sign-in page.
 */
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showNotification({
        type: "error",
        title: "Invalid reset link",
        message: "This reset link is missing its token. Please request a new one.",
      });
      return;
    }

    if (!form.newPassword || form.newPassword.length < 6) {
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
      const response = await resetPassword(token, form.newPassword);

      showNotification({
        type: "success",
        title: "Password reset!",
        message:
          response?.message || "Your password has been reset. Sign in with your new password.",
      });

      navigate("/");
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Failed to reset password",
        message: error.response?.data?.error || "The link is invalid or has expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex max-h-screen min-h-screen">
      <div className="relative hidden w-238 lg:block">
        <img src={bgSignIn} alt="" className="absolute h-full w-full object-cover" />
        <div className="bg-linear-to-bl from-[#1B3C4A] to-[#1A5C78] absolute top-0 flex h-full w-full flex-col items-start justify-center px-20 text-[#FFFFFF] opacity-80">
          <h1 className="mb-3.5 text-[48px]/[100%] font-semibold tracking-[-2%]">
            Welcome to FASYL PM Portal
          </h1>
          <p className="font-normal text-[20px]/[30px]">
            Login to the portal to manage your projects
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-start justify-center">
        <img
          src={bgSignInTwo}
          alt=""
          className="absolute z-[-1000] h-full w-full object-cover opacity-30"
        />
        <div className="flex flex-col items-start justify-center gap-4 px-8 sm:px-16">
          <h3 className="text-[#101828] text-[24px]/[100%] tracking-[0%] font-semibold">
            Reset your password
          </h3>
          <p className="text-[#141414] text-[16px]/[24px] tracking-[0%] font-normal">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            <div className="flex flex-col">
              <label htmlFor="newPassword" className="font-medium text-[14px]/[20px] text-[#090909] mb-1.5">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909] sm:w-90"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="confirmPassword" className="font-medium text-[14px]/[20px] text-[#090909] mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat the new password"
                autoComplete="new-password"
                className="w-full h-11 rounded-lg bg-[#FFFFFF] border border-[#D0D5DD] shadow-[#1018280D] shadow-[2px] py-2.5 px-3.5 outline-none text-[#090909] sm:w-90"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-[#FFFFFF] font-medium bg-[#1B3C4A] shadow-[#1018280D] shadow-[2px] py-2.5 px-4.5 mt-2 cursor-pointer disabled:opacity-80 sm:w-90"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full h-11 rounded-lg border border-[#D0D5DD] bg-[#FFFFFF] font-medium text-[14px]/[20px] text-[#1B3C4A] cursor-pointer sm:w-90"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
