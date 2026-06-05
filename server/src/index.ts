import express, { type Express } from "express";
import cors from "cors";
import { PORT } from "./utils/dotenv.js";
import quarantineRoutes from "./routes/quarentine.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app: Express = express();
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/upload", uploadRoutes);
app.use("/api/quarantine", quarantineRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
