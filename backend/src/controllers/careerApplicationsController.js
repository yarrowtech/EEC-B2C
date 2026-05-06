import CareerApplication from "../models/CareerApplication.js";
import {
  sendCareerApplicationReceivedEmail,
  sendCareerApplicationStatusEmail,
} from "../utils/sendMail.js";

export const createCareerApplication = async (req, res) => {
  try {
    const { name, email, phone, jobPosition, message } = req.body;

    if (!name || !email || !jobPosition) {
      return res
        .status(400)
        .json({ message: "Name, email and job position are required" });
    }

    if (!req.file?.path) {
      return res.status(400).json({ message: "CV upload is required" });
    }

    const application = await CareerApplication.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      jobPosition: String(jobPosition).trim(),
      message: String(message || "").trim(),
      cvUrl: req.file.path,
      cvPublicId: req.file.filename || "",
    });

    sendCareerApplicationReceivedEmail({
      to: String(email).trim().toLowerCase(),
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      jobPosition: String(jobPosition).trim(),
    }).catch((mailErr) => {
      console.error("Career application confirmation email failed:", mailErr?.message || mailErr);
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("createCareerApplication error:", error);
    return res.status(500).json({ message: "Failed to submit application" });
  }
};

export const listCareerApplications = async (req, res) => {
  try {
    const { status, q, limit = 50, page = 1 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (q) {
      const regex = new RegExp(String(q).trim(), "i");
      query.$or = [{ name: regex }, { email: regex }, { jobPosition: regex }];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      CareerApplication.find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      CareerApplication.countDocuments(query),
    ]);

    return res.json({
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    });
  } catch (error) {
    console.error("listCareerApplications error:", error);
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const updateCareerApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const allowed = ["new", "reviewed", "shortlisted", "rejected", "hired"];
    if (!allowed.includes(String(status || "").trim())) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const item = await CareerApplication.findByIdAndUpdate(
      id,
      { status: String(status).trim() },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Application not found" });
    }

    const normalizedStatus = String(status).trim().toLowerCase();
    if (normalizedStatus === "shortlisted" || normalizedStatus === "rejected") {
      sendCareerApplicationStatusEmail({
        to: String(item.email || "").trim().toLowerCase(),
        name: String(item.name || "").trim(),
        jobPosition: String(item.jobPosition || "").trim(),
        status: normalizedStatus,
      }).catch((mailErr) => {
        console.error("Career application status email failed:", mailErr?.message || mailErr);
      });
    }

    return res.json({ message: "Status updated", application: item });
  } catch (error) {
    console.error("updateCareerApplicationStatus error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};
