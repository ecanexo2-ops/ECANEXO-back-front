package com.example.ecanexo.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.ecanexo.data.remote.RetrofitClient
import com.example.ecanexo.data.remote.models.*
import kotlinx.coroutines.launch

private val quitarEmoji = Regex("^\\S+\\s")

@Composable
fun VentasScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val api = remember { RetrofitClient.create(context) }
    val scope = rememberCoroutineScope()

    var solicitudes by remember { mutableStateOf<List<Solicitud>>(emptyList()) }
    var ventas by remember { mutableStateOf<List<Venta>>(emptyList()) }
    var tarifas by remember { mutableStateOf<Map<String, Tarifa>>(emptyMap()) }
    var cargando by remember { mutableStateOf(true) }
    var guardando by remember { mutableStateOf(false) }
    var solicitudId by remember { mutableStateOf("") }
    var mat by remember { mutableStateOf("") }
    var kg by remember { mutableStateOf("50") }
    var precioKg by remember { mutableStateOf("0") }
    var mensaje by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    fun cargar() {
        scope.launch {
            cargando = true
            try {
                val ss = api.solicitudes().data ?: emptyList()
                val vs = api.ventas().data ?: emptyList()
                val ts = api.tarifas().data ?: emptyMap()
                solicitudes = ss; ventas = vs; tarifas = ts
                if (solicitudId.isBlank() && ss.isNotEmpty()) solicitudId = ss[0].id.toString()
                if (mat.isBlank() && ts.isNotEmpty()) {
                    mat = ts.keys.first()
                    precioKg = ts[mat]?.precioKg?.limpio() ?: "0"
                }
            } catch (e: Exception) {
                error = e.mensajeApi()
            }
            cargando = false
        }
    }
    LaunchedEffect(Unit) { cargar() }

    val total = (kg.toDoubleOrNull() ?: 0.0) * (precioKg.toDoubleOrNull() ?: 0.0)

    fun confirmar() {
        val kgNum = kg.toDoubleOrNull() ?: 0.0
        val precioNum = precioKg.toDoubleOrNull() ?: 0.0
        if (mat.isBlank() || kgNum <= 0 || precioNum <= 0) {
            error = "Completa producto, cantidad y precio."
            return
        }
        scope.launch {
            guardando = true; error = ""; mensaje = ""
            try {
                val sol = solicitudes.firstOrNull { it.id.toString() == solicitudId }
                val nombreMat = tarifas[mat]?.nombre?.replace(quitarEmoji, "") ?: mat
                val res = api.crearVenta(
                    VentaRequest(
                        cliente = sol?.cliente ?: "—",
                        material = nombreMat,
                        kg = kgNum,
                        precioKg = precioNum,
                        solicitudId = sol?.id
                    )
                )
                mensaje = "Venta confirmada. Ticket ${res.data?.ticket ?: ""} generado."
                cargar()
            } catch (e: Exception) {
                error = e.mensajeApi()
            }
            guardando = false
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { Encabezado("Confirmación de ventas", "RF05 — Confirmar venta y actualizar inventario", onBack) }
        item { Mensajes(mensaje, error) }
        item { Text("Nueva venta", style = MaterialTheme.typography.titleMedium) }
        item {
            Selector(
                "Solicitud",
                solicitudes.map { it.id.toString() to "#${it.id.toString().padStart(4, '0')} — ${it.cliente}" },
                solicitudId
            ) { solicitudId = it }
        }
        item {
            Selector(
                "Producto",
                tarifas.entries.map { it.key to it.value.nombre.replace(quitarEmoji, "") },
                mat
            ) {
                mat = it
                precioKg = tarifas[it]?.precioKg?.limpio() ?: "0"
            }
        }
        item { CampoNumero("Cantidad (kg)", kg) { kg = it } }
        item { CampoNumero("Precio acordado (\$/kg)", precioKg) { precioKg = it } }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total ticket")
                    Text("\$${formatoMoneda(total)}", style = MaterialTheme.typography.titleLarge)
                }
            }
        }
        item {
            Button(
                onClick = { confirmar() },
                enabled = !guardando,
                modifier = Modifier.fillMaxWidth()
            ) { Text(if (guardando) "Procesando..." else "Confirmar y generar ticket") }
        }
        item { Text("Transacciones", style = MaterialTheme.typography.titleMedium) }
        if (cargando) item { Text("Cargando...") }
        items(ventas.reversed()) { v ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text("${v.ticket} — ${v.cliente}", style = MaterialTheme.typography.titleSmall)
                    Text("${v.material} ${v.kg.limpio()} kg")
                    Text("\$${formatoMoneda(v.total)}")
                }
            }
        }
    }
}