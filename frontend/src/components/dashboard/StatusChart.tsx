import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

type Props = {
  data: {
    status: string;
    total: number;
  }[];
};

const COLORS = [
  "#4CAF50",
  "#2196F3",
  "#F44336",
];

export default function StatusChart({
  data,
}: Props) {

  return (

    <PieChart width={420} height={320}>

      <Pie
        data={data}
        dataKey="total"
        nameKey="status"
        outerRadius={110}
        label
      >

        {data.map((_, index) => (

          <Cell
            key={index}
            fill={
              COLORS[index % COLORS.length]
            }
          />

        ))}

      </Pie>

      <Tooltip />

      <Legend />

    </PieChart>

  );

}