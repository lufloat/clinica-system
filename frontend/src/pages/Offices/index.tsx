import { useEffect, useState } from "react";

import Table from "../../components/ui/Table";
import OfficeForm from "./OfficeForm";

import type { Office } from "./office.types";
import { getOffices } from "../../services/officeService";

function Offices() {

    const [offices, setOffices] = useState<Office[]>([]);

    async function loadOffices() {
        const data = await getOffices();
        setOffices(data);
    }

    useEffect(() => {
        loadOffices();
    }, []);

    const columns = [
        { key: "name", label: "Consultório" },
        { key: "room", label: "Sala" },
        { key: "floor", label: "Andar" },
    ] as const;

    return (
        <>
            <h1>Consultórios</h1>

            <Table
                columns={columns}
                data={offices}
            />

            <OfficeForm
                onOfficeCreated={loadOffices}
            />
        </>
    );
}

export default Offices;