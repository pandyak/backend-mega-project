import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
const fallbackDnsServers = ["1.1.1.1", "8.8.8.8"];

const connectWithMongo = async () => {
  return mongoose.connect(mongoUri, {
    dbName: process.env.DB_NAME || "megaproject",
    serverSelectionTimeoutMS: 5000,
  });
};

const connectDB = async () => {
  try {
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    const connection = await connectWithMongo();
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    return;
  } catch (error) {
    if (error.code === "ECONNREFUSED" && error.syscall === "querySrv") {
      console.warn("MongoDB SRV lookup failed. Retrying with public DNS servers...");
      dns.setServers(fallbackDnsServers);

      try {
        const connection = await connectWithMongo();
        console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
        return;
      } catch (retryError) {
        console.error("MongoDB retry failed:", retryError.message || retryError);
        process.exit(1);
      }
    }

    console.error("MongoDB connection failed:", error.message || error);
    process.exit(1);
  }
};

export default connectDB;