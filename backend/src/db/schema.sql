-- ============================================================
-- NeonBench SaaS — SQLite Schema
-- Esquema relacional con roles ADMIN/USER
-- ============================================================

-- ─── Tabla: usuarios ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    rol         TEXT    NOT NULL DEFAULT 'USER' CHECK(rol IN ('ADMIN', 'USER')),
    activo      INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Tabla: logs_entrenamiento ───────────────────────────────
CREATE TABLE IF NOT EXISTS logs_entrenamiento (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER NOT NULL,
    ejercicio     TEXT    NOT NULL,
    formato_raw   TEXT    NOT NULL,
    series        INTEGER NOT NULL,
    repeticiones  INTEGER NOT NULL,
    peso          REAL    NOT NULL,
    unidad        TEXT    NOT NULL DEFAULT 'kg' CHECK(unidad IN ('kg', 'lbs')),
    volumen       REAL    NOT NULL,
    semana        INTEGER,
    dia           INTEGER,
    nota          TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ─── Tabla: sesiones_uso ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones_uso (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER NOT NULL,
    inicio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fin           DATETIME,
    duracion_min  REAL,
    ip_address    TEXT,
    user_agent    TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ─── Índices de rendimiento ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_logs_usuario   ON logs_entrenamiento(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_created   ON logs_entrenamiento(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_ejercicio ON logs_entrenamiento(ejercicio);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_uso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_inicio  ON sesiones_uso(inicio);
CREATE INDEX IF NOT EXISTS idx_usuarios_email   ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol     ON usuarios(rol);

-- ─── Tabla: semanas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS semanas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id    INTEGER NOT NULL,
    nombre        TEXT    NOT NULL,
    fecha_inicio  DATE,
    fecha_fin     DATE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ─── Tabla: dias ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dias (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    semana_id     INTEGER NOT NULL,
    usuario_id    INTEGER NOT NULL,
    nombre        TEXT    NOT NULL,
    orden         INTEGER NOT NULL DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semana_id)  REFERENCES semanas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ─── Tabla: ejercicios (catálogo del usuario) ────────────────
CREATE TABLE IF NOT EXISTS ejercicios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id      INTEGER NOT NULL,
    nombre          TEXT    NOT NULL,
    grupo_muscular  TEXT,
    notas           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ─── Tabla: dia_ejercicios (ejercicios asignados a un día) ──
CREATE TABLE IF NOT EXISTS dia_ejercicios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_id          INTEGER NOT NULL,
    ejercicio_id    INTEGER NOT NULL,
    series          INTEGER NOT NULL DEFAULT 3,
    repeticiones    INTEGER NOT NULL DEFAULT 10,
    peso            REAL    DEFAULT 0,
    unidad          TEXT    NOT NULL DEFAULT 'kg' CHECK(unidad IN ('kg', 'lbs')),
    nota            TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dia_id)       REFERENCES dias(id) ON DELETE CASCADE,
    FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id) ON DELETE CASCADE
);

-- ─── Índices nuevos ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_semanas_usuario     ON semanas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dias_semana         ON dias(semana_id);
CREATE INDEX IF NOT EXISTS idx_dias_usuario        ON dias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_usuario  ON ejercicios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dia_ejercicios_dia  ON dia_ejercicios(dia_id);

-- ─── Tabla: agent_interactions ───────────────────────────────
-- Registra cada interacción con el agente IA (ciclo completo: guarda dato)
CREATE TABLE IF NOT EXISTS agent_interactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id      INTEGER,                                      -- NULL = consulta de admin sin usuario específico
    agente_tipo     TEXT    NOT NULL CHECK(agente_tipo IN ('CLIENTE', 'ADMIN')),
    mensaje_usuario TEXT    NOT NULL,                             -- Entrada del usuario
    respuesta_ia    TEXT    NOT NULL,                             -- Salida del agente
    intencion       TEXT    DEFAULT 'CONSULTA',                  -- CONSULTA | PEDIDO | RECLAMO | ALERTA | ANALISIS
    accion_tomada   TEXT,                                         -- Descripción de acción concreta ejecutada
    datos_contexto  TEXT,                                         -- JSON con datos usados como contexto (métricas, logs)
    resuelto        INTEGER NOT NULL DEFAULT 1,                   -- 1=resuelto, 0=derivado a humano
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_usuario  ON agent_interactions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_interactions_tipo     ON agent_interactions(agente_tipo);
CREATE INDEX IF NOT EXISTS idx_interactions_fecha    ON agent_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_intencion ON agent_interactions(intencion);
