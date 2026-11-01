const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const root=document.querySelector("#app");let courses=[],flash=null;
async function load(){const{data,error}=await sb.from("courses").select("id,title,modules(id,title,position,quizzes(id,title,pass_mark,quiz_questions(id,question,options,correct_index,position)))").order("title");if(error)throw error;courses=data}
function render(){
  const mods=courses.flatMap(c=>(c.modules||[]).map(m=>({...m,course:c.title})));
  const quizzes=mods.flatMap(m=>(m.quizzes||[]).map(q=>({...q,mod:m.title,course:m.course})));
  root.innerHTML=`<h1>Manage quizzes</h1><p><a href="admin.html">Back to admin</a></p>${flash?`<div class="msg ${flash.ok?"ok":"err"}" role="alert" style="margin-top:12px">${esc(flash.t)}</div>`:""}
  <h2 style="margin-top:24px">New quiz</h2>${mods.length?`<form data-form="quiz" class="card" style="gap:12px;margin-top:12px"><label>Module<select name="module">${mods.map(m=>`<option value="${esc(m.id)}">${esc(m.course)} / ${esc(m.title)}</option>`).join("")}</select></label><label>Quiz title<input name="title" required maxlength="120"></label><label>Pass mark (%)<input name="pass" type="number" min="1" max="100" value="70" required></label><button class="btn">Create quiz</button></form>`:"<p class='meta'>Add a module to a course first (Admin page).</p>"}
  <h2 style="margin-top:32px">Quizzes (${quizzes.length})</h2>${quizzes.map(q=>{const qs=(q.quiz_questions||[]).sort((a,b)=>a.position-b.position);return `<div class="card" style="margin-top:12px"><span class="tag">${esc(q.course)} / ${esc(q.mod)}</span><h3>${esc(q.title)}</h3><p class="meta">Pass mark ${esc(q.pass_mark)}% · ${qs.length} question${qs.length===1?"":"s"}</p>
  ${qs.map((x,i)=>`<div style="border-top:1px solid var(--line);padding-top:8px"><p><strong>${i+1}. ${esc(x.question)}</strong></p>${x.options.map((o,j)=>`<p class="meta">${j===x.correct_index?"✓":"○"} ${esc(o)}</p>`).join("")}<button class="btn ghost" style="padding:2px 10px;font-size:.8rem" data-act="delq" data-id="${esc(x.id)}">Remove question</button></div>`).join("")}
  <form data-form="question" data-id="${esc(q.id)}" data-n="${qs.length}" style="display:grid;gap:8px;margin-top:8px"><input name="question" placeholder="Question" required maxlength="300">${[1,2,3,4].map(n=>`<input name="o${n}" placeholder="Option ${n}" required maxlength="200">`).join("")}<label>Correct answer<select name="correct"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option><option value="3">Option 4</option></select></label><button class="btn">Add question</button></form>
  <button class="btn ghost" style="margin-top:8px;color:#9b1c1c" data-act="delquiz" data-id="${esc(q.id)}">Delete quiz</button></div>`}).join("")||"<p class='meta'>No quizzes yet.</p>"}`}
async function run(fn,ok){flash=null;try{const{error}=await fn();if(error)throw error;flash={t:ok,ok:true};await load()}catch(e){flash={t:"Failed: "+e.message,ok:false}}render();window.scrollTo({top:0,behavior:"smooth"})}
root.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;
  if(b.dataset.act==="delq"&&confirm("Remove this question?"))run(()=>sb.from("quiz_questions").delete().eq("id",b.dataset.id),"Question removed.");
  if(b.dataset.act==="delquiz"&&confirm("Delete this quiz and its questions and results?"))run(()=>sb.from("quizzes").delete().eq("id",b.dataset.id),"Quiz deleted.")});
root.addEventListener("submit",e=>{e.preventDefault();const f=e.target,d=new FormData(f);
  if(f.dataset.form==="quiz"){const p=parseInt(d.get("pass"),10);if(!(p>=1&&p<=100)){flash={t:"Pass mark must be 1 to 100.",ok:false};return render()}
    run(()=>sb.from("quizzes").insert({module_id:d.get("module"),title:String(d.get("title")).trim(),pass_mark:p}),"Quiz created. Now add questions.")}
  if(f.dataset.form==="question"){const o=[1,2,3,4].map(n=>String(d.get("o"+n)).trim());
    if(new Set(o).size<4){flash={t:"The four options must all be different.",ok:false};return render()}
    run(()=>sb.from("quiz_questions").insert({quiz_id:f.dataset.id,question:String(d.get("question")).trim(),options:o,correct_index:+d.get("correct"),position:+f.dataset.n+1}),"Question added.")}});
(async()=>{
  if(!window.configured){root.textContent="Supabase is not configured.";return}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){location.href="login.html";return}
  const{data:me}=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
  if(!me||me.role!=="admin"){location.href="dashboard.html";return}
  try{await load();render()}catch(e){root.innerHTML="<p>Could not load: "+esc(e.message)+"</p>"}})();
