import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("governance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    action TEXT,
    content_original TEXT,
    content_reframed TEXT,
    scenario_context TEXT,
    safety_score REAL,
    bias_detected BOOLEAN,
    spiral_risk REAL,
    triggers TEXT,
    power_dynamics TEXT,
    compliance_tags TEXT,
    reframing_logic TEXT,
    cultural_analysis TEXT,
    emotional_health_design TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/audit", (req, res) => {
    const { 
      user_id, 
      action, 
      content_original, 
      content_reframed,
      scenario_context,
      safety_score, 
      bias_detected, 
      spiral_risk, 
      triggers,
      power_dynamics,
      compliance_tags,
      reframing_logic,
      cultural_analysis,
      emotional_health_design
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        user_id, action, content_original, content_reframed, scenario_context,
        safety_score, bias_detected, spiral_risk, triggers, power_dynamics,
        compliance_tags, reframing_logic, cultural_analysis, emotional_health_design
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      user_id, 
      action, 
      content_original, 
      content_reframed,
      JSON.stringify(scenario_context),
      safety_score ?? 1, 
      bias_detected ? 1 : 0, 
      spiral_risk ?? 0, 
      JSON.stringify(triggers),
      JSON.stringify(power_dynamics),
      JSON.stringify(compliance_tags),
      reframing_logic,
      JSON.stringify(cultural_analysis),
      JSON.stringify(emotional_health_design)
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/audit", (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100").all();
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
