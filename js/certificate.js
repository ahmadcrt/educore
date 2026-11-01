const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
(async()=>{const root=document.querySelector("#cert");
  if(!window.configured){root.textContent="Supabase is not configured.";return}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){location.href="login.html";return}
  const id=new URLSearchParams(location.search).get("id");
  const{data:c,error}=await sb.from("certificates").select("id,issued_at,user_id,courses(title,academy,instructor)").eq("id",id).maybeSingle();
  if(error||!c){root.innerHTML="<p>Certificate not found. <a href='dashboard.html'>Back to dashboard</a></p>";return}
  const{data:p}=await sb.from("profiles").select("full_name").eq("id",c.user_id).maybeSingle();
  root.innerHTML=`<div class="cert"><p class="meta">EDUCORE by Ahmad</p><h1>Certificate of Completion</h1><p>This certifies that</p><p class="name">${esc(p?.full_name||"Student")}</p><p>has successfully completed</p><h2>${esc(c.courses?.title)}</h2><p class="meta">${esc(c.courses?.academy)}</p><p style="margin-top:20px">Issued ${new Date(c.issued_at).toLocaleDateString()}</p><p class="meta" style="margin-top:16px">Certificate ID: ${esc(c.id)}</p></div>`})();
