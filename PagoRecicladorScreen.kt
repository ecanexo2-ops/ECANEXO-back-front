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

@Composable
fun PagoRecicladorScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val api = remember { RetrofitClient.create(context) }
    val scope = rememberCoroutineScope()

    var recicladores by remember { mutableStateOf<List<Reciclador>>(emptyList()) }
    var pagos by remember { mutableStateOf<List<PagoReciclador>>(emptyList()) }
    var tarifas by remember { mutableStateOf<Map<String, Tarifa>>(emptyMap()) }
    var cargando by remember { mutableStateOf(true) }
    var guardando by remember { mutableStateOf(false) }
    var reciclador by remember { mutableStateOf("") }
    var mat by remember { mutableStateOf("") }
    var kg by remember { mutableStateOf("80") }
    var bonus by remember { mutableStateOf("0") }
    var modalidad by remember { mutableStateOf("Efectivo") }
    var mensaje by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    fun cargar() {
        scope.launch {
            cargando = true
            try {
                val rs = api.recicladores().data ?: emptyList()
                val ps = api.pagosReciclador().data ?: emptyList()
                val ts = api.tarifas().data ?: emptyMap()
                recicladores = rs; pagos = ps; tarifas = ts
                if (reciclador.isBlank() && rs.isNotEmpty()) reciclador = rs[0].nombre
                if (mat.isBlank() && ts.isNotEmpty()) mat = ts.keys.first()
            } catch (e: Exception) {
                error = e.mensajeApi()
            }
            cargando = false
        }
    }
    LaunchedEffect(Unit) { cargar() }

    // precioCompra = lo que ECA le paga al reciclador (igual que la web)
    val precioCompra = tarifas[mat]?.precioCompra ?: 0.0
    val kgNum = kg.toDoubleOrNull() ?: 0.0
    val bonusNum = bonus.toDoubleOrNull() ?: 0.0
    val total = Math.round(precioCompra * kgNum * (1 + bonusNum / 100)).toDouble()

    fun procesar() {
        if (reciclador.isBlank() || mat.isBlank() || kgNum <= 0) {
            error = "Completa reciclador, material y peso."
            return
        }
        if (bonusNum < 0 || bonusNum > 20) {
            error = "La bonificación debe estar entre 0 y 20 %."
            return
        }
        scope.launch {
            guardando = true; error = ""; mensaje = ""
            try {
                api.crearPagoReciclador(PagoRecicladorRequest(reciclador, mat, kgNum, bonusNum, modalidad))
                mensaje = "Pago procesado. Recibo generado."
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
        item { Encabezado("Pago al reciclador", "RF08 — Gestión y procesamiento de pagos a recicladores", onBack) }
        item { Mensajes(mensaje, error) }
        item { Text("Procesar pago", style = MaterialTheme.typography.titleMedium) }
        item {
            Selector("Reciclador", recicladores.map { it.nombre to it.nombre }, reciclador) { reciclador = it }
        }
        item {
            Selector(
                "Material",
                tarifas.entries.map { it.key to "${it.value.nombre} — \$${formatoMoneda(it.value.precioCompra)}/kg" },
                mat
            ) { mat = it }
        }
        item { CampoNumero("Peso (kg)", kg) { kg = it } }
        item { CampoNumero("Bonificación por calidad (%)", bonus) { bonus = it } }
        item {
            Selector(
                "Modalidad",
                listOf("Efectivo" to "Efectivo", "Transferencia bancaria" to "Transferencia bancaria"),
                modalidad
            ) { modalidad = it }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Monto a pagar")
                        Text("\$${formatoMoneda(total)}", style = MaterialTheme.typography.titleLarge)
                    }
                    Text(
                        "${kgNum.limpio()} kg × \$${formatoMoneda(precioCompra)} + ${bonusNum.limpio()}% bonif.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
        item {
            Button(
                onClick = { procesar() }, enabled = !guardando,
                modifier = Modifier.fillMaxWidth()
            ) { Text(if (guardando) "Procesando..." else "Procesar pago") }
        }
        item { Text("Reporte de pagos", style = MaterialTheme.typography.titleMedium) }
        if (cargando) item { Text("Cargando...") }
        items(pagos.reversed()) { p ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text(p.reciclador, style = MaterialTheme.typography.titleSmall)
                    Text("${tarifas[p.material]?.nombre ?: p.material} · ${p.kg.limpio()} kg")
                    Text("\$${formatoMoneda(p.monto)} — ${p.estado}")
                }
            }
        }
    }
}