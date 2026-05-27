const functions = require('firebase-functions');
const { Resend } = require('resend');
const cors = require('cors')({ origin: true });

const resend = new Resend('re_Mhk5FYDy_2RGu7KxKsMBsddxbpFuHLSex');

exports.sendEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
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
  });
});