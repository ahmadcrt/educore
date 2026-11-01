const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
(async()=>{const root=document.querySelector("#app");
  if(!window.configured){root.textContent="Supabase is not configured.";return}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){location.href="login.html";return}
  // Role is read from the database on every load; RLS also blocks non-admins from the data below.
  const{data:me}=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
  if(!me||me.role!=="admin"){location.href="dashboard.html";return}
  const[st,en]=await Promise.all([sb.from("profiles").select("full_name,role,created_at").order("created_at",{ascending:false}),sb.from("enrollments").select("id,profiles(full_name),courses(title)")]);
  if(st.error||en.error){root.innerHTML="<p>Could not load admin data: "+esc((st.error||en.error).message)+"</p>";return}
  root.innerHTML=`<h1>Admin</h1><h2 style="margin-top:24px">Students (${st.data.length})</h2>${st.data.map(s=>`<p>${esc(s.full_name||"(no name)")} · ${esc(s.role)}</p>`).join("")}
  <h2 style="margin-top:24px">Enrolments (${en.data.length})</h2>${en.data.map(e=>`<p>${esc(e.profiles?.full_name)} → ${esc(e.courses?.title)}</p>`).join("")||"<p class='meta'>None yet.</p>"}
  <p style="margin-top:24px"><button class="btn ghost" onclick="logout()">Log out</button></p>`})();
