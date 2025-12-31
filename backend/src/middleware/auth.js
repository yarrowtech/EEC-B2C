import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = { id: user._id, name: user.name, email: user.email, class: user.class, role: user.role, board: user.board };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}


// ✅ NEW optional middleware
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export function requireAdmin(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only admin can perform this action" });
    }
    next();
}

export function requireAdminOrTeacher(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "teacher") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 THIS LINE IS REQUIRED
    req.user = await User.findById(decoded.id).select("_id points role");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};