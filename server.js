// ============================================================================
// MeasureX! - Legal Metrology Online Verification Portal
// Main Express Application Server
// ============================================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { initDb } = require('./src/config/db');
const { notFoundHandler, globalErrorHandler } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const instrumentRoutes = require('./src/routes/instrumentRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const inspectorRoutes = require('./src/routes/inspectorRoutes');
const certificateRoutes = require('./src/routes/certificateRoutes');
const publicRoutes = require('./src/routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve existing frontend static files (index.html, styles.css, app.js, data.js)
app.use(express.static(path.join(__dirname)));

// API Root / Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'MeasureX! Legal Metrology Verification Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/inspector', inspectorRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/public', publicRoutes);

// Catch-all route to serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start Server
async function startServer() {
  try {
    await initDb();

    app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`⚖️  MeasureX! Legal Metrology Backend Server running on port ${PORT}`);
      console.log(`🌐  API URL: http://localhost:${PORT}/api`);
      console.log(`🖥️  Frontend Portal: http://localhost:${PORT}/`);
      console.log('================================================================');
      console.log('Key Endpoints Available:');
      console.log('  POST /api/auth/register       - Register user & hash password');
      console.log('  POST /api/auth/login          - Authenticate & get JWT');
      console.log('  POST /api/instruments         - Register instrument (Trader)');
      console.log('  GET  /api/instruments         - List instruments (Traders own; Admins all)');
      console.log('  POST /api/requests            - Book verification with statutory fee (Trader)');
      console.log('  GET  /api/requests            - List verification bookings by role');
      console.log('  GET  /api/requests/track/:id  - Amazon-style 4-step status timeline');
      console.log('  POST /api/inspector/testbench - Submit MPE readings & issue certificate');
      console.log('  GET  /api/certificates/:id    - Form VII certificate for viewing/printing');
      console.log('  GET  /api/public/access/:id   - Public unauthenticated QR code scan');
      console.log('================================================================');
    });
  } catch (error) {
    console.error('Failed to start MeasureX! backend server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
