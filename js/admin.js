const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ACAD=["Technology & Programming","Financial Markets & Trading","Digital Business & Marketing"],LEVELS=["Beginner","Intermediate","Advanced"];
const root=document.querySelector("#app");
let courses=[],students=[],enrols=[],editId=null,openId=null,flash=null;
const opts=(arr,v)=>arr.map(a=>`<option${a===v?" selected":""}>${esc(a)}</option>`).join("");
async function load(){
  const[c,s,e]=await Promise.all([
    sb.from("courses").select("*,modules(id,title,position,lessons(id,title,content,position))").order("created_at",{ascending:false}),
    sb.from("profiles").select("full_name,role,created_at").order("created_at",{ascending:false}),
    sb.from("enrollments").select("id,profiles(full_name),courses(title)")]);
  const err=c.error||s.error||e.error;if(err)throw err;
  courses=c.data;students=s.data;enrols=e.data}
function render(){
  const ed=courses.find(c=>c.id===editId)||{};
  root.innerHTML=`<h1>Admin</h1>${flash?`<div class="msg ${flash.ok?"ok":"err"}" role="alert" style="margin-top:12px">${esc(flash.t)}</div>`:""}
  <h2 style="margin-top:24px">${editId?"Edit course":"New course"}</h2>
  <form data-form="course" class="card" style="gap:12px;margin-top:12px">
    <label>Title<input name="title" required maxlength="120" value="${esc(ed.title)}"></label>
    <label>Academy<select name="academy">${opts(ACAD,ed.academy)}</select></label>
    <label>Level<select name="level">${opts(LEVELS,ed.level)}</select></label>
    <label>Instructor<input name="instructor" maxlength="80" value="${esc(ed.instructor)}"></label>
    <label>Duration (hours)<input name="hours" type="number" min="1" max="500" value="${esc(ed.duration_hours||"")}"></label>
    <label>Description<textarea name="description" rows="3" maxlength="600">${esc(ed.description)}</textarea></label>
    <label style="display:flex;gap:8px;align-items:center"><input name="published" type="checkbox" style="width:auto"${ed.published?" checked":""}> Published (visible to students)</label>
    <button class="btn">${editId?"Save changes":"Create course"}</button>
    ${editId?`<button type="button" class="btn ghost" data-act="cancel">Cancel editing</button>`:""}
  </form>
  <h2 style="margin-top:32px">Courses (${courses.length})</h2>
  ${courses.map(c=>{const mods=(c.modules||[]).sort((a,b)=>a.position-b.position);return `<div class="card" style="margin-top:12px">
    <span class="tag">${esc(c.academy)}</span><h3>${esc(c.title)}</h3>
    <p class="meta">${esc(c.level)} · ${esc(c.instructor)} · ${esc(c.duration_hours)}h · ${c.published?"Published":"Draft"}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ghost" data-act="edit" data-id="${esc(c.id)}">Edit</button>
      <button class="btn ghost" data-act="toggle" data-id="${esc(c.id)}">${c.published?"Unpublish":"Publish"}</button>
      <button class="btn ghost" data-act="open" data-id="${esc(c.id)}">${openId===c.id?"Hide content":"Modules & lessons"}</button>
      <button class="btn ghost" style="color:#9b1c1c" data-act="del" data-id="${esc(c.id)}">Delete</button></div>
    ${openId===c.id?`<div style="margin-top:12px">${mods.map(m=>`<div class="card" style="margin-top:8px"><strong>${esc(m.title)}</strong>
      ${(m.lessons||[]).sort((a,b)=>a.position-b.position).map(l=>`<p class="meta">• ${esc(l.title)} <button class="btn ghost" style="padding:2px 8px;font-size:.8rem" data-act="dellesson" data-id="${esc(l.id)}">Remove</button></p>`).join("")||"<p class='meta'>No lessons yet.</p>"}
      <form data-form="lesson" data-id="${esc(m.id)}" data-n="${(m.lessons||[]).length}" style="display:grid;gap:8px;margin-top:8px"><input name="title" placeholder="New lesson title" required maxlength="120"><textarea name="content" rows="2" placeholder="Lesson content" maxlength="3000"></textarea><button class="btn">Add lesson</button></form>
      <button class="btn ghost" style="margin-top:8px;color:#9b1c1c" data-act="delmod" data-id="${esc(m.id)}">Delete module</button></div>`).join("")}
      <form data-form="module" data-id="${esc(c.id)}" data-n="${mods.length}" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><input name="title" placeholder="New module title" required maxlength="120" style="flex:1;min-width:180px"><button class="btn">Add module</button></form></div>`:""}
  </div>`}).join("")||"<p class='meta'>No courses yet.</p>"}
  <h2 style="margin-top:32px">Students (${students.length})</h2>${students.map(s=>`<p>${esc(s.full_name||"(no name)")} · ${esc(s.role)}</p>`).join("")}
  <h2 style="margin-top:24px">Enrolments (${enrols.length})</h2>${enrols.map(e=>`<p>${esc(e.profiles?.full_name)} → ${esc(e.courses?.title)}</p>`).join("")||"<p class='meta'>None yet.</p>"}
  <p style="margin-top:24px"><button class="btn ghost" onclick="logout()">Log out</button></p>`}
