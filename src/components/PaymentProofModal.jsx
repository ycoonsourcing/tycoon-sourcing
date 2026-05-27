import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileCheck, AlertCircle, Loader2, Download } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';
import { generateDetailedInvoiceHTML } from '@/lib/DetailedInvoiceGenerator';
import { sendAdminPaymentUploadedEmail } from '@/lib/emailService'; // ✅ EMAIL IMPORT

const inp = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 text-sm';
const lbl = 'block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider';

// PHASE 5: Payment proof upload modal
// Allows clients to upload payment receipts/screenshots
export default function PaymentProofModal({ open, batch, invoice, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deal, setDeal] = useState(null);
  const [client, setClient] = useState(null);
  const [proofStatus, setProofStatus] = useState('initial'); // 'initial', 'uploaded', 'rejected'
  const [existingProof, setExistingProof] = useState(null);

  // Load deal and client data when modal opens
  useEffect(() => {
    if (open && batch) {
      loadInvoiceData();
      checkExistingProof();
    }
  }, [open, batch]);

  const checkExistingProof = async () => {
    try {
      const sb = await loadSupabase();
      const { data: proofs } = await sb
        .from('payment_proofs')
        .select('*')
        .eq('batch_id', batch?.id)
        .order('uploaded_at', { ascending: false })
        .limit(1);
      
      if (proofs && proofs.length > 0) {
        setExistingProof(proofs[0]);
        setProofStatus(proofs[0].status === 'rejected' ? 'rejected' : 'uploaded');
      }
    } catch (e) {
      console.log('No existing proof');
    }
  };

  const loadInvoiceData = async () => {
    try {
      const sb = await loadSupabase();

      // Get deal data
      if (batch?.deal_id) {
        const { data: dealData } = await sb.from('deals').select('*').eq('id', batch.deal_id).single();
        setDeal(dealData);
      }

      // Get client data - IMPORTANT for email
      if (invoice?.client_id) {
        const { data: clientData } = await sb
          .from('profiles')
          .select('*')  // ✅ Get ALL fields
          .eq('id', invoice.client_id)
          .single();
        setClient(clientData);
        console.log('✅ Client data loaded:', clientData);
      } else {
        console.warn('⚠️ No client_id in invoice');
      }
    } catch (e) {
      console.error('Failed to load invoice data:', e);
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file size (max 5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setErr('File must be less than 5MB');
      return;
    }

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(selected.type)) {
      setErr('Only JPG, PNG, WebP, or PDF files allowed');
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setErr('');
  };

  // ✅ FIXED handleUpload with proper email sending
  const handleUpload = async () => {
    if (!file) {
      setErr('Please select a file');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      const sb = await loadSupabase();
      const user = await sb.auth.getUser();

      // Upload to storage
      const filePath = `${batch.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await sb.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = sb.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Create payment_proof record
      const { error: dbError } = await sb.from('payment_proofs').insert({
        batch_id: batch.id,
        client_id: user.data.user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size_mb: (file.size / (1024 * 1024)).toFixed(2),
        uploaded_by: user.data.user.id,
        status: 'pending',
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      // ✅ SEND EMAIL TO ADMIN - NEW PAYMENT PROOF UPLOADED
      try {
        console.log('📧 Sending payment proof email...');
        console.log('Client data:', { full_name: client?.full_name, email: client?.email });
        
        // Use client data that was already loaded
        if (client?.full_name && client?.email) {
          await sendAdminPaymentUploadedEmail(
            client.full_name,      // ✅ Use full_name
            client.email,
            invoice?.invoice_num || 'Unknown',
            invoice?.amount || 0
          );
          console.log('✅ Payment proof email sent to admin');
        } else {
          console.warn('⚠️ Client data missing:', { 
            full_name: client?.full_name, 
            email: client?.email 
          });
        }
      } catch (emailErr) {
        console.warn('⚠️ Email send failed (but file uploaded):', emailErr);
        // Don't fail the whole upload if email fails
      }

      // Success - close and refresh
      console.log('✅ File uploaded successfully');
      setProofStatus('uploaded');
      setFile(null);
      setFileName('');
      await checkExistingProof();
      onSuccess?.();
      // Don't close - let user see "Uploaded" button
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      console.error('Upload failed:', e);
      setErr(e.message || 'Upload failed. Please try again.');
    }

    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md border border-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900">Upload Payment Proof</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Invoice Info */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Invoice</span>
                  <span className="font-bold text-slate-900">{invoice?.invoice_num}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount Due</span>
                  <span className="font-bold text-slate-900">LKR {(invoice?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status</span>
                  <span className="font-bold text-amber-600">⏳ Payment Pending</span>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase">Bank Transfer Details</div>
                <div className="space-y-1 text-xs text-slate-700">
                  <div><strong>Bank:</strong> Seylan Bank PLC</div>
                  <div><strong>Account:</strong> 0710 13338448 001</div>
                  <div><strong>Name:</strong> Tycoon Holdings (Pvt) Ltd</div>
                  <div><strong>Reference:</strong> {invoice?.invoice_num}</div>
                </div>
                <div className="text-xs text-slate-600 mt-3">
                  <div><strong>Contact for help:</strong></div>
                  <div>WhatsApp: +94 777 303 091</div>
                  <div>Email: info@tycoonsourcing.com</div>
                </div>
              </div>

              {/* Download Invoice Button */}
              <button 
                onClick={() => {
                  if (invoice?.id && batch && deal) {
                    // Generate detailed invoice HTML
                    const invoiceHTML = generateDetailedInvoiceHTML(invoice, batch, deal, client);
                    const w = window.open('', '', 'width=1000,height=800');
                    w.document.write(invoiceHTML);
                    w.document.close();
                  } else {
                    alert('Invoice data not available');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-sm"
              >
                <Download size={16} />
                Download Invoice
              </button>

              {/* File Upload */}
              <div className="space-y-2">
                <label className={lbl}>Upload Payment Receipt</label>
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600">
                      {fileName ? fileName : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP, or PDF (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File Info */}
              {file && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileCheck size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-700">
                    <strong>{file.name}</strong>
                    <div className="text-xs text-green-600">{(file.size / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
              )}

              {/* Error */}
              {err && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">{err}</div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="text-xs text-amber-800">
                  <strong>What to upload:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Bank transfer receipt</li>
                    <li>Payment confirmation screenshot</li>
                    <li>Transaction reference number</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-200 bg-slate-50">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              
              {proofStatus === 'uploaded' && !file ? (
                <div className="flex-1 py-2.5 bg-green-50 border-2 border-green-500 text-green-700 font-bold rounded-lg flex items-center justify-center gap-2">
                  <FileCheck size={16} />
                  ✅ Uploaded
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  disabled={busy || !file}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white font-bold rounded-lg transition-all ${
                    proofStatus === 'rejected' 
                      ? 'bg-orange-600 hover:bg-orange-500 disabled:opacity-60' 
                      : 'bg-green-600 hover:bg-green-500 disabled:opacity-60'
                  }`}
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {proofStatus === 'rejected' ? 'Re-upload Proof' : 'Upload Receipt'}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
