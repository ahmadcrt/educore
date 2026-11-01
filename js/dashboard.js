const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
(async()=>{const root=document.querySelector("#app");
  if(!window.configured){root.textContent="Supabase is not configured.";return}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){location.href="login.html";return}
  try{
    const u=session.user,p=await ensureProfile(u);
    const load=()=>Promise.all([
      sb.from("enrollments").select("course_id,courses(id,title,academy)").eq("user_id",u.id),
      sb.from("lessons").select("id,modules!inner(course_id)"),
      sb.from("lesson_progress").select("lesson_id").eq("user_id",u.id),
      sb.from("quiz_attempts").select("score,created_at,quizzes(title,pass_mark)").eq("user_id",u.id).order("created_at",{ascending:false}),
      sb.from("certificates").select("id,course_id,issued_at,courses(title)").eq("user_id",u.id)]);
    let[en,ls,pr,qa,ce]=await load();
    for(const r of[en,ls,pr,qa,ce])if(r.error)throw r.error;
    const done=new Set(pr.data.map(x=>x.lesson_id));
    const calc=()=>en.data.map(e=>{const l=ls.data.filter(x=>x.modules.course_id===e.course_id);const d=l.filter(x=>done.has(x.id)).length;
      return{...e.courses,total:l.length,done:d,pct:l.length?Math.round(d/l.length*100):0}});
    let rows=calc();
    // Ask the database to issue a certificate for every finished course (it re-checks completion itself)
    const have=new Set(ce.data.map(c=>c.course_id));
    const finished=rows.filter(r=>r.total>0&&r.pct===100&&!have.has(r.id));
    if(finished.length){for(const r of finished)await sb.rpc("issue_certificate",{p_course:r.id});
      ce=await sb.from("certificates").select("id,course_id,issued_at,courses(title)").eq("user_id",u.id);
      if(ce.error)throw ce.error}
    const next=rows.find(r=>r.pct<100)||rows[0];
    root.innerHTML=`<h1>Welcome, ${esc(p.full_name||u.email)}</h1><p class="meta">${esc(u.email)} · ${esc(p.role)}</p>
    ${next?`<div class="card" style="margin:20px 0"><h3>Continue learning</h3><p>${esc(next.title)}</p><a class="btn" href="course-details.html?id=${esc(next.id)}">Resume course</a></div>`:""}
    <h2>My courses</h2>${rows.length?`<div class="grid">${rows.map(r=>`<div class="card"><span class="tag">${esc(r.academy)}</span><h3>${esc(r.title)}</h3><div style="background:var(--line);border-radius:99px;height:8px"><div style="width:${r.pct}%;height:8px;border-radius:99px;background:var(--teal)"></div></div><p class="meta">${r.done} of ${r.total} lessons completed (${r.pct}%)</p><a href="course-details.html?id=${esc(r.id)}">Open course</a></div>`).join("")}</div>`:`<div class="card" style="margin-top:12px"><h3>You have not enrolled yet</h3><p class="meta">Pick a course to start learning.</p><a class="btn" href="courses.html">Explore courses</a></div>`}
    <h2 style="margin-top:32px">Completed lessons</h2><p>${done.size} lesson${done.size===1?"":"s"} completed.</p>
    <h2 style="margin-top:32px">Quiz results</h2>${qa.data.length?qa.data.map(a=>`<p>${esc(a.quizzes?.title)}: ${esc(a.score)}% ${a.score>=a.quizzes?.pass_mark?"(passed)":"(not passed)"}</p>`).join(""):"<p class='meta'>No quiz attempts yet.</p>"}
    <h2 style="margin-top:32px">Certificates</h2>${ce.data.length?ce.data.map(c=>`<div class="card" style="margin-bottom:12px"><h3>${esc(c.courses?.title)}</h3><p class="meta">Issued ${new Date(c.issued_at).toLocaleDateString()}</p><a class="btn" href="certificate.html?id=${esc(c.id)}">View certificate</a></div>`).join(""):"<p class='meta'>Finish every lesson in a course to earn a certificate.</p>"}
    <p style="margin-top:32px"><button class="btn ghost" onclick="logout()">Log out</button></p>`;
  }catch(e){root.innerHTML="<p>Could not load your dashboard: "+esc(e.message)+"</p>"}})();
