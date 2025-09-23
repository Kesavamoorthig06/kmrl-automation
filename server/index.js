// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Twilio = require("twilio");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/**
 * Helper function to copy CSV file to public directory for frontend access
 */
function copyCSVToPublic() {
  try {
    const sourcePath = path.join(__dirname, "../python/data/combined_ml_analysis.csv");
    const destPath = path.join(__dirname, "../public/ml_analysis_data.csv");
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log("CSV file copied to public directory for frontend access");
      return true;
    } else {
      console.log("Source CSV file not found, will use existing public file");
      return false;
    }
  } catch (error) {
    console.error("Error copying CSV file:", error);
    return false;
  }
}

/**
 * Read crew config from env with safe defaults.
 * CREW_ROLES, CREW_PHONES, CREW_EMAILS are comma-separated lists.
 */
const CREW_ROLES = (process.env.CREW_ROLES || "loco-pilot,cleaning,morning-depot-rollout").split(",").map(s => s.trim());
const CREW_PHONES = (process.env.CREW_PHONES || "").split(",").map(s => s.trim()).filter(Boolean);
const CREW_EMAILS = (process.env.CREW_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);

/**
 * Get maintenance conflicts from Python script
 */
async function getMaintenanceConflicts() {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "../python/scripts/maintenance_api.py");
    const pythonProcess = spawn("python", [pythonScript], {
      cwd: path.join(__dirname, "..")
    });

    let output = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          console.error("Error parsing maintenance data:", parseError);
          reject(parseError);
        }
      } else {
        console.error("Python script error:", error);
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

// Build crew objects (phone/email might be missing — we still report attempts)
const crews = CREW_ROLES.map((role, i) => ({
  role,
  phone: CREW_PHONES[i] || null,
  email: CREW_EMAILS[i] || null
}));

/**
 * Helper: Create nodemailer transp
 * 
 * orter.
 * If SMTP config is provided in env we use that, otherwise we create an Ethereal test account for dev.
 */
async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465, // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Ethereal test account (no real email delivered, but preview URL generated)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

/**
 * Helper: Create Twilio client (if creds provided).
 */
function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return Twilio(sid, token);
}

/**
 * POST /api/deploy
 * Body: { trains: ["R-01","R-02"] }
 *
 * For each crew, try sending an SMS (if phone present) and an Email (if email present).
 * Return per-crew outcomes.
 */
app.post("/api/deploy", async (req, res) => {
  const { trains } = req.body;
  if (!Array.isArray(trains)) {
    return res.status(400).json({ success: false, message: "Payload must include trains: []" });
  }

  const twilioClient = getTwilioClient();
  const twilioFrom = process.env.TWILIO_FROM;

  let transporter;
  try {
    transporter = await getTransporter();
  } catch (err) {
    console.error("Failed creating transporter:", err);
    // continue — we can still try Twilio
  }

  const outcomes = [];

  // Compose message text
  const textBody = `KMRL Deployment: The following trains have been deployed: ${trains.join(", ")}`;

  // For each crew, send SMS & email (if contact provided)
  for (const crew of crews) {
    const result = { role: crew.role, phone: crew.phone, email: crew.email, sms: null, emailResult: null };

    // Send SMS via Twilio (if configured and crew has phone)
    if (twilioClient && twilioFrom && crew.phone) {
      try {
        const msg = await twilioClient.messages.create({
          body: `${crew.role.toUpperCase()} notification: ${textBody}`,
          from: twilioFrom,
          to: crew.phone
        });
        result.sms = { success: true, sid: msg.sid, to: msg.to };
      } catch (err) {
        console.error(`Twilio send error for ${crew.role} (${crew.phone}):`, err.message || err);
        result.sms = { success: false, error: err.message || String(err) };
      }
    } else if (!crew.phone) {
      result.sms = { success: false, error: "No phone number for this crew" };
    } else {
      result.sms = { success: false, error: "Twilio not configured (check env)" };
    }

    // Send Email via nodemailer (if transporter exists and crew has email)
    if (transporter && crew.email) {
      try {
        const info = await transporter.sendMail({
          from: '"KMRL Induction" <no-reply@kmrl.local>',
          to: crew.email,
          subject: `Deployment notification — ${trains.length} train(s)`,
          text: `Hello ${crew.role},\n\n${textBody}\n\nRegards,\nKMRL Induction`,
          html: `<p>Hello <strong>${crew.role}</strong>,</p><p>${textBody}</p>`
        });
        result.emailResult = { success: true, messageId: info.messageId, preview: nodemailer.getTestMessageUrl(info) || null };
      } catch (err) {
        console.error(`Email send error for ${crew.role} (${crew.email}):`, err.message || err);
        result.emailResult = { success: false, error: err.message || String(err) };
      }
    } else if (!crew.email) {
      result.emailResult = { success: false, error: "No email for this crew" };
    } else {
      result.emailResult = { success: false, error: "Email transporter not available" };
    }

    outcomes.push(result);
  }

  // Respond with details
  res.json({
    success: true,
    deployed: trains,
    timestamp: new Date().toISOString(),
    outcomes
  });
});

