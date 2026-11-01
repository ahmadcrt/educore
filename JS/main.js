const s=document.querySelector("#home-search");
if(s)s.addEventListener("submit",e=>{e.preventDefault();location.href="courses.html?q="+encodeURIComponent(s.q.value)});
document.querySelectorAll("[data-year]").forEach(e=>e.textContent=new Date().getFullYear());
