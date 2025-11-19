import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Change these credentials
    const adminData = {
      username: "admin",
      email: "admin@gmail.com",
      password: "admin123" 
    };

    const adminExists = await User.findOne({ username: adminData.username });
    if (adminExists) {
      console.log("❌ Admin user already exists");
      process.exit(0);
    }

    const admin = new User({
      ...adminData,
      role: "admin"
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log(`Username: ${adminData.username}`);
    console.log(`Email: ${adminData.email}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

createAdmin();
