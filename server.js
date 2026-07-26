const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();

// Use Render's assigned port, or fall back to 5000 for local testing
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(__dirname));

let db;

// 1. Initialize SQLite Database
async function initDatabase() {
    db = await open({
        filename: path.join(__dirname, 'campcare.db'),
        driver: sqlite3.Database
    });

    // Create Doctors Table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            degree TEXT,
            regNo TEXT UNIQUE NOT NULL,
            phone TEXT,
            cabin TEXT,
            status TEXT DEFAULT 'Active'
        );
    `);

    // Insert initial demo doctors if table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM doctors");
    if (count.count === 0) {
        await db.run(`INSERT INTO doctors (id, name, degree, regNo, phone, cabin) VALUES 
            ('DOC-101', 'Dr. Sam Patel', 'MBBS, MD', 'MMC-89012', '9876543210', 'Cabin 02'),
            ('DOC-102', 'Dr. Rahul Sharma', 'MBBS, MS', 'MMC-45678', '9822110033', 'Cabin 01'),
            ('DOC-103', 'Dr. Anjali Deshmukh', 'BAMS, MD', 'MMC-78901', '9766554433', 'Cabin 03')
        `);
        console.log("Initial doctor records created in SQLite database!");
    }
}

// 2. Fetch all doctors from Database
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await db.all("SELECT * FROM doctors");
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch doctors" });
    }
});

// 3. Delete doctor from Database
app.delete('/api/doctors/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        await db.run("DELETE FROM doctors WHERE id = ?", [doctorId]);
        res.json({ message: "Doctor record deleted permanently from database." });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete doctor" });
    }
});

// Start Server & Connect Database
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});