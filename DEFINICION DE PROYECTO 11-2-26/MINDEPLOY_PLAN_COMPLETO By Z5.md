# MINDEPLOY - PLAN DE DESARROLLO COMPLETO
## Centro de Meditación Online Basado en las 7 Leyes

---

## 🎯 VISIÓN DEL PROYECTO

### La Sinergia Central

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ECOSISTEMA MINDEPLOY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     📖 LIBRO                     📱 APP                      🤖 IA        │
│     "7 Leyes de la Realidad"     MinDeploy                   Guía        │
│                                                                          │
│     ┌────────────────┐           ┌────────────────┐         ┌─────────┐ │
│     │ MARCO TEÓRICO  │──────────▶│ EXPERIENCIA    │◀───────▶│ GUIA    │ │
│     │                │           │ SOMÁTICA       │         │ ADAPTAT.│ │
│     └────────────────┘           └────────────────┘         └─────────┘ │
│            │                            │                         │       │
│            ▼                            ▼                         ▼       │
│     ┌────────────────┐           ┌────────────────┐         ┌─────────┐ │
│     │ • Inercia      │           │ • Discovery    │         │ • Nivel │ │
│     │ • Resonancia   │           │ • Sync Pareja  │         │ • Tono  │ │
│     │ • Cristalización│          │ • Guías IA     │         │ • Ritmo │ │
│     │ • Sensibilidad │           │ • Historial    │         │ • Voz   │ │
│     │ • Frontera     │           │ • Comunidad    │         │         │ │
│     │ • Memoria      │           │                │         │         │ │
│     │ • Homeostasis  │           │                │         │         │ │
│     └────────────────┘           └────────────────┘         └─────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Propuesta de Valor por Componente

| Componente | Rol | Valor al Usuario | Conexión |
|------------|-----|------------------|----------|
| **Libro** | Marco teórico | "Entiendo POR QUÉ resonamos" | Sustenta científicamente la app |
| **App** | Experiencia práctica | "SIENTO la resonancia en mi cuerpo" | Aplicación del libro |
| **IA** | Personalización | "Me guían SEGÚN mi nivel" | Adaptación dinámica |

---

## 📋 FASES DE DESARROLLO

### FASE 0: Arquitectura Base (Semana 1)

**Objetivo:** Configurar infraestructura y modelo de datos

**Entregables:**
- [x] Proyecto Next.js 15 configurado
- [ ] Schema de base de datos en Supabase
- [ ] Autenticación funcional
- [ ] Configuración de RLS (Row Level Security)
- [ ] Sistema de rutas: `/discovery`, `/sync`, `/guided`

**Tareas Técnicas:**
1. Crear tablas en Supabase (ver schema.sql)
2. Configurar Supabase Auth con providers (Google, Email)
3. Implementar middleware de autenticación
4. Configurar Supabase Realtime para sincronización
5. Crear componentes base de UI

---

### FASE 1: Funcionalidad Discovery (Semanas 2-3)

**"¿Quién respira como vos ahora?"**

Esta funcionalidad implementa la **Ley de Resonancia por Imitación** del libro:
> *"Los sistemas humanos son medios resonantes, y cada vibración emitida por un participante se propaga, se amplifica y se replica a través del tejido que conecta a todos los demás."*

