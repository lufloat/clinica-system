export type Condition =
  | "SAUDAVEL"
  | "CARIE"
  | "RESTAURADO"
  | "FRATURADO"
  | "AUSENTE"
  | "IMPLANTE"
  | "PROTESE";

export type Face =
  | "TODO"
  | "VESTIBULAR"
  | "LINGUAL"
  | "MESIAL"
  | "DISTAL"
  | "OCLUSAL";

export type RecordStatus = "PLANEJADO" | "EXECUTADO" | "CANCELADO";

export type ToothRecord = {
  id?: number;
  chart: number;
  tooth: number;
  face: Face;
  condition: Condition;
  procedure: string;
  status: RecordStatus;
  appointment?: number | null;
  notes: string;
  created_at?: string;
};

export type DentalChart = {
  id: number;
  patient: number;
  patient_name: string;
  notes: string;
  tooth_records: ToothRecord[];
};

/** Notação FDI, por quadrante, na ordem em que a boca é desenhada. */
export const QUADRANTS: { label: string; teeth: number[] }[] = [
  { label: "Sup. direito", teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  { label: "Sup. esquerdo", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { label: "Inf. direito", teeth: [48, 47, 46, 45, 44, 43, 42, 41] },
  { label: "Inf. esquerdo", teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
];

export const CONDITION_LABEL: Record<Condition, string> = {
  SAUDAVEL: "Saudável",
  CARIE: "Cárie",
  RESTAURADO: "Restaurado",
  FRATURADO: "Fraturado",
  AUSENTE: "Ausente",
  IMPLANTE: "Implante",
  PROTESE: "Prótese",
};

export const FACE_LABEL: Record<Face, string> = {
  TODO: "Dente inteiro",
  VESTIBULAR: "Vestibular",
  LINGUAL: "Lingual",
  MESIAL: "Mesial",
  DISTAL: "Distal",
  OCLUSAL: "Oclusal",
};

export const STATUS_LABEL: Record<RecordStatus, string> = {
  PLANEJADO: "Planejado",
  EXECUTADO: "Executado",
  CANCELADO: "Cancelado",
};
