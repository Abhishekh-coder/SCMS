
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading, webbrowser

HTML = r"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CampusFix Analytics</title>
<style>
body{margin:0;background:#0b1120;color:#edf4ff;font:14px Arial;padding:24px}h1{margin-bottom:5px}p{color:#9eafc7}.panel{background:#151f30;border:1px solid #304057;border-radius:13px;padding:16px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.kpi b{font-size:28px;display:block;margin:10px 0;color:#71ccff}select,input,button{background:#0c1525;color:white;border:1px solid #394c65;border-radius:7px;padding:10px;max-width:100%}button{cursor:pointer;background:#1b4160}.bars{display:grid;gap:8px}.bar{display:grid;grid-template-columns:120px 1fr 35px;gap:8px;align-items:center;cursor:pointer}.track{background:#28364c;border-radius:8px;overflow:hidden}.fill{height:12px;background:#58b9f5}.bar:hover{color:#7ed8ff}table{border-collapse:collapse;width:100%;min-width:650px}th,td{text-align:left;padding:9px;border-bottom:1px solid #304057}th{cursor:pointer;color:#83d2ff}#table{overflow:auto;max-height:400px}.filters{display:flex;gap:8px;flex-wrap:wrap}.filters>*{flex:1;min-width:130px}.muted{color:#9eafc7;font-size:12px}@media(max-width:600px){body{padding:12px}.bar{grid-template-columns:90px 1fr 25px}}
</style></head><body>
<h1>CampusFix Analytics</h1><p>Complaint intelligence · Interactive dashboard</p>
<div class="panel"><b>Upload your CSV dataset</b><p class="muted">Data stays in your browser. No demo data is generated.</p><input type="file" id="file" accept=".csv"><button onclick="reset()">Clear filters</button><span id="msg"></span></div>
<div class="panel filters">
<select id="status"><option value="">All statuses</option></select><select id="category"><option value="">All categories</option></select><select id="department"><option value="">All departments</option></select><select id="priority"><option value="">All priorities</option></select>
<input id="from" type="date" title="From date"><input id="to" type="date" title="To date"><input id="search" placeholder="Search tickets">
</div>
<div class="grid" id="kpis"></div>
<div class="grid">
<div class="panel"><h3>Tickets by status</h3><div id="cstatus" class="bars"></div></div>
<div class="panel"><h3>Tickets by category</h3><div id="ccategory" class="bars"></div></div>
<div class="panel"><h3>Department workload</h3><div id="cdepartment" class="bars"></div></div>
<div class="panel"><h3>Priority distribution</h3><div id="cpriority" class="bars"></div></div>
</div>
<div class="panel"><h3>Timeline · Tickets by date</h3><div id="timeline" class="bars"></div></div>
<div class="panel"><h3>Ticket records</h3><p id="count"></p><button onclick="exportCSV()">Export filtered CSV</button><div id="table"></div><button onclick="page=Math.max(0,page-1);drawTable()">Previous</button> <button onclick="page++;drawTable()">Next</button><span id="pg"></span></div>
<script>
let data=[],cols=[],view=[],page=0,sort='',asc=true;
const $=id=>document.getElementById(id);
const aliases={status:['status','complaintstatus','state'],category:['category','subcategory','type'],department:['department','departmentname','team'],priority:['priority','severity'],date:['createdat','created_at','date','submittedat','timestamp'],id:['ticketnumber','ticketid','ticket_id','id']};
function norm(s){return s.toLowerCase().replace(/[^a-z0-9]/g,'')}
function col(k){return cols.find(c=>(aliases[k]||[]).includes(norm(c)))}
function val(r,k){return col(k)?String(r[col(k)]||'').trim():''}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function csv(text){let rows=[],row=[],s='',q=false;for(let i=0;i<text.length;i++){let c=text[i];if(q&&c=='"'&&text[i+1]=='"'){s+='"';i++}else if(c=='"')q=!q;else if(c==','&&!q){row.push(s);s=''}else if(c=='\n'&&!q){row.push(s.trimEnd());if(row.some(x=>x.trim()))rows.push(row);row=[];s=''}else s+=c}if(s||row.length){row.push(s.trimEnd());rows.push(row)}cols=(rows.shift()||[]).map(x=>x.trim());return rows.map(a=>Object.fromEntries(cols.map((c,i)=>[c,(a[i]||'').trim()])))}
function date(r){let d=val(r,'date');return d&& !isNaN(new Date(d))?new Date(d):null}
function day(d){return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:''}
function done(r){return /resolved|closed|complete|fixed/i.test(val(r,'status'))}
function options(k){let el=$(k);let old=el.value,vs=[...new Set(data.map(r=>val(r,k)).filter(Boolean))].sort();el.innerHTML='<option value="">All '+k+'s</option>'+vs.map(v=>`<option>${esc(v)}</option>`).join('');el.value=vs.includes(old)?old:''}
function reset(){['status','category','department','priority','search','from','to'].forEach(k=>$(k).value='');page=0;render()}
function filtered(){return data.filter(r=>['status','category','department','priority'].every(k=>!$(k).value||val(r,k)===$(k).value)&&(! $('search').value||Object.values(r).join(' ').toLowerCase().includes($('search').value.toLowerCase()))&&(! $('from').value||(date(r)&&day(date(r))>=$('from').value))&&(! $('to').value||(date(r)&&day(date(r))<=$('to').value)))}
function chart(id,k){let counts={};view.forEach(r=>{let v=val(r,k)||'(Blank)';counts[v]=(counts[v]||0)+1});let a=Object.entries(counts).sort((x,y)=>y[1]-x[1]),max=Math.max(1,...a.map(x=>x[1]));$('c'+id).innerHTML=a.length?a.map(([v,n])=>`<div class="bar" data-v="${esc(v)}"><span>${esc(v)}</span><div class="track"><div class="fill" style="width:${100*n/max}%"></div></div><span>${n}</span></div>`).join(''):'<p>No matching data</p>';document.querySelectorAll('#c'+id+' .bar').forEach(b=>b.onclick=()=>{let f=$(k);f.value=f.value===b.dataset.v?'':b.dataset.v;render()})}
function render(){view=filtered();let n=view.length,d=view.filter(done).length;let k=[['Tickets',n],['Open / active',n-d],['Resolved / closed',d],['High / critical',view.filter(r=>/high|critical|urgent/i.test(val(r,'priority'))).length],['Resolution rate',n?(100*d/n).toFixed(1)+'%':'—']];$('kpis').innerHTML=k.map(([a,b])=>`<div class="panel kpi">${a}<b>${b}</b></div>`).join('');['status','category','department','priority'].forEach(k=>chart(k,k));let ds={};view.forEach(r=>{if(date(r)){let x=day(date(r));ds[x]=(ds[x]||0)+1}});let dates=Object.keys(ds).sort();$('timeline').innerHTML=dates.length?dates.map(x=>`<div class="bar" data-date="${x}"><span>${x}</span><div class="track"><div class="fill" style="width:${100*ds[x]/Math.max(...Object.values(ds))}%"></div></div><span>${ds[x]}</span></div>`).join(''):'<p>No valid date column found</p>';document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{$('from').value=b.dataset.date;$('to').value=b.dataset.date;render()});$('count').textContent=n+' matching records';page=0;drawTable()}
function drawTable(){if(!cols.length){$('table').innerHTML='<p>Upload a CSV file to begin.</p>';return}let a=[...view];if(sort)a.sort((x,y)=>String(x[sort]||'').localeCompare(String(y[sort]||''),undefined,{numeric:true})*(asc?1:-1));let size=25,pages=Math.max(1,Math.ceil(a.length/size));page=Math.min(page,pages-1);$('pg').textContent=` Page ${page+1}/${pages}`;$('table').innerHTML='<table><thead><tr>'+cols.map(c=>`<th data-col="${esc(c)}">${esc(c)}${sort===c?(asc?' ↑':' ↓'):''}</th>`).join('')+'</tr></thead><tbody>'+a.slice(page*size,(page+1)*size).map(r=>'<tr>'+cols.map(c=>`<td>${esc(r[c])}</td>`).join('')+'</tr>').join('')+'</tbody></table>';document.querySelectorAll('th[data-col]').forEach(th=>th.onclick=()=>{if(sort===th.dataset.col)asc=!asc;else{sort=th.dataset.col;asc=true}drawTable()})}
$('file').onchange=async e=>{try{data=csv(await e.target.files[0].text());if(!cols.length||!data.length)throw Error('CSV has no data rows');['status','category','department','priority'].forEach(options);let ds=data.map(date).filter(Boolean).map(day).sort();$('from').value=ds[0]||'';$('to').value=ds.at(-1)||'';$('msg').textContent=' Loaded '+data.length+' rows';render()}catch(err){$('msg').textContent=' Error: '+err.message}};
['status','category','department','priority','from','to'].forEach(k=>$(k).onchange=render);$('search').oninput=render;
function exportCSV(){let rows=[cols,...view.map(r=>cols.map(c=>r[c]||''))];let text=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download='campusfix_filtered.csv';a.click();URL.revokeObjectURL(a.href)}
render();
</script></body></html>"""

class App(BaseHTTPRequestHandler):
    def do_GET(self):
        body = HTML.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *args): pass

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8765), App)
    url = "http://127.0.0.1:8765"
    threading.Timer(1, lambda: webbrowser.open(url)).start()
    print("CampusFix dashboard:", url, "| Stop with Ctrl+C")
    server.serve_forever()