**Flujo de Usuario:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     DISCOVERY FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LANDING                                                      │
│     ┌────────────────────────────────────────┐                  │
│     │  "Coloca tu dedo sobre la cámara"      │                  │
│     │  ┌────────────────────────────────┐    │                  │
│     │  │     🔘 CÍRCULO PULSANTE        │    │                  │
│     │  │     (se expande/contrae)       │    │                  │
│     │  └────────────────────────────────┘    │                  │
│     │  Duración: 30 segundos                 │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  2. ANÁLISIS                                                     │
│     ┌────────────────────────────────────────┐                  │
│     │  "Analizando tu patrón respiratorio..." │                  │
│     │  ████████████░░░░░░░░░░░░  67%         │                  │
│     │                                         │                  │
│     │  Tu ritmo: 14 resp/min                  │                  │
│     │  Tu corazón: 72 bpm                     │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  3. MAPA MUNDIAL                                                │
│     ┌────────────────────────────────────────┐                  │
│     │  🗺️ MAPA MUNDIAL (Leaflet)             │                  │
│     │                                         │                  │
│     │    ● Buenos Aires (91%)                │                  │
│     │    ● Madrid (87%)                      │                  │
│     │    ● Tokyo (82%)                       │                  │
│     │    ● São Paulo (79%)                   │                  │
│     │                                         │                  │
│     │  "23 personas respiran como vos ahora" │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  4. SESIÓN SILENCIOSA (Opcional)                               │
│     ┌────────────────────────────────────────┐                  │
│     │  Respirando con: María (Madrid)        │                  │
│     │                                         │                  │
│     │  🔵 Tu patrón    🩷 Su patrón          │                  │
│     │     (superpuestos)                      │                  │
│     │                                         │                  │
│     │  Sincronía: 87%                         │                  │
│     │  Tiempo: 03:24                          │                  │
│     └────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes a Desarrollar:**

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| `BreathDetector.tsx` | Acceso a cámara/micrófono, algoritmo rPPG | Alta |
| `BreathVisualizer.tsx` | Círculo pulsante animado | Alta |
| `PatternAnalyzer.ts` | Lógica de análisis de patrón | Alta |
| `DiscoveryMap.tsx` | Mapa Leaflet con puntos animados | Alta |
| `PatternCard.tsx` | Tarjeta de usuario similar | Media |
| `SilentSession.tsx` | Sesión silenciosa con otro usuario | Media |

**Algoritmo de Matching:**

```typescript
// Fórmula de similitud (basada en requerimientos)
function calculateSimilarity(myPattern: Pattern, theirPattern: Pattern): number {
  const breathDiff = Math.abs(myPattern.breathRate - theirPattern.breathRate);
  const heartDiff = Math.abs(myPattern.heartRate - theirPattern.heartRate);
  const varDiff = Math.abs(myPattern.variability - theirPattern.variability);
  
  const similarity = 100 - (breathDiff * 5) - (heartDiff * 2) - (varDiff * 1);
  return Math.max(0, Math.min(100, similarity));
}
```

**Consideraciones Técnicas:**
- rPPG funciona pero necesita pulido (ya existe base)
- Detección por audio como backup/redundancia
- Geolocalización por IP (no GPS exacto) para privacidad
- Patrones expiran en 5 minutos de inactividad

---

### FASE 2: Funcionalidad Sync de Pareja (Semanas 4-5)

**"Respirá juntos"**

Esta funcionalidad implementa la **Ley de Resonancia** aplicada a parejas:

> *"La resonancia por imitación no es nuestra enemiga ni nuestra salvadora. Es simplemente la física de los sistemas humanos. Podemos aprender a trabajar con ese mecanismo de manera más consciente."*

**Flujo de Usuario:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYNC DE PAREJA FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USUARIO 1 (Creador)           USUARIO 2 (Invitado)             │
│                                                                  │
│  1. CREAR SESIÓN                                               │
│     ┌───────────────┐          ┌───────────────┐                │
│     │ "Respirar con │          │ Recibe link   │                │
│     │  alguien"     │          │ o ingresa     │                │
│     └───────┬───────┘          │ código        │                │
│             ▼                   └───────┬───────┘                │
│     ┌───────────────┐                  ▼                        │
│     │ Código: XK49L2│          ┌───────────────┐                │
│     │ [Copiar link] │          │ Ingresa:      │                │
│     │               │          │ XK49L2        │                │
│     │ Esperando...  │          │ [Unirme]      │                │
│     └───────┬───────┘          └───────┬───────┘                │
│             │                          │                         │
│             └──────────┬───────────────┘                         │
│                        ▼                                         │
│  2. SESIÓN ACTIVA                                              │
│     ┌────────────────────────────────────────────┐              │
│     │                                             │              │
│     │      🔵 ─────────────── 🩷                  │              │
│     │     (Azul = tú)      (Rosa = pareja)       │              │
│     │                                             │              │
│     │           SINCRONÍA: 73%                    │              │
│     │                                             │              │
│     │     Tiempo: 05:23    [Terminar sesión]     │              │
│     │                                             │              │
│     └────────────────────────────────────────────┘              │
│                        │                                         │
│                        ▼                                         │
│  3. RESULTADOS                                                 │
│     ┌────────────────────────────────────────────┐              │
│     │  📊 Resumen de la sesión                   │              │
│     │                                             │              │
│     │  Duración: 5:23                            │              │
│     │  Sincronía promedio: 71%                   │              │
│     │  Sincronía máxima: 89%                     │              │
│     │                                             │              │
│     │  📈 Gráfico de evolución temporal          │              │
│     │                                             │              │
│     │  [Ver historial con esta persona]          │              │
│     └────────────────────────────────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes a Desarrollar:**

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| `PairInvite.tsx` | Generación de código y link | Alta |
| `SyncSession.tsx` | Vista principal de sesión | Alta |
| `SyncVisualizer.tsx` | Dos círculos superpuestos | Alta |
| `SyncCalculator.ts` | Cálculo de sincronía en tiempo real | Alta |
| `SessionResults.tsx` | Estadísticas post-sesión | Media |
| `SessionHistory.tsx` | Historial con una pareja | Media |

