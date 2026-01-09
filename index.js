const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("resumeBuilder");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// Routes

// Get all resumes
app.get("/api/resumes", async (req, res) => {
  try {
    const resumes = await db.collection("resumes").find({}).toArray();
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

// Get single resume by ID
app.get("/api/resumes/:id", async (req, res) => {
  try {
    const resume = await db.collection("resumes").findOne({ _id: new ObjectId(req.params.id) });
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});


// Create new resume
app.post("/api/resumes", async (req, res) => {
  try {
    const resumeData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection("resumes").insertOne(resumeData);
    res.status(201).json({ _id: result.insertedId, ...resumeData });
  } catch (error) {
    res.status(500).json({ error: "Failed to create resume" });
  }
});

// Update resume
app.put("/api/resumes/:id", async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };
    delete updateData._id; // Remove _id from update data
    
    const result = await db.collection("resumes").findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update resume" });
  }
});

// Delete resume
app.delete("/api/resumes/:id", async (req, res) => {
  try {
    const result = await db.collection("resumes").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Resume Builder API is running" });
});

// Start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
