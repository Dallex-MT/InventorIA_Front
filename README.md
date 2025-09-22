<div align="center">
  <img src="./src/assets/images/logo.png" height="140" alt="InventorIA Logo" />
  <h1>
    <img src="https://img.shields.io/badge/InventorIA-Sistema%20de%20Reconocimiento%20Inteligente%20de%20Facturas-blueviolet?style=for-the-badge&logo=react&logoColor=white" alt="InventorIA Title" />
  </h1>
  <p>
    <img src="https://img.shields.io/badge/Status-En%20Desarrollo-yellowgreen" alt="Project Status" />
    <img src="https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-teal?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/shadcn%2Fui-0.8-orange?logo=shadcnui&logoColor=white" alt="shadcn/ui" />
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  </p>
</div>

## 📝 Descripción del Proyecto

**InventorIA** es un sistema frontend avanzado diseñado para la gestión de inventarios, con un enfoque innovador en el **reconocimiento inteligente de facturas**. Este proyecto tiene como objetivo principal optimizar y automatizar el proceso de entrada de datos de inventario para **COTA, Estudio de Arquitectura e Ingeniería**, reduciendo errores manuales y mejorando la eficiencia operativa.

Dirigido a empresas y profesionales que buscan una solución robusta para la administración de sus activos y materiales, InventorIA proporciona una interfaz intuitiva y herramientas potentes para una gestión de inventario sin precedentes.

## 🎯 Objetivos del Proyecto

1.  **Automatización de la Entrada de Datos:** Implementar un módulo de reconocimiento inteligente de facturas para extraer automáticamente información relevante (ítems, cantidades, precios) y registrarla en el sistema de inventario.
2.  **Optimización de la Gestión de Inventarios:** Desarrollar funcionalidades que permitan un seguimiento preciso del stock, alertas de niveles bajos, y reportes detallados para una toma de decisiones informada.
3.  **Experiencia de Usuario Superior:** Ofrecer una interfaz de usuario moderna, responsiva y fácil de usar, que simplifique las tareas diarias de gestión de inventario y mejore la productividad del usuario.

## 📂 Estructura del Proyecto

```
inventoria/
├── public/                 # Archivos estáticos y assets públicos
├── src/                    # Código fuente de la aplicación
│   ├── api/                # Definiciones de servicios API
│   ├── assets/             # Imágenes, iconos y otros recursos
│   ├── components/         # Componentes UI reutilizables
│   ├── hooks/              # Hooks personalizados de React
│   ├── layouts/            # Estructuras de diseño de la aplicación
│   ├── locales/            # Archivos de internacionalización (i18n)
│   ├── pages/              # Páginas principales de la aplicación
│   ├── routes/             # Definición de rutas y navegación
│   ├── store/              # Gestión de estado global (Zustand)
│   ├── theme/              # Configuración de temas y estilos
│   ├── types/              # Definiciones de tipos TypeScript
│   ├── ui/                 # Componentes UI de shadcn/ui
│   └── utils/              # Utilidades y funciones auxiliares
├── package.json            # Dependencias y scripts del proyecto
├── pnpm-lock.yaml          # Bloqueo de dependencias de pnpm
├── tailwind.config.ts      # Configuración de Tailwind CSS
├── tsconfig.json           # Configuración de TypeScript
└── vite.config.ts          # Configuración de Vite
```

## 🛠️ Tecnologías Utilizadas

*   **Frontend:**
    *   [React 19](https://react.dev/): Biblioteca de JavaScript para construir interfaces de usuario.
    *   [Vite 5](https://vitejs.dev/): Herramienta de construcción frontend de próxima generación.
    *   [TypeScript 5](https://www.typescriptlang.org/): Lenguaje de programación que añade tipado estático a JavaScript.
    *   [Tailwind CSS 3](https://tailwindcss.com/): Framework CSS utility-first para un diseño rápido.
    *   [shadcn/ui](https://ui.shadcn.com/): Colección de componentes UI reutilizables y accesibles.
    *   [Zustand](https://zustand-demo.pmnd.rs/): Solución de gestión de estado ligera y rápida.
    *   [React Query](https://tanstack.com/query/latest): Biblioteca para la gestión de datos asíncronos.
    *   [i18next](https://www.i18next.com/): Framework de internacionalización.
*   **Mocking:**
    *   [MSW (Mock Service Worker)](https://mswjs.io/): API mocking en el navegador y Node.js.
    *   [Faker.js](https://fakerjs.dev/): Generación de datos falsos.

## 🚀 Inicio Rápido

Sigue estos pasos para configurar y ejecutar el proyecto localmente.

### 1. Obtener el Código del Proyecto

Clona el repositorio a tu máquina local:

```bash
git clone https://github.com/Dallex-MT/InventorIA_Front.git
```

Navega al directorio del proyecto:

```bash
cd inventoria
```

### 2. Instalar Dependencias

Asegúrate de tener [pnpm](https://pnpm.io/) instalado. Si no, puedes instalarlo globalmente:

```bash
npm install -g pnpm
```

Luego, instala las dependencias del proyecto:

```bash
pnpm install
```

### 3. Iniciar el Servidor de Desarrollo

Ejecuta el siguiente comando para iniciar la aplicación en modo de desarrollo:

```bash
pnpm dev
```

La aplicación estará disponible en [http://localhost:3001](http://localhost:3001).

### 4. Construir para Producción

Para generar una versión optimizada para producción:

```bash
pnpm build
```

## 🤝 Cómo Contribuir

¡Nos encantaría tu ayuda para mejorar InventorIA!

1.  **Fork** el repositorio.
2.  **Clona** tu fork: `git clone https://github.com/Dallex-MT/InventorIA_Front.git`
3.  Crea una **nueva rama** para tu característica o corrección: `git checkout -b feature/nombre-de-la-caracteristica`
4.  Realiza tus **cambios** y **commits** con mensajes claros y descriptivos.
5.  **Push** tu rama a tu fork: `git push origin feature/nombre-de-la-caracteristica`
6.  Abre un **Pull Request** a la rama `main` del repositorio original.

## 📜 Historial de Cambios

*   **v1.0.1 - 2024-07-30**
    *   Internacionalización completa de textos estáticos (español/inglés).
    *   Optimización de la carga de avatares de usuario.
    *   Mejoras en la estructura del `README.md`.
*   **v1.0.0 - 2024-07-25**
    *   Lanzamiento inicial del frontend de InventorIA.
    *   Implementación de la estructura base del dashboard.
    *   Configuración de autenticación y rutas principales.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.


## 🎓 Nota Final

Este proyecto es parte de un esfuerzo educativo y de práctica, demostrando la aplicación de tecnologías modernas en el desarrollo de sistemas de gestión de inventarios con capacidades de IA.
