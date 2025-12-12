// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
// keep express.json() for any JSON endpoints you might add
app.use(express.json());

// Directories
const ROOT = __dirname;
const CSV_DIR = path.join(ROOT, "csv");
const UPLOADS_DIR = path.join(ROOT, "uploads");

if (!fs.existsSync(CSV_DIR)) fs.mkdirSync(CSV_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer setup for single screenshot upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  },
});
const upload = multer({ storage });

// -------- Event schemas: headers + required keys ---------
// Make sure these headers are exactly the ones you want in CSV (order matters)
const EVENT_SCHEMAS = {
  "it-quiz": {
    file: "it_quiz.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "USN/ID 1",
      "Name 2",
      "USN/ID 2",
      "College",
      "Phone",
      "Email",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "usn1",
      "name2",
      "usn2",
      "college",
      "phone",
      "email",
    ],
  },

  "garuda-anveshana": {
    file: "garuda_anveshana.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "Name 2",
      "Name 3",
      "Name 4",
      "USN/ID",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "name2",
      "name3",
      "name4",
      "usn",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },

  "web-kala-vinyasa": {
    file: "web_kala_vinyasa.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "Name 2",
      "USN/ID",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "name2",
      "usn",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },

  vedix: {
    file: "vedix.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "USN/ID",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "usn",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },

  drishti: {
    file: "drishti.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "USN/ID",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "usn",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },

  "raja-neeti": {
    file: "raja_neeti.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "USN/ID",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "usn",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },

  chakravyuha: {
    file: "chakravyuha.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "USN/ID 1",
      "Name 2",
      "USN/ID 2",
      "Name 3",
      "USN/ID 3",
      "Name 4",
      "USN/ID 4",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "usn1",
      "name2",
      "usn2",
      "name3",
      "usn3",
      "name4",
      "usn4",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },

  "dhwani-yuddha": {
    file: "dhwani_yuddha.csv",
    headers: [
      "Event Name",
      "Team Name",
      "Name 1",
      "USN/ID",
      "College",
      "Phone",
      "Email",
      "UTR ID",
      "UTR Number",
      "Screenshot",
      "Timestamp",
    ],
    required: [
      "teamName",
      "name1",
      "usn",
      "college",
      "phone",
      "email",
      "utrId",
      "utrNumber",
    ],
  },
};

// -------- helpers --------

// CSV helper: escape and quote a field
function csvSafe(val) {
  if (val === undefined || val === null) return "";
  const s = String(val);
  // double quotes inside values must be escaped by doubling them
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

// Append a row to CSV (creates file with headers if missing)
function appendRowToCSV(filename, headers, payload) {
  const filePath = path.join(CSV_DIR, filename);

  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const findValue = (header) => {
    const nh = normalize(header);

    // -------------------------
    // SPECIAL FIX FOR USN FIELD
    // -------------------------
    if (nh === "usnid" || nh === "usn") {
      return payload.usn || payload.usn1 || payload["USN"] || "";
    }
    if (nh === "usnid1") return payload.usn1 || payload.usn || "";
    if (nh === "usnid2") return payload.usn2 || "";
    if (nh === "usnid3") return payload.usn3 || "";
    if (nh === "usnid4") return payload.usn4 || "";

    // event name
    if (nh === "eventname")
      return payload.eventName || payload["Event Name"] || "";

    // screenshot
    if (nh === "screenshot") return payload.screenshot || "";

    // generic matching for all other fields
    const matchKey = Object.keys(payload).find((pk) => normalize(pk) === nh);

    return matchKey ? payload[matchKey] : "";
  };

  // build row in correct order
  const row = headers.map((h) => findValue(h));

  // CSV safe
  const csvLine =
    row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";

  // write file or append
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers.join(",") + "\n" + csvLine);
  } else {
    fs.appendFileSync(filePath, csvLine);
  }

  console.log("CSV updated:", filePath);
  return filePath;
}

// -------- email helper --------
async function sendConfirmationEmail(to, eventName, payload) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS not set - skipping email send");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
    <div>
      <h2>Registration Confirmed: ${eventName}</h2>
      <p>Hello ${payload.name1 || payload.teamName || ""},</p>
      <p>Your registration for <b>${eventName}</b> is successful.</p>
      <p><b>Team / Participant:</b> ${
        payload.teamName || payload.name1 || ""
      }</p>
      <p><b>UTR ID:</b> ${payload.utrId || "N/A"}</p>
      <p><b>Screenshot:</b> ${payload.screenshot || "N/A"}</p>
      <p>Keep this email for your records.</p>
      <br/><p>— Zerone Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Zerone Events" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Zerone Registration — ${eventName}`,
    html,
  });
}

// -------- validate payload against schema (required fields) --------
function validatePayload(eventKey, payload) {
  const schema = EVENT_SCHEMAS[eventKey];
  if (!schema) return { ok: false, message: "Unknown event key" };

  const missing = [];
  for (const k of schema.required) {
    // payload may have camelCase keys (teamName) or header keys ("Team Name")
    const found = Object.keys(payload).some(
      (pk) =>
        pk.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        k.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (!found) missing.push(k);
  }
  return { ok: missing.length === 0, missing, schema };
}

// -------- register route (multipart/form-data) --------
app.post("/register", upload.single("screenshot"), async (req, res) => {
  try {
    // payload must be passed as JSON string in `payload` form field
    let payload = {};
    if (req.body.payload) {
      try {
        payload = JSON.parse(req.body.payload);
      } catch (e) {
        payload = req.body.payload; // fallback
      }
    }

    const eventKey = req.body.eventKey || req.body.eventId;
    const eventName = req.body.eventName || "";

    if (!eventKey || !payload) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing eventKey or payload" });
    }

    // attach screenshot filename and eventName into payload (both header-style and camelCase)
    const screenshotFilename = req.file ? req.file.filename : "";
    payload.screenshot = screenshotFilename;
    payload["Screenshot"] = screenshotFilename;

    payload.eventName = eventName;
    payload["Event Name"] = eventName;

    // debug logging (safe)
    console.log("RECEIVED PAYLOAD:", payload);

    // validate
    const validation = validatePayload(eventKey, payload);
    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        message: "Missing fields",
        missing: validation.missing,
      });
    }

    const schema = validation.schema;

    // append to CSV
    const csvPath = appendRowToCSV(schema.file, schema.headers, payload);
    console.log("Appended to CSV:", csvPath);

    // send email (non-blocking)
    if (payload.email) {
      sendConfirmationEmail(
        payload.email,
        eventName || eventKey,
        payload
      ).catch((err) => console.error("Email error:", err));
    }

    return res.json({ ok: true, message: "Registered", file: csvPath });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// -------- download CSV for admin --------
app.get("/download/:eventKey", (req, res) => {
  const { eventKey } = req.params;
  const schema = EVENT_SCHEMAS[eventKey];
  if (!schema) return res.status(404).send("Unknown event");
  const filePath = path.join(CSV_DIR, schema.file);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
  res.download(filePath);
});

// optional: list events (keys + file path) for admin
app.get("/events", (req, res) => {
  const list = Object.keys(EVENT_SCHEMAS).map((k) => ({
    eventKey: k,
    file: EVENT_SCHEMAS[k].file,
    headers: EVENT_SCHEMAS[k].headers,
  }));
  res.json(list);
});

// -------- health check for Render --------
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// -------- start server --------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});





