import "./Pagination.css";

type Props = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
};

/**
 * Janela de páginas em volta da atual: com muitas páginas, a lista de
 * botões viraria um paredão. Devolve números e cortes ("…").
 */
function windowOf(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const around = [page - 1, page, page + 1].filter(
    (n) => n > 1 && n < pageCount
  );

  const numbers = [1, ...around, pageCount];
  const out: Array<number | "gap"> = [];

  for (let i = 0; i < numbers.length; i++) {
    if (i > 0 && numbers[i] - numbers[i - 1] > 1) out.push("gap");
    out.push(numbers[i]);
  }

  return out;
}

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: Props) {

  if (pageCount <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="Paginação">
      <span className="pagination-info">
        Mostrando {first}–{last} de {total}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          ‹ Anterior
        </button>

        {windowOf(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="pagination-gap">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === page ? "page active" : "page"}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
        >
          Próximo ›
        </button>
      </div>
    </nav>
  );
}
