import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { RefreshCw, Download } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getJSON } from "../../lib/api";

const METRICS = [
  { key: "uniqueVisitors", label: "Unique visitors", desc: "People who opened the site", color: "#6366f1" },
  { key: "pageViews", label: "Page views", desc: "Every page opened by visitors", color: "#0ea5e9" },
  { key: "linkVisits", label: "Link visits", desc: "Arrived through a coupon or campaign link", color: "#f59e0b" },
  { key: "clicks", label: "Clicks", desc: "Buttons and links tapped", color: "#ec4899" },
  { key: "logins", label: "Logins", desc: "Successful sign-ins", color: "#10b981" },
  { key: "signups", label: "Sign-ups", desc: "New accounts created", color: "#8b5cf6" },
  { key: "topicViews", label: "Topic views", desc: "Learning topic pages opened", color: "#14b8a6" },
  { key: "purchaseAttempts", label: "Purchase attempts", desc: "Visitors who started a payment", color: "#f97316" },
];

const RANGES = [7, 30, 90];
const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif";

function changeBadge(current, previous) {
  if (!previous) return current ? "New" : "0%";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function formatDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const DEVICES = [
  { key: "desktop", label: "Desktop", color: "#0ea5e9" },
  { key: "mobile", label: "Mobile", color: "#6366f1" },
  { key: "tablet", label: "Tablet", color: "#f59e0b" },
];
const FUNNEL_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f97316"];

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-4 sm:p-5 ${className}`}>
      <h2 className="text-sm font-bold text-[#111]">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Donut({ devices, total }) {
  const sum = DEVICES.reduce((s, d) => s + (devices[d.key] || 0), 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eef0f4" strokeWidth="12" />
        {sum > 0 &&
          DEVICES.map((d) => {
            const len = ((devices[d.key] || 0) / sum) * c;
            const seg = (
              <circle
                key={d.key}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth="12"
                strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-[#111]">{total}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visitors</span>
      </div>
    </div>
  );
}

function FunnelList({ steps }) {
  const top = steps[0]?.count || 0;
  return (
    <div className="space-y-4">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].count : 0;
        const pct = prev ? Math.round((step.count / prev) * 100) : 0;
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[#111]">{step.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-[#111]">{step.count}</span>
                {i > 0 && (
                  <span className="rounded-md bg-[#f1f2f6] px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                    {pct}%
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-[#f1f2f6]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${top ? Math.max(step.count ? 3 : 0, (step.count / top) * 100) : 0}%`,
                  background: FUNNEL_COLORS[i],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function PeakHours({ grid }) {
  const max = Math.max(0, ...grid.flat());
  let busiest = null;
  grid.forEach((row, d) =>
    row.forEach((v, h) => {
      if (v > 0 && (!busiest || v > busiest.v)) busiest = { d, h, v };
    })
  );

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-1">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-[10px] font-bold text-slate-500">
                {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
              </span>
            ))}
            {grid.map((row, d) => (
              <div key={WEEKDAYS[d]} className="contents">
                <span className="self-center text-[11px] font-bold text-slate-500">{WEEKDAYS[d]}</span>
                {row.map((v, h) => (
                  <div
                    key={h}
                    title={`${WEEKDAYS[d]} ${String(h).padStart(2, "0")}:00 — ${v} page views`}
                    className="aspect-square rounded-md"
                    style={{
                      background: v && max ? `rgba(99,102,241,${0.15 + 0.85 * (v / max)})` : "#f4f5f8",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Busiest:{" "}
        {busiest ? (
          <>
            <span className="font-bold text-[#111]">
              {WEEKDAYS[busiest.d]} {String(busiest.h).padStart(2, "0")}:00
            </span>{" "}
            ({busiest.v} page views)
          </>
        ) : (
          "—"
        )}
      </p>
    </>
  );
}

function RankedList({ rows, empty, color = "#6366f1" }) {
  if (!rows?.length) return <p className="text-sm text-slate-400">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-[#111]">{r.name}</span>
            <span className="font-bold text-[#111]">{r.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[#f1f2f6]">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (r.count / max) * 100)}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ButtonAnalytics() {
  const [days, setDays] = useState(7);
  const [active, setActive] = useState("uniqueVisitors");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const role = useMemo(() => {
    try {
      return String(JSON.parse(localStorage.getItem("user") || "null")?.role || "").toLowerCase();
    } catch {
      return "";
    }
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      setData(await getJSON(`/api/site-events/admin/overview?days=${days}&tz=${tz}`));
    } catch (e) {
      setErr(e.message || "Failed to load analytics");
    } finally {
      setBusy(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const activeMetric = METRICS.find((m) => m.key === active);
  const totals = data?.totals || {};
  const previous = data?.previous || {};
  const funnel = data?.funnel || [];
  const audience = data?.audience || {};
  const newsletterData = useMemo(
    () => (data?.newsletter || []).map((row) => ({ ...row, label: formatDay(row.date) })),
    [data]
  );
  const newsletterTotal = newsletterData.reduce((s, r) => s + r.count, 0);
  const chartData = useMemo(
    () => (data?.series || []).map((row) => ({ ...row, label: formatDay(row.date) })),
    [data]
  );

  function downloadCsv() {
    if (!data?.series?.length) return;
    const header = ["Date", ...METRICS.map((m) => m.label)];
    const rows = data.series.map((r) => [r.date, ...METRICS.map((m) => r[m.key] || 0)]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${days}d_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (role && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-3 sm:p-6" style={{ fontFamily: FONT }}>
      <div className="rounded-3xl bg-[#f4f4f5] p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111]">Analytics</h1>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Traffic, link visits, clicks and logins. Admin, teacher and dashboard pages are excluded.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:mt-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-bold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {data?.onlineNow ?? 0} online now
            </span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-[#ececee] p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDays(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    days === r ? "bg-white text-[#111] shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {r} days
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={load}
              title="Refresh"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              title="Download CSV"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Download size={15} />
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
        )}

        {/* Metric cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m) => {
            const isActive = m.key === active;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setActive(m.key)}
                className={`rounded-2xl border-2 bg-[#ececee] p-4 text-left transition sm:p-5 ${
                  isActive ? "border-[#6366f1]" : "border-transparent hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-medium text-[#222]">{m.label}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-5xl font-extrabold leading-tight tracking-tight" style={{ color: m.color }}>
                    {busy && !data ? "–" : (totals[m.key] ?? 0).toLocaleString("en-IN")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      changeBadge(totals[m.key] || 0, previous[m.key] || 0) === "New"
                        ? "bg-indigo-100 text-indigo-500"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {changeBadge(totals[m.key] || 0, previous[m.key] || 0)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{m.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className="mt-5 rounded-2xl bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111]">{activeMetric.label} over time</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {(totals[active] ?? 0).toLocaleString("en-IN")} in the last {days} days
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActive(m.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    m.key === active
                      ? "border-[#6366f1] bg-[#6366f1] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeMetric.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={activeMetric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v) => [v, activeMetric.label]}
                />
                <Area
                  type="basis"
                  dataKey={active}
                  stroke={activeMetric.color}
                  strokeWidth={2}
                  fill="url(#metricFill)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel + Audience */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel title="Conversion funnel" subtitle="How visitors move from landing to purchase">
            <FunnelList steps={funnel} />
          </Panel>

          <Panel title="Audience" subtitle="Devices and returning visitors">
            <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
              <Donut devices={audience.devices || {}} total={audience.visitors || 0} />
              <div className="space-y-3">
                {DEVICES.map((d) => {
                  const sum = DEVICES.reduce((s, x) => s + (audience.devices?.[x.key] || 0), 0);
                  const pct = sum ? Math.round(((audience.devices?.[d.key] || 0) / sum) * 100) : 0;
                  return (
                    <div key={d.key} className="flex items-center gap-3 text-sm">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="w-20 font-medium text-[#111]">{d.label}</span>
                      <span className="font-bold text-[#111]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["New", audience.newVisitors],
                ["Returning", audience.returning],
                ["Signed in", audience.signedIn],
                ["Sessions", audience.sessions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f4f5f8] px-3 py-3">
                  <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                  <p className="mt-1 text-base font-extrabold text-[#111]">{value ?? 0}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Top pages + Traffic sources */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel title="Top pages" subtitle="By page views">
            <RankedList rows={data?.topPages} empty="No page views yet." />
          </Panel>
          <Panel title="Traffic sources" subtitle="Where visitors come from">
            <RankedList rows={data?.trafficSources} empty="No visits yet." color="#0ea5e9" />
          </Panel>
        </div>

        {/* Campaign links + Most clicked */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel title="Coupon and campaign links" subtitle="Visits through shared links">
            <RankedList rows={data?.campaignLinks} empty="No campaign link visits yet." color="#f59e0b" />
          </Panel>
          <Panel title="Most clicked" subtitle="Buttons and links">
            <RankedList rows={data?.mostClicked} empty="No clicks yet." color="#ec4899" />
          </Panel>
        </div>

        {/* Peak hours */}
        <Panel className="mt-5" title="Peak hours" subtitle="Page views by day and hour (your local time)">
          <PeakHours grid={data?.heatmap || Array.from({ length: 7 }, () => Array(24).fill(0))} />
        </Panel>

        {/* Newsletter + CRM */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel
            title="Newsletter growth"
            subtitle={`${newsletterTotal} new in this period`}
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={newsletterData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="newsletterFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, (max) => Math.max(4, max)]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v) => [v, "New subscribers"]}
                  />
                  <Area type="basis" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#newsletterFill)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="CRM lead funnel" subtitle="Leads captured in this period">
            <FunnelList steps={data?.leadFunnel || []} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
