export default function serviceTokenAuth(req, res, next) {
  const token = req.headers["x-service-token"];
  const clientSource = String(req.headers["x-client-source"] || "").trim();
  const expectedToken =
    process.env.SUPER_ADMIN_PORTAL_SERVICE_TOKEN ||
    process.env.TEACHER_CONTENT_SERVICE_TOKEN ||
    process.env.EDIFYEIGHT_API_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({
      success: false,
      error: "Internal service token is not configured",
    });
  }

  if (!clientSource) {
    return res.status(401).json({
      success: false,
      error: "Client source required",
    });
  }

  if (clientSource !== "super-admin-portal") {
    return res.status(403).json({
      success: false,
      error: "Invalid client source",
    });
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Service token required",
    });
  }

  if (token !== expectedToken) {
    return res.status(403).json({
      success: false,
      error: "Invalid service token",
    });
  }

  console.log(
    `[Internal Service API] ${req.method} ${req.originalUrl} - Source: ${clientSource}`
  );
  next();
}
