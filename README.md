# NORTHSTAR · AI impact observatory

**A decision cockpit for the economics and trustworthiness of an AI support copilot.**

This portfolio case study gives a product and data team one place to answer: *Should we expand this AI release?* It connects service outcomes, unit economics, response quality and operational guardrails instead of presenting usage volume as proof of value.

> **Data integrity:** Product telemetry and costs in the demo are deterministic synthetic data. They are not results from a real company or a live model. Market context uses published Eurostat statistics. The release thresholds are illustrative product policy choices.

## Why this problem

- **Adoption is growing, outcomes still need proof.** Eurostat reports that 19.95% of EU enterprises used AI in 2025, up 6.47 percentage points year over year. Adoption ranged from 17% of small enterprises to 55.03% of large enterprises.
- **Trust is a production concern.** In dbt Labs' 2026 analytics engineering survey, 71% of respondents were concerned about hallucinated or incorrect data reaching stakeholders; 83% put trust in data among their priorities.
- **Market fit is broader than one region.** AI-assisted customer support is a recognizable SaaS use case in the US and Europe, with a concrete operating decision and metrics that transfer across industries.

Sources and definitions: [Eurostat: AI use in enterprises](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Use_of_artificial_intelligence_in_enterprises), [dbt Labs: 2026 State of Analytics Engineering](https://www.getdbt.com/resources/state-of-analytics-engineering-2026).

## What the dashboard does

1. **Measures outcomes:** AI resolution, grounded answer rate and cost per resolved case.
2. **Shows the trade-off:** weekly changes in resolution vs. answer grounding, with a 90% quality floor.
3. **Gates a release:** compares grounded answers, human handoff and p95 latency with explicit thresholds.
4. **Models unit economics:** compares estimated AI-assisted cost with a human-only baseline and lets the viewer change monthly case volume.
5. **Adds market context:** displays sourced EU enterprise AI adoption statistics alongside the simulated operational data.
6. **Supports inspection:** filter by period and support queue, then export the filtered cohort to CSV.

## Tech stack

| Layer | Technology | Why it is here |
| --- | --- | --- |
| Interactive web dashboard | HTML, CSS, JavaScript, SVG | Lightweight, responsive, accessible, deployable as a static GitHub Pages site |
| Data preparation | Python 3, standard library | Reproducibly generates the synthetic cohort and web-ready JSON / CSV |
| Metric layer | SQL | Documents weighted metrics and release-gate definitions in a queryable form |
| Automation | GitHub Actions | Regenerates the demo dataset and checks the Python pipeline on each push |
| Hosting | GitHub Pages | Public, low-friction portfolio demo |

**Why Python and SQL:** the Stack Overflow Developer Survey 2025 describes Python's year-over-year usage increase as 7 percentage points and calls out its role in AI, data science and backend work. GitHub's Octoverse 2025 reports TypeScript became the most-used language on GitHub in August 2025. Those are usage signals, not a direct count of job-posting requirements. This iteration focuses on the Python + SQL data analyst foundation; a React + TypeScript client and dbt / warehouse adapter are the next production-style extension.

Sources: [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology), [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/typescript-python-and-the-ai-feedback-loop-changing-software-development/).

## Metric definitions

| Metric | Definition in the demo |
| --- | --- |
| AI resolution rate | Cases resolved without an agent / eligible AI cases |
| Grounded answer rate | Responses passing the demo's grounding check / AI responses |
| Human handoff rate | AI cases escalated to an agent / eligible AI cases |
| Cost per case | Model cost + human handling cost for unresolved cases + monthly platform cost allocation |
| Net monthly value | Human-only baseline cost − AI-assisted cost estimate |
| Release gate | Grounded answers ≥ 90%, handoff ≤ 35%, p95 latency ≤ 2 seconds |

Thresholds and monetary assumptions are configurable demo assumptions, not universal benchmarks or advice to deploy an AI system.

## Run locally

```bash
python scripts/build_demo_data.py
python -m http.server 8000
```

Open `http://localhost:8000`. The SQL model can be run in DuckDB from the project root:

```sql
-- In a DuckDB shell or notebook
SELECT * FROM read_csv_auto('data/cohort.csv') LIMIT 10;
```

Then run `sql/weekly_product_metrics.sql` to reproduce the weekly weighted metrics and release gate.

## Repository map

```text
index.html                         dashboard structure
styles.css                        responsive visual system
app.js                            filtering, KPI calculations, SVG charts, CSV export
data/cohort.json                  generated fixture consumed by the dashboard
data/cohort.csv                   same fixture for SQL / BI workflows
scripts/build_demo_data.py        deterministic data-generation pipeline
sql/weekly_product_metrics.sql    metric contract and release gate
.github/workflows/checks.yml      Python data-contract checks on each push
```

## Next production steps

- Replace simulated support telemetry with privacy-reviewed event data.
- Store event-level metrics in a warehouse; add dbt models and tests for freshness, uniqueness, and metric semantics.
- Connect to a versioned offline evaluation set and compare releases before the canary gate.
- Add model-provider cost and latency telemetry with dated price assumptions.
- Extend the frontend in React + TypeScript once the product workflow is validated.

## Author

**João Luis F. Leite** · Data Analyst · SQL, Python, Power BI · Data Quality, ETL/ELT, Automation & AI
