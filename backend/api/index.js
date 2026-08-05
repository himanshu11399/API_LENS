/* ============================================
   APILens — Vercel Serverless Function Handler
   ============================================ */

import app from '../src/app.js';
import mongoose from 'mongoose';

let isConnected = false;

export default async function handler(req, res) {
  if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
    } catch (err) {
      console.error('MongoDB Serverless Connection Error:', err);
    }
  }
  return app(req, res);
}
