import pool from "../db.js";

// 🔹 Crear usuario (el password YA debe venir encriptado)
export async function createUser({ nombre, email, password, roleId }) {
  const [result] = await pool.query(
    "INSERT INTO users (nombre, email, password, roleId) VALUES (?, ?, ?, ?)",
    [nombre, email, password, roleId] // 👈 aquí se guarda el hash
  );
  return { id: result.insertId, nombre, email, roleId };
}

// 🔹 Buscar usuario por email
export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

// 🔹 Buscar usuario por id
export async function findUserById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}
