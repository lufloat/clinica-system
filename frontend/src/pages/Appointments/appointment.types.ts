export type Appointment = {

    id?: number;

    patient:number;

    patient_name?:string;

    doctor:number;

    doctor_name?:string;

    office:number;

    office_name?:string;

    appointment_date:string;

    appointment_time:string;

    observations:string;

    status?:string;

}