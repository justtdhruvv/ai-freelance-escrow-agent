import dotenv from 'dotenv';

// Load environment variables at the very beginning
dotenv.config();

import app from './app';
import db from './config/database';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
