import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import type { Patient } from "./patient.types";
import { createPatient } from "../../services/patientService";

type PatientFormProps = {
  onPatientCreated: () => void;
};

function PatientForm({ onPatientCreated }: PatientFormProps) {
  const [form, setForm] = useState<Patient>({
    name: "",
    cpf: "",
    phone: "",
    email: "",
    birth_date: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createPatient(form);

      onPatientCreated();

      setForm({
        name: "",
        cpf: "",
        phone: "",
        email: "",
        birth_date: "",
      });

      alert("Paciente cadastrado com sucesso!");

    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar paciente.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <h2>Novo Paciente</h2>

      <Input
        label="Nome"
        name="name"
        value={form.name}
        onChange={handleChange}
      />

      <Input
        label="CPF"
        name="cpf"
        value={form.cpf}
        onChange={handleChange}
      />

      <Input
        label="Telefone"
        name="phone"
        value={form.phone}
        onChange={handleChange}
      />

      <Input
        label="Email"
        name="email"
        value={form.email}
        onChange={handleChange}
      />

      <Input
        label="Data de nascimento"
        name="birth_date"
        type="date"
        value={form.birth_date}
        onChange={handleChange}
      />

      <Button type="submit">
        Salvar
      </Button>

    </form>
  );
}

export default PatientForm;