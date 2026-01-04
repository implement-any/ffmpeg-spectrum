import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import ws from "ws";

import audio from "@/routes/audio.routes";
import upload from "@/routes/upload.routes";

import { socketConnection } from "./controllers/socket.controller";

// .env
const { PORT } = process.env;

const app = express();
const server = http.createServer(app);

// Resource
app.use(express.static(path.resolve(__dirname, "../public")));

// Router
app.use("/audio", audio);
app.use("/upload", upload);

// WebSocket
const wss = new ws.WebSocket.Server({ server });
wss.on("connection", socketConnection);

server.listen(PORT, () => console.log(`Server online on port: ${PORT}`));
