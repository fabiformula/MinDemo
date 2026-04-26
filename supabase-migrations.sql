-- ═══════════════════════════════════════════════════════════════════
-- MINDEPLOY MVP - SQL MIGRATIONS
-- ═══════════════════════════════════════════════════════════════════
-- 
-- INSTRUCCIONES:
-- 1. Andá a tu Supabase Dashboard: https://supabase.com/dashboard
-- 2. Seleccioná tu proyecto (vortrqxzypdccepdmolh)
-- 3. Hacé click en "SQL Editor" en la barra lateral izquierda
-- 4. Copiá TODO el contenido de este archivo
-- 5. Pegalo en el editor SQL
-- 6. Dale click al botón verde "Run" (▶)
-- 7. Debería decir "Success. No rows returned" - eso es normal!
--
-- NOTA: Podés ejecutar todo junto, no hace falta ir tabla por tabla.
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- TABLA 1: active_patterns (para Discovery)
-- ═══════════════════════════════════════════════════════════════════
-- Guarda el patrón respiratorio activo de cada usuario.
-- Se auto-expira después de 5 minutos.

CREATE TABLE IF NOT EXISTS active_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate NUMERIC,
  breath_rate NUMERIC,
  variability NUMERIC,
  location JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Índice para limpiar patrones expirados rápido
CREATE INDEX IF NOT EXISTS idx_active_patterns_expires 
  ON active_patterns(expires_at);

-- Índice para buscar por usuario
CREATE INDEX IF NOT EXISTS idx_active_patterns_user 
  ON active_patterns(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE active_patterns ENABLE ROW LEVEL SECURITY;

-- Política: cualquier usuario autenticado puede ver todos los patrones activos
CREATE POLICY "Usuarios autenticados pueden ver patrones activos"
  ON active_patterns FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

-- Política: cada usuario solo puede insertar/actualizar/borrar sus propios patrones
CREATE POLICY "Usuarios pueden crear sus propios patrones"
  ON active_patterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios patrones"
  ON active_patterns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden borrar sus propios patrones"
  ON active_patterns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════
-- TABLA 2: sync_sessions (para Sync de Pareja)
-- ═══════════════════════════════════════════════════════════════════
-- Guarda cada sesión de respiración compartida entre 2 personas.

CREATE TABLE IF NOT EXISTS sync_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code VARCHAR(6) UNIQUE NOT NULL,
  user1_id UUID REFERENCES auth.users(id),
  user2_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  avg_sync_percentage NUMERIC,
  sync_data JSONB DEFAULT '[]'
);

-- Índice para buscar sesiones por código
CREATE INDEX IF NOT EXISTS idx_sync_sessions_code 
  ON sync_sessions(session_code);

-- Habilitar RLS
ALTER TABLE sync_sessions ENABLE ROW LEVEL SECURITY;

-- Política: participantes pueden ver sus sesiones
CREATE POLICY "Participantes pueden ver sus sesiones"
  ON sync_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Política: cualquier autenticado puede crear una sesión
CREATE POLICY "Usuarios pueden crear sesiones"
  ON sync_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id);

-- Política: participantes pueden actualizar su sesión
CREATE POLICY "Participantes pueden actualizar sesiones"
  ON sync_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Política especial: cualquier autenticado puede unirse (update user2_id)
-- Esto es necesario porque user2 necesita poder unirse a la sesión
CREATE POLICY "Cualquiera puede unirse a sesión abierta"
  ON sync_sessions FOR UPDATE
  TO authenticated
  USING (user2_id IS NULL);


-- ═══════════════════════════════════════════════════════════════════
-- TABLA 3: sync_realtime (datos en vivo durante sesión)
-- ═══════════════════════════════════════════════════════════════════
-- Datos biométricos en tiempo real durante una sesión de pareja.

CREATE TABLE IF NOT EXISTS sync_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sync_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  breath_rate NUMERIC,
  heart_rate NUMERIC
);

-- Índice para buscar por sesión
CREATE INDEX IF NOT EXISTS idx_sync_realtime_session 
  ON sync_realtime(session_id, timestamp);

-- Habilitar RLS
ALTER TABLE sync_realtime ENABLE ROW LEVEL SECURITY;

-- Política: participantes de la sesión pueden ver los datos
CREATE POLICY "Participantes pueden ver datos realtime"
  ON sync_realtime FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sync_sessions 
      WHERE sync_sessions.id = sync_realtime.session_id
      AND (sync_sessions.user1_id = auth.uid() OR sync_sessions.user2_id = auth.uid())
    )
  );

-- Política: participantes pueden insertar sus propios datos
CREATE POLICY "Participantes pueden insertar datos realtime"
  ON sync_realtime FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM sync_sessions 
      WHERE sync_sessions.id = sync_realtime.session_id
      AND (sync_sessions.user1_id = auth.uid() OR sync_sessions.user2_id = auth.uid())
    )
  );


-- ═══════════════════════════════════════════════════════════════════
-- HABILITAR REALTIME para sync_realtime
-- ═══════════════════════════════════════════════════════════════════
-- Esto permite que Supabase Realtime notifique cambios en la tabla

ALTER PUBLICATION supabase_realtime ADD TABLE sync_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_sessions;


-- ═══════════════════════════════════════════════════════════════════
-- LISTO! 🎉
-- ═══════════════════════════════════════════════════════════════════
-- Si ves "Success. No rows returned" significa que todo salió bien.
-- Las tablas ya están creadas con seguridad (RLS) habilitada.
