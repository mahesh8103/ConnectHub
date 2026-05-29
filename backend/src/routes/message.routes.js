import { Router } from "express";
import { getMessages, sendMessage ,markMessagesSeen} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/:id").get(verifyJWT, getMessages);
router.route("/:id").post(verifyJWT, upload.single("image"), sendMessage);
router.route("/:id/seen").patch(verifyJWT, markMessagesSeen);

export default router;