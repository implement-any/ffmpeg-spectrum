import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import ws from "ws";

import audio from "@/routes/audio.routes";

import { socketConnection } from "./controllers/socket.controller";

// .env
const { PORT } = process.env;

const app = express();
const server = http.createServer(app);

// Router
app.use("/audio", audio);

// WebSocket
const wss = new ws.WebSocket.Server({ server });
wss.on("connection", socketConnection);

server.listen(PORT, () => console.log(`Server online on port: ${PORT}`));
