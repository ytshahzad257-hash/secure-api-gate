import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryBreakdown } from "../lib/loadEvidence.js";

interface CategoryChartProps {
  data: CategoryBreakdown[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map((category) => ({
    category: category.category,
    failed: category.failed,
    passed: category.passed,
    deductions: category.deductions
  }));

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>Category Failures</h2>
          <p>Failed scenarios and score deductions by security category.</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="empty-inline">No category data available.</div>
      ) : (
        <div className="chart-frame" aria-label="Category failure chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#edf1f7" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "#f2f6fc" }}
                contentStyle={{
                  border: "1px solid #d9e0ec",
                  borderRadius: 8,
                  boxShadow: "0 12px 28px rgba(16, 24, 40, 0.12)"
                }}
              />
              <Bar dataKey="failed" name="Failures" fill="#d92d20" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="deductions"
                name="Risk deductions"
                fill="#f79009"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
