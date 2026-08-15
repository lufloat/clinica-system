import type { ReactNode } from "react";
import "./Table.css";

type Column<T> = {
  key: keyof T;
  label: string;
  /** permite formatar a célula em vez de imprimir o valor cru */
  render?: (item: T) => ReactNode;
};

type TableProps<T> = {
  columns: readonly Column<T>[];
  data: T[];
  actions?: (item: T) => ReactNode;
  emptyText?: string;
};

/** `id?` porque os tipos do domínio só ganham id depois de salvos. */
function Table<T extends { id?: number }>({
  columns,
  data,
  actions,
  emptyText = "Nenhum registro encontrado.",
}: TableProps<T>) {

  const span = columns.length + (actions ? 1 : 0);

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
        {data.length === 0 && (
          <tr>
            <td colSpan={span} className="table-empty">
              {emptyText}
            </td>
          </tr>
        )}

        {data.map((item, index) => (
          <tr key={item.id ?? index}>
            {columns.map((column) => (
              <td key={String(column.key)}>
                {column.render
                  ? column.render(item)
                  : String(item[column.key] ?? "")}
              </td>
            ))}

            {actions && (
              <td>
                <div className="table-actions">{actions(item)}</div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
