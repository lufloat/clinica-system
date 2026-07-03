import { useEffect, useState } from "react";

import "./Appointments.css";

import AppointmentForm from "./AppointmentForm";

import type { Appointment } from "./appointment.types";
import {
  getAppointments,
  finalizeAppointment,
  cancelAppointment,
} from "../../services/appointmentService";

function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  async function loadAppointments() {
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
    }
  }

  async function handleFinalize(id: number) {
    try {
      await finalizeAppointment(id);

      await loadAppointments();

      alert("Consulta finalizada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar consulta.");
    }
  }

  async function handleCancel(id: number) {
    try {
      await cancelAppointment(id);

      await loadAppointments();

      alert("Consulta cancelada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao cancelar consulta.");
    }
  }

  function handleCertificate(id: number) {

    window.open(

        `http://127.0.0.1:8000/api/documents/${id}/certificate/`,

        "_blank"

    );

}

  function handlePrescription(id: number) {
    alert("Emitir receita da consulta " + id);
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function getStatusColor(status: string) {
    switch (status) {
      case "AGENDADA":
        return "green";

      case "FINALIZADA":
        return "blue";

      case "CANCELADA":
        return "red";

      default:
        return "gray";
    }
  }

  return (
    <div>
      <h1>Agenda de Consultas</h1>

      <AppointmentForm
        onAppointmentCreated={loadAppointments}
      />

      <hr />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Médico</th>
            <th>Consultório</th>
            <th>Data</th>
            <th>Hora</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.patient_name}</td>
              <td>{appointment.doctor_name}</td>
              <td>{appointment.office_name}</td>
              <td>{appointment.appointment_date}</td>
              <td>{appointment.appointment_time}</td>

              <td>
                <span
                  style={{
                    background: getStatusColor(appointment.status!),
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    fontWeight: "bold",
                  }}
                >
                  {appointment.status}
                </span>
              </td>

              <td>
                <div className="actions">
                  <button type="button">
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinalize(appointment.id!)}
                  >
                    Finalizar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancel(appointment.id!)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCertificate(appointment.id!)}
                  >
                    📄 Atestado
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrescription(appointment.id!)}
                  >
                    💊 Receita
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Appointments;