'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#007AFF', '#5AC8FA', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

type FeedData = Array<{ name: string; value: number }>;
type SourceData = Array<{ source_name: string; count: number }>;

export function FeedDistributionChart({ data }: { data: FeedData }) {
  if (!data.some((d) => d.value > 0)) {
    return <p className="text-gray-500 text-center py-12">Henüz veri yok</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopSourcesChart({ data }: { data: SourceData }) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-12">Henüz veri yok</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="source_name" angle={-45} textAnchor="end" height={100} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#007AFF" />
      </BarChart>
    </ResponsiveContainer>
  );
}
