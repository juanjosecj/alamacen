import express from "express";
import pool from "../db.js"; 

const router = express.Router();

/* ---------------- POST CREAR PEDIDO ---------------- */
router.post("/", async (req, res) => {
  const { userId, productos } = req.body;

  try {
    if (!userId || !productos || productos.length === 0) {
      return res.status(400).json({ error: "Datos incompletos para crear pedido" });
    }

    const [result] = await pool.query(
      "INSERT INTO pedidos (userId, productos, estado) VALUES (?, ?, ?)",
      [userId, JSON.stringify(productos), "pendiente"]
    );

    res.status(201).json({
      message: "✅ Pedido creado exitosamente",
      pedidoId: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ---------------- GET PEDIDOS DE UN CLIENTE ---------------- */
router.get("/cliente/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM pedidos WHERE userId = ?", [userId]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener pedidos del cliente:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ---------------- GET TODOS LOS PEDIDOS (ADMIN) ---------------- */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pedidos");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/* ---------------- PUT ACTUALIZAR ESTADO ---------------- */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const [result] = await pool.query("UPDATE pedidos SET estado = ? WHERE id = ?", [
      estado,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json({ message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
