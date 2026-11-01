const $c=s=>document.querySelector(s);
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const withTimeout=(p,ms=10000)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error("The request timed out. Check your connection and Supabase settings.")),ms))]);
const grid=$c("#course-grid"),det=$c("#detail");
if(grid)list();if(det)detail();
async function list(){
  const q=$c("#q"),acad=$c("#academy");let all=[];
  q.value=new URLSearchParams(location.search).get("q")||"";
  const render=()=>{const t=q.value.toLowerCase(),a=acad.value;
    const r=all.filter(c=>(!a||c.academy===a)&&(c.title+" "+(c.description||"")).toLowerCase().includes(t));
    grid.innerHTML=r.length?r.map(c=>`<a class="card" style="text-decoration:none" href="course-details.html?id=${esc(c.id)}"><span class="tag">${esc(c.academy)}</span><h3>${esc(c.title)}</h3><p class="meta">${esc(c.description)}</p><p class="meta">${esc(c.level)} · ${esc(c.instructor)} · ${esc(c.duration_hours)}h</p></a>`).join(""):`<p>${all.length?"No courses match your search. Try another word or academy.":"No courses have been published yet."}</p>`};
  q.addEventListener("input",render);acad.addEventListener("change",render);
  if(!window.configured){grid.innerHTML="<p>Supabase is not configured. Check js/config.js.</p>";return}
  try{const{data,error}=await withTimeout(sb.from("courses").select("*").eq("published",true).order("title"));
    if(error)throw error;all=data||[];render()}
  catch(e){grid.innerHTML=`<p>Could not load courses: ${esc(e.message)}. Make sure database/schema.sql has been run in Supabase.</p>`}}
async function detail(){
  const id=new URLSearchParams(location.search).get("id");
  if(!id){det.innerHTML="<p>No course selected. <a href='courses.html'>Browse courses</a>.</p>";return}
  try{
    const{data:c,error}=await withTimeout(sb.from("courses").select("*,modules(id,title,position,lessons(id,title,content,position))").eq("id",id).maybeSingle());
    if(error)throw error;if(!c){det.innerHTML="<p>Course not found. <a href='courses.html'>Browse courses</a>.</p>";return}
    const{data:{session}}=await sb.auth.getSession();let enrolled=false,done=new Set();
    if(session){const e=await sb.from("enrollments").select("id").eq("course_id",id).eq("user_id",session.user.id).maybeSingle();enrolled=!!e.data;
      if(enrolled){const p=await sb.from("lesson_progress").select("lesson_id").eq("user_id",session.user.id);done=new Set((p.data||[]).map(x=>x.lesson_id))}}
    const mods=(c.modules||[]).sort((a,b)=>a.position-b.position);
    det.innerHTML=`<span class="tag">${esc(c.academy)}</span><h1>${esc(c.title)}</h1><p class="meta">${esc(c.level)} · ${esc(c.instructor)} · ${esc(c.duration_hours)}h</p><p style="margin:12px 0;max-width:40em">${esc(c.description)}</p>
    ${enrolled?"<p class='tag'>You are enrolled</p>":`<button class="btn" id="enrol">Enrol in this course</button>`}<div id="emsg" class="msg" role="alert" style="margin-top:12px"></div>
    <h2 style="margin-top:32px">Modules</h2>${mods.length?mods.map(m=>`<div class="card" style="margin-top:12px"><h3>${esc(m.title)}</h3>${(m.lessons||[]).sort((a,b)=>a.position-b.position).map(l=>`<details><summary>${done.has(l.id)?"✓ ":""}${esc(l.title)}</summary><p style="margin:8px 0">${esc(l.content)}</p>${done.has(l.id)?"<span class='meta'>Completed</span>":`<button class="btn mark" data-l="${esc(l.id)}">Mark as completed</button>`}</details>`).join("")||(enrolled?"<p class='meta'>No lessons yet.</p>":"<p class='meta'>Enrol to view lessons.</p>")}</div>`).join(""):"<p class='meta'>Modules will appear here soon.</p>"}`;
    const em=$c("#emsg"),en=$c("#enrol");
    if(en)en.onclick=async()=>{if(!session){location.href="login.html";return}
      const{error}=await sb.from("enrollments").insert({user_id:session.user.id,course_id:id});
      if(error&&error.code!=="23505"){em.textContent="Could not enrol: "+error.message;em.className="msg err";return}
      location.href="dashboard.html"};
    det.querySelectorAll(".mark").forEach(b=>b.onclick=async()=>{
      const{error}=await sb.from("lesson_progress").insert({user_id:session.user.id,lesson_id:b.dataset.l});
      if(error&&error.code!=="23505"){em.textContent="Could not save progress: "+error.message;em.className="msg err";return}
      detail()});
  }catch(e){det.innerHTML=`<p>Could not load this course: ${esc(e.message)}</p>`}}
