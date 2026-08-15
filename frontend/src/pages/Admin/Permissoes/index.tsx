import { useEffect, useMemo, useState } from "react";

import type { Role, ModuleDef, ActionDef, PermissionMap } from "../../../services/roleService";
import {
  getRoles,
  getPermissionCatalog,
  updateRole,
} from "../../../services/roleService";
import { extractErrorMessage } from "../../../utils/errors";

import "./Permissoes.css";

export default function Permissoes() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<ModuleDef[]>([]);
  const [actions, setActions] = useState<ActionDef[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PermissionMap>({});
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [rls, catalog] = await Promise.all([
        getRoles(),
        getPermissionCatalog(),
      ]);
      setRoles(rls);
      setModules(catalog.modules);
      setActions(catalog.actions);
      // seleciona o primeiro cargo não-admin por padrão
      const first = rls.find((r) => !r.is_admin) ?? rls[0];
      if (first) selectRole(first);
      setLoadError("");
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    }
  }

  function selectRole(role: Role) {
    setSelectedId(role.id);
    setDraft(JSON.parse(JSON.stringify(role.permissions || {})));
    setSaved(false);
  }

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) ?? null,
    [roles, selectedId]
  );

  function has(module: string, action: string) {
    return (draft[module] ?? []).includes(action);
  }

  function toggle(module: string, action: string) {
    setSaved(false);
    setDraft((current) => {
      const set = new Set(current[module] ?? []);
      if (set.has(action)) {
        set.delete(action);
        // sem "view" não faz sentido manter as demais ações
        if (action === "view") set.clear();
      } else {
        set.add(action);
        set.add("view"); // qualquer ação exige poder visualizar
      }
      const next = { ...current };
      if (set.size) next[module] = Array.from(set);
      else delete next[module];
      return next;
    });
  }

  function toggleModuleAll(module: string) {
    setSaved(false);
    const allKeys = actions.map((a) => a.key);
    const hasAll = allKeys.every((a) => has(module, a));
    setDraft((current) => {
      const next = { ...current };
      if (hasAll) delete next[module];
      else next[module] = [...allKeys];
      return next;
    });
  }

  async function handleSave() {
    if (!selected || saving) return;
    try {
      setSaving(true);
      await updateRole(selected.id, {
        name: selected.name,
        description: selected.description,
        permissions: draft,
      });
      await load();
      setSelectedId(selected.id);
      setSaved(true);
    } catch (error) {
      setLoadError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Permissões</h1>
          <p className="page-sub">
            Defina o que cada cargo pode ver e fazer em cada módulo.
          </p>
        </div>
      </header>

      {loadError && <p className="form-error form-error-banner">{loadError}</p>}

      <div className="perm-layout">
        <aside className="perm-roles">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className={role.id === selectedId ? "perm-role active" : "perm-role"}
              onClick={() => selectRole(role)}
            >
              <strong>{role.name}</strong>
              {role.is_admin && <span className="tag-admin">acesso total</span>}
            </button>
          ))}
        </aside>

        <section className="page-card perm-matrix-card">
          {!selected ? (
            <p className="empty">Selecione um cargo.</p>
          ) : selected.is_admin ? (
            <div className="perm-admin-note">
              <h2>{selected.name}</h2>
              <p>
                Este cargo tem <strong>acesso total</strong> a todos os módulos e
                ações. Não é editável.
              </p>
            </div>
          ) : (
            <>
              <div className="perm-matrix-head">
                <h2>{selected.name}</h2>
                <div className="perm-actions">
                  {saved && <span className="perm-saved">✓ Salvo</span>}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Salvar permissões"}
                  </button>
                </div>
              </div>

              <div className="perm-scroll">
                <table className="perm-table">
                  <thead>
                    <tr>
                      <th>Módulo</th>
                      {actions.map((a) => (
                        <th key={a.key}>{a.label}</th>
                      ))}
                      <th>Tudo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m.key}>
                        <td className="perm-module">{m.label}</td>
                        {actions.map((a) => (
                          <td key={a.key} className="perm-cell">
                            <input
                              type="checkbox"
                              checked={has(m.key, a.key)}
                              onChange={() => toggle(m.key, a.key)}
                            />
                          </td>
                        ))}
                        <td className="perm-cell">
                          <input
                            type="checkbox"
                            checked={actions.every((a) => has(m.key, a.key))}
                            onChange={() => toggleModuleAll(m.key)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
