import express from "express";
import pool from "../db.js";

const router = express.Router();

// POST: Crear factura basada en una solicitud
router.post("/:solicitud_id", async (req, res) => {
  const { solicitud_id } = req.params;

  try {
    // 1. Obtener la solicitud y cliente asociado
    const [solicitudes] = await pool.query(
      `SELECT s.id, s.cliente_id, s.total, s.metodo_pago, f.id AS factura_id
       FROM solicitudes s
       LEFT JOIN facturas f ON f.solicitud_id = s.id
       WHERE s.id = ?`,
      [solicitud_id]
    );

    if (solicitudes.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const solicitud = solicitudes[0];

    if (solicitud.factura_id) {
      return res.status(400).json({ error: "Esta solicitud ya tiene una factura generada" });
    }

    // 2. Insertar nueva factura
    const [result] = await pool.query(
      "INSERT INTO facturas (solicitud_id, cliente_id, total, metodo_pago) VALUES (?, ?, ?, ?)",
      [solicitud.id, solicitud.cliente_id, solicitud.total, solicitud.metodo_pago]
    );

    res.status(201).json({
      message: "Factura creada exitosamente",
      factura: {
        id: result.insertId,
        solicitud_id: solicitud.id,
        cliente_id: solicitud.cliente_id,
        total: solicitud.total,
        metodo_pago: solicitud.metodo_pago
      }
    });
  } catch (error) {
    console.error("Error al crear factura:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET: Obtener factura por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [facturas] = await pool.query(
      `SELECT f.id, f.fecha, f.total, f.metodo_pago,
              s.id AS solicitud_id, c.nombre AS cliente_nombre
       FROM facturas f
       JOIN solicitudes s ON f.solicitud_id = s.id
       JOIN clientes c ON f.cliente_id = c.id
       WHERE f.id = ?`,
      [id]
    );

    if (facturas.length === 0) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    res.status(200).json({ factura: facturas[0] });
  } catch (error) {
    console.error("Error al obtener factura:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
