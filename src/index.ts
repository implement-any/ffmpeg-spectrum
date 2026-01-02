import dotenv from "dotenv";
dotenv.config();

import express from "express";

import audio from "@/routes/audio";

// .env
const { PORT } = process.env;

const app = express();

// Router
app.use("/audio", audio);

app.listen(PORT, () => console.log(`Server online on port: ${PORT}`));
