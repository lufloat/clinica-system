import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import PeopleIcon from "@mui/icons-material/People";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import StatCard from "../../components/dashboard/StatCard";
import StatusChart from "../../components/dashboard/StatusChart";

import { getDashboard } from "../../services/dashboardService";

function Dashboard(){

    const [data,setData]=useState<any>({});

    useEffect(()=>{

        async function load(){

            const response=await getDashboard();

            setData(response);

        }

        load();

    },[]);

    return(

        <div>

            <h1>Dashboard</h1>

            <Grid container spacing={3}>

              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <StatCard
                  title="Consultas Hoje"
                  value={data.appointments_today || 0}
                  icon={<CalendarMonthIcon fontSize="large" />}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <StatCard
                  title="Médicos"
                  value={data.doctors || 0}
                  icon={<LocalHospitalIcon fontSize="large" />}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <StatCard
                  title="Pacientes"
                  value={data.patients || 0}
                  icon={<PeopleIcon fontSize="large" />}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <StatCard
                  title="Consultórios"
                  value={data.offices || 0}
                  icon={<MeetingRoomIcon fontSize="large" />}
                />
              </Grid>

            </Grid>

            <h2 style={{ marginTop: 40 }}>
              Consultas por Status
            </h2>

            <StatusChart
              data={data.status_chart || []}
            />

        </div>

    )

}

export default Dashboard;