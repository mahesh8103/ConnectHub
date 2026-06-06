import { Router } from "express";
import { getMessages, sendMessage ,markMessagesSeen, searchMessages,deleteMessage,reactToMessage} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/:id").get(verifyJWT, getMessages);
router.route("/:id").post(verifyJWT, upload.single("image"), sendMessage);
router.route("/:id/seen").post(verifyJWT, markMessagesSeen);
router.route("/:id/search").get(verifyJWT, searchMessages);
router.route("/:messageId/delete").delete(verifyJWT, deleteMessage);
router.route("/:messageId/react").post(verifyJWT, reactToMessage);

export default router;