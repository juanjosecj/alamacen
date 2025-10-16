import express from "express";
import pool from "../db.js"; // conexión a MySQL
import bcrypt from "bcryptjs";

const router = express.Router();

/* ---------------- Registro de cliente ---------------- */
router.post("/", async (req, res) => {
  const { nombre, email, password, direccion, telefono } = req.body;

  try {
    if (!nombre || !email || !password ||!direccion || !telefono) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar si el email ya existe
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario con roleId = 2 (cliente)
    const [result] = await pool.query(
      "INSERT INTO users (nombre, email, password, roleId, direccion, telefono) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, email, hashedPassword, 2, direccion, telefono]
    );

    res.status(201).json({
      message: "Cliente registrado exitosamente",
      cliente: {
        id: result.insertId,
        nombre,
        email,
        direccion,
        telefono,
        roleId: 2,
      },
    });
    } catch (error) {
    console.error("Error al registrar cliente:", error); // 👈 imprime todo el error completo
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- Login de cliente ---------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Buscar usuario por email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? AND roleId = 2", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }

    const cliente = rows[0];

    // Comparar contraseña
    const esValida = await bcrypt.compare(password, cliente.password);
    if (!esValida) {
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }

    // Cliente autenticado (sin password)
    const clienteSinPassword = {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      roleId: cliente.roleId,
    };

    res.json({ message: "Login exitoso", cliente: clienteSinPassword });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ---------------- Obtener cliente por ID ---------------- */

/* ---------------- Obtener usuario (admin o cliente) por ID ---------------- */
router.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, email, direccion, telefono, roleId FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
