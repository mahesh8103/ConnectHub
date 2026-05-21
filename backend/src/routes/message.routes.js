import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:id").get(verifyJWT, getMessages);   // get messages with user :id
router.route("/:id").post(verifyJWT, sendMessage);  // send message to user :id

export default router;