/**
 * POST /generate-chart
 * Generate charts for train metrics using Python script
 */
app.post("/generate-chart", (req, res) => {
  const { trainId, trainData } = req.body;
  
  if (!trainId || !trainData) {
    return res.status(400).json({ success: false, error: "Missing trainId or trainData" });
  }

  // Create realistic metrics based on train data and ID for consistency
  const trainIdNum = parseInt(trainId.replace('R-', ''));
  const seed = trainIdNum * 7; // Use train ID as seed for consistent values
  
  // Generate consistent but varied metrics for each train
  const mileageEfficiency = (70 + (seed % 25)).toFixed(1);
  const energyConsumption = (2.5 + (seed % 15) / 10).toFixed(1);
  const averageSpeed = (35 + (seed % 20)).toFixed(1);
  const accelerationRate = (0.7 + (seed % 8) / 10).toFixed(1);
  const serviceHours = (1500 + (seed % 2000)).toFixed(0);
  const passengerCapacity = 250 + (seed % 200);
  const loadFactor = (55 + (seed % 35)).toFixed(1);
  const safetyScore = 75 + (seed % 20);
  const maintenanceScore = 80 + (seed % 15);
  const operationalEfficiency = (65 + (seed % 30)).toFixed(1);
  const fuelEfficiency = (8.5 + (seed % 3)).toFixed(1);
  const brakeEfficiency = (85 + (seed % 10)).toFixed(1);
  
  const metrics = {
    mileageEfficiency: `${mileageEfficiency}%`,
    energyConsumption: `${energyConsumption} kWh/km`,
    averageSpeed: `${averageSpeed} km/h`,
    accelerationRate: `${accelerationRate} m/s²`,
    totalDistance: `${(trainData.mileage || 0).toLocaleString()} km`,
    serviceHours: `${serviceHours} hrs`,
    passengerCapacity: passengerCapacity,
    loadFactor: `${loadFactor}%`,
    safetyScore: `${safetyScore}/100`,
    maintenanceScore: `${maintenanceScore}/100`,
    operationalEfficiency: `${operationalEfficiency}%`,
    electricityEfficiency: `${fuelEfficiency} km/kWh`,
    brakeEfficiency: `${brakeEfficiency}%`
  };

  // Path to the Python script
  const pythonScriptPath = path.join(__dirname, "../python/scripts/generate_charts.py");
  
  // Spawn Python process
  const pythonProcess = spawn("python", [
    pythonScriptPath,
    "single",
    trainId,
    JSON.stringify(metrics)
  ]);

  let output = "";
  let errorOutput = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(output);
        if (result.success) {
          // Convert the chart path to a URL that the frontend can access
          const chartUrl = `http://localhost:${PORT}/charts/${path.basename(result.chart_path)}`;
          res.json({ success: true, chartPath: chartUrl, metrics: metrics });
        } else {
          res.status(500).json({ success: false, error: result.error || "Chart generation failed" });
        }
      } catch (parseError) {
        console.error("Error parsing Python output:", parseError);
        res.status(500).json({ success: false, error: "Failed to parse chart generation result" });
      }
    } else {
      console.error("Python script error:", errorOutput);
      res.status(500).json({ success: false, error: `Chart generation failed: ${errorOutput}` });
    }
  });

  pythonProcess.on("error", (error) => {
    console.error("Failed to start Python process:", error);
    res.status(500).json({ success: false, error: "Failed to start chart generation process" });
  });
});

