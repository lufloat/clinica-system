import { useEffect, useState } from "react";
import {
  createDoctor,
  updateDoctor,
} from "../../services/doctorService";
import type { Doctor } from "./doctor.types";
import {
  TextField,
  Button,
  Stack,
} from "@mui/material";

type DoctorFormProps = {
  doctor: Doctor | null;
  onDoctorCreated: () => void;
  onFinishEdit: () => void;
};

function DoctorForm({
  doctor,
  onDoctorCreated,
  onFinishEdit,
}: DoctorFormProps) {
  const [form, setForm] = useState<Doctor>({
    name: "",
    crm: "",
    specialty: "",
    phone: "",
    email: "",
  });

  // Preenche formulário no modo edição
  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name,
        crm: doctor.crm,
        specialty: doctor.specialty,
        phone: doctor.phone,
        email: doctor.email,
      });
    } else {
      // limpa ao voltar para "novo médico"
      setForm({
        name: "",
        crm: "",
        specialty: "",
        phone: "",
        email: "",
      });
    }
  }, [doctor]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {

      if (form.id) {

        await updateDoctor(form.id, form);

      } else {

        await createDoctor(form);

      }

      onDoctorCreated();
      onFinishEdit();

      setForm({
        id: undefined,
        name: "",
        crm: "",
        specialty: "",
        phone: "",
        email: "",
      });

    } catch (error) {

      console.error(error);

      alert("Erro ao salvar médico.");

    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>
        {doctor ? "Editar Médico" : "Novo Médico"}
      </h2>

      <Stack spacing={2}>

        <TextField
          fullWidth
          name="name"
          label="Nome"
          value={form.name}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          name="crm"
          label="CRM"
          value={form.crm}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          name="specialty"
          label="Especialidade"
          value={form.specialty}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          name="phone"
          label="Telefone"
          value={form.phone}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          name="email"
          label="Email"
          value={form.email}
          onChange={handleChange}
        />

        <Button
          variant="contained"
          type="submit"
        >
          {doctor ? "Atualizar" : "Salvar"}
        </Button>

      </Stack>
    </form>
  );
}

export default DoctorForm;