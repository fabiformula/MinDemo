# 🫀 Monitor de Pulso PPG - Análisis Técnico y Mejoras

## 📋 Resumen de Cambios Implementados

### 1. **Algoritmo PPG Robusto**

#### Procesamiento de Señal Mejorado
- **Filtrado DC**: Elimina el componente de corriente continua (drift lento)
- **Promedio Móvil**: Reduce ruido de alta frecuencia
- **Detección Adaptativa**: Umbrales dinámicos basados en estadísticas locales
- **Validación de Rangos**: BPM entre 40-180 con verificación de intervalos

#### Detección de Picos
```javascript
// Antes (simplista):
const isValley = (v1 > v2) && (v3 > v2);

// Ahora (robusto):
- Ventana local de 15 muestras
- Umbral adaptativo (130% sobre media local)
- Validación temporal entre picos (333ms-1500ms)
- Filtro de outliers con mediana
```

### 2. **Sistema de Flash Inteligente**

#### Ciclo de 30 segundos:
1. **Medición inicial** (8 latidos estables)
2. **Fase de relajación** (30 segundos con guía sonora)
3. **Re-calibración** (flash automático, 5 latidos)
4. **Ajuste de BPM guiado** según nueva medición
5. Repetir hasta fin de sesión

```javascript
CONFIG.RELAX_DURATION_MS = 30000  // 30 segundos
CONFIG.INITIAL_CALIBRATION_BEATS = 8  // Primera medición
CONFIG.UPDATE_CALIBRATION_BEATS = 5   // Re-calibración
```

### 3. **Validación de Señal**

#### Indicador de Calidad (0-100%)
- **Brillo**: Rechaza señal muy oscura (<30) o saturada (>240)
- **Varianza**: Calcula desviación estándar del canal rojo
- **Rango óptimo**: stdDev entre 5-30 = señal buena
- **Movimiento**: Penaliza varianza excesiva (>40)

#### Estados de Calidad:
- 🟢 **Excelente** (70-100%): Señal óptima
- 🟡 **Buena** (40-69%): Funcional
- 🟠 **Regular** (20-39%): Ajustar presión
- 🔴 **Pobre** (<20%): Señal inválida

### 4. **Manejo de Errores Mejorado**

```javascript
// Errores de Cámara
- NotAllowedError → "Permiso denegado"
- NotFoundError → "Sin cámara trasera"
- Timeout → "Señal perdida, reajusta"

// Validaciones
- Stream activo antes de procesar
- Video no pausado/terminado
- Buffer suficiente (>30 muestras)
- BPM en rango válido
```

### 5. **Panel de Debugging**

Activa con checkbox "Modo Debug":

#### Información en tiempo real:
- Estado actual del sistema
- BPM calculado
- Calidad de señal (%)
- Latidos detectados
- Tamaño de buffer
- Número de picos
- Intervalos R-R almacenados
- Tiempo desde último latido

#### Gráficos:
- **Superior**: Señal RAW (gris)
- **Inferior**: Señal FILTRADA (azul)
- Comparación visual de efectividad del filtro

## 🔧 Configuración Técnica

### Parámetros Ajustables (CONFIG)

```javascript
SAMPLE_RATE: 30              // Hz - tasa de muestreo objetivo
HISTORY_SIZE: 256            // Muestras guardadas (~8.5s)
SMOOTH_WINDOW: 3             // Ventana promedio móvil

MIN_BPM: 40                  // BPM mínimo válido
MAX_BPM: 180                 // BPM máximo válido

MIN_SIGNAL_STRENGTH: 5       // Varianza mínima
PEAK_THRESHOLD: 1.3          // Pico = 130% de media local
VALLEY_THRESHOLD: 0.85       // Valle = 85% de media local

INITIAL_CALIBRATION: 8       // Latidos para calibración inicial
UPDATE_CALIBRATION: 5        // Latidos para re-calibración
SIGNAL_LOSS_TIMEOUT: 5000    // ms sin latido = pérdida

RELAX_DURATION: 30000        // ms de relajación entre mediciones
```

## 📊 Flujo del Algoritmo

### 1. Captura de Señal
```
Video Frame → Canvas (80x80) → Region Central (50%) → Promedio Canal Rojo
```

### 2. Preprocesamiento
```
Señal RAW → Remover DC → Promedio Móvil → Señal Filtrada
```

### 3. Detección
```
Para cada punto:
  - Calcular ventana local (±15 muestras)
  - Verificar máximo/mínimo local
  - Validar umbral adaptativo
  - Comprobar distancia temporal
  → Marcar como Pico/Valle
```

### 4. Cálculo BPM
```
Picos Detectados → Intervalos R-R → Filtro de Outliers (mediana) 
→ Promedio → 60000/intervalo → BPM
```

### 5. Guía de Audio
```
BPM Medido → Target = BPM - 5 (mín 50) 
→ Rampa Lineal 30s → Nuevo Ciclo
```

## 🐛 Debugging: Qué Observar

### Señal de Buena Calidad
- **RAW**: Onda con periodicidad clara
- **FILTRADA**: Onda suave sin ruido
- **Picos**: Marcadores verdes en máximos regulares
- **Calidad**: >60%
- **BPM**: Estable (±5 entre lecturas)

### Problemas Comunes

#### 1. Calidad <20%
**Causas:**
- Dedo mal posicionado
- Sin flash activado
- Presión insuficiente/excesiva
- Movimiento