/**
 * POST /api/rerun-simulation
 * Trigger ML script to run and generate fresh data
 */
app.post("/api/rerun-simulation", (req, res) => {
  console.log("Starting ML simulation rerun...");
  
  // Path to the ML script
  const mlScriptPath = path.join(__dirname, "../python/scripts/ml.py");
  const csvScriptPath = path.join(__dirname, "../python/scripts/create_combined_csv.py");
  
  // Spawn Python process to run ML script
  const pythonProcess = spawn("python", [mlScriptPath]);
  
  let output = "";
  let errorOutput = "";
  
  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
    console.log("ML Script output:", data.toString());
  });
  
  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
    console.error("ML Script error:", data.toString());
  });
  
  pythonProcess.on("close", (code) => {
    if (code === 0) {
      console.log("ML simulation completed successfully, now creating CSV...");
      
      // After ML script completes, run the CSV creation script
      const csvProcess = spawn("python", [csvScriptPath]);
      
      let csvOutput = "";
      let csvErrorOutput = "";
      
      csvProcess.stdout.on("data", (data) => {
        csvOutput += data.toString();
        console.log("CSV Script output:", data.toString());
      });
      
      csvProcess.stderr.on("data", (data) => {
        csvErrorOutput += data.toString();
        console.error("CSV Script error:", data.toString());
      });
      
      csvProcess.on("close", (csvCode) => {
        if (csvCode === 0) {
          console.log("CSV creation completed successfully");
          
          // Copy the generated CSV to public directory for frontend access
          const csvCopied = copyCSVToPublic();
          
          res.json({ 
            success: true, 
            message: "ML simulation and CSV creation completed successfully",
            mlOutput: output,
            csvOutput: csvOutput,
            csvCopied: csvCopied,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error("CSV creation failed with code:", csvCode);
          res.status(500).json({ 
            success: false, 
            error: `ML simulation completed but CSV creation failed with exit code ${csvCode}`,
            mlOutput: output,
            csvErrorOutput: csvErrorOutput,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      csvProcess.on("error", (csvError) => {
        console.error("Failed to start CSV creation process:", csvError);
        res.status(500).json({ 
          success: false, 
          error: "ML simulation completed but failed to start CSV creation process",
          mlOutput: output,
          details: csvError.message,
          timestamp: new Date().toISOString()
        });
      });
      
    } else {
      console.error("ML simulation failed with code:", code);
      res.status(500).json({ 
        success: false, 
        error: `ML simulation failed with exit code ${code}`,
        errorOutput: errorOutput,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  pythonProcess.on("error", (error) => {
    console.error("Failed to start ML simulation process:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to start ML simulation process",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  });
});

/**
 * Serve static files from charts directory
 */
app.use("/charts", express.static(path.join(__dirname, "../public/charts")));

/**
 * POST /api/copy-csv
 * Manually copy CSV file to public directory
 */
app.post("/api/copy-csv", (req, res) => {
  const csvCopied = copyCSVToPublic();
  res.json({ 
    success: csvCopied, 
    message: csvCopied ? "CSV file copied successfully" : "Failed to copy CSV file",
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve static files from pages directory (for CSV files)
 */
app.use(express.static(path.join(__dirname, "../public")));

/**
 * GET /api/maintenance/conflicts
 * Get maintenance conflicts from Python ML analysis
 */
app.get("/api/maintenance/conflicts", async (req, res) => {
  try {
    const maintenanceData = await getMaintenanceConflicts();
    res.json(maintenanceData);
  } catch (error) {
    console.error("Error fetching maintenance conflicts:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch maintenance data",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check
 */
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log("Crew config:", crews);
  
  // Copy CSV file to public directory on startup if available
  const csvCopied = copyCSVToPublic();
  if (csvCopied) {
    console.log("Initial CSV file copied to public directory");
  } else {
    console.log("No initial CSV file found, will copy after ML simulation");
  }
});
