# 🪒 Barbería Pro - Sistema de Gestión de Citas

Sistema completo de gestión de citas para barberías desarrollado con HTML, CSS (Tailwind), y JavaScript vanilla.

## 🌟 Características

- ✅ **Autenticación por roles**: Admin, Cliente, Barbero
- ✅ **CRUD completo**: Servicios y Barberos
- ✅ **Reserva inteligente**: Slots disponibles automáticos
- ✅ **Asignación manual**: Admin asigna barberos a citas pendientes
- ✅ **Validación de conflictos**: Previene doble reserva
- ✅ **Responsive Design**: Compatible con móviles y tablets
- ✅ **Dark Mode**: Soporte automático de tema oscuro

## 👥 Usuarios de Prueba

```
Admin:
Email: admin@barberia.com
Password: admin123

Cliente:
Email: cliente@test.com
Password: cliente123
```

## 🚀 Instalación Local

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/barberia-app.git
cd barberia-app
```

2. Abre `index.html` en tu navegador
```bash
# En Windows
start index.html

# En Mac
open index.html

# En Linux
xdg-open index.html
```

¡Eso es todo! No requiere instalación de dependencias.

## 📦 Despliegue en Netlify

### Opción 1: Netlify Drop (Más Fácil)
1. Ve a [netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra el archivo `index.html`
3. ¡Listo! Obtendrás tu enlace público

### Opción 2: Conectar con GitHub (Recomendado)
1. Sube tu código a GitHub (siguiendo esta guía)
2. Ve a [netlify.com](https://netlify.com) y regístrate
3. "Add new site" → "Import from Git"
4. Selecciona tu repositorio de GitHub
5. Deploy automático cada vez que hagas cambios

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Framework CSS**: Tailwind CSS (CDN)
- **Almacenamiento**: Variables en memoria (simulación de backend)
- **Autenticación**: JWT simulado

## 📋 Estructura del Proyecto

```
barberia-app/
├── index.html          # Aplicación completa (SPA)
├── README.md           # Este archivo
└── eslint.config.cjs   # Configuración ESLint
```

## 🔄 Flujo de Trabajo

1. **Cliente** reserva una cita → Estado: PENDIENTE
2. **Admin** asigna un barbero disponible
3. Sistema valida conflictos de horario
4. Cita queda ASIGNADA
5. **Barbero** ve sus citas en su panel

## 🎯 Funcionalidades por Rol

### Administrador
- ✅ Gestión de servicios (CRUD)
- ✅ Gestión de barberos (CRUD)
- ✅ Asignación manual de barberos a citas
- ✅ Validación de conflictos automática

### Cliente
- ✅ Reservar citas con slots disponibles
- ✅ Ver historial de citas
- ✅ Cancelar citas futuras

### Barbero
- ✅ Ver citas asignadas
- ✅ Consultar horarios

## 🚧 Próximas Mejoras (Roadmap)

- [ ] Backend real con Node.js + Express
- [ ] Base de datos MongoDB
- [ ] Autenticación JWT real con BCrypt
- [ ] Notificaciones por email
- [ ] Sistema de recordatorios
- [ ] Panel de estadísticas
- [ ] Exportar reportes PDF

## 📄 Licencia

MIT License - Siéntete libre de usar este código para tus proyectos.

## 👨‍💻 Autor

Creado con ❤️ para la comunidad de barberías.

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!
