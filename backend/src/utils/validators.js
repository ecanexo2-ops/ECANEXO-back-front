// Solo letras (incluye tildes y ñ) y espacios.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/
// Solo dígitos.
const SOLO_NUMEROS = /^[0-9]+$/

const validarSoloLetras = (valor, campo) => {
  if (!valor || !String(valor).trim()) return `${campo} es obligatorio.`
  if (!SOLO_LETRAS.test(valor)) return `${campo} solo puede contener letras.`
  return null
}

const validarSoloNumeros = (valor, campo) => {
  if (!valor || !String(valor).trim()) return `${campo} es obligatorio.`
  if (!SOLO_NUMEROS.test(valor)) return `${campo} solo puede contener números.`
  return null
}

const validarSoloNumerosOpcional = (valor, campo) => {
  if (!valor || !String(valor).trim()) return null
  if (!SOLO_NUMEROS.test(valor)) return `${campo} solo puede contener números.`
  return null
}

module.exports = {
  validarSoloLetras,
  validarSoloNumeros,
  validarSoloNumerosOpcional,
}