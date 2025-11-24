import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Email service function
const sendQuoteNotification = async (quoteData) => {
  try {
    const { name, email, phone, service_type, material_type, project_size, quantity, project_details, deadline } = quoteData;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; color: #374151; }
          .urgent { background: #fef3c7; padding: 10px; border-radius: 5px; }
          .section { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .quote-id { background: #1f2937; color: white; padding: 5px 10px; border-radius: 4px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 NEW QUOTE REQUEST - JIVDANII</h1>
          <p>Quote ID: <span class="quote-id">#${quoteData.id || 'NEW'}</span></p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>👤 Contact Information</h2>
            <div class="detail"><span class="label">Name:</span> ${name}</div>
            <div class="detail"><span class="label">Email:</span> ${email}</div>
            <div class="detail"><span class="label">Phone:</span> ${phone}</div>
          </div>
          
          <div class="section">
            <h2>📋 Project Specifications</h2>
            <div class="detail"><span class="label">Service Type:</span> ${service_type || 'Not specified'}</div>
            <div class="detail"><span class="label">Material:</span> ${material_type || 'Not specified'}</div>
            <div class="detail"><span class="label">Project Size:</span> ${project_size || 'Not specified'}</div>
            <div class="detail"><span class="label">Quantity:</span> ${quantity || '1'} units</div>
            ${deadline ? `<div class="urgent"><span class="label">⏰ Deadline:</span> ${deadline} - URGENT!</div>` : ''}
          </div>
          
          <div class="section">
            <h2>📝 Project Description</h2>
            <p>${project_details || 'No details provided'}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #dcfce7; border-radius: 5px; border-left: 4px solid #16a34a;">
            <strong>🎯 ACTION REQUIRED: Respond within 2 hours for best conversion!</strong>
            <br>
            <small>Contact: ${phone} | ${email}</small>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'JIVDANII Quotes <onboarding@resend.dev>',
      to: process.env.NOTIFICATION_EMAIL || 'jivdaniiprintingprocess@gmail.com',
      subject: `📋 Quote #${quoteData.id || 'NEW'}: ${name} - ${service_type || 'Printing Service'}`,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Email error:', error);
      return false;
    }

    console.log('✅ Email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
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
      emailSent: emailSent,
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
    email: "READY"
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
  console.log(`📧 Email notifications: ${process.env.RESEND_API_KEY ? 'READY' : 'NOT CONFIGURED'}`);
  console.log(`💾 Database: ACTIVE (in-memory)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
