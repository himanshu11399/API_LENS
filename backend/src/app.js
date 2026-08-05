import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger.js";
import { errorHandler } from "./middleware/error.js";
import { apiLimiter } from "./middleware/rateLimit.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import requestRoutes from "./routes/request.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import historyRoutes from "./routes/history.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, cloud deployments (Render/Vercel), or matching CORS_ORIGIN
      if (!origin || process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN || origin.includes('onrender.com') || origin.includes('vercel.app') || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get(["/", "/api", "/api/health", "/health"], (req, res) => {
  res.status(200).json({ status: "ok", message: "APILens Backend API is running", timestamp: new Date().toISOString() });
});

// Apply rate limiting to API routes
app.use(["/api", "/auth", "/request", "/collections", "/history", "/stats", "/ai"], apiLimiter);

// API Swagger Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Mount Routers (Supports both /api/* and /* for Vercel serverless rewrites)
app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/request", "/request"], requestRoutes);
app.use(["/api/collections", "/collections"], collectionRoutes);
app.use(["/api/history", "/history"], historyRoutes);
app.use(["/api/stats", "/stats"], statsRoutes);
app.use(["/api/ai", "/ai"], aiRoutes);

// Wildcard 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
