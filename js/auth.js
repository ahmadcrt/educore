const $=s=>document.querySelector(s);
const show=(el,t,ok)=>{el.textContent=t;el.className="msg "+(ok?"ok":"err")};
const NOKEYS="Supabase is not configured. Check js/config.js.";
const dest=p=>p.role==="admin"?"admin.html":"dashboard.html";
async function ensureProfile(user,name){
  const{data,error}=await sb.from("profiles").select("id,role,full_name").eq("id",user.id).maybeSingle();
  if(error)throw error;
  if(data)return data;
  const{data:p,error:e2}=await sb.from("profiles").insert({id:user.id,full_name:name||user.user_metadata?.full_name||""}).select("id,role,full_name").single();
  if(e2)throw e2;return p}
window.ensureProfile=ensureProfile;
const login=$("#login-form"),reg=$("#register-form"),reset=$("#reset-btn");
(async()=>{
  if(!window.configured||!(login||reg))return;
  const{data}=await sb.auth.getSession();
  if(data.session){try{location.href=dest(await ensureProfile(data.session.user))}catch(e){}}})();
if(login)login.addEventListener("submit",async e=>{e.preventDefault();const m=$("#msg"),f=new FormData(login);
  if(!window.configured)return show(m,NOKEYS);
  const email=String(f.get("email")).trim();
  if(!email||!f.get("password"))return show(m,"Enter your email and password.");
  show(m,"Logging in…",true);
  try{const{data,error}=await sb.auth.signInWithPassword({email,password:f.get("password")});
    if(error)return show(m,error.message);
    location.href=dest(await ensureProfile(data.user))}catch(x){show(m,"Login failed: "+x.message)}});
if(reg)reg.addEventListener("submit",async e=>{e.preventDefault();const m=$("#msg"),f=new FormData(reg);
  if(!window.configured)return show(m,NOKEYS);
  const name=String(f.get("name")).trim(),email=String(f.get("email")).trim();
  if(name.length<2)return show(m,"Enter your full name.");
  if(!/^\S+@\S+\.\S+$/.test(email))return show(m,"Enter a valid email address.");
  if(f.get("password").length<8)return show(m,"Use a password with at least 8 characters.");
  show(m,"Creating your account…",true);
  try{const{data,error}=await sb.auth.signUp({email,password:f.get("password"),options:{data:{full_name:name},emailRedirectTo:location.origin+location.pathname.replace("register.html","login.html")}});
    if(error)return show(m,error.message);
    if(data.user&&data.user.identities&&data.user.identities.length===0)return show(m,"That email is already registered. Log in instead.");
    if(data.session){await ensureProfile(data.user,name);show(m,"Account created. Opening your dashboard…",true);location.href="dashboard.html"}
    else show(m,"Account created. Open the confirmation email we sent, then log in.",true)}catch(x){show(m,"Registration failed: "+x.message)}});
if(reset)reset.addEventListener("click",async()=>{const m=$("#msg"),email=$("#email").value.trim();
  if(!window.configured)return show(m,NOKEYS);
  if(!email)return show(m,"Enter your email above first.");
  const{error}=await sb.auth.resetPasswordForEmail(email);
  error?show(m,error.message):show(m,"Reset link sent. Check your inbox.",true)});
window.logout=async()=>{await sb.auth.signOut();location.href="index.html"};
(async()=>{const a=$("#auth-link");if(!a||!window.configured)return;
  const{data}=await sb.auth.getSession();
  if(data.session){a.textContent="Log out";a.href="#";a.onclick=e=>{e.preventDefault();logout()};
    const d=document.createElement("a");d.href="dashboard.html";d.textContent="Dashboard";a.before(d)}})();
