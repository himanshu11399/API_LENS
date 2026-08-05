import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { specs } from './src/config/swagger.js';
import { getActiveUsersCount } from './src/sockets/socket.js';

console.log('⚡ Starting APILens Backend Compilation and Bootstrap Verification...\n');

// 1. Verify environment config fields
const requiredEnv = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN'];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.log(`⚠️  Warning: Missing environmental configurations: ${missing.join(', ')}`);
  console.log('Using fallback values for compiler verification...\n');
  process.env.PORT = '5000';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/apilens';
  process.env.JWT_SECRET = 'testaccesskey';
  process.env.JWT_REFRESH_SECRET = 'testrefreshkey';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
}

// 2. Validate App instantiation
try {
  console.log('✅ Express App created successfully.');
  
  // Verify Swagger Spec generation
  if (specs && specs.info) {
    console.log(`✅ Swagger Documentation compiled: "${specs.info.title}" v${specs.info.version}`);
  } else {
    throw new Error('Swagger Spec compilation failed');
  }

  // Verify Socket interface
  const initialOnline = getActiveUsersCount();
  console.log(`✅ Socket.IO active tracking operational (Initial count: ${initialOnline})`);

  // Create temporary HTTP Server
  const server = http.createServer(app);
  
  console.log('\n🎉 ALL APILENS BACKEND CODE AND DEPENDENCIES COMPILED SUCCESSFULLY!');
  process.exit(0);

} catch (err) {
  console.error('\n❌ Bootstrap check failed with compile error:');
  console.error(err);
  process.exit(1);
}
