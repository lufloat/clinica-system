type StatCardProps = {
  title: string;
  value: number | string;
};

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}

export default StatCard;