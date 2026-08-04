import {
  registerUser,
  loginUser,
  refreshTokenService,
  logoutUser,
  getProjectManagersService
} from "./auth.service.js";

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
    res.status(401).json({ error: err.message });
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