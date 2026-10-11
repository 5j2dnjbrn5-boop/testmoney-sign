const KEY="moneysync.transactions.v1",THEME="moneysync.theme.v1";
let rows=load();
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB"}).format(Number(n)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(rows))}
function monthKey(d=new Date()){return d.toISOString().slice(0,7)}
function render(){
 const mk=monthKey(), cur=rows.filter(r=>r.date.slice(0,7)===mk);
 const inc=cur.filter(r=>r.type==="income").reduce((a,r)=>a+Number(r.amount),0);
 const exp=cur.filter(r=>r.type==="expense").reduce((a,r)=>a+Number(r.amount),0);
 const ai=rows.filter(r=>r.type==="income").reduce((a,r)=>a+Number(r.amount),0);
 const ae=rows.filter(r=>r.type==="expense").reduce((a,r)=>a+Number(r.amount),0);
 $("balance").textContent=money(ai-ae);$("income").textContent=money(inc);$("expense").textContent=money(exp);
 const q=$("search").value.trim().toLowerCase();
 const shown=rows.filter(r=>[r.title,r.category,r.note].some(v=>String(v||"").toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
 $("transactions").innerHTML=shown.length?shown.map(txHtml).join(""):`<p class="muted">ยังไม่มีรายการ</p>`;
 const cats={};cur.filter(r=>r.type==="expense").forEach(r=>cats[r.category]=(cats[r.category]||0)+Number(r.amount));
 $("categories").innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="category-row"><span>${esc(k)}</span><strong>${money(v)}</strong></div>`).join("")||`<p class="muted">ยังไม่มีรายจ่ายเดือนนี้</p>`;
 draw("chart",inc,exp);
}
function txHtml(r){return `<div class="transaction"><div class="tx-icon">${r.type==="income"?"🟢":"🔴"}</div><div><div class="tx-title">${esc(r.title)}</div><div class="tx-meta">${esc(r.category)} • ${esc(r.date)}${r.note?` • ${esc(r.note)}`:""}</div></div><div class="tx-amount ${r.type}">${r.type==="income"?"+":"−"}${money(r.amount)}</div><button class="delete" onclick="delTx('${r.id}')">×</button></div>`}
function draw(id,inc,exp){
 const c=$(id),ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
 const max=Math.max(inc,exp,1),base=h-35,bw=Math.min(100,w/4),gap=40;
 [[inc,"รายรับ","#16824b"],[exp,"รายจ่าย","#c0392b"]].forEach((x,i)=>{const bh=x[0]/max*(h-75),xp=w/2-bw-gap/2+i*(bw+gap);ctx.fillStyle=x[2];ctx.fillRect(xp,base-bh,bw,bh);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.textAlign="center";ctx.font="13px sans-serif";ctx.fillText(x[1],xp+bw/2,h-12);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--text");ctx.font="bold 13px sans-serif";ctx.fillText(money(x[0]),xp+bw/2,Math.max(18,base-bh-8))})
}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
$("form").addEventListener("submit",e=>{e.preventDefault();const type=document.querySelector('input[name="type"]:checked').value;rows.push({id:crypto.randomUUID(),type,amount:Number($("amount").value),title:$("title").value.trim(),category:$("category").value,date:$("date").value,note:$("note").value.trim(),createdAt:Date.now()});save();e.target.reset();$("date").valueAsDate=new Date();render();toast("บันทึกแล้ว ✓")});
window.delTx=id=>{if(confirm("ลบรายการนี้ใช่ไหม?")){rows=rows.filter(r=>r.id!==id);save();render();toast("ลบแล้ว")}};
$("search").addEventListener("input",render);
$("date").valueAsDate=new Date();
$("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem(THEME,document.body.classList.contains("dark")?"dark":"light")});
if(localStorage.getItem(THEME)==="dark")document.body.classList.add("dark");

function encodeShare(obj){const bytes=new TextEncoder().encode(JSON.stringify(obj));let bin="";bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function buildShare(){
 const range=$("shareRange").value,notes=$("shareNotes").value==="yes",data=range==="month"?rows.filter(r=>r.date.slice(0,7)===monthKey()):rows;
 const payload={v:1,createdAt:new Date().toISOString(),range,notes,transactions:data.map(r=>notes?r:{...r,note:""})};
 return location.origin+location.pathname.replace(/\/[^/]*$/,"/")+"share.html#"+encodeShare(payload);
}
$("shareBtn").addEventListener("click",()=>{const u=buildShare();$("shareUrl").value=u;$("shareResult").classList.remove("hidden");toast("สร้างลิงก์แล้ว ✓")});
$("copyBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("shareUrl").value);toast("คัดลอกแล้ว ✓")}catch{$("shareUrl").select();document.execCommand("copy");toast("คัดลอกแล้ว ✓")}});
$("openShareBtn").addEventListener("click",()=>location.href=$("shareUrl").value);
render();