import express from "express";
import pool from "../db.js"; 
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();

// reconstruir __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// configuración de multer para recibir imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ---------------- POST CREAR ITEM ---------------- */
router.post("/", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, precio, cantidad, descripcion } = req.body;

    let imagePath = null;
    if (req.file) {
      const optimizedImage = await sharp(req.file.buffer)
        .resize(800, 800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const imageName = `${Date.now()}_${nombre}.jpg`;
      imagePath = path.join(__dirname, "../public/images", imageName);
      fs.writeFileSync(imagePath, optimizedImage);
      imagePath = `/images/${imageName}`;
    }

    const [result] = await pool.query(
      "INSERT INTO items (nombre, precio, cantidad, descripcion, imagen) VALUES (?, ?, ?, ?, ?)",
      [nombre, precio, cantidad, descripcion, imagePath]
    );

    res.status(201).json({
      message: "Producto creado correctamente",
      id: result.insertId,
      nombre,
      precio,
      cantidad,
      descripcion,
      imagen: imagePath,
    });
  } catch (error) {
    console.error("Error al crear item:", error);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

/* ---------------- GET TODOS LOS ITEMS ---------------- */
router.get("/", async (req, res) => {
  try {
    const [items] = await pool.query("SELECT * FROM items");
    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los items" });
  }
});

/* ---------------- GET ITEM POR ID ---------------- */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [items] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);
    if (items.length === 0) {
      return res.status(404).json({ error: "Item no encontrado" });
    }
    res.status(200).json(items[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el item" });
  }
});

/* ---------------- PUT ACTUALIZAR ITEM ---------------- */
router.put("/:id", upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, cantidad, descripcion } = req.body;

  try {
    const [existing] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    let imagePath = existing[0].imagen;
    if (req.file) {
      const optimizedImage = await sharp(req.file.buffer)
        .resize(800, 800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const imageName = `${Date.now()}_${nombre}.jpg`;
      const newPath = path.join(__dirname, "../public/images", imageName);
      fs.writeFileSync(newPath, optimizedImage);
      imagePath = `/images/${imageName}`;
    }

    await pool.query(
      "UPDATE items SET nombre = ?, precio = ?, cantidad = ?, descripcion = ?, imagen = ? WHERE id = ?",
      [nombre, precio, cantidad, descripcion, imagePath, id]
    );

    res.status(200).json({
      message: "Producto actualizado correctamente",
      id,
      nombre,
      precio,
      cantidad,
      descripcion,
      imagen: imagePath,
    });
  } catch (error) {
    console.error("Error al actualizar item:", error);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

/* ---------------- DELETE ITEM ---------------- */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM items WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item no encontrado" });
    }
    res.status(200).json({ message: "Item eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar item:", error);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

/* ---------------- PUT DECREMENTAR CANTIDAD ---------------- */
router.put("/:id/decrementar", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT cantidad FROM items WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Item no encontrado" });

    if (rows[0].cantidad <= 0) {
      return res.status(400).json({ error: "El producto está agotado" });
    }

    await pool.query("UPDATE items SET cantidad = cantidad - 1 WHERE id = ?", [id]);
    res.status(200).json({ message: "Cantidad decrementada correctamente" });
  } catch (error) {
    console.error("Error al decrementar cantidad:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/* ---------------- PUT INCREMENTAR CANTIDAD ---------------- */
router.put("/:id/incrementar", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT cantidad FROM items WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Item no encontrado" });

    await pool.query("UPDATE items SET cantidad = cantidad + 1 WHERE id = ?", [id]);
    res.status(200).json({ message: "Cantidad incrementada correctamente" });
  } catch (error) {
    console.error("Error al incrementar cantidad:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
