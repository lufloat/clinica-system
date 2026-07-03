import { useEffect, useState } from "react";
import type { Patient } from "./patient.types";

import { getPatients } from "../../services/patientService";

import Table from "../../components/ui/Table";
import PatientForm from "./PatientForm";

function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);

  async function loadPatients() {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const columns = [
    { key: "name", label: "Nome" },
    { key: "cpf", label: "CPF" },
    { key: "phone", label: "Telefone" },
  ] as const;

  return (
    <div>
      <h1>Pacientes</h1>

      <Table
        columns={columns}
        data={patients}
      />

      <div style={{ marginTop: "30px" }}>
        <PatientForm
          onPatientCreated={loadPatients}
        />
      </div>
    </div>
  );
}

export default Patients;