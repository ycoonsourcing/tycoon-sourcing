import React, { useState } from 'react';
import { X, Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { loadSupabase, sendClientEmail, getUser } from '@/lib/supabase';
import { SITE } from '@/content';

const DOCUMENT_TYPES = [
  { val: 'nic', label: 'National ID Card (NIC)', required: true },
  { val: 'business_license', label: 'Business License / Registration', required: true },
  { val: 'bank_statement', label: 'Bank Statement (recent)', required: false },
  { val: 'tax_id', label: 'Tax ID / VAT Certificate', required: false },
  { val: 'other', label: 'Other supporting documents', required: false },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

export default function OnboardingFormModal({ open, onClose, user, onSuccess }) {
  const [step, setStep] = useState(1); // 1: form, 2: documents, 3: review
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [files, setFiles] = useState({});

  const [form, setForm] = useState({
    business_name: user?.company || '',
    business_type: '',
    business_address: user?.address || '',
    business_district: user?.district || '',
    phone_verified: user?.phone || '',
    nic_number: user?.nic || '',
    business_registration_number: '',
    annual_turnover: '',
    average_monthly_orders: '',
    primary_products: '',
    terms_accepted: false,
  });

  const handleFormChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrMsg('');
  };

  const handleFileSelect = (docType, file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setErrMsg(`File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.`);
      return;
    }
    setFiles(f => ({ ...f, [docType]: file }));
  };

  const validateStep1 = () => {
    if (!form.business_name) { setErrMsg('Business name required'); return false; }
    if (!form.business_type) { setErrMsg('Business type required'); return false; }
    if (!form.nic_number) { setErrMsg('NIC number required'); return false; }
    if (!form.terms_accepted) { setErrMsg('You must accept the terms'); return false; }
    return true;
  };

  const validateStep2 = () => {
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required).map(d => d.val);
    const missingDocs = requiredDocs.filter(doc => !files[doc]);
    if (missingDocs.length > 0) {
      setErrMsg(`Please upload required documents: ${missingDocs.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }
    
    // Submit step 3
    setLoading(true);
    setErrMsg('');
    setSuccessMsg('');
    
    try {
      const sb = await loadSupabase();
      const curUser = await getUser();
      
      // Upload documents to Supabase Storage
      const uploadedDocs = [];
      for (const [docType, file] of Object.entries(files)) {
        if (!file) continue;
        
        const filePath = `kyc/${curUser.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await sb.storage
          .from('documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = sb.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        uploadedDocs.push({
          client_id: curUser.id,
          document_type: docType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          status: 'pending',
        });
      }
      
      // Save KYC documents
      if (uploadedDocs.length > 0) {
        const { error: docError } = await sb
          .from('kyc_documents')
          .insert(uploadedDocs);
        if (docError) throw docError;
      }
      
      // Update profile with onboarding info
      const { error: profileError } = await sb
        .from('profiles')
        .update({
          company: form.business_name,
          address: form.business_address,
          district: form.business_district,
          nic: form.nic_number,
          kyc_status: 'pending_review',
          status: 'pending',
        })
        .eq('id', curUser.id);
      
      if (profileError) throw profileError;
      
      // Send notification to admin
      await sb.from('notifications').insert({
        client_id: null,
        type: 'warning',
        message: `New client onboarding: ${form.business_name} (${user.email}) - requires KYC review`,
        metadata: { client_id: curUser.id, action: 'review_kyc' },
      });
      
      // Send email to client
      try {
        await sendClientEmail({
          client_email: user.email,
          client_name: user.full_name || form.business_name,
          subject: 'KYC Application Submitted',
          message: `Your KYC documents have been received. Our team will review them within 24-48 hours. You'll receive an email once verified.`,
        });
      } catch (emailErr) {
        console.error('Email send failed:', emailErr);
      }
      
      setSuccessMsg('✓ Onboarding submitted! We\'ll review your documents and notify you within 24-48 hours.');
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);
      
    } catch (err) {
      setErrMsg(err.message || 'Failed to submit onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Client Onboarding</h2>
            <p className="text-sm text-blue-100 mt-1">Step {step} of 3: {step === 1 ? 'Business Details' : step === 2 ? 'Documents' : 'Review & Submit'}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-200">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Error/Success messages */}
          {errMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          )}

          {/* STEP 1: Business Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={e => handleFormChange('business_name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Type *</label>
                <select
                  required
                  value={form.business_type}
                  onChange={e => handleFormChange('business_type', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                >
                  <option value="">Select type...</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="importer">Importer</option>
                  <option value="exporter">Exporter</option>
                  <option value="distributor">Distributor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIC / ID Number *</label>
                <input
                  type="text"
                  required
                  value={form.nic_number}
                  onChange={e => handleFormChange('nic_number', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  placeholder="Your National ID number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Address</label>
                <input
                  type="text"
                  value={form.business_address}
                  onChange={e => handleFormChange('business_address', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">District</label>
                <input
                  type="text"
                  value={form.business_district}
                  onChange={e => handleFormChange('business_district', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  placeholder="Your district"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Products</label>
                <input
                  type="text"
                  value={form.primary_products}
                  onChange={e => handleFormChange('primary_products', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                  placeholder="What products do you trade in?"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terms_accepted}
                  onChange={e => handleFormChange('terms_accepted', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-slate-600">
                  I confirm that the information provided is accurate and authorize Tycoon Sourcing to verify these details.
                </span>
              </label>
            </div>
          )}

          {/* STEP 2: Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                Please upload the required documents. Maximum file size: 10MB. Accepted formats: PDF, JPG, PNG, DOC, DOCX
              </p>
              
              {DOCUMENT_TYPES.map(docType => (
                <div key={docType.val} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">{docType.label}</label>
                      {docType.required && <span className="text-xs text-red-600 font-semibold">Required</span>}
                    </div>
                    {files[docType.val] && <span className="text-xs font-semibold text-green-600">✓ Uploaded</span>}
                  </div>
                  
                  {files[docType.val] ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-green-600" />
                        <span className="text-sm font-semibold text-green-700">{files[docType.val].name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileSelect(docType.val, null)}
                        className="text-xs text-red-600 hover:bg-red-100 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Upload size={16} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-600">Click to upload</span>
                      <input
                        type="file"
                        accept={ACCEPTED_TYPES}
                        onChange={e => handleFileSelect(docType.val, e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Review Your Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-slate-700">Business:</span> {form.business_name}</p>
                  <p><span className="font-semibold text-slate-700">Type:</span> {form.business_type}</p>
                  <p><span className="font-semibold text-slate-700">NIC:</span> {form.nic_number}</p>
                  {form.primary_products && <p><span className="font-semibold text-slate-700">Products:</span> {form.primary_products}</p>}
                  <p className="text-xs text-slate-600 mt-4">
                    {Object.values(files).filter(Boolean).length} document{Object.values(files).filter(Boolean).length !== 1 ? 's' : ''} ready for upload
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                ⏱ Your application will be reviewed within 24-48 hours. You'll receive an email confirmation once verified.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-4 py-2.5 text-slate-700 font-semibold border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {step === 3 ? 'Submit Onboarding' : step === 2 ? 'Review' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
