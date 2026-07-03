import { useState } from "react";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import type { Office } from "./office.types";
import { createOffice } from "../../services/officeService";

type OfficeFormProps = {
  onOfficeCreated: () => void;
};

function OfficeForm({ onOfficeCreated }: OfficeFormProps) {
  const [form, setForm] = useState<Office>({
    name: "",
    room: "",
    floor: "",
    observations: "",
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
      await createOffice(form);

      onOfficeCreated();

      setForm({
        name: "",
        room: "",
        floor: "",
        observations: "",
      });

      alert("Consultório cadastrado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar consultório.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      <h2>Novo Consultório</h2>

      <Input
        label="Nome"
        name="name"
        value={form.name}
        onChange={handleChange}
      />

      <Input
        label="Sala"
        name="room"
        value={form.room}
        onChange={handleChange}
      />

      <Input
        label="Andar"
        name="floor"
        value={form.floor}
        onChange={handleChange}
      />

      <Input
        label="Observações"
        name="observations"
        value={form.observations}
        onChange={handleChange}
      />

      <Button type="submit">
        Salvar
      </Button>

    </form>
  );
}

export default OfficeForm;