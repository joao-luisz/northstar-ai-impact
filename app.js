/* Ponte uses deterministic, fully synthetic demo data. No personal records are stored. */
const regions = ["Sertão Central", "Litoral Oeste", "Região Norte", "Vale do Curu", "Serra da Ibiapaba"];
const services = ["Cadastro e documentação", "Benefícios sociais", "Qualificação", "Atenção à família", "Acesso digital"];
const months = ["Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];
const base = [54, 58, 61, 59, 66, 71, 74, 78, 81, 86, 91, 96];
const demo = [];
for (let m = 0; m < 12; m++) {
  regions.forEach((region, r) => {
    const households = Math.max(12, Math.round(base[m] * [0.25, 0.22, 0.2, 0.18, 0.15][r]));
    const completionRate = [0.79, 0.73, 0.84, 0.68, 0.76][r] + (m * 0.006) - (r === 3 ? 0.012 : 0);
    const complete = Math.min(households, Math.round(households * completionRate));
    const pending = Math.max(2, Math.round(households * [0.13, 0.18, 0.1, 0.22, 0.16][r] * (1 - m * 0.018)));
    services.forEach((service, s) => {
      const count = Math.max(1, Math.round((households / 5) * [1.1, 0.84, 0.53, 0.72, 0.38][s] * (1 + ((r + s + m) % 3) * 0.08)));
      demo.push({ month: m, region, households, complete, pending, service, requests: count, open: Math.round(count * [0.32, 0.42, 0.28, 0.47, 0.37][s]), days: 16 + ((r * 3 + m * 2) % 12) });
    });
  });
}
const queueTemplates = [
  { priority: "Alta", level: "high", signal: "Encaminhamento sem retorno há +15 dias", region: "Vale do Curu", volume: 18, next: "Confirmar recebimento com a rede" },
  { priority: "Alta", level: "high", signal: "Cadastro com documentação incompleta", region: "Litoral Oeste", volume: 14, next: "Agendar atualização cadastral" },
  { priority: "Média", level: "medium", signal: "Demanda por qualificação sem oferta", region: "Sertão Central", volume: 11, next: "Revisar calendário de turmas" },
  { priority: "Média", level: "medium", signal: "Baixa cobertura de retorno registrado", region: "Vale do Curu", volume: 9, next: "Validar rotina de acompanhamento" },
  { priority: "Baixa", level: "low", signal: "Registros sem canal de contato preferido", region: "Região Norte", volume: 7, next: "Incluir pergunta no atendimento" },
  { priority: "Baixa", level: "low", signal: "Variação atípica no volume de demanda", region: "Serra da Ibiapaba", volume: 5, next: "Conferir lote recente de registros" }
];
const fmt = new Intl.NumberFormat("pt-BR");
const periodSelect = document.querySelector("#period-select");
const regionSelect = document.querySelector("#region-select");
const regionOrder = regions;
regions.forEach(region => regionSelect.add(new Option(region, region)));
let activeRows = [];
let toastTimer;

function notify(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function selectedData() {
  const period = periodSelect.value === "all" ? 12 : Number(periodSelect.value);
  const start = 12 - period;
  const region = regionSelect.value;
  return demo.filter(d => d.month >= start && (region === "all" || d.region === region));
}
function aggregate(rows) {
  const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i, households: 0, complete: 0, pending: 0, days: [] }));
  const byRegion = Object.fromEntries(regionOrder.map(r => [r, { households: 0, complete: 0, pending: 0 }]));
  const byService = Object.fromEntries(services.map(s => [s, { requests: 0, open: 0 }]));
  const seen = new Set();
  rows.forEach(d => {
    const key = `${d.month}|${d.region}`;
    if (!seen.has(key)) {
      seen.add(key);
      byMonth[d.month].households += d.households;
      byMonth[d.month].complete += d.complete;
      byMonth[d.month].pending += d.pending;
      byMonth[d.month].days.push(d.days);
      byRegion[d.region].households += d.households;
      byRegion[d.region].complete += d.complete;
      byRegion[d.region].pending += d.pending;
    }
    byService[d.service].requests += d.requests;
    byService[d.service].open += d.open;
  });
  return { byMonth, byRegion, byService };
}
function renderTrend(byMonth) {
  const span = periodSelect.value === "all" ? 12 : Number(periodSelect.value);
  const points = byMonth.slice(12 - span).filter((_, i) => i % (span > 6 ? 1 : 1) === 0);
  const max = Math.max(1, ...points.map(d => d.households));
  const x = i => (points.length === 1 ? 50 : i * 100 / (points.length - 1));
  const y = v => 92 - (v / max) * 78;
  const line = key => points.map((d, i) => `${i ? "L" : "M"} ${x(i)} ${y(d[key])}`).join(" ");
  const area = `${line("households")} L 100 100 L 0 100 Z`;
  const circles = key => points.map((d, i) => `<circle cx="${x(i)}" cy="${y(d[key])}" r="1.5"/>`).join("");
  document.querySelector("#trend-chart").innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78a789" stop-opacity=".17"/><stop offset="1" stop-color="#78a789" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#areaFill)"/><path d="${line("households")}" fill="none" stroke="#609477" stroke-width="1.25" vector-effect="non-scaling-stroke"/><path d="${line("complete")}" fill="none" stroke="#799be1" stroke-width="1.15" vector-effect="non-scaling-stroke"/><path d="${line("pending")}" fill="none" stroke="#e7a16b" stroke-width="1.15" vector-effect="non-scaling-stroke" stroke-dasharray="3 2"/>${["households", "complete", "pending"].map((key, i) => `<g fill="${["#609477", "#799be1", "#e7a16b"][i]}">${circles(key)}</g>`).join("")}</svg>`;
  const labels = points.map(d => `<span>${months[d.month]}</span>`).join("");
  document.querySelector("#trend-labels").innerHTML = labels;
  const first = points[0]?.households || 0, last = points.at(-1)?.households || 0;
  const change = first ? Math.round((last - first) / first * 100) : 0;
  document.querySelector("#trend-insight").textContent = change >= 0 ? `O volume acompanhado cresceu ${change}% no recorte. Confira se a capacidade de retorno acompanhou a procura.` : `O volume acompanhado caiu ${Math.abs(change)}% no recorte. Investigue sazonalidade antes de realocar equipe.`;
}
function render() {
  activeRows = selectedData();
  const { byMonth, byRegion, byService } = aggregate(activeRows);
  const scopedMonths = byMonth.filter(d => d.households > 0);
  const families = scopedMonths.reduce((sum, d) => sum + d.households, 0);
  const complete = scopedMonths.reduce((sum, d) => sum + d.complete, 0);
  const pending = scopedMonths.reduce((sum, d) => sum + d.pending, 0);
  const completeRate = families ? Math.round(complete / families * 100) : 0;
  const avgDays = Math.round(scopedMonths.reduce((sum, d) => sum + d.days.reduce((a, b) => a + b, 0), 0) / Math.max(1, scopedMonths.reduce((sum, d) => sum + d.days.length, 0)));
  document.querySelector("#kpi-families").textContent = fmt.format(families);
  document.querySelector("#kpi-complete").textContent = `${completeRate}%`;
  document.querySelector("#kpi-growth").textContent = `${Math.max(3, Math.round(6 + completeRate / 12))}%`;
  document.querySelector("#kpi-complete-rate").textContent = `${Math.max(1, completeRate - 68)} p.p.`;
  document.querySelector("#kpi-pending").textContent = fmt.format(pending);
  document.querySelector("#kpi-days").textContent = fmt.format(avgDays);
  renderTrend(byMonth);

  const ordered = regionOrder.map(name => ({ name, ...byRegion[name], rate: byRegion[name].households ? Math.round(byRegion[name].complete / byRegion[name].households * 100) : 0 })).sort((a, b) => b.rate - a.rate);
  const highest = Math.max(1, ...ordered.map(d => d.rate));
  document.querySelector("#region-chart").innerHTML = ordered.map(r => `<div class="region-row"><span class="region-name" title="${r.name}">${r.name}</span><div class="bar-track"><div class="bar-fill" style="width:${r.rate / highest * 100}%"></div></div><span class="region-value">${r.rate}%</span></div>`).join("");
  const lowest = ordered.at(-1);
  document.querySelector("#regional-insight-title").textContent = lowest?.name === regionSelect.value ? "Compare antes de agir" : `Ponto de atenção · ${lowest?.name || "—"}`;
  document.querySelector("#regional-insight-copy").textContent = regionSelect.value === "all" ? `${lowest?.rate || 0}% de cadastros completos. A diferença pode refletir acesso, equipe ou registro.` : `Veja se a cobertura de ${lowest?.rate || 0}% acompanha a demanda e a capacidade local.`;

  const serviceEntries = Object.entries(byService).sort((a, b) => b[1].requests - a[1].requests);
  const largest = Math.max(1, ...serviceEntries.map(([, v]) => v.requests));
  document.querySelector("#service-chart").innerHTML = serviceEntries.map(([name, v]) => `<div class="service-row"><span class="service-name" title="${name}">${name}</span><div class="stacked-bar"><i style="width:${Math.min(100, v.requests / largest * 100)}%"></i><i style="width:${v.requests ? Math.min(55, v.open / v.requests * 100) : 0}%"></i></div><span class="service-total">${fmt.format(v.requests)}</span></div>`).join("");
  const required = Math.max(83, Math.min(99, completeRate + 8));
  document.querySelector("#quality-score").textContent = `${required}/100`;
  document.querySelector("#quality-meter-fill").style.width = `${required}%`;
  document.querySelector("#quality-required").textContent = `${required}%`;
  document.querySelector("#quality-overdue").textContent = fmt.format(Math.round(pending * .34));
  const queue = queueTemplates.map(q => ({ ...q, volume: Math.max(1, Math.round(q.volume * (families / 520))) })).filter(q => regionSelect.value === "all" || q.region === regionSelect.value).slice(0, 4);
  document.querySelector("#priority-count").textContent = String(queue.length).padStart(2, "0");
  document.querySelector("#queue-badge").textContent = `${queue.length} grupos`;
  document.querySelector("#priority-table").innerHTML = queue.map(q => `<tr><td><span class="priority-label ${q.level}">${q.priority}</span></td><td>${q.signal}</td><td>${q.region}</td><td class="volume-cell">${fmt.format(q.volume)}</td><td class="next-step">${q.next}</td><td class="row-arrow">↗</td></tr>`).join("") || `<tr><td colspan="6">Nenhum grupo de atenção neste recorte.</td></tr>`;
}
function exportCsv() {
  const rows = selectedData();
  const csv = ["mes,regiao,servico,solicitacoes_abertas,em_acompanhamento,familias,cadastros_completos,encaminhamentos_pendentes", ...rows.map(d => [months[d.month], d.region, d.service, d.requests, d.open, d.households, d.complete, d.pending].join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = "ponte-dados-sinteticos.csv"; link.click(); URL.revokeObjectURL(link.href);
  notify("CSV de demonstração baixado.");
}
periodSelect.addEventListener("change", render);
regionSelect.addEventListener("change", render);
document.querySelector("#reset-btn").addEventListener("click", () => { periodSelect.value = "12"; regionSelect.value = "all"; render(); notify("Filtros restaurados."); });
document.querySelector("#export-btn").addEventListener("click", exportCsv);
document.querySelector("#queue-export").addEventListener("click", exportCsv);
document.querySelector("#action-btn").addEventListener("click", () => document.querySelector("#action-dialog").showModal());
document.querySelector(".dialog-close").addEventListener("click", () => document.querySelector("#action-dialog").close());
document.querySelector(".dialog-done").addEventListener("click", () => document.querySelector("#action-dialog").close());
document.querySelector("#service-details").addEventListener("click", () => notify("Gráfico detalhado com dados sintéticos de demonstração."));
document.querySelector("#quality-details").addEventListener("click", () => notify("Verificações: completude, duplicidade e tempo de retorno."));
document.querySelector("#view-all").addEventListener("click", () => notify("Os grupos são agregados; nenhum caso individual é exibido."));
render();
