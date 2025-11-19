import jwt from "jsonwebtoken";

// Authenticate user from JWT token
export const authenticate = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Authorize user based on roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden. Required role: ${allowedRoles.join(" or ")}` 
      });
    }

    next();
  };
};
