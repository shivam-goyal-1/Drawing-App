const mongoose = require("mongoose");

const connectionString = process.env.MONGO_URI;

const connectToDatabase = async () => {
    if (!connectionString) {
        console.error(
            "❌ MONGO_URI is not set. Add it to Backend/.env (see .env.example)."
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(connectionString);
        console.log("✅ Connected to MongoDB Atlas");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectToDatabase;