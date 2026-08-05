import mongoose from 'mongoose';

const savedRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Request template name is required'],
    trim: true
  },
  method: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  },
  url: {
    type: String,
    required: [true, 'Request URL is required'],
    trim: true
  },
  headers: [
    {
      key: { type: String, default: '' },
      value: { type: String, default: '' },
      enabled: { type: Boolean, default: true }
    }
  ],
  params: [
    {
      key: { type: String, default: '' },
      value: { type: String, default: '' },
      enabled: { type: Boolean, default: true }
    }
  ],
  body: {
    type: String,
    default: ''
  },
  auth: {
    type: { type: String, default: 'none' },
    token: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    apiKey: { type: String, default: '' },
    headerName: { type: String, default: '' },
    addTo: { type: String, default: '' }
  }
}, {
  timestamps: true
});

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true
  },
  requests: [savedRequestSchema]
});

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Collection must belong to a user']
  },
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  requests: [savedRequestSchema],
  folders: [folderSchema]
}, {
  timestamps: true
});

// Setup indexes
collectionSchema.index({ userId: 1 });

const Collection = mongoose.model('Collection', collectionSchema);
export default Collection;
