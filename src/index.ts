import dotenv from "dotenv";
dotenv.config();

import express from "express";
import ws from "ws";

import audio from "@/routes/audio.routes";

import { socketConnection } from "./controllers/socket.controller";

// .env
const { PORT } = process.env;

const app = express();

// Router
app.use("/audio", audio);

// WebSocket
const wss = new ws.WebSocket.Server({ port: 9090 });
wss.on("connection", socketConnection);

app.listen(PORT, () => console.log(`Server online on port: ${PORT}`));
