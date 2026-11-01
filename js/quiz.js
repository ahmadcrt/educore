const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
(async()=>{const root=document.querySelector("#app");
  if(!window.configured){root.textContent="Supabase is not configured.";return}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){location.href="login.html";return}
  const id=new URLSearchParams(location.search).get("id");
  try{
    if(!id){
      const{data,error}=await sb.from("quizzes").select("id,title,pass_mark,modules!inner(title,courses(title))");
      if(error)throw error;
      root.innerHTML=`<h1>My quizzes</h1>${data.length?`<div class="grid">${data.map(q=>`<div class="card"><span class="tag">${esc(q.modules.courses?.title)}</span><h3>${esc(q.title)}</h3><p class="meta">${esc(q.modules.title)} · pass mark ${esc(q.pass_mark)}%</p><a class="btn" href="quiz.html?id=${esc(q.id)}">Take quiz</a></div>`).join("")}</div>`:"<p class='meta' style='margin-top:12px'>No quizzes yet. Quizzes appear here for courses you are enrolled in. <a href='courses.html'>Browse courses</a></p>"}<p style="margin-top:24px"><a href="dashboard.html">Back to dashboard</a></p>`;return}
    const[qz,qs]=await Promise.all([sb.from("quizzes").select("title,pass_mark").eq("id",id).maybeSingle(),sb.rpc("get_quiz_questions",{p_quiz:id})]);
    if(qs.error)throw qs.error;
    if(!qz.data||!qs.data.length){root.innerHTML="<p>This quiz is unavailable. Make sure you are enrolled in the course. <a href='quiz.html'>Back to quizzes</a></p>";return}
    root.innerHTML=`<h1>${esc(qz.data.title)}</h1><p class="meta">Pass mark ${esc(qz.data.pass_mark)}%</p>
    <form id="qf" style="display:grid;gap:16px;margin-top:16px">${qs.data.map((q,i)=>`<fieldset class="card"><legend><strong>${i+1}. ${esc(q.question)}</strong></legend>${q.options.map((o,j)=>`<label style="display:flex;gap:8px;font-weight:400"><input type="radio" name="${esc(q.id)}" value="${j}" style="width:auto"> ${esc(o)}</label>`).join("")}</fieldset>`).join("")}
    <div id="msg" class="msg" role="alert"></div><button class="btn">Submit answers</button></form><div id="res"></div>`;
    const f=document.querySelector("#qf"),m=document.querySelector("#msg");
    f.addEventListener("submit",async e=>{e.preventDefault();const a={};
      for(const q of qs.data){const v=f.querySelector(`input[name="${q.id}"]:checked`);if(!v){m.textContent="Answer every question before submitting.";m.className="msg err";return}a[q.id]=+v.value}
      f.querySelector("button").disabled=true;
      const{data,error}=await sb.rpc("submit_quiz",{p_quiz:id,p_answers:a});
      if(error){m.textContent="Could not submit: "+error.message;m.className="msg err";f.querySelector("button").disabled=false;return}
      f.style.display="none";
      document.querySelector("#res").innerHTML=`<div class="card" style="margin-top:16px"><h2>${data.passed?"Passed":"Not passed yet"}</h2><p>You scored ${esc(data.score)}% (${esc(data.correct)} of ${esc(data.total)} correct). Pass mark: ${esc(data.pass_mark)}%.</p><a class="btn" href="quiz.html?id=${esc(id)}">Try again</a> <a href="dashboard.html">Back to dashboard</a></div>`});
  }catch(e){root.innerHTML="<p>Could not load quizzes: "+esc(e.message)+"</p>"}})();
