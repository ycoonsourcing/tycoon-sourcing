// src/pages/AdminPage.jsx (Updated section for withdrawal approvals)
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { approveWithdrawal, rejectWithdrawal } from '../services/withdrawalService';
import './AdminPage.css';

export default function AdminPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    fetchCurrentAdmin();
    fetchWithdrawals();
  }, []);

  const fetchCurrentAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentAdmin(user?.id);
    } catch (error) {
      console.error('Error fetching admin:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          id,
          client_id,
          amount,
          status,
          created_at,
          updated_at,
          clients (
            id,
            email,
            business_name,
            contact_person
          )
        `)
        .in('status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setMessage({ type: 'error', text: 'Failed to load withdrawals' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (withdrawal) => {
    setSelectedWithdrawal({ ...withdrawal, action: 'approve' });
    setApprovalNotes('');
  };

  const handleRejectClick = (withdrawal) => {
    setSelectedWithdrawal({ ...withdrawal, action: 'reject' });
    setRejectionReason('');
  };

  const handleConfirmApprove = async () => {
    if (!currentAdmin || !selectedWithdrawal) return;

    try {
      setProcessing(true);
      setMessage(null);

      // Call the withdrawal service - this handles email sending
      const result = await approveWithdrawal(
        selectedWithdrawal.id,
        currentAdmin,
        approvalNotes
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });

        // Update local state
        setWithdrawals(withdrawals.map(w =>
          w.id === selectedWithdrawal.id
            ? { ...w, status: 'approved', updated_at: new Date().toISOString() }
            : w
        ));

        // Close modal
        setSelectedWithdrawal(null);

        // Refresh after delay
        setTimeout(() => fetchWithdrawals(), 2000);
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to approve withdrawal'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!currentAdmin || !selectedWithdrawal) return;

    try {
      setProcessing(true);
      setMessage(null);

      const result = await rejectWithdrawal(
        selectedWithdrawal.id,
        currentAdmin,
        rejectionReason
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });

        // Update local state
        setWithdrawals(withdrawals.map(w =>
          w.id === selectedWithdrawal.id
            ? { ...w, status: 'rejected', updated_at: new Date().toISOString() }
            : w
        ));

        // Close modal
        setSelectedWithdrawal(null);

        // Refresh after delay
        setTimeout(() => fetchWithdrawals(), 2000);
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to reject withdrawal'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="admin-page loading">Loading withdrawals...</div>;
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Withdrawal Requests</h1>
        <p>Approve or reject client withdrawal requests</p>
      </div>

      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">✕</button>
        </div>
      )}

      <div className="withdrawals-section">
        <div className="section-title">
          <h2>Pending Requests</h2>
          <span className="badge">{pendingWithdrawals.length}</span>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div className="empty-state">
            <p>No pending withdrawal requests</p>
          </div>
        ) : (
          <div className="withdrawals-table">
            <div className="table-header">
              <div className="col col-1">Client</div>
              <div className="col col-2">Amount</div>
              <div className="col col-3">Date</div>
              <div className="col col-4">Email</div>
              <div className="col col-5">Actions</div>
            </div>
            {pendingWithdrawals.map(withdrawal => (
              <div key={withdrawal.id} className="table-row">
                <div className="col col-1">
                  <strong>{withdrawal.clients?.business_name}</strong>
                  <small>{withdrawal.clients?.contact_person}</small>
                </div>
                <div className="col col-2">
                  AUD ${withdrawal.amount.toFixed(2)}
                </div>
                <div className="col col-3">
                  {formatDate(withdrawal.created_at)}
                </div>
                <div className="col col-4">
                  {withdrawal.clients?.email}
                </div>
                <div className="col col-5">
                  <button
                    onClick={() => handleApproveClick(withdrawal)}
                    className="btn-action btn-approve"
                    title="Approve and send email notification"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(withdrawal)}
                    className="btn-action btn-reject"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWithdrawal && (
        <div className="modal-overlay" onClick={() => setSelectedWithdrawal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedWithdrawal.action === 'approve' ? 'Approve' : 'Reject'} Withdrawal
            </h2>

            <div className="withdrawal-details">
              <p>
                <strong>Client:</strong> {selectedWithdrawal.clients?.business_name}
              </p>
              <p>
                <strong>Contact:</strong> {selectedWithdrawal.clients?.contact_person}
              </p>
              <p>
                <strong>Email:</strong> {selectedWithdrawal.clients?.email}
              </p>
              <p>
                <strong>Amount:</strong> AUD ${selectedWithdrawal.amount.toFixed(2)}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedWithdrawal.created_at)}
              </p>
            </div>

            {selectedWithdrawal.action === 'approve' ? (
              <div className="form-group">
                <label htmlFor="approvalNotes">Approval Notes (optional)</label>
                <textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes about this approval..."
                  rows="3"
                />
                <small>Client will receive approval notification at {selectedWithdrawal.clients?.email}</small>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="rejectionReason">Rejection Reason (required)</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this withdrawal is being rejected..."
                  rows="3"
                  required
                />
                <small>Client will be notified of rejection at {selectedWithdrawal.clients?.email}</small>
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="btn btn-cancel"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={selectedWithdrawal.action === 'approve' ? handleConfirmApprove : handleConfirmReject}
                className={`btn ${selectedWithdrawal.action === 'approve' ? 'btn-approve' : 'btn-reject'}`}
                disabled={processing || (selectedWithdrawal.action === 'reject' && !rejectionReason)}
              >
                {processing ? 'Processing...' : (selectedWithdrawal.action === 'approve' ? 'Approve & Notify' : 'Reject & Notify')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
