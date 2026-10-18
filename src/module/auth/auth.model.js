import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin", "support"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Sensitive security tokens (all set to select: false)
    verificationToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

// 1. Pre-save Hook: Automatically hashes password before saving to DB
userSchema.pre("save", async function () {
  // If the password field wasn't changed (e.g. user just updated their name), skip hashing
  if (!this.isModified("password")) return;

  // Hash password with a cost factor (salt rounds) of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// 2. Instance Method: Compares plain password with the hashed password in DB
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);