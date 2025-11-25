// src/controllers/users.js
import User from "../models/User.js";

export async function listStudents(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const filter = { role: "student" }; // stored in the same User model
    if (q) {
      filter.$or = [
        { name:   { $regex: q, $options: "i" } },
        { email:  { $regex: q, $options: "i" } },
        { phone:  { $regex: q, $options: "i" } },
        { state:  { $regex: q, $options: "i" } },
        { class:  { $regex: q, $options: "i" } },
      ];
    }
    const students = await User
      .find(filter)
      .select("name email phone state class createdAt updatedAt"); // omit password
    res.json({ students });
  } catch (err) {
    console.error("listStudents error:", err);
    res.status(500).json({ message: "Failed to fetch students." });
  }
}
