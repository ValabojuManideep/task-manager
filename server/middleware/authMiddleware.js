import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Authenticate user from JWT token
export const authenticate = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    console.log("✅ Token verified. User:", decoded);
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Authorize user based on roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error("❌ No user in request");
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    console.log("🔍 Checking authorization. User role:", req.user.role, "Allowed roles:", allowedRoles);
    
    if (!allowedRoles.includes(req.user.role)) {
      console.error("❌ User role not authorized. Required:", allowedRoles);
      return res.status(403).json({ 
        error: `Forbidden. Required role: ${allowedRoles.join(" or ")}` 
      });
    }

    console.log("✅ Authorization granted");
    next();
  };
};
