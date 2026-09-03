import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Film,
  PlaySquare,
  Users,
  CreditCard,
  UploadCloud,
  Wand2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { db, subscribeDb } from "../../lib/mock/db";
import StatsCard from "../../components/admin/StatsCard";
import type { CommunityUpload } from "../../lib/mock/types";

const PIE_COLORS = ["#1A4D3E", "#D4AF37", "#2D7D6F", "#8C7335", "#16382C", "#5C766C"];

export default function AdminDashboardPage() {
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const store = db.store;
  const totalRevenue = db.subscriptions.totalRevenue();
  const activeSubs = db.subscriptions.activeCount();
  const seriesCount = store.series.length;
  const episodesCount = store.episodes.length;
  const usersCount = store.users.length;
  const pendingCommunity = store.communityUploads.filter((c) => c.status === "PENDING");
  const recentSubs = store.subscriptions.slice(0, 5);
  const recentVideoJobs = store.videoJobs.slice(0, 4);

  // Category Distribution for PieChart
  const categoryData = store.categories.map((c) => ({
    name: c.nameSw,
    count: store.series.filter((s) => s.categoryId === c.id).length,
  })).filter((c) => c.count > 0);

  // Revenue by Plan for BarChart
  const planBreakdown = [
    {
      name: "Weekly",
      revenue: store.subscriptions
        .filter((s) => s.plan === "WEEKLY")
        .reduce((sum, s) => sum + (s.amountTzs || 0), 0),
      count: store.subscriptions.filter((s) => s.plan === "WEEKLY").length,
    },
    {
      name: "Monthly",
      revenue: store.subscriptions
        .filter((s) => s.plan === "MONTHLY")
        .reduce((sum, s) => sum + (s.amountTzs || 0), 0),
      count: store.subscriptions.filter((s) => s.plan === "MONTHLY").length,
    },
    {
      name: "Annual",
      revenue: store.subscriptions
        .filter((s) => s.plan === "ANNUAL")
        .reduce((sum, s) => sum + (s.amountTzs || 0), 0),
      count: store.subscriptions.filter((s) => s.plan === "ANNUAL").length,
    },
    {
      name: "Lifetime VIP",
      revenue: store.subscriptions
        .filter((s) => s.plan === "VIP_LIFETIME")
        .reduce((sum, s) => sum + (s.amountTzs || 0), 0),
      count: store.subscriptions.filter((s) => s.plan === "VIP_LIFETIME").length,
    },
  ];

  // Daily Listening Activity trend (synthetic data based on episode views & progress)
  const activityData = [
    { day: "Mon", listens: 240, completions: 180 },
    { day: "Tue", listens: 310, completions: 245 },
    { day: "Wed", listens: 420, completions: 360 },
    { day: "Thu", listens: 390, completions: 310 },
    { day: "Fri", listens: 580, completions: 490 },
    { day: "Sat", listens: 640, completions: 550 },
    { day: "Sun", listens: 720, completions: 610 },
  ];

  function handleApprove(upload: CommunityUpload) {
    db.communityUploads.updateStatus(upload.id, "APPROVED");
  }

  function handleReject(upload: CommunityUpload) {
    db.communityUploads.updateStatus(upload.id, "REJECTED", "Did not meet audio quality criteria");
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-deep-green to-[#133C30] text-warm-white p-6 rounded-2xl shadow-sm border border-gold/20">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-light">
            Control Center · Kituo Kikuu cha Uongozi
          </span>
          <h1 className="font-display text-2xl font-bold mt-1 text-warm-white">
            Qisas al-Anbiyaa Administration
          </h1>
          <p className="text-[13px] text-warm-white/70 mt-1 max-w-xl">
            Real-time management for audio series, Swahili dubbing, VIP monetization, community submissions, and AI story video generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/admin/analytics"
            className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-deep-green text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>View Analytics</span>
          </Link>
          <Link
            to="/admin/videos/new"
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-warm-white text-xs font-bold px-3.5 py-2 rounded-xl transition border border-white/10"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-light" />
            <span>AI Studio</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatsCard
          title="Revenue (TZS)"
          value={`${(totalRevenue / 1000).toFixed(0)}k`}
          subtext={`${totalRevenue.toLocaleString()} TZS total`}
          icon={<CreditCard className="h-4 w-4" />}
          variant="gold"
          trend="up"
          change="+18%"
        />
        <StatsCard
          title="Active VIPs"
          value={activeSubs}
          subtext="Subscribers with access"
          icon={<Users className="h-4 w-4" />}
          trend="up"
          change="+12%"
        />
        <StatsCard
          title="Series Catalog"
          value={seriesCount}
          subtext={`${store.categories.length} categories`}
          icon={<Film className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Episodes"
          value={episodesCount}
          subtext="Audio & Video stories"
          icon={<PlaySquare className="h-4 w-4" />}
        />
        <StatsCard
          title="Community Submissions"
          value={pendingCommunity.length}
          subtext="Pending moderation"
          icon={<UploadCloud className="h-4 w-4" />}
          variant={pendingCommunity.length > 0 ? "teal" : "default"}
        />
        <StatsCard
          title="Registered Users"
          value={usersCount}
          subtext="App accounts"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Activity Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">
                Daily Listening Activity & Completions
              </h3>
              <p className="text-[11px] text-muted">
                Engagement across mobile app listeners over the past 7 days
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              +24% this week
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="listensGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A4D3E" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1A4D3E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A4D3E",
                    borderRadius: "12px",
                    color: "#FAF8F5",
                    border: "1px solid #D4AF37",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="listens"
                  name="Episode Plays"
                  stroke="#1A4D3E"
                  fillOpacity={1}
                  fill="url(#listensGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="completions"
                  name="Finished (100%)"
                  stroke="#D4AF37"
                  fillOpacity={1}
                  fill="url(#compGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">
                Content by Category
              </h3>
              <p className="text-[11px] text-muted">Distribution of series per category</p>
            </div>
            <Link to="/admin/categories" className="text-xs text-teal font-bold hover:underline">
              Manage
            </Link>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-display text-deep-green">{seriesCount}</span>
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Series</span>
            </div>
          </div>

          <div className="pt-2 border-t border-line grid grid-cols-2 gap-2 text-[11px]">
            {categoryData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="truncate text-ink font-medium">{c.name}</span>
                <span className="text-muted ml-auto font-bold">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Plan & Moderation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue by Plan Bar Chart */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h3 className="font-display text-base font-bold text-deep-green">
                Revenue by VIP Plan
              </h3>
              <p className="text-[11px] text-muted">Income in TZS per subscription tier</p>
            </div>
            <Link to="/admin/subscriptions" className="text-xs text-teal font-bold hover:underline">
              All Subs
            </Link>
          </div>

          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planBreakdown} layout="vertical">
                <XAxis type="number" stroke="#888" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} width={80} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} TZS`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#1A4D3E",
                    borderRadius: "8px",
                    color: "#FAF8F5",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Community Uploads Moderation */}
        <div className="lg:col-span-2 rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-teal" />
              <div>
                <h3 className="font-display text-base font-bold text-deep-green">
                  Community Submissions for Review
                </h3>
                <p className="text-[11px] text-muted">
                  User audio uploads requiring moderation before public indexing
                </p>
              </div>
            </div>
            <Link
              to="/admin/community"
              className="text-xs text-deep-green font-bold hover:text-teal flex items-center gap-1"
            >
              <span>View All ({store.communityUploads.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-line/60 my-2 flex-1">
            {pendingCommunity.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1.5" />
                All caught up! No pending submissions to review.
              </div>
            ) : (
              pendingCommunity.slice(0, 3).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[13px] text-deep-green truncate">
                      {item.titleSw || item.title}
                    </div>
                    <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                      <span>By: {item.uploaderName || item.authorName || "Anonymous"}</span>
                      <span>·</span>
                      <span className="bg-sand px-1.5 py-0.2 rounded text-ink font-medium">
                        {item.category}
                      </span>
                      <span>·</span>
                      <span>{Math.round((item.durationSec || 0) / 60)} mins</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleApprove(item)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                      title="Approve & Publish"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                      title="Reject"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-line text-[11px] text-muted flex items-center justify-between">
            <span>Section 7.7 Community Moderation Protocol</span>
            <Link to="/admin/community" className="font-bold text-teal hover:underline">
              Open Full Moderation Queue →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions & Video Jobs Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Subscriptions */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="font-display text-base font-bold text-deep-green">
              Recent VIP Subscriptions
            </h3>
            <Link to="/admin/subscriptions" className="text-xs text-teal font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-line/60">
            {recentSubs.map((sub) => (
              <div key={sub.id} className="py-2.5 flex items-center justify-between text-[12px]">
                <div>
                  <div className="font-bold text-ink">{sub.userName}</div>
                  <div className="text-[11px] text-muted">
                    {sub.planNameSw} · {sub.paymentMethod} ({sub.referenceCode})
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-deep-green">
                    {sub.amountTzs.toLocaleString()} TZS
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sand text-muted"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Video Generation Pipeline */}
        <div className="rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-bold text-deep-green">
                AI Video Studio Pipeline
              </h3>
            </div>
            <Link to="/admin/videos/new" className="text-xs text-gold font-bold hover:underline">
              + Generate Video
            </Link>
          </div>

          <div className="divide-y divide-line/60 flex-1">
            {recentVideoJobs.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs">
                No active video jobs. Click above to launch story video generation.
              </div>
            ) : (
              recentVideoJobs.map((job) => (
                <div key={job.id} className="py-2.5 flex items-center justify-between text-[12px]">
                  <div>
                    <div className="font-bold text-ink">{job.titleSw || job.titleEn || "Untitled Job"}</div>
                    <div className="text-[11px] text-muted">
                      Voice: {job.voice} · {job.storyboard?.length || 0} Scenes
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : job.status === "RENDERING"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : job.status === "READY"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-sand text-muted"
                      }`}
                    >
                      {job.status}
                    </span>
                    <Link
                      to={`/admin/videos/${job.id}`}
                      className="text-xs font-bold text-teal hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-line text-[11px] text-muted flex items-center justify-between">
            <span>Powered by Qisas Studio AI Pipeline</span>
            <Link to="/admin/videos" className="font-bold text-teal hover:underline">
              View Video Studio →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
