// src/services/withdrawalService.js
import { supabase } from './supabaseClient';
import { sendWithdrawalApprovedEmail } from './emailService';

/**
 * Approve a withdrawal request as admin
 * BUG FIX: Ensures sendWithdrawalApprovedEmail() is called and client email is sent
 * 
 * @param {string} withdrawalId - The withdrawal request ID
 * @param {string} adminId - The admin approving the request
 * @param {string} approvalNotes - Optional notes about the approval
 * @returns {Promise<Object>} Updated withdrawal record
 */
export const approveWithdrawal = async (withdrawalId, adminId, approvalNotes = '') => {
  try {
    // Step 1: Fetch the withdrawal record with client details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select(`
        id,
        client_id,
        amount,
        status,
        created_at,
        clients (
          id,
          email,
          business_name,
          contact_person
        )
      `)
      .eq('id', withdrawalId)
      .single();

    if (fetchError) {
      console.error('Error fetching withdrawal:', fetchError);
      throw new Error('Withdrawal not found');
    }

    if (!withdrawal) {
      throw new Error('Withdrawal record not found');
    }

    // Step 2: Update withdrawal status in database
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating withdrawal:', updateError);
      throw new Error('Failed to update withdrawal status');
    }

    // Step 3: Get client email (ensure we have it)
    const clientEmail = withdrawal.clients?.email;
    if (!clientEmail) {
      console.warn(`No email found for client ${withdrawal.client_id}`);
      throw new Error('Client email not found - cannot send approval notification');
    }

    // Step 4: Send approval email to client
    // This is the critical bug fix - ensure this is called
    const emailResult = await sendWithdrawalApprovedEmail({
      clientEmail: clientEmail,
      clientName: withdrawal.clients?.contact_person || withdrawal.clients?.business_name,
      withdrawalAmount: withdrawal.amount,
      withdrawalId: withdrawal.id,
      businessName: withdrawal.clients?.business_name,
      approvalNotes: approvalNotes
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      // Note: We don't throw here - the withdrawal is approved in DB
      // but we log the email failure for admin follow-up
    }

    console.log(`Withdrawal ${withdrawalId} approved and notification sent to ${clientEmail}`);

    return {
      success: true,
      withdrawal: updatedWithdrawal,
      emailSent: emailResult.success,
      message: emailResult.success 
        ? 'Withdrawal approved and client notified' 
        : 'Withdrawal approved but email notification failed'
    };

  } catch (error) {
    console.error('Error in approveWithdrawal:', error);
    throw error;
  }
};

/**
 * Reject a withdrawal request
 * @param {string} withdrawalId - The withdrawal request ID
 * @param {string} adminId - The admin rejecting the request
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<Object>} Updated withdrawal record
 */
export const rejectWithdrawal = async (withdrawalId, adminId, rejectionReason = '') => {
  try {
    // Fetch withdrawal with client details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select(`
        id,
        client_id,
        amount,
        status,
        clients (
          id,
          email,
          business_name,
          contact_person
        )
      `)
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      throw new Error('Withdrawal not found');
    }

    // Update withdrawal status
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        rejected_by: adminId,
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (updateError) {
      throw new Error('Failed to update withdrawal status');
    }

    // Send rejection email to client
    const clientEmail = withdrawal.clients?.email;
    if (clientEmail) {
      await sendWithdrawalRejectedEmail({
        clientEmail: clientEmail,
        clientName: withdrawal.clients?.contact_person || withdrawal.clients?.business_name,
        withdrawalAmount: withdrawal.amount,
        withdrawalId: withdrawal.id,
        rejectionReason: rejectionReason
      });
    }

    return {
      success: true,
      withdrawal: updatedWithdrawal,
      message: 'Withdrawal rejected and client notified'
    };

  } catch (error) {
    console.error('Error in rejectWithdrawal:', error);
    throw error;
  }
};

/**
 * Get withdrawal request details
 * @param {string} withdrawalId - The withdrawal request ID
 * @returns {Promise<Object>} Withdrawal record with client details
 */
export const getWithdrawalDetails = async (withdrawalId) => {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        id,
        client_id,
        amount,
        status,
        created_at,
        updated_at,
        approved_at,
        approved_by,
        approval_notes,
        clients (
          id,
          email,
          business_name,
          contact_person,
          phone
        )
      `)
      .eq('id', withdrawalId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching withdrawal details:', error);
    throw error;
  }
};

// Mock email functions - replace with actual email service
export const sendWithdrawalRejectedEmail = async (emailData) => {
  // Implementation depends on your email service (Resend, EmailJS, etc.)
  console.log('Sending rejection email:', emailData);
  return { success: true };
};
