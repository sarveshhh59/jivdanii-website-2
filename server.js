import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// SIMPLE DATABASE - No external file needed
let quotes = [];
let nextId = 1;

const db = {
  async saveQuote(quoteData) {
    const quote = {
      id: nextId++,
      ...quoteData,
      created_at: new Date().toISOString(),
      status: 'new'
    };
    quotes.push(quote);
    console.log('💾 Quote saved to database:', quote.id);
    return quote;
  },

  async getAllQuotes() {
    return quotes;
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the root directory
app.use(express.static(__dirname));

// FIX: Ignore favicon requests to prevent errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// SIMPLE EMAIL - Just log for now
const sendQuoteNotification = async (quoteData) => {
  try {
    console.log('📧 QUOTE DATA FOR EMAIL:', {
      name: quoteData.name,
      email: quoteData.email,
      service: quoteData.service_type,
      quoteId: quoteData.id
    });
    
    // Simulate email success
    return true;
    
  } catch (error) {
    console.error('❌ Email simulation error:', error);
    return false;
  }
};

// Enhanced quote route - handles the new order form
app.post("/api/contact/submit", async (req, res) => {
  try {
    const { name, email, phone, service_type, material_type, project_size, quantity, project_details, deadline } = req.body;
    
    console.log("🚀 NEW QUOTE REQUEST RECEIVED:");
    console.log("👤 Name:", name);
    console.log("📧 Email:", email);
    console.log("📞 Phone:", phone);
    console.log("🛠️ Service Type:", service_type);
    console.log("📦 Material:", material_type);
    console.log("📊 Project Size:", project_size);
    console.log("🔢 Quantity:", quantity);
    console.log("📝 Project Details:", project_details);
    console.log("⏰ Deadline:", deadline);

    // Save to database first
    const savedQuote = await db.saveQuote({
      name, email, phone, service_type, material_type, project_size, quantity, project_details, deadline
    });

    console.log("💾 Quote saved to database with ID:", savedQuote.id);

    // Send email notification with quote ID
    const emailSent = await sendQuoteNotification(savedQuote);

    res.json({
      success: true,
      message: "Quote request submitted successfully! We will contact you within 24 hours.",
      emailSent: true, // Force success for now
      quoteId: savedQuote.id,
      data: savedQuote
    });

  } catch (error) {
    console.error("❌ Quote request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit quote request. Please try again."
    });
  }
});

// Get all quotes (for admin panel later)
app.get("/api/quotes", async (req, res) => {
  try {
    const quotes = await db.getAllQuotes();
    res.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    console.error("❌ Get quotes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quotes"
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "JIVDANII Backend is running!",
    database: "ACTIVE",
    email: "SIMULATED"
  });
});

// Serve HTML files for all routes (SPA behavior for Render)
app.get("*", (req, res) => {
  const path = join(__dirname, req.path);
  
  // If it's an API route, skip
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // If it's a file that exists, serve it
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    return res.sendFile(path);
  }
  
  // Otherwise serve the main HTML files
  if (req.path === '/about.html' || req.path === '/about') {
    return res.sendFile(join(__dirname, 'about.html'));
  }
  if (req.path === '/contact.html' || req.path === '/contact') {
    return res.sendFile(join(__dirname, 'contact.html'));
  }
  
  // Default to index.html
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: ACTIVE (in-memory)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
