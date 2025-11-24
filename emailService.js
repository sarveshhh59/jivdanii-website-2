import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendQuoteNotification = async (quoteData) => {
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
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 NEW QUOTE REQUEST</h1>
          <p>JIVDANII PRINTING PROCESS</p>
        </div>
        
        <div class="content">
          <h2>Contact Information</h2>
          <div class="detail"><span class="label">Name:</span> ${name}</div>
          <div class="detail"><span class="label">Email:</span> ${email}</div>
          <div class="detail"><span class="label">Phone:</span> ${phone}</div>
          
          <h2>Project Details</h2>
          <div class="detail"><span class="label">Service Type:</span> ${service_type}</div>
          <div class="detail"><span class="label">Material:</span> ${material_type || 'Not specified'}</div>
          <div class="detail"><span class="label">Project Size:</span> ${project_size}</div>
          <div class="detail"><span class="label">Quantity:</span> ${quantity} units</div>
          ${deadline ? `<div class="urgent"><span class="label">Deadline:</span> ${deadline} - URGENT!</div>` : ''}
          
          <h2>Project Description</h2>
          <p>${project_details}</p>
          
          <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 5px;">
            <strong>⏰ Respond within 2 hours for best conversion!</strong>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'JIVDANII Quotes <quotes@yourdomain.com>',
      to: process.env.NOTIFICATION_EMAIL || 'jivdaniiprintingprocess@gmail.com',
      subject: `📋 New Quote Request from ${name}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Email error:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
};