**Solución:**
- Presionar suavemente pero firme
- Cubrir completamente cámara + flash
- Mantener quieto

#### 2. BPM Errático
**Causas:**
- Ruido en señal
- Detección de armónicos (doble frecuencia)
- Movimiento

**Solución:**
- Esperar más latidos (aumentar INITIAL_CALIBRATION)
- Ajustar PEAK_THRESHOLD más alto (1.4-1.5)

#### 3. "Señal Perdida"
**Causas:**
- Dedo levantado
- Flash apagado
- Batería baja (cámara se apaga)

**Solución:**
- Reposicionar dedo
- Verificar permisos de cámara

#### 4. Flash No Enciende
**Causas:**
- Navegador no soporta API torch
- Permisos insuficientes
- Dispositivo sin flash

**Verificación:**
```javascript
// En consola del navegador:
const track = stream.getVideoTracks()[0];
console.log(track.getCapabilities());
// Buscar: torch: true
```

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome Android 87+
- ✅ Safari iOS 14.3+
- ✅ Firefox Android 88+
- ✅ Edge Android 87+
- ❌ Navegadores Desktop (sin flash)

### API Flash
- **Android**: Amplio soporte
- **iOS**: Limitado (Safari solamente)
- **Fallback**: Funciona sin flash pero menor precisión

## 🎯 Próximas Mejoras Recomendadas

### 1. Filtro Butterworth
Reemplazar promedio móvil con filtro pasa-banda digital (0.7-3 Hz)

### 2. FFT para HRV
Análisis de frecuencia para variabilidad cardíaca

### 3. Calibración por Dispositivo
Guardar parámetros óptimos en localStorage

### 4. Machine Learning
Clasificar calidad de señal con modelo entrenado

### 5. Exportar Datos
Permitir guardar sesión (CSV, JSON)

## 📖 Uso de la App

### Inicio
1. Seleccionar duración de sesión (1-60 min)
2. (Opcional) Activar "Modo Debug"
3. Presionar "Iniciar Medición"

### Durante Medición
1. **Calibración Inicial** (15-20 segundos)
   - Colocar dedo índice sobre cámara trasera
   - Cubrir completamente flash
   - Presión firme pero no excesiva
   - Mantener quieto
   - Esperar a ver BPM estable

2. **Fase Relajación** (30 segundos)
   - Quitar dedo
   - Seguir ritmo del beep
   - Respirar al compás
   - BPM disminuye gradualmente

3. **Re-calibración** (10 segundos)
   - Colocar dedo nuevamente
   - Flash se enciende automáticamente
   - Esperar nueva lectura

4. **Ciclo Completo**
   - Alternar medición/relajación
   - Cada ciclo ~40 segundos
   - BPM objetivo baja progresivamente

### Finalización
- Timer llega a 00:00
- Mensaje "Sesión Completada"
- Cámara se apaga automáticamente

## 🔍 Interpretación del Debug

### Valores Normales
```
Estado: MEASURING_INITIAL / RELAXING / MEASURING_UPDATE
BPM: 60-90 (en reposo)
Calidad: 60-100%
Latidos: Incrementa continuamente
Buffer: 30-256
Picos: Incrementa con latidos
Intervalos RR: 5-10 valores
Último Latido: <1.5s
```

### Valores Problemáticos
```
BPM: <40 o >180 → Detección errónea
Calidad: <40% → Mala señal
Último Latido: >3s → Ajustar dedo
Buffer: <30 → Esperando datos
Picos: No incrementa → Sin detección
```

## ⚙️ Ajustes Finos

Si el algoritmo no detecta bien tu pulso específico:

### Pulso Lento (<60 BPM)
```javascript
CONFIG.MAX_PEAK_DISTANCE_MS = 2000  // Aumentar
CONFIG.MIN_BPM = 35  // Reducir
```

### Pulso Rápido (>90 BPM)
```javascript
CONFIG.MIN_PEAK_DISTANCE_MS = 280  // Reducir
CONFIG.MAX_BPM = 200  // Aumentar
```

### Señal Ruidosa
```javascript
CONFIG.SMOOTH_WINDOW = 5  // Aumentar suavizado
CONFIG.PEAK_THRESHOLD_MULTIPLIER = 1.5  // Más restrictivo
```

### Muy Sensible (detecta doble)
```javascript
CONFIG.MIN_PEAK_DISTANCE_MS = 400  // Aumentar
CONFIG.PEAK_THRESHOLD_MULTIPLIER = 1.4  // Aumentar
```

## 📝 Notas Importantes

1. **Privacidad**: Toda la medición es local, no se envía datos
2. **Precisión**: ±5 BPM es normal vs dispositivos médicos
3. **No es dispositivo médico**: Solo uso recreacional/wellness
4. **Mejor en Android**: Mayor compatibilidad con API torch
5. **Luz ambiente**: Funciona mejor en lugares oscuros

## 🚀 Testing Recomendado

1. Probar en 3+ dispositivos diferentes
2. Comparar con pulsómetro de referencia
3. Testar en diferentes condiciones de luz
4. Verificar consumo de batería en sesiones largas
5. Probar con usuarios de diferentes edades (pulso variable)

---

**Desarrollado con algoritmo PPG (Photoplethysmography)**  
Versión: 2.0 - Febrero 2026
