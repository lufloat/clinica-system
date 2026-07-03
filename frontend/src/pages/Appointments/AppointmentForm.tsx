import { useEffect, useState } from "react";

import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

import type { Appointment } from "./appointment.types";

import { createAppointment } from "../../services/appointmentService";
import { getDoctors } from "../../services/doctorService";
import { getPatients } from "../../services/patientService";
import { getOffices } from "../../services/officeService";

type Option = {
  value: number;
  label: string;
};

type AppointmentFormProps = {
  onAppointmentCreated: () => void;
};

function AppointmentForm({ onAppointmentCreated }: AppointmentFormProps) {

  const [doctors, setDoctors] = useState<Option[]>([]);
  const [patients, setPatients] = useState<Option[]>([]);
  const [offices, setOffices] = useState<Option[]>([]);

  const [form, setForm] = useState<Appointment>({
    patient: 0,
    doctor: 0,
    office: 0,
    appointment_date: "",
    appointment_time: "",
    observations: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    const doctorsData = await getDoctors();
    const patientsData = await getPatients();
    const officesData = await getOffices();

    setDoctors(
      doctorsData.map((doctor: any) => ({
        value: doctor.id,
        label: doctor.name,
      }))
    );

    setPatients(
      patientsData.map((patient: any) => ({
        value: patient.id,
        label: patient.name,
      }))
    );

    setOffices(
      officesData.map((office: any) => ({
        value: office.id,
        label: office.name,
      }))
    );
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {

      await createAppointment({
        ...form,
        patient: Number(form.patient),
        doctor: Number(form.doctor),
        office: Number(form.office),
      });

      alert("Consulta agendada com sucesso!");

      onAppointmentCreated();

      setForm({
        patient: 0,
        doctor: 0,
        office: 0,
        appointment_date: "",
        appointment_time: "",
        observations: "",
      });

    } catch (error) {

      console.error(error);

      alert("Erro ao agendar consulta.");

    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <h2>Nova Consulta</h2>

      <Select
        label="Paciente"
        name="patient"
        value={form.patient}
        options={patients}
        onChange={handleChange}
      />

      <Select
        label="Médico"
        name="doctor"
        value={form.doctor}
        options={doctors}
        onChange={handleChange}
      />

      <Select
        label="Consultório"
        name="office"
        value={form.office}
        options={offices}
        onChange={handleChange}
      />

      <Input
        label="Data"
        type="date"
        name="appointment_date"
        value={form.appointment_date}
        onChange={handleChange}
      />

      <Input
        label="Hora"
        type="time"
        name="appointment_time"
        value={form.appointment_time}
        onChange={handleChange}
      />

      <Input
        label="Observações"
        name="observations"
        value={form.observations}
        onChange={handleChange}
      />

      <Button type="submit">
        Agendar
      </Button>

    </form>
  );
}

export default AppointmentForm;