import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"; 

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

// ─── Signup ────────────────────────────────────────────────────────────────────

const signup = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  // check empty fields
  if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists
  const existedUser = await User.findOne({
    $or: [ { username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  // handle avatar upload
  let avatarUrl = `https://ui-avatars.com/api/?name=${fullName}&background=random&color=fff&bold=true`;
  if(req.files?.avatar?.[0]?.path){
    const upload = await uploadOnCloudinary(req.files.avatar[0].path);
    if (upload?.url) avatarUrl = upload.url;
  };

  // create user
  const user = await User.create({
    fullName,
    username,
    email,
    password,
    avatar: avatarUrl,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// ─── Login ─────────────────────────────────────────────────────────────────────

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!userExist) {
    throw new ApiError(404, "User does not exist, please sign up first");
  }

  const isPasswordValid = await userExist.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(userExist._id);

  const loggedInUser = await User.findById(userExist._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// ─── Logout ────────────────────────────────────────────────────────────────────

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { returnDocument: "after"}
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// ─── Refresh Access Token ──────────────────────────────────────────────────────

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(403, error?.message || "Invalid refresh token");
  }
});

// ─── Change Password ───────────────────────────────────────────────────────────

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// ─── Get Current User ──────────────────────────────────────────────────────────

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// ─── Update Account Details ────────────────────────────────────────────────────

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;

  if (!fullName && !username && !email) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        username,
        email,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// ─── Update Avatar ─────────────────────────────────────────────────────────────

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar file");
  }
  
  const oldUser = await User.findById(req.user?._id);
  const oldAvatarUrl = oldUser?.avatar;

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar, please try again");
  }
    if (oldAvatarUrl) {
    const publicId = oldAvatarUrl
      .split("/upload/")[1]
      .replace(/\.[^/.]+$/, "")
      .replace(/^v\d+\//, "");

    await cloudinary.uploader.destroy(publicId);
  }
  

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

//-----------------getAllUsers---------------------------------

const getAllUsers = asyncHandler(async (req, res) =>{
  const loggedInUserId = req.user._id;
  const users = await User.find({_id: {$ne: loggedInUserId}})
  .select("-password -refreshToken")
  .lean();      // it will return plain js objects instead of mongoose documents, so it will be faster and we don't need mongoose document methods for this
  return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));

})
// ─── Exports ───────────────────────────────────────────────────────────────────



export {
  signup,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getAllUsers,
};