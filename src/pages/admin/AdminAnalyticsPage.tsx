import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, Clock, TrendingUp, ShieldCheck, DollarSign } from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import StatsCard from "../../components/admin/StatsCard";

const PROVIDER_COLORS = ["#1A4D3E", "#D4AF37", "#E05A47", "#2D7D6F"];

export default function AdminAnalyticsPage() {
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const store = db.store;

  // Top Series by Views
  const topSeries = [...store.series]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8)
    .map((s) => ({
      name: s.titleSw.length > 18 ? s.titleSw.slice(0, 18) + "..." : s.titleSw,
      views: s.views || 0,
      likes: s.likes || 0,
    }));

  // Episode Duration Histogram (Rule: 90s - 180s)
  const durationBuckets = [
    { range: "< 90s (Short)", count: 0, status: "warning" },
    { range: "90s - 120s (Ideal)", count: 0, status: "ideal" },
    { range: "121s - 150s (Ideal)", count: 0, status: "ideal" },
    { range: "151s - 180s (Ideal)", count: 0, status: "ideal" },
    { range: "> 180s (Long)", count: 0, status: "flagged" },
  ];

  store.episodes.forEach((e) => {
    const d = e.durationSec;
    if (d < 90) durationBuckets[0].count++;
    else if (d <= 120) durationBuckets[1].count++;
    else if (d <= 150) durationBuckets[2].count++;
    else if (d <= 180) durationBuckets[3].count++;
    else durationBuckets[4].count++;
  });

  const compliantCount =
    durationBuckets[1].count + durationBuckets[2].count + durationBuckets[3].count;
  const compliancePct = Math.round((compliantCount / Math.max(1, store.episodes.length)) * 100);

  // Payment Methods Breakdown
  const paymentMethods = [
    {
      name: "M-Pesa",
      count: store.subscriptions.filter((s) => s.paymentMethod === "M-Pesa").length,
    },
    {
      name: "Tigo Pesa",
      count: store.subscriptions.filter((s) => s.paymentMethod === "Tigo Pesa").length,
    },
    {
      name: "Airtel Money",
      count: store.subscriptions.filter((s) => s.paymentMethod === "Airtel Money").length,
    },
    {
      name: "Admin Grant",
      count: store.subscriptions.filter((s) => s.paymentMethod === "Admin Grant").length,
    },
  ].filter((p) => p.count > 0);

  // Monthly revenue trend projection
  const revenueTrend = [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 68000 },
    { month: "Mar", revenue: 95000 },
    { month: "Apr", revenue: 142000 },
    { month: "May", revenue: 175000 },
    { month: "Jun", revenue: 210000 },
    { month: "Current", revenue: db.subscriptions.totalRevenue() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-gold" />
            Analytics & System KPIs
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Content consumption analytics, duration rule compliance, and Tanzanian mobile payment distribution.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-deep-green bg-sand px-3 py-1.5 rounded-xl border border-line">
          <Clock className="h-3.5 w-3.5 text-gold" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Rule Compliance"
          value={`${compliancePct}%`}
          subtext={`${compliantCount} of ${store.episodes.length} episodes within 90-180s`}
          icon={<ShieldCheck className="h-4 w-4" />}
          variant="gold"
        />
        <StatsCard
          title="Total Story Plays"
          value={store.series.reduce((sum, s) => sum + (s.views || 0), 0).toLocaleString()}
          subtext="Aggregated across series"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Avg Playback Length"
          value={`${Math.round(
            store.episodes.reduce((sum, e) => sum + e.durationSec, 0) /
              Math.max(1, store.episodes.length),
          )} sec`}
          subtext="Target: 90s - 180s"
          icon={<Clock className="h-4 w-4" />}
          variant="teal"
        />
        <StatsCard
          title="VIP Subscription MRR"
          value={`${(db.subscriptions.totalRevenue() / 1000).toFixed(0)}k TZS`}
          subtext="Active subscriber run-rate"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Top Series by Plays Bar Chart */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="font-display text-base font-bold text-deep-green">
              Top Series by Listeners & Plays
            </h3>
            <p className="text-[11px] text-muted">Most popular Islamic narrative collections</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSeries}>
              <XAxis dataKey="name" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A4D3E",
                  borderRadius: "8px",
                  color: "#FAF8F5",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="views" name="Total Plays" fill="#1A4D3E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="likes" name="Likes / Favorites" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: Duration Compliance + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Duration Compliance Histogram */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">
                Section 7.3: Episode Duration Rule
              </h3>
              <p className="text-[11px] text-muted">
                Adherence to micro-story duration constraint (90 to 180 seconds)
              </p>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                compliancePct >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {compliancePct}% Adherent
            </span>
          </div>

          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationBuckets}>
                <XAxis dataKey="range" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A4D3E",
                    borderRadius: "8px",
                    color: "#FAF8F5",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Episodes Count" fill="#2D7D6F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">
                Payment Channel Distribution
              </h3>
              <p className="text-[11px] text-muted">Tanzanian Mobile Money & Admin Grants</p>
            </div>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {paymentMethods.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PROVIDER_COLORS[index % PROVIDER_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A4D3E",
                    borderRadius: "8px",
                    color: "#FAF8F5",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-line grid grid-cols-2 gap-2 text-[11px]">
            {paymentMethods.map((p, i) => (
              <div key={p.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PROVIDER_COLORS[i % PROVIDER_COLORS.length] }}
                />
                <span className="truncate text-ink font-medium">{p.name}</span>
                <span className="text-muted ml-auto font-bold">{p.count} subs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend Over Time */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="font-display text-base font-bold text-deep-green">
              Revenue Growth Trajectory (TZS)
            </h3>
            <p className="text-[11px] text-muted">Cumulative subscription earnings</p>
          </div>
        </div>

        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend}>
              <XAxis dataKey="month" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toLocaleString()} TZS`, "Revenue"]}
                contentStyle={{
                  backgroundColor: "#1A4D3E",
                  borderRadius: "8px",
                  color: "#FAF8F5",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={3}
                dot={{ fill: "#1A4D3E", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
