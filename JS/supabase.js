const cfg=window.EDUCORE_CONFIG;
window.configured=!cfg.SUPABASE_URL.includes("YOUR-PROJECT");
window.sb=window.configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
