import React, { useState } from 'react';
import { sendTestEmail } from '@/lib/emailService';

export default function TestEmail() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await sendTestEmail('stephenfndo@gmail.com');
      setResult(res);
      if (res.success) {
        alert('✅ Email sent! Check inbox in 2-5 minutes');
      } else {
        alert('❌ Error: ' + res.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '100px', textAlign: 'center', backgroundColor: '#dbeafe', minHeight: '100vh' }}>
      <h1>📧 Email Test</h1>
      <p>Click button to send test email to stephenfndo@gmail.com</p>
      
      <button 
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: '20px 40px',
          fontSize: '18px',
          backgroundColor: '#0a2342',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'wait' : 'pointer',
          marginTop: '20px',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? '⏳ Sending...' : '📧 Send Test Email'}
      </button>

      {result && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: result.success ? '#10b981' : '#ef4444', color: 'white', borderRadius: '8px', fontSize: '16px' }}>
          {result.success ? '✅ SUCCESS!' : '❌ FAILED'}
          {result.error && <p>{result.error}</p>}
        </div>
      )}
    </div>
  );
}