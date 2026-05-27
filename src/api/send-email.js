// src/api/send-email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  try {
    const result = await resend.emails.send({
      from: 'notifications@tycoonsourcing.com',
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}