let series = [];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const percent = value => `${value.toFixed(1)}%`;
const byId = id => document.getElementById(id);
const period = byId("period");
const segment = byId("segment");
const slider = byId("volume-slider");
let activeRows = [];
let toastTimer;

function toast(message) {
  const el = byId("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
function filteredRows() {
  const duration = period.value === "all" ? 13 : Math.ceil(Number(period.value) / 7);
  const selected = series.filter(row => segment.value === "all" || row.queue === segment.value);
  const weeks = [...new Set(selected.map(row => row.week))].sort((a, b) => a - b).slice(-duration);
  return weeks.map(week => {
    const group = selected.filter(row => row.week === week);
    const volume = group.reduce((sum, row) => sum + row.volume, 0);
    const weighted = key => group.reduce((sum, row) => sum + row[key] * row.volume, 0) / Math.max(1, volume);
    return { week, label: group[0].label, volume, resolution: weighted("resolution"), grounded: weighted("grounded"), handoff: weighted("handoff"), latency: weighted("latency"), modelCost: weighted("modelCost") };
  });
}
function average(rows, key) { return rows.length ? rows.reduce((total, row) => total + row[key], 0) / rows.length : 0; }
function last(rows, key) { return rows.at(-1)?.[key] || 0; }
function valueModel(volume, resolution = 0.735, modelCost = 0.12, labor = 3.8) {
  const platform = 8900;
  const aiCost = volume * (modelCost + (1 - resolution) * labor) + platform;
  const humanBaseline = volume * labor;
  return { humanBaseline, aiCost, net: humanBaseline - aiCost };
}
function percentChange(current, previous, invert = false) {
  if (!previous) return "—";
  const delta = ((current - previous) / previous) * 100;
  const beneficial = invert ? delta < 0 : delta > 0;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% ${beneficial ? "vs prior" : "vs prior"}`;
}
function setDelta(id, text, inverse = false, current = 1, previous = 1) {
  const el = byId(id);
  el.textContent = text;
  el.classList.toggle("negative", inverse ? current > previous : current < previous);
  el.classList.toggle("positive", inverse ? current <= previous : current >= previous);
}
function chartLine(rows, key, top, bottom, min = 70, max = 100) {
  const width = 800;
  const x = index => rows.length === 1 ? width / 2 : index * width / (rows.length - 1);
  const y = value => bottom - (value - min) / (max - min) * (bottom - top);
  const points = rows.map((row, index) => [x(index), y(row[key])]);
  if (!points.length) return "";
  return points.map(([px, py], index) => `${index ? "L" : "M"} ${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
}
function renderChart(rows) {
  const svg = byId("trend-svg");
  const resolution = chartLine(rows, "resolution", 4, 218, 70, 100);
  const grounded = chartLine(rows, "grounded", 4, 218, 70, 100);
  const yOf = v => 218 - (v - 70) / 30 * 214;
  const thresh = yOf(90);
  const lastPoint = (key, value) => {
    const x = rows.length <= 1 ? 400 : 800;
    return `<circle cx="${x}" cy="${yOf(value)}" r="4" fill="white" stroke="${key}" stroke-width="2.5"/>`;
  };
  svg.innerHTML = rows.length ? `<path d="${resolution}" fill="none" stroke="#36b995" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${grounded}" fill="none" stroke="#7395ec" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="0" y1="${thresh}" x2="800" y2="${thresh}" stroke="#c8d0db" stroke-width="1" stroke-dasharray="5 5"/>${lastPoint("#36b995", last(rows, "resolution"))}${lastPoint("#7395ec", last(rows, "grounded"))}` : "";
  byId("x-labels").innerHTML = rows.map((row, index) => `<span>${rows.length > 7 && index % 2 ? "" : row.label}</span>`).join("");
}
function renderEconomics(volume, resolution, modelCost) {
  const { humanBaseline, aiCost, net } = valueModel(volume, resolution / 100, modelCost);
  byId("baseline-value").textContent = money.format(humanBaseline);
  byId("ai-runrate").textContent = money.format(aiCost);
  byId("saved-value").textContent = money.format(net);
  byId("scenario-value").textContent = money.format(net);
  const max = 80000 * 3.8;
  const heights = [humanBaseline, aiCost, Math.max(0, net)].map(value => Math.min(100, value / max * 100));
  byId("bars-wrap").innerHTML = `<div class="bar-group"><i class="bar baseline" style="height:${heights[0]}%"></i><span class="bar-label">Now</span></div><div class="bar-group"><i class="bar ai" style="height:${heights[1]}%"></i><span class="bar-label">AI assist</span></div><div class="bar-group"><i class="bar ai" style="height:${heights[2]}%"></i><span class="bar-label">Value</span></div>`;
  byId("volume-output").textContent = new Intl.NumberFormat("en-US").format(volume);
  const range = (volume - 5000) / 75000;
  slider.style.background = `linear-gradient(90deg,#39ba97 ${range * 100}%,#e8edf2 ${range * 100}%)`;
}
function render() {
  activeRows = filteredRows();
  const res = average(activeRows, "resolution");
  const grounded = average(activeRows, "grounded");
  const handoff = average(activeRows, "handoff");
  const latency = average(activeRows, "latency");
  const modelCost = average(activeRows, "modelCost") || 0.12;
  const totalVolume = activeRows.reduce((sum, row) => sum + row.volume, 0);
  const latest = activeRows.at(-1);
  const prior = activeRows.at(-2) || latest;
  const scenarioVolume = Number(slider.value);
  const business = valueModel(scenarioVolume, res / 100, modelCost);
  const costPerCase = business.aiCost / Math.max(1, scenarioVolume * res / 100);
  const latestUnitCost = latest ? valueModel(scenarioVolume, latest.resolution / 100, latest.modelCost).aiCost / Math.max(1, scenarioVolume * latest.resolution / 100) : costPerCase;
  const previousUnitCost = prior ? valueModel(scenarioVolume, prior.resolution / 100, prior.modelCost).aiCost / Math.max(1, scenarioVolume * prior.resolution / 100) : latestUnitCost;
  const quality = Math.round(grounded * .55 + res * .3 + (100 - handoff) * .15);

  byId("kpi-resolution").textContent = percent(res);
  byId("kpi-cost").textContent = `$${costPerCase.toFixed(2)}`;
  byId("kpi-grounded").textContent = percent(grounded);
  byId("kpi-value").textContent = money.format(business.net);
  setDelta("delta-resolution", percentChange(last(activeRows, "resolution"), prior?.resolution), false, last(activeRows, "resolution"), prior?.resolution);
  setDelta("delta-cost", percentChange(latestUnitCost, previousUnitCost, true), true, latestUnitCost, previousUnitCost);
  setDelta("delta-grounded", percentChange(last(activeRows, "grounded"), prior?.grounded), false, latest?.grounded, prior?.grounded);
  byId("period-label").textContent = period.value === "all" ? "All time" : `Last ${period.value} days`;
  renderChart(activeRows);

  const resDiff = last(activeRows, "resolution") - (activeRows[0]?.resolution || 0);
  const trustDiff = last(activeRows, "grounded") - (activeRows[0]?.grounded || 0);
  byId("trend-insight").textContent = `AI resolution is up ${resDiff.toFixed(1)} pts in this cohort while grounded answers ${trustDiff >= 0 ? "improved" : "slipped"} ${Math.abs(trustDiff).toFixed(1)} pts. Keep the 90% quality floor in the release gate.`;

  byId("quality-score").textContent = quality;
  document.querySelector(".ring-value").style.strokeDashoffset = `${270 * (1 - quality / 100)}`;
  const ready = grounded >= 90 && handoff <= 35 && latency <= 2;
  const status = byId("gate-status");
  status.classList.toggle("hold", !ready);
  status.innerHTML = `<i></i>${ready ? "READY TO SCALE" : "HOLD RELEASE"}`;
  byId("gate-title").textContent = ready ? "Guardrails passed" : "Quality needs attention";
  byId("gate-copy").textContent = ready ? "Canary meets the demo thresholds for trust, handoff and speed." : "Review the failing guardrail before expanding traffic.";
  const guard = [Math.min(100, grounded), Math.min(100, 100 - handoff), Math.max(0, 100 - latency / 3 * 100)];
  ["grounded", "handoff", "latency"].forEach((key, index) => byId(`guard-${key}`).style.width = `${guard[index]}%`);
  byId("guard-grounded-value").textContent = percent(grounded);
  byId("guard-handoff-value").textContent = percent(handoff);
  byId("guard-latency-value").textContent = `${latency.toFixed(2)}s`;
  renderEconomics(scenarioVolume, res, modelCost);
  byId("bars-wrap").setAttribute("aria-label", `Synthetic 30 day projection across ${new Intl.NumberFormat("en-US").format(scenarioVolume)} cases`);
  byId("report-button").setAttribute("aria-label", `Current cohort: ${Math.round(totalVolume).toLocaleString()} cases`);
}
function exportRows() {
  const csv = ["week,queue,volume,ai_resolution_pct,grounded_answer_pct,handoff_pct,p95_latency_seconds,model_cost_per_case", ...series.filter(row => activeRows.some(active => active.week === row.week) && (segment.value === "all" || row.queue === segment.value)).map(row => [row.label, row.queue, row.volume, row.resolution, row.grounded, row.handoff, row.latency, row.modelCost].join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "northstar-demo-cohort.csv"; anchor.click(); URL.revokeObjectURL(url);
  toast("Filtered cohort exported as CSV");
}
period.addEventListener("change", render);
segment.addEventListener("change", render);
slider.addEventListener("input", render);
byId("reset").addEventListener("click", () => { period.value = "90"; segment.value = "all"; slider.value = "25000"; render(); toast("Filters reset"); });
byId("export-button").addEventListener("click", exportRows);
byId("report-button").addEventListener("click", () => document.getElementById("market").scrollIntoView({ behavior: "smooth" }));
byId("gate-button").addEventListener("click", () => toast(byId("gate-title").textContent + " · review quality, handoff and p95 latency before increasing traffic."));
if (window.NORTHSTAR_COHORT?.rows?.length) {
  series = window.NORTHSTAR_COHORT.rows;
} else {
  series = Array.from({ length: 13 }, (_, index) => {
    const wave = Math.sin(index * .78) * 1.25;
    return { week: index, label: `W${String(index + 1).padStart(2, "0")}`, volume: 4150 + index * 126, resolution: 62.5 + index * .88 + wave, grounded: 94.2 - index * .09 + Math.sin(index * .62) * .42, handoff: 37.8 - index * .69 + Math.cos(index * .61) * .75, latency: 1.94 - index * .025 + Math.cos(index * .82) * .07, modelCost: .14 - index * .001 + Math.sin(index * .5) * .008, queue: "all" };
  });
}
render();
