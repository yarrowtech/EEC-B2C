import CareerApplication from "../models/CareerApplication.js";
import sendMail from "../utils/sendMail.js";

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

    const nameSafe = String(name || "").trim() || "Candidate";
    const jobSafe = String(jobPosition || "").trim();
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ca8a04,#fde047);padding:22px 20px;text-align:center">
          <h2 style="margin:0;color:#ffffff;font-size:22px;">Application Submitted Successfully</h2>
        </div>
        <div style="padding:20px">
          <p style="margin:0 0 10px;color:#374151;font-size:15px;">Hi <strong>${nameSafe}</strong>,</p>
          <p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
            Thank you for applying to <strong>${jobSafe}</strong> at Electronic Educare (EEC).
            Your application has been submitted successfully.
          </p>
          <p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
            Our team will review your profile and contact you if your profile matches our requirements.
          </p>
          <p style="margin:18px 0 0;color:#6b7280;font-size:12px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    `;

    sendMail({
      to: String(email).trim().toLowerCase(),
      subject: `EEC Careers: Application Received for ${jobSafe}`,
      html,
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

    return res.json({ message: "Status updated", application: item });
  } catch (error) {
    console.error("updateCareerApplicationStatus error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};
