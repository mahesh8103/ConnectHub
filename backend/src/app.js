import express from "express";
import cors from "cors";
const app = express();

app.use(
  cors({
       origin: "http://localhost:5173",  
       credentials: true,
  })
);
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";



app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//     API running checkpoint
app.get("/", (req, res) => {
  res.send("API is running...");
});

// routes
app.use("/users", userRouter);

export { app };