CREATE DATABASE ecanexo CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE ecanexo;


CREATE TABLE usuarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50)  NOT NULL UNIQUE,
    contrasenia    VARCHAR(255) NOT NULL,
    rol            ENUM('Caja', 'Planillero', 'Admin') NOT NULL,
    estado         ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento   ENUM('Cédula (CC)', 'NIT', 'Pasaporte') NOT NULL,
    numero_documento VARCHAR(50)  NOT NULL UNIQUE,
    primer_nombre    VARCHAR(50)  NOT NULL,
    primer_apellido  VARCHAR(50)  NOT NULL,
    email            VARCHAR(100) DEFAULT '',
    telefono         VARCHAR(20)  DEFAULT '',
    tipo_cliente     ENUM('Externo', 'Empresa', 'Interno') NOT NULL DEFAULT 'Externo',
    estado           ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    fecha_registro   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE materiales (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nombre        ENUM('Cartón', 'Metales', 'Vidrio', 'Cobre', 'Plástico') NOT NULL UNIQUE,
    precio_venta  DECIMAL(10,2) NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL
);

CREATE TABLE inventario (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_material  INT           NOT NULL UNIQUE,
    cantidad_kg  DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_material) REFERENCES materiales(id)
);

CREATE TABLE recicladores (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento   ENUM('Cédula (CC)', 'Pasaporte') NOT NULL,
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    primer_nombre    VARCHAR(50) NOT NULL,
    primer_apellido  VARCHAR(50) NOT NULL,
    telefono         VARCHAR(20) DEFAULT '',
    usuario_sistema  VARCHAR(50) DEFAULT '',
    estado           ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    fecha_registro   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solicitudes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente      INT           NOT NULL,
    fecha_entrega   DATE,
    hora_entrega    TIME,
    cantidad_kg     DECIMAL(10,2) NOT NULL,
    observaciones   VARCHAR(255)  DEFAULT '',
    estado          ENUM('Pendiente', 'Confirmada', 'En proceso', 'Cancelada') NOT NULL DEFAULT 'Pendiente',
    fecha_registro  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);

CREATE TABLE solicitud_materiales (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_material  INT NOT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_material)  REFERENCES materiales(id)
);

CREATE TABLE pagos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente  INT           NOT NULL,
    id_material INT           NOT NULL,
    id_solicitud INT,
    peso_kg     DECIMAL(10,2) NOT NULL,
    precio_kg   DECIMAL(10,2) NOT NULL,
    total       DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('Efectivo') NOT NULL DEFAULT 'Efectivo',
    estado      ENUM('Pagado', 'Pendiente') NOT NULL DEFAULT 'Pagado',
    fecha       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente)   REFERENCES clientes(id),
    FOREIGN KEY (id_material)  REFERENCES materiales(id),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id)
);

CREATE TABLE ventas (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente   INT           NOT NULL,
    id_material  INT           NOT NULL,
    id_solicitud INT,
    cantidad_kg  DECIMAL(10,2) NOT NULL,
    precio_kg    DECIMAL(10,2) NOT NULL,
    total        DECIMAL(10,2) NOT NULL,
    estado       ENUM('Confirmada', 'Cancelada') NOT NULL DEFAULT 'Confirmada',
    fecha        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente)   REFERENCES clientes(id),
    FOREIGN KEY (id_material)  REFERENCES materiales(id),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id)
);

CREATE TABLE recepciones (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    id_reciclador  INT           NOT NULL,
    id_material    INT           NOT NULL,
    peso_kg        DECIMAL(10,2) NOT NULL,
    numero_lote    VARCHAR(50)   DEFAULT NULL,
    fecha          DATE          NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_reciclador) REFERENCES recicladores(id),
    FOREIGN KEY (id_material)   REFERENCES materiales(id)
);

CREATE TABLE pagos_reciclador (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    id_reciclador    INT           NOT NULL,
    id_material      INT           NOT NULL,
    peso_kg          DECIMAL(10,2) NOT NULL,
    precio_kg        DECIMAL(10,2) NOT NULL,
    monto_base       DECIMAL(10,2) NOT NULL,
    bonificacion_pct DECIMAL(5,2)  NOT NULL DEFAULT 0,
    total            DECIMAL(10,2) NOT NULL,
    modalidad_pago   ENUM('Efectivo', 'Transferencia bancaria') NOT NULL DEFAULT 'Efectivo',
    estado           ENUM('Pagado', 'Pendiente') NOT NULL DEFAULT 'Pagado',
    fecha            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_reciclador) REFERENCES recicladores(id),
    FOREIGN KEY (id_material)   REFERENCES materiales(id)
);

INSERT INTO usuarios (nombre_usuario, contrasenia, rol) VALUES
('caja',       '$2b$10$q36kRO/S8nP/kgMxDdGRFe3N.esC6Q84x7aZZIrCVgL1mRCm4NuDu', 'Caja'),
('planillero', '$2b$10$cXcIRKoRewYgrI8XqJnHNeUArlqls0wRaOuZo9LkFNFkA5ES0OvhC', 'Planillero'),
('admin',      '$2b$10$wVwgkAcvV5vGbfzioXI4muoXOTcD4e1k0jDCDzhgmQADI2QoikM9S', 'Admin');

INSERT INTO materiales (nombre, precio_venta, precio_compra) VALUES
('Cartón',   350.00,   250.00),
('Metales',  1200.00,  900.00),
('Vidrio',   150.00,   100.00),
('Cobre',    18000.00, 15000.00),
('Plástico', 400.00,   300.00);

INSERT INTO inventario (id_material, cantidad_kg) VALUES
(1, 520.00),
(2, 310.00),
(3, 180.00),
(4, 90.00),
(5, 740.00);
