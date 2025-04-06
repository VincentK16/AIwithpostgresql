const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 3000;

// PostgreSQL configuration
const pool = new Pool({
    user: "", // Include the server name in the username
    host: "",
    database: "",
    password: "", // Replace with the actual password
    port: 5432, // Default PostgreSQL port
    ssl: {
        rejectUnauthorized: false // Required for Azure PostgreSQL
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint to handle form submissions
app.post("/submit", async (req, res) => {
    const { name, email } = req.body;
    try {
        const query = "INSERT INTO users (name, email) VALUES ($1, $2)";
        await pool.query(query, [name, email]);
        res.status(200).send("Data inserted successfully!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error inserting data");
    }
});

// Endpoint to fetch listings
app.get("/listings", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM listings");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching listings:", err);
        res.status(500).send("Error fetching listings");
    }
});

// Endpoint to fetch reviews
app.get("/reviews", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM reviews");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send("Error fetching reviews");
    }
});

// Endpoint to fetch users with PII redaction
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, azure_cognitive.recognize_pii_entities(email, 'en') AS email FROM users"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users with PII redaction:", err);
        res.status(500).send("Error fetching users");
    }
});

// Updated Endpoint to perform sentiment analysis
app.get("/sentiment/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch the comments for the given ID
        const result = await pool.query("SELECT comments FROM reviews WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).send("Review not found");
        }

        const comments = result.rows[0].comments;

        // Perform sentiment analysis (mocked for now)
        const sentimentResult = {
            id,
            comments,
            sentiment: "Positive", // Replace with actual sentiment analysis logic
            confidence: 0.95 // Mock confidence score
        };

        res.json(sentimentResult);
    } catch (err) {
        console.error("Error performing sentiment analysis:", err);
        res.status(500).send("Error performing sentiment analysis");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

