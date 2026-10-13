import { useEffect, useState } from 'react'
import { api } from '../services/api'

const badgeClass = { Externo: 'badge-blue', Empresa: 'badge-green', Interno: 'badge-gray' }
const emptyForm  = { tipoDoc: 'Cédula (CC)', documento: '', nombre: '', apellido: '', email: '', telefono: '', tipo: 'Externo' }

// Solo letras (con tildes/ñ) y espacios; descarta números y símbolos mientras se escribe
const soloLetras  = (valor) => valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '')
// Solo dígitos; descarta letras y símbolos mientras se escribe
const soloNumeros = (valor) => valor.replace(/[^0-9]/g, '')

export default function Clientes() {
  const [clientes,   setClientes]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [form,       setForm]       = useState(emptyForm)
  const [editandoId, setEditandoId] = useState(null)
  const [confirmId,  setConfirmId]  = useState(null) // ID del cliente a confirmar eliminación

  const cargar = () => {
    setLoading(true)
    api.getClientes().then(setClientes).catch(e => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(cargar, [])

  const update = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  // Igual que update, pero descarta cualquier carácter que no sea letra (para nombre/apellido)
  const updateLetras  = field => e => setForm(f => ({ ...f, [field]: soloLetras(e.target.value) }))
  // Igual que update, pero descarta cualquier carácter que no sea dígito (para el N° de documento)
  const updateNumeros = field => e => setForm(f => ({ ...f, [field]: soloNumeros(e.target.value) }))

  const iniciarEdicion = (c) => {
    const partesNombre = c.nombre.split(' ')
    const partesDoc    = c.documento.split(' ')
    const tipoDoc      = partesDoc[0] === 'NIT' ? 'NIT' : 'Cédula (CC)'
    const numDoc       = partesDoc.slice(1).join('')
    setForm({
      tipoDoc,
      documento: numDoc,
      nombre:    partesNombre[0] || '',
      apellido:  partesNombre.slice(1).join(' ') || '',
      email:     c.email || '',
      telefono:  c.telefono || '',
      tipo:      c.tipo || 'Externo',
    })
    setEditandoId(c.id)
    setConfirmId(null)
    setError(''); setMsg('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelarEdicion = () => {
    setForm(emptyForm); setEditandoId(null); setError(''); setMsg('')
  }

  const guardar = async () => {
    if (!form.documento || !form.nombre) { setError('Documento y nombre son obligatorios.'); return }
    setError(''); setSaving(true)
    try {
      const payload = {
        nombre:    `${form.nombre} ${form.apellido}`.trim(),
        documento: `${form.tipoDoc.includes('NIT') ? 'NIT' : 'CC'} ${form.documento}`,
        tipo:      form.tipo,
        email:     form.email,
        telefono:  form.telefono,
      }
      if (editandoId) {
        await api.actualizarCliente(editandoId, payload)
        setMsg('✅ Cliente actualizado correctamente.')
        setEditandoId(null)
      } else {
        await api.crearCliente(payload)
        setMsg('✅ Cliente guardado correctamente.')
      }
      setForm(emptyForm); cargar(); setTimeout(() => setMsg(''), 3500)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const eliminar = async (id) => {
    try {
      await api.eliminarCliente(id)
      setMsg('🗑️ Cliente eliminado correctamente.')
      setConfirmId(null)
      if (editandoId === id) { setForm(emptyForm); setEditandoId(null) }
      cargar()
      setTimeout(() => setMsg(''), 3500)
    } catch (e) { setError(e.message); setConfirmId(null) }
  }

  const filtrados = search
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.documento.toLowerCase().includes(search.toLowerCase()))
    : clientes

  return (
    <>
      <div className="section-title">Gestión de clientes</div>
      <div className="section-sub">RF01 · RF02 — Registrar, consultar y editar clientes</div>
      {msg   && <div className="success-msg">{msg}</div>}
      {error && <div className="login-error">{error}</div>}

      <div className="grid-2">
        {/* FORMULARIO */}
        <div className="card">
          <div className="card-title">
            {editandoId ? `✏️ Editando cliente #${editandoId}` : '➕ Registrar cliente'}
          </div>
          <div className="form-row">
            <div className="form-group"><label>Tipo documento</label>
              <select value={form.tipoDoc} onChange={update('tipoDoc')} disabled={!!editandoId}>
                <option>Cédula (CC)</option><option>NIT</option><option>Pasaporte</option>
              </select>
            </div>
            <div className="form-group"><label>N° documento</label>
              <input type="text" placeholder="1000123456" value={form.documento}
                onChange={updateNumeros('documento')} disabled={!!editandoId}
                inputMode="numeric" pattern="[0-9]*" title="Solo números"
                style={editandoId ? { background: '#f5f5f5' } : {}} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Primer nombre</label>
              <input type="text" placeholder="Juan" value={form.nombre} onChange={updateLetras('nombre')}
                inputMode="text" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+" title="Gigite el campo" />
            </div>
            <div className="form-group"><label>Primer apellido</label>
              <input type="text" placeholder="Pérez" value={form.apellido} onChange={updateLetras('apellido')}
                inputMode="text" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+" title="Gigite el campo" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Email</label>
              <input type="email" placeholder="correo@email.com" value={form.email} onChange={update('email')} />
            </div>
            <div className="form-group"><label>Teléfono</label>
              <input type="text" placeholder="300 123 4567" value={form.telefono}
                onChange={updateNumeros('telefono')} inputMode="numeric" pattern="[0-9]*" title="Solo números" />
            </div>
          </div>
          <div className="form-group"><label>Tipo de cliente</label>
            <select value={form.tipo} onChange={update('tipo')}>
              <option>Externo</option><option>Empresa</option><option>Interno</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={cancelarEdicion}>
              {editandoId ? 'Cancelar edición' : 'Limpiar'}
            </button>
            <button className="btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : editandoId ? 'Actualizar cliente' : 'Guardar cliente'}
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="card">
          <div className="card-title">Clientes registrados ({filtrados.length})</div>
          <div className="form-group">
            <input type="text" placeholder="🔍 Buscar por nombre o documento..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Documento</th><th>Tipo</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4}>Cargando...</td></tr>}
                {!loading && filtrados.length === 0 && <tr><td colSpan={4}>Sin resultados.</td></tr>}
                {filtrados.map(c => (
                  <tr key={c.id} style={editandoId === c.id ? { background: '#EAF3DE' } : {}}>
                    <td>{c.nombre}</td>
                    <td>{c.documento}</td>
                    <td><span className={'badge ' + (badgeClass[c.tipo] || 'badge-gray')}>{c.tipo}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-sm" onClick={() => iniciarEdicion(c)}>✏️ Editar</button>

                        {/* Botón eliminar o confirmación */}
                        {confirmId === c.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#e53e3e' }}>¿Seguro?</span>
                            <button className="btn-sm" style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
                              onClick={() => eliminar(c.id)}>Sí</button>
                            <button className="btn-sm" onClick={() => setConfirmId(null)}>No</button>
                          </div>
                        ) : (
                          <button className="btn-sm" style={{ borderColor: '#e53e3e', color: '#e53e3e' }}
                            onClick={() => { setConfirmId(c.id); setError('') }}>
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
