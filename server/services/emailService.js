/**
 * Email Service
 * Handles email sending through multiple providers (Nodemailer, SendGrid)
 */

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'nodemailer';
    this.transporter = null;
    this.sendgrid = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (this.provider === 'sendgrid') {
        // SendGrid setup
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sendgrid = sgMail;
        console.log('Email service initialized with SendGrid');
      } else {
        // Nodemailer setup
        const nodemailer = require('nodemailer');

        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Verify connection
        await this.transporter.verify();
        console.log('Email service initialized with Nodemailer');
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Email service initialization failed:', error.message);
      console.warn('Email sending will be disabled');
    }
  }

  /**
   * Send a single email
   */
  async send(to, subject, html, text = null, options = {}) {
    await this.initialize();

    if (!this.initialized) {
      console.log(`[Email Skipped] To: ${to}, Subject: ${subject}`);
      return { success: false, message: 'Email service not initialized' };
    }

    const fromEmail = process.env.FROM_EMAIL || 'noreply@platform.com';
    const fromName = process.env.PLATFORM_NAME || 'E-Commerce Platform';

    try {
      if (this.provider === 'sendgrid') {
        await this.sendgrid.send({
          to,
          from: { email: fromEmail, name: fromName },
          subject,
          html,
          text: text || this.stripHtml(html),
          ...options,
        });
      } else {
        await this.transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject,
          html,
          text: text || this.stripHtml(html),
          ...options,
        });
      }

      console.log(`Email sent to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulk(recipients, subject, html, options = {}) {
    await this.initialize();

    if (!this.initialized) {
      console.log(`[Bulk Email Skipped] Recipients: ${recipients.length}, Subject: ${subject}`);
      return { success: false, sent: 0, failed: recipients.length };
    }

    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(async (recipient) => {
        try {
          // Personalize email if recipient has variables
          let personalizedHtml = html;
          let personalizedSubject = subject;

          if (recipient.variables) {
            for (const [key, value] of Object.entries(recipient.variables)) {
              personalizedHtml = personalizedHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
              personalizedSubject = personalizedSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }
          }

          await this.send(
            recipient.email,
            personalizedSubject,
            personalizedHtml,
            null,
            options
          );

          results.sent++;
          return { email: recipient.email, success: true };
        } catch (error) {
          results.failed++;
          results.errors.push({ email: recipient.email, error: error.message });
          return { email: recipient.email, success: false };
        }
      });

      await Promise.all(promises);

      // Add small delay between batches
      if (i + batchSize < recipients.length) {
        await this.sleep(1000);
      }
    }

    return results;
  }

  /**
   * Send using a template
   */
  async sendTemplate(to, templateId, variables = {}) {
    // This would be used with SendGrid dynamic templates
    // or custom Handlebars templates stored in database

    await this.initialize();

    if (this.provider === 'sendgrid' && process.env.SENDGRID_TEMPLATES) {
      try {
        await this.sendgrid.send({
          to,
          from: {
            email: process.env.FROM_EMAIL,
            name: process.env.PLATFORM_NAME,
          },
          templateId,
          dynamicTemplateData: variables,
        });
        return { success: true };
      } catch (error) {
        console.error('Template email error:', error);
        return { success: false, message: error.message };
      }
    }

    // Fallback: Load template from database
    const TicketTemplate = require('../models/TicketTemplate');
    const template = await TicketTemplate.findById(templateId);

    if (!template) {
      return { success: false, message: 'Template not found' };
    }

    const html = template.compile(variables);
    return this.send(to, template.subject || 'Notification', html);
  }

  /**
   * Send transactional emails
   */
  async sendOrderConfirmation(order, customer) {
    const html = this.buildOrderEmail(order, 'confirmation');
    return this.send(
      customer.email,
      `Order Confirmed - #${order.orderNumber}`,
      html
    );
  }

  async sendShippingUpdate(order, shipment, customer) {
    const html = this.buildShippingEmail(order, shipment);
    return this.send(
      customer.email,
      `Your Order is on the Way - #${order.orderNumber}`,
      html
    );
  }

  async sendPasswordReset(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #1976d2;
        color: white;
        text-decoration: none;
        border-radius: 4px;
      ">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;
    return this.send(email, 'Password Reset Request', html);
  }

  // ============ Helper Methods ============

  buildOrderEmail(order, type) {
    const platformName = process.env.PLATFORM_NAME || 'E-Commerce Platform';

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1976d2;">${platformName}</h1>
        <h2>Order ${type === 'confirmation' ? 'Confirmed' : 'Update'}</h2>
        <p>Order Number: <strong>#${order.orderNumber}</strong></p>

        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>Rs. ${order.totals?.total?.toLocaleString()}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/orders" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          ">View Order</a>
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Thank you for shopping with ${platformName}!
        </p>
      </div>
    `;
  }

  buildShippingEmail(order, shipment) {
    const platformName = process.env.PLATFORM_NAME || 'E-Commerce Platform';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1976d2;">${platformName}</h1>
        <h2>Your Order is on the Way!</h2>
        <p>Order Number: <strong>#${order.orderNumber}</strong></p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Tracking Information</h3>
          <p><strong>Courier:</strong> ${shipment.courier?.name || 'Standard Delivery'}</p>
          <p><strong>Tracking Number:</strong> ${shipment.trackingNumber || 'N/A'}</p>
          ${shipment.estimatedDelivery ? `<p><strong>Expected Delivery:</strong> ${new Date(shipment.estimatedDelivery).toLocaleDateString()}</p>` : ''}
        </div>

        <p>
          <a href="${process.env.FRONTEND_URL}/track/${shipment.trackingNumber}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          ">Track Your Order</a>
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Thank you for shopping with ${platformName}!
        </p>
      </div>
    `;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
module.exports = new EmailService();
