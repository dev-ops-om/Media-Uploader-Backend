import User from "./auth.model.js"
import ApiError from "../../common/utils/api-error.js"
import { generateResetToken,hashToken ,generateAccessToken,generateRefreshToken} from "../../common/utils/jwt.utils.js"
import { sendVerificationEmail } from "../../common/config/email.js";



const register=async({name,email,password,role})=>{
     const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("Email is already registered");
  }
 const { rawToken, hashedToken } = generateResetToken();

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken: hashedToken,
  });


    console.log(
        `[Verification Token for ${email}]: ${rawToken}`
    );

  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error(err);
    // console.error("Failed to send verification email:", err.message);
  }


    const userObj = user.toObject();
  delete userObj.password;
  delete userObj.verificationToken;
  return userObj;
};






const verifyEmail = async (token) => {
  const trimmed = String(token).trim();
  if (!trimmed) {
    throw ApiError.badRequest("Verification token is required");
  }
  // 1. Hash the incoming raw token to match what is stored in DB
  const hashedInput = hashToken(trimmed);
  // 2. Search for user by hashed token (we must explicitly .select('+verificationToken'))
  let user = await User.findOne({ verificationToken: hashedInput }).select("+verificationToken");
  // Fallback check: in case token was saved unhashed during testing
  if (!user) {
    user = await User.findOne({ verificationToken: trimmed }).select("+verificationToken");
  }
  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }
  // 3. Mark user as verified and delete verificationToken field
  await User.findByIdAndUpdate(user._id, {
    $set: { isVerified: true },
    $unset: { verificationToken: 1 },
  });
  return true;
};






const login = async ({ email, password }) => {

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }
 
  if (!user.isVerified) {
    throw ApiError.forbidden("Please verify your email before logging in");
  }
 
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });
  
// Store the HASHED refresh token in the database
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  // Clean sensitive fields before returning
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  return { user: userObj, accessToken, refreshToken };
};


export { register ,verifyEmail,login};