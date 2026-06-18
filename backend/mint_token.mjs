import "dotenv/config";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const uri = process.env.MONGO_URI;
await mongoose.connect(uri);
const usersCol = mongoose.connection.collection("users");
const u = await usersCol.findOne({ email: "demo@demo.com" });
const payload = { sub: u._id, email: u.email, name: u.name, role: u.role, board: u.board, state: u.state };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
console.log(JSON.stringify({ token, user: u }));
await mongoose.disconnect();
