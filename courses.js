const grid=document.querySelector("#course-grid"),q=document.querySelector("#q"),acad=document.querySelector("#academy");
let all=[];
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(){const t=q.value.toLowerCase(),a=acad.value;
  const list=all.filter(c=>(!a||c.academy===a)&&(c.title+" "+(c.description||"")).toLowerCase().includes(t));
  grid.innerHTML=list.length?list.map(c=>`<article class="card"><span class="tag">${esc(c.academy)}</span><h3>${esc(c.title)}</h3><p class="meta">${esc(c.description)}</p><p class="meta">${esc(c.level)} · ${esc(c.instructor)} · ${esc(c.duration_hours)}h</p></article>`).join(""):"<p>No courses match. Try a different search or academy.</p>"}
async function init(){
  q.value=new URLSearchParams(location.search).get("q")||"";
  if(!window.configured){grid.innerHTML="<p>Add your Supabase keys in js/config.js to load courses.</p>";return}
  const{data,error}=await sb.from("courses").select("*").eq("published",true).order("title");
  if(error){grid.innerHTML="<p>Could not load courses: "+esc(error.message)+"</p>";return}
  all=data;render()}
q.addEventListener("input",render);acad.addEventListener("change",render);init();
