// Supabase client — load SDK from CDN to avoid bundling complications
import { SITE } from '@/content';

let _supabaseClient = null;

export function loadSupabase() {
  return new Promise((resolve) => {
    if (_supabaseClient) { resolve(_supabaseClient); return; }
    if (window.supabase) {
      _supabaseClient = window.supabase.createClient(SITE.supabase_url, SITE.supabase_anon_key);
      resolve(_supabaseClient);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = () => {
      _supabaseClient = window.supabase.createClient(SITE.supabase_url, SITE.supabase_anon_key);
      resolve(_supabaseClient);
    };
    document.head.appendChild(s);
  });
}

// Auth helpers
export async function signUp(email, password, metadata = {}) {
  const sb = await loadSupabase();
  return sb.auth.signUp({ email, password, options: { data: metadata } });
}

export async function signIn(email, password) {
  const sb = await loadSupabase();
  return sb.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const sb = await loadSupabase();
  return sb.auth.signOut();
}

export async function getSession() {
  const sb = await loadSupabase();
  return sb.auth.getSession();
}

export async function getUser() {
  const sb = await loadSupabase();
  const { data } = await sb.auth.getUser();
  return data?.user;
}

export async function resetPassword(email) {
  const sb = await loadSupabase();
  return sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/portal`
  });
}

// Data helpers (with RLS — users only see their own data)
export async function getMyProfile() {
  const sb = await loadSupabase();
  const user = await getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

export async function getMyDeals() {
  const sb = await loadSupabase();
  const user = await getUser();
  if (!user) return [];
  const { data } = await sb.from('deals').select('*, batches(*)').eq('client_id', user.id).order('created_at', { ascending: false });
  return data || [];
}

export async function getMyCredits() {
  const sb = await loadSupabase();
  const user = await getUser();
  if (!user) return { active: [], total: 0 };
  const { data } = await sb.from('credits').select('*').eq('client_id', user.id).eq('status', 'active').order('earned_at');
  const total = (data || []).reduce((s, c) => s + (c.balance || 0), 0);
  return { active: data || [], total };
}

export async function updateMyProfile(updates) {
  const sb = await loadSupabase();
  const user = await getUser();
  if (!user) return null;
  return sb.from('profiles').update(updates).eq('id', user.id);
}

// ============================================================
// FILE UPLOADS — Supabase Storage
// ============================================================
export async function uploadFile(file) {
  const sb = await loadSupabase();
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2,9)}.${ext}`;
  const { data, error } = await sb.storage
    .from('request-documents')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = sb.storage.from('request-documents').getPublicUrl(fileName);
  return {
    fileName: file.name,
    fileUrl: urlData.publicUrl,
    fileSize: file.size,
    fileType: file.type,
    storagePath: fileName,
  };
}

export async function saveRequestWithDocuments(requestData, files = []) {
  const sb = await loadSupabase();
  // 1. Insert the request
  const { data: req, error } = await sb.from('requests').insert(requestData).select().single();
  if (error) throw error;
  if (!req) return null;

  // 2. Upload each file to storage, then insert records
  for (const file of files) {
    try {
      const uploaded = await uploadFile(file);
      await sb.from('request_documents').insert({
        request_id: req.id,
        file_name:  uploaded.fileName,
        file_url:   uploaded.fileUrl,
        file_size:  uploaded.fileSize,
        file_type:  uploaded.fileType,
      });
    } catch (e) { console.warn('File upload failed:', file.name, e); }
  }
  return req;
}

export async function getRequestDocuments(requestId) {
  const sb = await loadSupabase();
  const { data } = await sb.from('request_documents').select('*').eq('request_id', requestId);
  return data || [];
}

// ============================================================
// EMAIL — Shared helper for EmailJS status notifications
// ============================================================
export function loadEmailJS() {
  return new Promise((resolve) => {
    if (window.emailjs) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload = () => { resolve(); };
    document.head.appendChild(s);
  });
}

export async function sendClientEmail({ clientId, subject, dealCode, model, product, quantity, price, notes }) {
  try {
    const sb = await loadSupabase();
    const { SITE } = await import('@/content');
    const { data: profile } = await sb.from('profiles').select('email, full_name, company').eq('id', clientId).single();
    if (!profile?.email) return { ok: false, reason: 'no email' };
    await loadEmailJS();
    window.emailjs.init(SITE.emailjs_public_key);
    const result = await window.emailjs.send(SITE.emailjs_service_id, SITE.emailjs_template_confirm, {
      to_email: profile.email,
      from_name: profile.full_name || profile.company || 'Client',
      reply_to: SITE.email,
      deal_code: dealCode || '',
      model: model || '',
      product: product || '',
      quantity: quantity || '',
      price: price || '',
      notes: notes || '',
    });
    return { ok: true, result };
  } catch (e) {
    console.warn('Email send failed:', e);
    return { ok: false, reason: e.message || 'unknown' };
  }
}

// ============================================================
// WAREHOUSES — load from DB with fallback to content.js
// ============================================================
export async function getWarehouses() {
  try {
    const sb = await loadSupabase();
    const { data, error } = await sb.from('warehouses').select('*').order('active', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    // Fallback to content.js warehouses if table doesn't exist yet
    const { SITE } = await import('@/content');
    return SITE.warehouses || [];
  }
}