**Cálculo de Sincronía en Tiempo Real:**

```typescript
interface SyncState {
  breathRate1: number;
  breathRate2: number;
  phase1: 'inhale' | 'exhale' | 'hold';
  phase2: 'inhale' | 'exhale' | 'hold';
}

function calculateRealtimeSync(state: SyncState): number {
  // Diferencia de ritmo
  const rateDiff = Math.abs(state.breathRate1 - state.breathRate2);
  const rateScore = Math.max(0, 100 - (rateDiff * 10));
  
  // Diferencia de fase (¿están en el mismo momento del ciclo?)
  const phaseMatch = state.phase1 === state.phase2 ? 100 : 50;
  
  // Score combinado
  return (rateScore * 0.6) + (phaseMatch * 0.4);
}
```

**Conexión con el Libro:**

Después de cada sesión, mostrar insight del Capítulo 2:

> *"Su sistema nervioso detectó tu malestar y comenzó a sincronizar. Esto no es empatía consciente. Es acoplamiento neurológico."*

---

### FASE 3: Integración IA - Guías Personalizadas (Semanas 6-7)

**"Guías que se adaptan a tu nivel"**

Esta funcionalidad implementa la **Ley de Homeostasis**:

> *"El sufrimiento no es un defecto. Es una característica. No es algo que hay que eliminar. Es algo que hay que entender."*

**Sistema de Niveles:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE NIVELES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🌱 BEGINNER (0-10 sesiones)                                   │
│     ├── Guías grabadas (no IA)                                 │
│     ├── Instrucciones explícitas                               │
│     ├── Sesiones cortas (3-5 min)                              │
│     └── Visualizaciones simples                                │
│                                                                  │
│  🌿 INTERMEDIATE (11-30 sesiones)                              │
│     ├── Guías IA personalizadas                                │
│     ├── Menos instrucciones, más espacio                       │
│     ├── Sesiones medianas (5-10 min)                           │
│     └── Visualizaciones avanzadas                              │
│                                                                  │
│  🌳 ADVANCED (31+ sesiones)                                    │
│     ├── IA minimalista (solo marcadores)                       │
│     ├── Espacio para práctica autónoma                         │
│     ├── Sesiones largas (10-20 min)                            │
│     └── Visualizaciones sutiles                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Flujo de Guía IA:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     GUÍA IA ADAPTATIVA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CONTEXTO                                                    │
│     ┌────────────────────────────────────────┐                  │
│     │ Usuario: Carlos (Intermediate, 23 ses) │                  │
│     │ Estado: breath_rate=14, heart=68       │                  │
│     │ Historia: prefiere sesiones de mañana  │                  │
│     │ Objetivo: reducir ansiedad             │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  2. GENERACIÓN IA (z-ai-web-dev-sdk)                           │
│     ┌────────────────────────────────────────┐                  │
│     │ Prompt al modelo:                       │                  │
│     │ "Genera guía de respiración 7 min para │                  │
│     │  usuario intermediate con ansiedad.    │                  │
│     │  Tono: calmado, minimalista.           │                  │
│     │  Incluir: técnica 4-7-8 adaptada."     │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  3. RESPUESTA IA → Script                                       │
│     ┌────────────────────────────────────────┐                  │
│     │ [0:00] "Comienza inhalando..."         │                  │
│     │ [0:04] "Sostén..."                      │                  │
│     │ [0:07] "Exhala lentamente..."          │                  │
│     │ [0:15] "..." (silencio guiado)         │                  │
│     │ ...                                      │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  4. TTS (Text-to-Speech)                                       │
│     ┌────────────────────────────────────────┐                  │
│     │ Convertir script a audio en tiempo real │                  │
│     │ Voz: calmada, neutra                   │                  │
│     │ Velocidad: 0.9x (más lenta)            │                  │
│     └────────────────────────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│  5. SESIÓN GUIADA                                               │
│     ┌────────────────────────────────────────┐                  │
│     │                                         │                  │
│     │     🔵 Círculo pulsante sincronizado   │                  │
│     │        con la guía                      │                  │
│     │                                         │                  │
│     │     🔊 "Inhala en 4... 3... 2... 1..." │                  │
│     │                                         │                  │
│     └────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes a Desarrollar:**

