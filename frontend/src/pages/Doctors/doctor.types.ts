/** CRM para medicina, CRO para odontologia. */
export type Council = "CRM" | "CRO";

export type Doctor = {
  id?: number;
  name: string;
  council: Council;
  council_code: string;
  specialty: string;
  phone: string;
  email: string;
  /** somente leitura — derivada do conselho (CRM/CRO) no backend */
  vertical_slug?: string;
  vertical_name?: string;
};