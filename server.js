require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const app      = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB terhubung!"))
  .catch((e) => console.log("Gagal koneksi:", e));

// Schema: Role Player
const playerSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  role:      { type: String, default: "None" },
  updatedAt: { type: Date, default: Date.now },
});
const Player = mongoose.model("Player", playerSchema);

// Schema: Kode Room
const roomSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true },
  roomType:   { type: String, required: true },
  hostUserId: { type: String, required: true },
  jobId:      { type: String, default: "" },
  placeId:    { type: String, required: true },
  createdAt:  { type: Date, default: Date.now, expires: 7200 },
});
const Room = mongoose.model("Room", roomSchema);

// Middleware cek secret key
function auth(req, res) {
  if (req.headers["x-api-key"] !== process.env.SECRET_KEY) {
    res.status(403).json({ error: "Akses ditolak!" });
    return false;
  }
  return true;
}

// ==============================
// ROLE ENDPOINTS
// ==============================

// GET /getrole?userId=xxx
app.get("/getrole", async (req, res) => {
  if (!auth(req, res)) return;
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId wajib!" });
  try {
    const p = await Player.findOne({ userId });
    res.json({ userId, role: p ? p.role : "None" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /setrole { userId, role }
app.post("/setrole", async (req, res) => {
  if (!auth(req, res)) return;
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: "userId & role wajib!" });
  try {
    await Player.findOneAndUpdate(
      { userId },
      { role, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ success: true, userId, role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==============================
// ROOM ENDPOINTS
// ==============================

// GET /getroom?code=xxx
app.get("/getroom", async (req, res) => {
  if (!auth(req, res)) return;
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "code wajib!" });
  try {
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: "Room tidak ditemukan!" });
    res.json({
      success:    true,
      code:       room.code,
      roomType:   room.roomType,
      hostUserId: room.hostUserId,
      jobId:      room.jobId,
      placeId:    room.placeId,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /createroom { code, roomType, hostUserId, jobId, placeId }
app.post("/createroom", async (req, res) => {
  if (!auth(req, res)) return;
  const { code, roomType, hostUserId, jobId, placeId } = req.body;
  if (!code || !roomType || !hostUserId || !placeId)
    return res.status(400).json({ error: "Field tidak lengkap!" });
  try {
    await Room.findOneAndUpdate(
      { code },
      { code, roomType, hostUserId, jobId: jobId || "", placeId, createdAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, code, roomType });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /deleteroom { code }
app.delete("/deleteroom", async (req, res) => {
  if (!auth(req, res)) return;
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "code wajib!" });
  try {
    await Room.deleteOne({ code });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Health check
app.get("/", (_, res) => res.json({ status: "Server jalan OK" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server jalan di port " + PORT));
