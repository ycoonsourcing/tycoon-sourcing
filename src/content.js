// ============================================================
// TYCOON SOURCING — SITE CONTENT CONFIG
// Edit this file to update anything site-wide without coding.
// ============================================================
export const SITE = {
  name:        'Tycoon Sourcing',
  tagline:     'Procurement · Trade · Warehousing',
  description: 'We source, purchase, and warehouse goods for businesses across Sri Lanka and beyond.',
  entity_au:   'Tycoon Sourcing',
  entity_sl:   'Tycoon Holdings (Pvt) Ltd',
  abn:         '',
  email:       'info@tycoonsourcing.com',
  phone_au:    '+61 435 805 847',
  phone_sl:    '+94 777 30 30 91',
  whatsapp:    '61435805847',
  address_au:  '88 Waldheim St, Annerley QLD 4103, Australia',
  address_sl:  'Colombo, Sri Lanka',
  website:     'tycoonsourcing.com',

  facebook:    'https://www.facebook.com/profile.php?id=61573274925115',
  linkedin:    'https://www.linkedin.com/company/tycoon-sourcing',
  instagram:   '',

  // EmailJS
  emailjs_service_id:        'service_9ga85oq',
  emailjs_template_request:  'template_i0x9btg',
  emailjs_template_confirm:  'template_ud6ymz7',
  emailjs_public_key:        'oAueGQxL_SRw3B6yM',

  // Tawk.to
  tawkto_property_id: '69e06e834ab3801c353651bf',
  tawkto_widget_id:   '1jmaavd0b',

  // Supabase — backend for auth + database
  supabase_url:       'https://unwlenldewsifnrjdagk.supabase.co',
  supabase_anon_key:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud2xlbmxkZXdzaWZucmpkYWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDAwODgsImV4cCI6MjA5MjA3NjA4OH0.JfOiGF89AWWcKN0sJTIWGlgR6lgg93ggE1BSGkQgg0Q',

  // Model 1 fees
  m1_deposit_pct:     20,
  m1_deposit_floor:   15,   // minimum deposit even with full credit applied
  m1_handling_pct:    3,
  m1_service_fee_pct: 4,
  m1_window_days:     90,

  // Model 2 fees
  m2_fee_pct:     1,
  m2_min_fee_lkr: 20000,

  // Tycoon Rewards — deposit credit system
  rewards_credit_pct:    5,   // % of completed deal value earned as credit
  rewards_expiry_months: 12,  // credits expire after X months

  // Default currency: LKR only
  default_currency: 'LKR',
  rate_lkr: 200,

  // Warehouses — update cbm_rate as actual Sri Lanka rates
  warehouses: [
    { id:'wh-col', name:'Colombo Main',   location:'Colombo, Sri Lanka',  cbm_rate:140, wholesale:140, capacity_cbm:200, type:'Owned',   active:true  },
    { id:'wh-kan', name:'Kandy Hub',      location:'Kandy, Sri Lanka',    cbm_rate:130, wholesale:80,  capacity_cbm:80,  type:'Partner', active:false },
    { id:'wh-gal', name:'Galle Southern', location:'Galle, Sri Lanka',    cbm_rate:120, wholesale:70,  capacity_cbm:60,  type:'Partner', active:false },
    { id:'wh-neg', name:'Negombo Hub',    location:'Negombo, Sri Lanka',  cbm_rate:124, wholesale:76,  capacity_cbm:70,  type:'Partner', active:false },
    { id:'wh-jaf', name:'Jaffna North',   location:'Jaffna, Sri Lanka',   cbm_rate:116, wholesale:66,  capacity_cbm:50,  type:'Partner', active:false },
  ],
};
