import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import Items from "./routes/Items.js";
import Cliente from "./routes/Cliente.js";
import Admin from "./routes/Admin.js";
import Solicitudes from "./routes/Solicitudes.js";
import Facturas from "./routes/Facturas.js";
import authRoutes from "./routes/authRoutes.js";
import Pedidos from "./routes/Pedidos.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { authorizeRoles } from "./middlewares/roleMiddleware.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 🔹 reconstruir __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📂 Servir archivos estáticos (todo public)
app.use(express.static(path.join(__dirname, "public")));

// 📂 Servir las imágenes directamente en /images
app.use("/images", express.static(path.join(__dirname, "public/images")));

/* ----------------- RUTAS ----------------- */
// rutas públicas
app.use("/api/auth", authRoutes);

// ruta protegida
app.get("/api/perfil", authMiddleware, (req, res) => {
  res.json({ message: "Acceso permitido", user: req.user });
});

// ruta exclusiva para admin
app.get("/api/admin", authMiddleware, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Bienvenido administrador", user: req.user });
});

// ruta exclusiva para cliente
app.get("/api/cliente", authMiddleware, authorizeRoles("cliente"), (req, res) => {
  res.json({ message: "Bienvenido cliente", user: req.user });
});

// rutas del resto de módulos
app.use("/api/items", Items);
app.use("/api/clientes", Cliente);
app.use("/api/login", Cliente);
app.use("/api/administradores", Admin);
app.use("/api/solicitudes", Solicitudes);
app.use("/api/facturas", Facturas);
app.use("/api/pedidos", Pedidos);

/* ----------------- INICIAR SERVIDOR ----------------- */
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
