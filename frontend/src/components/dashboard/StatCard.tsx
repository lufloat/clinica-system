import { Card, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  value: number;
  icon: ReactNode;
};

function StatCard({ title, value, icon }: Props) {
  return (
    <Card sx={{ minWidth: 220 }}>
      <CardContent>

        <Typography
          color="text.secondary"
          gutterBottom
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
        >
          {value}
        </Typography>

        {icon}

      </CardContent>
    </Card>
  );
}

export default StatCard;