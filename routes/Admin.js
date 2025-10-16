import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Crear un Administrador
router.post("/", async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const [existing] = await pool.query("SELECT * FROM administrador WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO administrador (nombre, email, password) VALUES (?, ?, ?)",
      [nombre, email, hashedPassword]
    );

    res.status(201).json({
      message: "Administrador registrado exitosamente",
      administrador: {
        id: result.insertId,
        nombre,
        email
      }
    });
  } catch (error) {
    console.error("Error al registrar administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener todos los administradores
router.get("/", async (req, res) => {
  try {
    const [administrador] = await pool.query("SELECT id, nombre, email FROM administrador");
    res.status(200).json(administrador);
  } catch (error) {
    console.error("Error al obtener administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener un administrador por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [administrador] = await pool.query(
      "SELECT id, nombre, email FROM administrador WHERE id = ?",
      [id]
    );
    if (administrador.length === 0) {
      return res.status(404).json({ error: "Administrador no encontrado" });
    }
    res.status(200).json(administrador[0]);
  } catch (error) {
    console.error("Error al obtener administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar un administrador
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password } = req.body;

  try {
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "UPDATE administrador SET nombre = ?, email = ?, password = ? WHERE id = ?",
      [nombre, email, hashedPassword, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Administrador no encontrado" });
    }

    res.status(200).json({ message: "Administrador actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar un administrador
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM administrador WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Administrador no encontrado" });
    }

    res.status(200).json({ message: "Administrador eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