| Componente | Descripción | Prioridad |
|------------|-------------|-----------|
| `GuidedSessionCreator.ts` | Generador de guías con IA | Alta |
| `AIGuideService.ts` | Servicio de integración con z-ai-sdk | Alta |
| `TTSService.ts` | Text-to-speech para guías | Alta |
| `GuidedSessionPlayer.tsx` | Reproductor de sesiones | Alta |
| `SessionLibrary.tsx` | Biblioteca de sesiones | Media |
| `LevelIndicator.tsx` | Indicador de nivel del usuario | Baja |

**Tipos de Sesiones:**

| Tipo | Descripción | Nivel |
|------|-------------|-------|
| **Respiración Box** | 4-4-4-4 (inhala-sostén-exhala-sostén) | Beginner |
| **4-7-8** | Técnica de relajación profunda | Beginner |
| **Coherencia Cardíaca** | 5 seg inhala, 5 seg exhala | Intermediate |
| **Respiración Alterna** | Nasal alternada | Intermediate |
| **Meditación Sync** | Para parejas, guiada | Todos |
| **Sesión Personalizada** | Generada por IA según contexto | Intermediate+ |

---

### FASE 4: Integración Libro-App (Semana 8)

**"El contenido teórico en la experiencia práctica"**

Esta fase conecta el libro con la app de forma orgánica:

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRACIÓN LIBRO-APP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ANTES DE SESIÓN                                               │
│  ┌────────────────────────────────────────┐                     │
│  │ 💡 "Hoy: Ley de Resonancia"            │                     │
│  │                                         │                     │
│  │ "Tu sistema nervioso detectó la        │                     │
│  │  vibración de angustia en el ambiente  │                     │
│  │  y la replicó automáticamente."        │                     │
│  │                                         │                     │
│  │ Esta sesión te ayudará a crear         │                     │
│  │  resonancia positiva.                  │                     │
│  └────────────────────────────────────────┘                     │
│                                                                  │
│  DESPUÉS DE SESIÓN                                             │
│  ┌────────────────────────────────────────┐                     │
│  │ 📖 Lectura sugerida:                    │                     │
│  │                                         │                     │
│  │ Capítulo 2: Ley de Resonancia          │                     │
│  │ "La convergencia de frecuencias..."    │                     │
│  │                                         │                     │
│  │ [Leer fragmento] [Ver capítulo completo]│                    │
│  └────────────────────────────────────────┘                     │
│                                                                  │
│  INSIGHTS EN TIEMPO REAL                                       │
│  ┌────────────────────────────────────────┐                     │
│  │ Durante sesión silenciosa:              │                     │
│  │                                         │                     │
│  │ "Tu sincronía subió a 85% -            │                     │
│  │  sus frecuencias están convergiendo    │                     │
│  │  como describe la Ley de Resonancia"   │                     │
│  └────────────────────────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Contenido por Funcionalidad:**

| Funcionalidad | Ley Relacionada | Contenido Integrado |
|---------------|-----------------|---------------------|
| Discovery | Resonancia por Imitación | Insights sobre sincronización automática |
| Sync Pareja | Resonancia + Inercia | Por qué es difícil cambiar patrones de pareja |
| Guías IA | Homeostasis | Por qué el malestar es necesario |
| Historial | Memoria con Olvido | Metabolizar experiencias |
| Comunidad | Cristalización Jerárquica | Cómo se forman comunidades |

---

### FASE 5: Pulido y MVP Final (Semana 9)

**Preparación para inversión:**

**Checklist de Calidad:**

- [ ] Todos los flujos funcionan sin errores
- [ ] Responsive mobile-first perfecto
- [ ] Animaciones suaves (60fps)
- [ ] Mensajes de error claros
- [ ] Estados de loading
- [ ] Accesibilidad básica
- [ ] Performance en gama media
- [ ] Privacidad respetada

