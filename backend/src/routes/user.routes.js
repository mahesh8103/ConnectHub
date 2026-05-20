import { Router } from "express";
import {
  signup,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

// public routes
router.route("/signup").post(
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  signup
);

router.route("/login").post(loginUser);

router.route("/refreshToken").post(refreshAccessToken);

// protected routes (need login)
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);

router.route("/currentUser").get(verifyJWT, getCurrentUser);

router.route("/updateAccount").patch(verifyJWT, updateAccountDetails);

router.route("/updateAvatar").patch(
  verifyJWT,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  updateUserAvatar
);

export default router;