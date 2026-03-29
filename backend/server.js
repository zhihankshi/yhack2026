const express = require("express");
const cors = require("cors");
require("dotenv").config();

const agentRoutes = require("./routes/agentRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "backend healthy" });
});

app.use("/api", agentRoutes);
app.use("/api", integrationRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
