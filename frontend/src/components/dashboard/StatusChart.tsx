import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

type Slice = {
  status: string;
  label: string;
  total: number;
};

type Props = {
  data: Slice[];
};

const STATUS_COLORS: Record<string, string> = {
  AGENDADA: "#6366F1",
  FINALIZADA: "#10B981",
  CANCELADA: "#F43F5E",
};

function colorFor(status: string) {
  return STATUS_COLORS[status] ?? "#94A3B8";
}

export default function StatusChart({ data }: Props) {
  const total = data.reduce((acc, item) => acc + item.total, 0);

  if (total === 0) {
    return <p className="empty-state">Nenhuma consulta registrada ainda.</p>;
  }

  return (
    <div className="chart-wrap">
      <div style={{ width: "100%", height: 240, position: "relative" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.status} fill={colorFor(item.status)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}`, `${name}`]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 30, fontWeight: 700, color: "var(--slate-900)" }}>
            {total}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-light)" }}>consultas</span>
        </div>
      </div>

      <div className="chart-legend">
        {data.map((item) => (
          <span key={item.status} className="chart-legend__item">
            <span
              className="chart-legend__dot"
              style={{ background: colorFor(item.status) }}
            />
            {item.label} ({item.total})
          </span>
        ))}
      </div>
    </div>
  );
}
