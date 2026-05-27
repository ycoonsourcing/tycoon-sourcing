import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2, Check, Trash2 } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';
import { sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '@/lib/emailService'; // ✅ IMPORT BOTH

const inp = 'w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 text-sm';
const lbl = 'block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider';

// PHASE 5: Admin payment verification modal
// Allows admins to approve or reject payment proofs
export default function AdminPaymentVerificationModal({ open, paymentProof, batch, invoice, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  const handleAction = async (action) => {
    if (action === 'reject' && !adminNotes.trim()) {
      setErr('Rejection reason is required');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      const sb = await loadSupabase();

      if (action === 'approve') {
        // Update payment_proof status
        await sb.from('payment_proofs').update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes,
        }).eq('id', paymentProof.id);

        // Update batch status to 'paid'
        await sb.from('batches').update({
          status: 'paid',
        }).eq('id', batch.id);

        // ✅ SEND EMAIL TO CLIENT - PAYMENT APPROVED
        try {
          if (invoice?.client_id) {
            const { data: clientData } = await sb
              .from('profiles')
              .select('email, full_name')  // ✅ USE full_name
              .eq('id', invoice.client_id)
              .single();
            
            if (clientData?.email) {
              console.log('📧 Sending payment approved email to:', clientData.email);
              await sendPaymentApprovedEmail(
                clientData.email,
                clientData.full_name || 'Client',  // ✅ FIXED: full_name
                invoice.invoice_num,
                invoice.amount
              );
              console.log('✅ Payment approved email sent');
            } else {
              console.warn('⚠️ Client email not found');
            }
          }
        } catch (emailErr) {
          console.warn('⚠️ Email send failed:', emailErr);
          // Don't fail the approval if email fails
        }

      } else if (action === 'reject') {
        // Update payment_proof
        await sb.from('payment_proofs').update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: adminNotes,
        }).eq('id', paymentProof.id);

        // ✅ SEND EMAIL TO CLIENT - PAYMENT REJECTED
        try {
          if (invoice?.client_id) {
            const { data: clientData } = await sb
              .from('profiles')
              .select('email, full_name')
              .eq('id', invoice.client_id)
              .single();
            
            if (clientData?.email) {
              console.log('📧 Sending payment rejected email to:', clientData.email);
              await sendPaymentRejectedEmail(
                clientData.email,
                clientData.full_name || 'Client',
                invoice.invoice_num,
                adminNotes
              );
              console.log('✅ Payment rejected email sent');
            } else {
              console.warn('⚠️ Client email not found');
            }
          }
        } catch (emailErr) {
          console.warn('⚠️ Email send failed:', emailErr);
          // Don't fail the rejection if email fails
        }
      }

      onSuccess?.();
      onClose();
    } catch (e) {
      console.error('Action failed:', e);
      setErr(e.message || 'Action failed. Please try again.');
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
          className="fixed inset-0 bg-black/70 z-[130] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-black text-white">Verify Payment</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Invoice Info */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Invoice</span>
                  <span className="font-bold text-white">{invoice?.invoice_num}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Amount</span>
                  <span className="font-bold text-green-400">LKR {(invoice?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Batch</span>
                  <span className="font-bold text-white">{batch?.batch_num}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Status</span>
                  <span className="font-bold text-amber-400">⏳ Pending Review</span>
                </div>
              </div>

              {/* Payment Proof File */}
              {paymentProof?.file_name && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-xs font-bold text-slate-300 mb-2 uppercase">Uploaded File</div>
                  <a
                    href={paymentProof.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline break-all"
                  >
                    {paymentProof.file_name}
                  </a>
                  <div className="text-xs text-slate-400 mt-1">
                    {paymentProof.file_size_mb} MB · {new Date(paymentProof.uploaded_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className={lbl}>Admin Notes {actionType === 'reject' && '*'}</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'reject' ? 'Required: Explain why rejected' : 'Optional: Add notes'}
                  className={`${inp} resize-none`}
                />
              </div>

              {/* Error */}
              {err && (
                <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-400">{err}</div>
                </div>
              )}

              {/* Warning for Reject */}
              {actionType === 'reject' && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                  <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-400">
                    Client will receive rejection email and can resubmit.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-700 bg-slate-900">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={busy}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-60 rounded-lg font-semibold ${
                  actionType === 'reject' ? 'bg-red-500/20' : ''
                }`}
                onMouseEnter={() => setActionType('reject')}
                onMouseLeave={() => setActionType(null)}
              >
                {busy && actionType === 'reject' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Reject
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={busy}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg font-semibold text-white ${
                  actionType === 'approve' ? 'ring-2 ring-green-400' : ''
                }`}
                onMouseEnter={() => setActionType('approve')}
                onMouseLeave={() => setActionType(null)}
              >
                {busy && actionType === 'approve' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Approve Payment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
