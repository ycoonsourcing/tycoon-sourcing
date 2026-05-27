import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { loadSupabase } from '@/lib/supabase';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Clock },
  contacted: { label: 'Contacted', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: FileText },
  quoted: { label: 'Quoted', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: CheckCircle },
  converted: { label: 'Converted to Deal', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  lost: { label: 'Not Proceeded', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: AlertCircle },
};

export default function RequestHistoryCard({ userId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const sb = await loadSupabase();
        const { data, error } = await sb
          .from('requests')
          .select('*, request_documents(id, file_name, file_url, file_size, file_type)')
          .eq('client_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setRequests(data);
        }
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRequests();
    }
  }, [userId]);

  // Subscribe to real-time updates for requests
  useEffect(() => {
    if (!userId) return;

    let channel;
    const setupSubscription = async () => {
      try {
        const sb = await loadSupabase();
        channel = sb
          .channel(`public:requests:client_id=eq.${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'requests',
              filter: `client_id=eq.${userId}`,
            },
            (payload) => {
              console.log('Request updated:', payload);
              setRequests((prev) => {
                const existing = prev.findIndex((r) => r.id === payload.new.id);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = payload.new;
                  return updated;
                }
                return [payload.new, ...prev];
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✓ Request subscription active');
            }
          });
      } catch (err) {
        console.error('Failed to setup request subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
        <Clock size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
        <FileText size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold">No service requests yet</p>
        <p className="text-xs text-slate-400 mt-1">Submit a request to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
        const StatusIcon = status.icon;
        const isExpanded = expandedId === req.id;

        return (
          <div key={req.id} className={`bg-white border rounded-2xl overflow-hidden transition-all ${status.bg}`}>
            
            {/* Header - clickable */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : req.id)}
              className="w-full p-4 flex items-start justify-between hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-start gap-3 flex-1 text-left">
                <StatusIcon size={20} className={`${status.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{req.product || 'Product request'}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {req.company} · {req.quantity} units · {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t bg-white p-4 space-y-4">
                
                {/* Request details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Model</p>
                    <p className="font-semibold text-slate-800 text-sm">{req.model || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Quantity</p>
                    <p className="font-semibold text-slate-800">{(+req.quantity || 0).toLocaleString()} units</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Estimated Price</p>
                    <p className="font-semibold text-slate-800">{req.price ? `LKR ${(+req.price).toLocaleString()}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Supplier</p>
                    <p className="font-semibold text-slate-800">{req.supplier || '—'}</p>
                  </div>
                </div>

                {/* Notes */}
                {req.notes && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Details</p>
                    <p className="text-sm text-slate-700">{req.notes}</p>
                  </div>
                )}

                {/* Attached documents */}
                {req.request_documents && req.request_documents.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Attached documents ({req.request_documents.length})</p>
                    <div className="space-y-1">
                      {req.request_documents.map(doc => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 hover:underline p-2 bg-blue-50 rounded"
                        >
                          <FileText size={14} />
                          {doc.file_name} ({(doc.file_size / 1024).toFixed(0)} KB)
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="border-t pt-3 text-xs text-slate-500">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Timeline</p>
                  <p>Submitted: {new Date(req.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
