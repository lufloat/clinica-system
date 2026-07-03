import { useState } from "react";

type Props = {
  appointmentId: number;
};

function PrescriptionForm({ appointmentId }: Props) {
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [observations, setObservations] = useState("");

  function generatePrescription() {
    const params = new URLSearchParams({
      medication,
      dosage,
      frequency,
      duration,
      observations,
    });

    window.open(
      `http://127.0.0.1:8000/api/documents/${appointmentId}/prescription/?${params.toString()}`,
      "_blank"
    );
  }

  return (
    <div>

      <h2>Receita Médica</h2>

      <input
        placeholder="Medicamento"
        value={medication}
        onChange={(e) => setMedication(e.target.value)}
      />

      <input
        placeholder="Dosagem"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
      />

      <input
        placeholder="Frequência"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
      />

      <input
        placeholder="Duração"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />

      <textarea
        placeholder="Observações"
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
      />

      <button
        type="button"
        onClick={generatePrescription}
      >
        Gerar Receita
      </button>

    </div>
  );
}

export default PrescriptionForm;