import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { generarToken } from "../utils/jwt.js";

const { User, Role } = db;

// 📌 Registro
export async function register(req, res) {
  try {
    const { nombre, email, password, role } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // obtener rol (por defecto "cliente")
    const userRole = await Role.findOne({ where: { name: role || "cliente" } });

    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      roleId: userRole?.id || null,
    });

    res.status(201).json({
      message: "Usuario registrado con éxito",
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        role: userRole?.name || "cliente",
      },
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error interno al registrar usuario" });
  }
}

// 📌 Login con email
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: { model: Role, attributes: ["name"] },
    });

    if (!user) {
      return res.status(400).json({ message: "Correo no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const token = generarToken({
      id: user.id,
      email: user.email,
      role: user.Role?.name || "cliente",
    });

    res.json({
      message: "Inicio de sesión exitoso ✅",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.Role?.name || "cliente",
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno al iniciar sesión" });
  }
}
