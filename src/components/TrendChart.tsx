// src/components/TrendChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendChartProps {
  data: { song: string; [key: string]: number | string }[];
  title: string;
  lines: string[]; // keys for metrics to plot
}

const TrendChart: React.FC<TrendChartProps> = ({ data, title, lines }) => (
  <div style={{ width: "100%", height: 400, marginBottom: 30 }}>
    <h3>{title}</h3>
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="song" />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((lineKey, idx) => (
          <Line
            key={lineKey}
            type="monotone"
            dataKey={lineKey}
            stroke={["#8884d8", "#82ca9d"][idx % 2]} // alternate colors
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default TrendChart;
