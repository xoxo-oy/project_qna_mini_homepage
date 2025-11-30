import express from "express";
import { PORT } from "./lib/contants.js";
import cors from "cors";

const app = express();

app.use(cors);
app.use(express.json());

app.listen(PORT, () => {
  console.log("Server Start");
});
