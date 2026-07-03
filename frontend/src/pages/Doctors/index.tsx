import { useEffect, useState } from "react";
import type { Doctor } from "./doctor.types";
import {
  getDoctors,
  deleteDoctor,
} from "../../services/doctorService";
import Button from "../../components/ui/Button";
import DoctorForm from "./DoctorForm";
import Table from "../../components/ui/Table";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

const columns = [
  { key: "name", label: "Nome" },
  { key: "crm", label: "CRM" },
  { key: "specialty", label: "Especialidade" },
] as const;

function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  async function loadDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Erro ao buscar médicos:", error);
    }
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
  }

  function finishEdit() {
    setEditingDoctor(null);
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este médico?"
    );

    if (!confirmed) return;

    try {
      await deleteDoctor(id);
      await loadDoctors();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir médico.");
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>

      <Typography
        variant="h4"
        gutterBottom
      >
        Médicos
      </Typography>

      <Card elevation={3}>

        <CardContent>

          <DoctorForm
            doctor={editingDoctor}
            onDoctorCreated={loadDoctors}
            onFinishEdit={finishEdit}
          />

          <Divider sx={{ my: 3 }} />

          <Button>
            Novo Médico
          </Button>

          <Table
            columns={columns}
            data={doctors}
            actions={(doctor) => (
              <>
                <button onClick={() => handleEdit(doctor)}>
                  ✏️ Editar
                </button>

                <button onClick={() => handleDelete(doctor.id!)}>
                  🗑 Excluir
                </button>
              </>
            )}
          />

        </CardContent>

      </Card>

    </Container>
  );
}

export default Doctors;