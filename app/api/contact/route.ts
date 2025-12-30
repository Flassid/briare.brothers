import { NextRequest, NextResponse } from 'next/server';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting map (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Sanitize input to prevent XSS
function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

interface ContactFormData {
  name: string;
  email: string;
  service: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: ContactFormData = await request.json();
    const { name, email, service, message } = body;

    // Validation
    const errors: string[] = [];

    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!email || !emailRegex.test(email)) {
      errors.push('Please provide a valid email address');
    }

    if (!service || service === '') {
      errors.push('Please select a service');
    }

    if (!message || message.trim().length < 10) {
      errors.push('Message must be at least 10 characters');
    }

    if (message && message.length > 5000) {
      errors.push('Message must be less than 5000 characters');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitize(name),
      email: sanitize(email),
      service: sanitize(service),
      message: sanitize(message),
      submittedAt: new Date().toISOString(),
    };

    // In production, you would:
    // 1. Send email via SendGrid, Resend, Nodemailer, etc.
    // 2. Store in database
    // 3. Send to CRM

    // For now, log the submission (replace with actual implementation)
    console.log('Contact form submission:', sanitizedData);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Example: Send via Resend (uncomment and configure when ready)
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'contact@briarebrothers.com',
      to: process.env.CONTACT_EMAIL || 'contact@briarebrothers.com',
      subject: `New Contact: ${sanitizedData.service} inquiry from ${sanitizedData.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Service:</strong> ${sanitizedData.service}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedData.message}</p>
        <hr>
        <p><small>Submitted at: ${sanitizedData.submittedAt}</small></p>
      `,
    });
    */

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
