import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null if run by anonymous guest
  },
  url: {
    type: String,
    required: [true, 'Request URL is required'],
    trim: true
  },
  method: {
    type: String,
    required: [true, 'HTTP Method is required'],
    uppercase: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  },
  queryParams: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  requestHeaders: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  responseHeaders: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  duration: {
    type: Number,
    required: [true, 'Response duration in ms is required']
  },
  status: {
    type: Number,
    required: [true, 'HTTP status code is required']
  },
  size: {
    type: Number,
    default: 0
  },
  success: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Setup indexes for optimization
historySchema.index({ userId: 1, timestamp: -1 });
historySchema.index({ timestamp: -1 });

const History = mongoose.model('History', historySchema);
export default History;