**Métricas del MVP:**

| Métrica | Objetivo |
|---------|----------|
| Tiempo hasta primera sesión | < 2 minutos |
| Detección de patrón exitosa | > 80% |
| Sesiones completadas | > 60% |
| Usuarios que repiten | > 30% |

---

## 🗓️ CRONOGRAMA

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRONOGRAMA DE DESARROLLO                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SEMANA 1    │ FASE 0: Arquitectura Base                        │
│              │ - Schema Supabase                                 │
│              │ - Auth + RLS                                      │
│              │ - Routing                                         │
│              │                                                   │
│  SEMANAS 2-3 │ FASE 1: Discovery                                │
│              │ - BreathDetector                                  │
│              │ - DiscoveryMap                                    │
│              │ - Matching algorithm                              │
│              │                                                   │
│  SEMANAS 4-5 │ FASE 2: Sync de Pareja                           │
│              │ - Sistema de códigos                              │
│              │ - SyncSession                                     │
│              │ - Realtime                                        │
│              │                                                   │
│  SEMANAS 6-7 │ FASE 3: IA Guías                                  │
│              │ - Integración z-ai-sdk                            │
│              │ - TTS                                             │
│              │ - Sistema de niveles                              │
│              │                                                   │
│  SEMANA 8    │ FASE 4: Integración Libro                        │
│              │ - Contenido teórico                               │
│              │ - Insights contextuales                           │
│              │                                                   │
│  SEMANA 9    │ FASE 5: Pulido MVP                               │
│              │ - Testing                                         │
│              │ - Performance                                     │
│              │ - Deploy final                                    │
│              │                                                   │
│  SEMANA 10   │ LANZAMIENTO MVP                                  │
│              │ - Demo a inversores                               │
│              │                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 DISEÑO UI/UX

### Paleta de Colores

```css
:root {
  --bg-primary: #0a0e27;      /* Fondo principal */
  --bg-secondary: #1e2a47;    /* Fondo secundario */
  --accent-user: #00d9ff;     /* Cyan - usuario principal */
  --accent-partner: #ff6b9d;  /* Coral/Rosa - pareja */
  --text-primary: #e8f4f8;    /* Texto principal */
  --text-muted: #6b7c93;      /* Texto secundario */
}
```

### Tipografía

| Uso | Fuente | Peso |
|-----|--------|------|
| Headings | Inter | Bold (700) |
| Body | Inter | Regular (400) |
| Códigos | JetBrains Mono | Mono |
| Números grandes | Inter | Light (300) |

### Visualizaciones Respiratorias

