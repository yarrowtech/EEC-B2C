import { useEffect, useMemo, useState } from "react";
import { Users, Target, ClipboardList, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast, ToastContainer } from "react-toastify";

import { getJSON } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const COLORS = { success: "#22c55e", fail: "#f43f5e" };

function StatCard({ icon, label, value, accent }) {
  const Icon = icon;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentEngagement() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [setRows, setSetRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getJSON("/api/questions/upload-performance");
        if (!mounted) return;
        setSummary(data?.teacherSummaries?.[0] || null);
        setSetRows(Array.isArray(data?.setRows) ? data.setRows : []);
      } catch (err) {
        toast.error(err?.message || "Failed to load student engagement data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pieData = useMemo(() => {
    const successCount = Number(summary?.successfulAttemptsCount || 0);
    const totalCount = Number(summary?.attemptsCount || 0);
    const failCount = Math.max(0, totalCount - successCount);
    if (totalCount === 0) return [];
    return [
      { name: "Successful Tryouts", value: successCount, key: "success" },
      { name: "Needs Improvement", value: failCount, key: "fail" },
    ];
  }, [summary]);

  const hasAttempts = Number(summary?.attemptsCount || 0) > 0;

  return (
    <div className="space-y-6">
      <ToastContainer position="bottom-right" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Engagement</h1>
        <p className="text-sm text-muted-foreground">
          How students are engaging with the tryouts you've uploaded, and how well they're doing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Students Engaged"
          value={loading ? "-" : summary?.uniqueStudentsCount || 0}
          accent="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Tryout Attempts"
          value={loading ? "-" : summary?.attemptsCount || 0}
          accent="bg-teal-100 text-teal-700"
        />
        <StatCard
          icon={Target}
          label="Questions Uploaded"
          value={loading ? "-" : summary?.uploadedQuestions || 0}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={loading ? "-" : `${summary?.successRate ?? 0}%`}
          accent="bg-emerald-100 text-emerald-700"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Success Rate Breakdown</CardTitle>
          <CardDescription>
            Share of tryout attempts where students scored at or above the pass mark, across all your questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !hasAttempts ? (
            <p className="text-sm text-muted-foreground">
              No students have attempted your tryouts yet. Once they do, their results will show up here.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} attempt${value === 1 ? "" : "s"}`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown by Chapter</CardTitle>
          <CardDescription>Engagement and success rate for each subject / chapter / question type you've uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Board / Class / Subject</th>
                  <th className="py-2 pr-4">Chapter</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Uploaded</th>
                  <th className="py-2 pr-4">Students</th>
                  <th className="py-2 pr-4">Attempts</th>
                  <th className="py-2 pr-4">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">Loading...</td>
                  </tr>
                ) : setRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      You haven't uploaded any tryout questions yet.
                    </td>
                  </tr>
                ) : (
                  setRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {[row.boardLabel, row.classLabel, row.subjectLabel].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-medium">{row.topicLabel || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">{row.type || "—"}</td>
                      <td className="py-2.5 pr-4">{row.uploadedQuestions}</td>
                      <td className="py-2.5 pr-4">{row.uniqueStudentsCount}</td>
                      <td className="py-2.5 pr-4">{row.attemptsCount}</td>
                      <td className="py-2.5 pr-4">
                        {row.attemptsCount > 0 ? (
                          <Badge
                            variant="outline"
                            className={
                              row.successRate >= 60
                                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                : "border-rose-200 bg-rose-100 text-rose-700"
                            }
                          >
                            {row.successRate}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No attempts yet</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
