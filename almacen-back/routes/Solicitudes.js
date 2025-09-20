import express from "express";
import pool from "../db.js";

const router = express.Router();

// 📌 POST: Crear solicitud con varios ítems
router.post("/", async (req, res) => {
  const { cliente_id, comentario, items, metodo_pago } = req.body;

  if (!cliente_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "cliente_id e items son requeridos" });
  }

  if (!["efectivo", "tarjeta", "transferencia"].includes(metodo_pago)) {
    return res.status(400).json({ error: "Método de pago no válido" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let totalSolicitud = 0;

    // 1. Insertar solicitud vacía
    const [solicitudResult] = await connection.query(
      "INSERT INTO solicitudes (cliente_id, comentario, metodo_pago) VALUES (?, ?, ?)",
      [cliente_id, comentario || null, metodo_pago]
    );

    const solicitud_id = solicitudResult.insertId;

    // 2. Insertar detalle por cada item y actualizar stock
    for (const item of items) {
      const { item_id, cantidad } = item;

      // Verificar existencia y stock disponible
      const [itemResult] = await connection.query(
        "SELECT precio, stock FROM items WHERE id = ?",
        [item_id]
      );

      if (itemResult.length === 0) {
        throw new Error(`Item con id ${item_id} no existe`);
      }

      if (itemResult[0].stock < cantidad) {
        throw new Error(`Stock insuficiente para el item ${item_id}`);
      }

      const precio_unitario = itemResult[0].precio;
      const subtotal = precio_unitario * cantidad;

      totalSolicitud += subtotal;

      // Insertar detalle de la solicitud
      await connection.query(
        "INSERT INTO `detalle-solicitud`(solicitud_id, item_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
        [solicitud_id, item_id, cantidad, precio_unitario]
      );

      // 🔥 Actualizar stock del item
      await connection.query(
        "UPDATE items SET stock = stock - ? WHERE id = ?",
        [cantidad, item_id]
      );
    }

    // 3. Actualizar la solicitud con el total
    await connection.query("UPDATE solicitudes SET total = ? WHERE id = ?", [
      totalSolicitud,
      solicitud_id,
    ]);

    await connection.commit();

    res.status(201).json({
      message: "Solicitud creada con éxito",
      solicitud_id,
      total: totalSolicitud,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear solicitud:", error.message);
    res.status(500).json({ error: error.message || "Error al procesar la solicitud" });
  } finally {
    connection.release();
  }
});
export default router;