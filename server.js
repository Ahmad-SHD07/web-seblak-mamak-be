require('dotenv').config();
const express = require('express');
const cors = require('cors');
const menuRoutes = require('./src/routes/menuRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome / health check
app.get('/', (req, res) => {
  res.json({
    name: 'API Seblak Mak Eunin',
    version: '1.0.0',
    status: 'Running'
  });
});

// API Routes
app.use('/api', menuRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server internal',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server Seblak Mak Eunin aktif di http://localhost:${PORT}`);
});
