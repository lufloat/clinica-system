import type { ReactNode } from "react";
import "./Table.css";

type Column<T> = {
  key: keyof T;
  label: string;
};

type TableProps<T> = {
  columns: readonly Column<T>[];
  data: T[];
  actions?: (item: T) => ReactNode;
};

function Table<T extends { id: number }>({
  columns,
  data,
  actions,
}: TableProps<T>) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)}>
              {column.label}
            </th>
          ))}

          {actions && <th>Ações</th>}
        </tr>
      </thead>

      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            {columns.map((column) => (
              <td key={String(column.key)}>
                {String(item[column.key] ?? "")}
              </td>
            ))}

            {actions && (
              <td>{actions(item)}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;