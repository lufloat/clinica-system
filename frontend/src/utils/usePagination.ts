import { useEffect, useMemo, useState } from "react";

/** Itens por página nas listagens de Pacientes, Médicos e Consultórios. */
export const PAGE_SIZE = 30;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  /**
   * Filtrar ou excluir encurta a lista: sem isto o usuário ficaria numa
   * página que não existe mais, vendo a tabela vazia.
   */
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return {
    page,
    setPage,
    pageCount,
    pageItems,
    pageSize,
    total: items.length,
  };
}
