export type Patient = {
  id?: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birth_date: string;
  active?: boolean;
};