const PAGE = document.body.dataset.page;
const assets = JSON.parse(localStorage.getItem("psc_assets") || []);

const $ = s => document.querySelector(s);
const fmt = n => "RM " + (n||0).toLocaleString("en-MY",{minimumFractionDigits:2});

/* ================= INIT ================= */
if (PAGE === "dash") {
  initDashboard();
}

function initDashboard(){
  if(!assets.length){
    updateTime();
    return;
  }

  setDefaultMonthYear();
  populateYearDropdown();
  refreshDashboard();

  $("#monthSelect")?.addEventListener("change", refreshDashboard);
  $("#yearSelect")?.addEventListener("change", refreshDashboard);
}

/* ================= DEFAULT MONTH/YEAR ================= */
function setDefaultMonthYear(){
  const soldDates = assets
    .map(a => a.SoldDate)
    .filter(Boolean)
    .sort();

  if(!soldDates.length) return;

  const latest = soldDates[soldDates.length - 1]; // YYYY-MM-DD
  const month = latest.slice(0,7);
  const year = latest.slice(0,4);

  if ($("#monthSelect")) $("#monthSelect").value = month;
  if ($("#yearSelect")) $("#yearSelect").value = year;
}

/* ================= YEAR DROPDOWN ================= */
function populateYearDropdown(){
  const years = [...new Set(
    assets
      .map(a => (a.SoldDate || "").slice(0,4))
      .filter(Boolean)
  )].sort();

  const sel = $("#yearSelect");
  if(!sel) return;

  sel.innerHTML = "";
  years.forEach(y=>{
    sel.innerHTML += `<option value="${y}">${y}</option>`;
  });
}

/* ================= REFRESH ================= */
function refreshDashboard(){
  const month = $("#monthSelect")?.value;
  const year = $("#yearSelect")?.value;

  // If your data uses "SOLD" (upper-case) elsewhere, consider normalizing:
  // const sold = assets.filter(a => String(a.Status||"").toUpperCase() === "SOLD");
  const sold = assets.filter(a => a.Status === "Sold");

  const byMonth = {};
  const byYear = {};

  sold.forEach(a=>{
    if(!a.SoldDate) return;
    const ym = a.SoldDate.slice(0,7);
    const y = a.SoldDate.slice(0,4);

    byMonth[ym] = (byMonth[ym] || 0) + 1;
    byYear[y] = (byYear[y] || 0) + 1;
  });

  /* ===== KPI ===== */
  const monthCount = month ? (byMonth[month] || 0) : 0;
  const yearCount = year ? (byYear[year] || 0) : 0;

  $("#kpiMonth").textContent = monthCount;
  $("#kpiYear").textContent = yearCount;

  /* ===== MoM ===== */
  if(month){
    const d = new Date(month + "-01");
    d.setMonth(d.getMonth() - 1);
    const prev = d.toISOString().slice(0,7);
    const diff = monthCount - (byMonth[prev] || 0);
    $("#kpiMoM").textContent = diff >= 0 ? `+${diff}` : `${diff}`;
  }

  /* ===== YoY ===== */
  if(year){
    const prev = String(Number(year) - 1);
    const diff = (byYear[year] || 0) - (byYear[prev] || 0);
    $("#kpiYoY").textContent = diff >= 0 ? `+${diff}` : `${diff}`;
  }

  renderBar($("#chartMonthly"), Object.keys(byMonth), Object.values(byMonth));
  renderBar($("#chartYearly"), Object.keys(byYear), Object.values(byYear));

  renderAgentPerformance(sold);
  updateTime();
}

/* ================= AGENT PERFORMANCE ================= */
function renderAgentPerformance(data){
  const map = {};

  data.forEach(a=>{
    const agent = a.SuccessfulAgent || "—";
    if(!map[agent]) map[agent] = {count:0,value:0,fee:0};
    map[agent].count++;
    map[agent].value += Number(a.SalePrice || 0);
    map[agent].fee += Number(a.ReferralFeeAmount || 0);
  });

  const tbody = $("#agentTable tbody");
  if(!tbody) return;

  tbody.innerHTML = "";
  Object.entries(map).forEach(([k,v])=>{
    tbody.innerHTML += 
      `<tr>
        <td>${k}</td>
        <td>${v.count}</td>
        <td>${fmt(v.value)}</td>
        <td>${fmt(v.fee)}</td>
      </tr>`;
  });
}

/* ================= SIMPLE BAR ================= */
function renderBar(el, labels, values){
  if(!el) return;
  el.innerHTML = "";

  const max = Math.max(...values,1);
  labels.forEach((l,i)=>{
    el.innerHTML += 
      `<div style="margin:6px 0">
        <small>${l}</small>
        <div style="background:#eee;border-radius:6px">
          <div style="
            width:${(values[i]/max)*100}%;
            background:#6a46ff;
            color:#fff;
            padding:4px;
            border-radius:6px">
            ${values[i]}
          </div>
        </div>
      </div>`;
  });
}

/* ================= TIME ================= */
function updateTime(){
  const t = new Date().toLocaleString();
  $("#lastUpdated") && ($("#lastUpdated").textContent = t);
  $("#footerUpdated") && ($("#footerUpdated").textContent = t);
}