```
┌─────────────────────────────────────────────────────────────────┐
│                     CÍRCULO RESPIRATORIO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     INHALACIÓN              EXHALACIÓN                          │
│     ┌─────────┐             ┌─────────┐                         │
│     │  ╭───╮  │             │ ╭─────╮ │                         │
│     │ │     │ │             │ │     │ │                         │
│     │ │  ●  │ │  <--->      │ │  ●  │ │                         │
│     │ │     │ │             │ │     │ │                         │
│     │  ╰───╯  │             │ ╰─────╯ │                         │
│     └─────────┘             └─────────┘                         │
│     (expandido)             (contraído)                         │
│                                                                  │
│     Características:                                            │
│     - Borde: 4px sólido                                         │
│     - Sin relleno                                               │
│     - Blur sutil (box-shadow)                                   │
│     - Animación: ease-in-out 600ms                              │
│     - Color cyan (usuario) o coral (pareja)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 PANTALLAS PRINCIPALES

### 1. Landing / Onboarding

```
┌────────────────────────────────────┐
│                                    │
│          MINDEPLOY                 │
│    ┌────────────────────────┐      │
│    │                        │      │
│    │    🔘                  │      │
│    │   (círculo animado)    │      │
│    │                        │      │
│    └────────────────────────┘      │
│                                    │
│   "Descubrí quién respira          │
│    como vos en este momento"       │
│                                    │
│   [Comenzar]  [Ya tengo cuenta]    │
│                                    │
└────────────────────────────────────┘
```

### 2. Discovery - Detección

```
┌────────────────────────────────────┐
│                                    │
│   Coloca tu dedo sobre la cámara  │
│                                    │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   │      🔘                    │   │
│   │   (se expande/contrae)     │   │
│   │                            │   │
│   └────────────────────────────┘   │
│                                    │
│   ████████████░░░░░░░░░░░░ 23s    │
│                                    │
│   Tu ritmo: detectando...          │
│                                    │
│   [Cancelar]                        │
│                                    │
└────────────────────────────────────┘
```

### 3. Discovery - Mapa

```
┌────────────────────────────────────┐
│                                    │
│  23 personas respiran como vos    │
│                                    │
│  ┌────────────────────────────┐    │
│  │                            │    │
│  │     🌍 MAPA MUNDIAL        │    │
│  │                            │    │
│  │   ● Madrid (91%)           │    │
│  │        ● Tokyo (87%)       │    │
│  │   ●                         │    │
│  │       ● São Paulo (79%)    │    │
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  ┌────────────────────────────┐    │
│  │ María - Madrid             │    │
│  │ Sincronía: 91%             │    │
│  │ [Respirar juntos]          │    │
│  └────────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
```

### 4. Sync de Pareja

```
┌────────────────────────────────────┐
│                                    │
│       Respirando con María        │
│                                    │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   │      🔵 ───── 🩷           │   │
│   │     (tú)    (María)        │   │
│   │                            │   │
│   │       SINCRONÍA            │   │
│   │         73%                │   │
│   │                            │   │
│   └────────────────────────────┘   │
│                                    │
│        Tiempo: 05:23              │
│                                    │
│      [Terminar sesión]            │
│                                    │
└────────────────────────────────────┘
```

### 5. Guía IA

```
┌────────────────────────────────────┐
│                                    │
│   Sesión: Calma Profunda          │
│   Nivel: Intermediate             │
│                                    │
│   ┌────────────────────────────┐   │
│   │                            │   │
│   │         🔘                 │   │
│   │    (sigue la guía)         │   │
│   │                            │   │
│   └────────────────────────────┘   │
│                                    │
│   🔊 "Inhala en 4... 3...         │
│        2... 1..."                  │
│                                    │
│   ████████░░░░░░░░░░░░░░ 3:24     │
│                                    │
│   [Pausar]  [Terminar]            │
│                                    │
└────────────────────────────────────┘
```

---

## 🔐 PRIVACIDAD Y SEGURIDAD

### Datos NO Guardados

- Ubicación GPS exacta (solo ciudad/país)
- Video o audio grabado
- Datos biométricos por más de 24 horas
- Patrones respiratorios históricos detallados

### Datos Guardados

- Métricas agregadas (promedios)
- Historial de sesiones (sin datos crudos)
- Conexiones con otros usuarios (con consentimiento)
- Preferencias del usuario

### RLS (Row Level Security)

```sql
-- Ejemplo: Solo el usuario puede ver su historial
CREATE POLICY "Users can view own history" 
ON user_session_history FOR SELECT 
USING (auth.uid() = user_id);
```

---

## 🚀 DEPLOY Y HOSTING

### Configuración Actual

- **Frontend:** Netlify (ya configurado)
- **Backend:** Supabase (ya configurado)
- **Auth:** Supabase Auth

### Variables de Entorno Necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ZAI_API_KEY=your_zai_api_key
```

---

## 📊 MÉTRICAS PARA INVERSORES

### KPIs del MVP

| Métrica | Definición | Objetivo |
|---------|------------|----------|
| DAU | Usuarios activos diarios | > 100 |
| Retención D7 | Usuarios que vuelven en 7 días | > 30% |
| Sesiones/Usuario | Sesiones promedio por usuario | > 3 |
| Sync Rate | Sesiones de pareja exitosas | > 50% |
| NPS | Net Promoter Score | > 40 |

### Historia para Inversores

> "MinDeploy no es una app de meditación más. Es el único sistema que integra teoría profunda (libro bestseller) con experiencia somática (app) e inteligencia artificial adaptativa. Nuestros usuarios no solo meditan - entienden por qué funciona y sienten la resonancia con otros en tiempo real."

---

## ✅ PRÓXIMOS PASOS INMEDIATOS

1. **Aprobar este plan** (o modificarlo)
2. **Crear schema en Supabase** (ejecutar SQL)
3. **Comenzar FASE 1** (Discovery)
4. **Iterar con feedback real**

---

*Documento generado para MinDeploy MVP*
*Versión: 1.0*
*Fecha: 2025*
