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
fun ProductosScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val api = remember { RetrofitClient.create(context) }
    val scope = rememberCoroutineScope()

    var recicladores by remember { mutableStateOf<List<Reciclador>>(emptyList()) }
    var productos by remember { mutableStateOf<List<Producto>>(emptyList()) }
    var cargando by remember { mutableStateOf(true) }
    var guardando by remember { mutableStateOf(false) }
    var reciclador by remember { mutableStateOf("") }
    var mat by remember { mutableStateOf("") }
    var kg by remember { mutableStateOf("") }
    var fecha by remember { mutableStateOf("") }
    var lote by remember { mutableStateOf("") }
    var mensaje by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    fun cargar() {
        scope.launch {
            cargando = true
            try {
                val rs = api.recicladores().data ?: emptyList()
                val ps = api.productos().data ?: emptyList()
                recicladores = rs; productos = ps
                if (reciclador.isBlank() && rs.isNotEmpty()) reciclador = rs[0].nombre
                if (mat.isBlank() && ps.isNotEmpty()) mat = ps[0].material
            } catch (e: Exception) {
                error = e.mensajeApi()
            }
            cargando = false
        }
    }
    LaunchedEffect(Unit) { cargar() }

    fun registrar() {
        val kgNum = kg.toDoubleOrNull() ?: 0.0
        if (kgNum <= 0) { error = "Ingresa el peso recibido."; return }
        scope.launch {
            guardando = true; error = ""; mensaje = ""
            try {
                api.registrarEntrada(EntradaRequest(mat, kgNum, reciclador, fecha, lote))
                mensaje = "Material registrado. Inventario actualizado."
                kg = ""; lote = ""
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
        item { Encabezado("Registrar productos", "RF07 — Clasificación de materiales y registro de inventario", onBack) }
        item { Mensajes(mensaje, error) }
        item { Text("Entrada de material", style = MaterialTheme.typography.titleMedium) }
        item {
            Selector("Reciclador", recicladores.map { it.nombre to it.nombre }, reciclador) { reciclador = it }
        }
        item {
            Selector("Tipo de material", productos.map { it.material to it.nombre }, mat) { mat = it }
        }
        item { CampoNumero("Peso (kg)", kg) { kg = it } }
        item {
            OutlinedTextField(
                value = fecha, onValueChange = { fecha = it },
                label = { Text("Fecha recepción (AAAA-MM-DD)") },
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )
        }
        item {
            OutlinedTextField(
                value = lote, onValueChange = { lote = it },
                label = { Text("N° de lote") },
                singleLine = true, modifier = Modifier.fillMaxWidth()
            )
        }
        item {
            Button(
                onClick = { registrar() }, enabled = !guardando,
                modifier = Modifier.fillMaxWidth()
            ) { Text(if (guardando) "Guardando..." else "Registrar entrada") }
        }
        item { Text("Inventario", style = MaterialTheme.typography.titleMedium) }
        if (cargando) item { Text("Cargando...") }
        items(productos) { p ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text(p.nombre, style = MaterialTheme.typography.titleSmall)
                    Text("Stock: ${p.stockKg.limpio()} kg  ·  \$${formatoMoneda(p.precioKg)}/kg")
                    Text(if (p.stockKg < 200) "Bajo stock" else "Disponible")
                }
            }
        }
    }
}