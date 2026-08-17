import {
  registerUser,
  loginUser,
  refreshTokenService,
  logoutUser,
  getProjectManagersService,
  getStaffService,
  checkAccountByEmailService,
  signupUser,
  getXnetEmployeesService,
  createUserAccountService,
  changePasswordService,
  forgotPasswordService,
  resetPasswordService,
  resendCredentialsService,
  removeUserService,
} from "./auth.service.js";
import {
  notifyAccountCreated,
  notifyPasswordReset,
} from "../notifications/notification.service.js";

/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      message: "User created",
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   SIGNUP (TEST ACCOUNTS)
========================= */
export const signup = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await signupUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "Account created successfully",
      user,
      accessToken,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =========================
   LOGIN (SETS HTTP-ONLY COOKIE)
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const { user, accessToken, refreshToken } =
      await loginUser(email, password);

    // 🔐 HTTP-ONLY COOKIE (secure refresh token storage)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      user,
      accessToken,
    });
  } catch (err) {
    // Locked accounts surface as 429; everything else stays 401 so the
    // response shape never leaks which failure mode occurred.
    res.status(err.status || 401).json({ error: err.message });
  }
};

/* =========================
   REFRESH TOKEN (AUTO ACCESS TOKEN RENEWAL)
========================= */
export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        error: "Refresh token missing",
      });
    }

    const result = await refreshTokenService(token);

    res.json({
      accessToken: result.accessToken,
    });
  } catch {
    res.status(401).json({
      error: "Invalid or expired refresh token",
    });
  }
};

/* =========================
   LOGOUT (REVOKE TOKEN + CLEAR COOKIE)
========================= */
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await logoutUser(token);
    }

    res.clearCookie("refreshToken");

    res.json({
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PROJECT MANAGER

export const getProjectManagers = async (req, res) => {
  try {
    const users = await getProjectManagersService();

    return res.status(200).json({
      success: true,
      message: "Project managers retrieved successfully",
      data: users,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project managers",
      error: err.message,
    });
  }
};

// GET STAFF USERS

export const getStaff = async (req, res) => {
  try {
    const users = await getStaffService();

    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully",
      data: users,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch staff",
      error: err.message,
    });
  }
};

// CHECK ACCOUNT EXISTENCE (any role, used by the Add Resource flow)

export const checkAccount = async (req, res) => {
  try {
    const email = req.query.email || "";
    const result = await checkAccountByEmailService(email);

    return res.status(200).json({
      success: true,
      message: result.exists ? "Account exists" : "No account found",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to check account",
      error: err.message,
    });
  }
};

// GET XNETT EMPLOYEE DIRECTORY

export const getXnetEmployees = async (req, res) => {
  try {
    const employees = await getXnetEmployeesService();

    return res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: "Failed to fetch employee directory",
      error: err.message,
    });
  }
};

/* =========================
   CREATE USER ACCOUNT (PM/STAFF)
========================= */
export const createUserAccount = async (req, res) => {
  try {
    const user = await createUserAccountService(req.body);

    notifyAccountCreated({
      user,
      temporaryPassword: req.body.password,
      createdBy: req.user,
    }).catch((error) => {
      console.error("Account creation notification failed:", error.message);
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to create account",
      error: err.message,
    });
  }
};

/* =========================
   CHANGE PASSWORD (LOGGED IN)
========================= */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await changePasswordService(
      req.user.id,
      currentPassword,
      newPassword,
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to change password",
      error: err.message,
    });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const { sent, token, user } = await forgotPasswordService(email);

    // Always report success so account existence is never leaked.
    if (sent && token && user?.email) {
      notifyPasswordReset({
        user,
        resetUrl: `${process.env.APP_BASE_URL || "http://localhost:5173"}/reset-password?token=${token}`,
      }).catch((error) => {
        console.error("Password reset email failed:", error.message);
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
      error: err.message,
    });
  }
};

/* =========================
   RESET PASSWORD (VIA EMAILED LINK)
========================= */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await resetPasswordService(token, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to reset password",
      error: err.message,
    });
  }
};

/* =========================
   RESEND CREDENTIALS
========================= */
/* =========================
   REMOVE USER (SOFT DELETE)
========================= */
export const removeUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await removeUserService(userId);

    return res.status(200).json({
      success: true,
      message: `${user.fullName} (${user.email}) has been removed from the portal`,
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to remove account",
      error: err.message,
    });
  }
};

export const resendCredentials = async (req, res) => {
  try {
    const { userId } = req.params;

    const { user, temporaryPassword } = await resendCredentialsService(userId);

    notifyAccountCreated({
      user,
      temporaryPassword,
      createdBy: req.user,
    }).catch((error) => {
      console.error("Credential resend notification failed:", error.message);
    });

    return res.status(200).json({
      success: true,
      message:
        "Credentials resent. A new temporary password was generated and emailed — it must be changed on first login.",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Failed to resend credentials",
      error: err.message,
    });
  }
};