async function run(fn,okText){flash=null;
  try{const{error}=await fn();if(error)throw error;flash={t:okText,ok:true};await load()}
  catch(e){flash={t:"Failed: "+e.message,ok:false}}
  render();window.scrollTo({top:0,behavior:"smooth"})}
root.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const id=b.dataset.id,c=courses.find(x=>x.id===id);
  switch(b.dataset.act){
    case"edit":editId=id;flash=null;render();window.scrollTo({top:0,behavior:"smooth"});break;
    case"cancel":editId=null;render();break;
    case"open":openId=openId===id?null:id;render();break;
    case"toggle":run(()=>sb.from("courses").update({published:!c.published}).eq("id",id),c.published?"Course unpublished.":"Course published.");break;
    case"del":if(confirm(`Delete "${c.title}"? This also deletes its modules, lessons, enrolments and progress.`))run(()=>sb.from("courses").delete().eq("id",id),"Course deleted.");break;
    case"delmod":if(confirm("Delete this module and its lessons?"))run(()=>sb.from("modules").delete().eq("id",id),"Module deleted.");break;
    case"dellesson":if(confirm("Remove this lesson?"))run(()=>sb.from("lessons").delete().eq("id",id),"Lesson removed.");break}});
root.addEventListener("submit",e=>{e.preventDefault();const f=e.target,d=new FormData(f),k=f.dataset.form;
  if(k==="course"){const title=String(d.get("title")).trim(),h=parseInt(d.get("hours"),10);
    if(title.length<3){flash={t:"Title must be at least 3 characters.",ok:false};return render()}
    if(!(h>0)){flash={t:"Enter the course duration in hours (1 or more).",ok:false};return render()}
    const row={title,academy:d.get("academy"),level:d.get("level"),instructor:String(d.get("instructor")).trim(),duration_hours:h,description:String(d.get("description")).trim(),published:d.get("published")==="on"};
    const was=editId;editId=null;
    run(()=>was?sb.from("courses").update(row).eq("id",was):sb.from("courses").insert(row),was?"Course updated.":"Course created. Use Modules & lessons to add content.")}
  if(k==="module")run(()=>sb.from("modules").insert({course_id:f.dataset.id,title:String(d.get("title")).trim(),position:+f.dataset.n+1}),"Module added.");
  if(k==="lesson")run(()=>sb.from("lessons").insert({module_id:f.dataset.id,title:String(d.get("title")).trim(),content:String(d.get("content")).trim(),position:+f.dataset.n+1}),"Lesson added.")});
(async()=>{
  if(!window.configured){root.textContent="Supabase is not configured.";return}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){location.href="login.html";return}
  const{data:me}=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
  if(!me||me.role!=="admin"){location.href="dashboard.html";return}
  try{await load();render()}catch(e){root.innerHTML="<p>Could not load admin data: "+esc(e.message)+"</p>"}})();
