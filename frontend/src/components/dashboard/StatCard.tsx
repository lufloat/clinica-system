import type { ReactNode } from "react";

type Props = {
  title: string;
  value: number;
  icon: ReactNode;
  color?: string;
  bg?: string;
};

function StatCard({ title, value, icon, color = "var(--primary)", bg = "var(--indigo-50)" }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__title">{title}</span>
      </div>
    </div>
  );
}

export default StatCard;
