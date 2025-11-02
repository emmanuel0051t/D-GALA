// ========================================
// APLICACIÓN PRINCIPAL (CLASE APP)
// Depende de: DataManager, SimpleStorage, Notifier, Loader, FormValidator
// ========================================
class App {
    constructor() {
        this.currentView = 'login';
        this.currentUser = null;
        this.carrito = [];
        this.filtrosCitas = {};
        this.sidebarOpen = false;
        this.estadisticas = {};
        this.calendarioMesActual = new Date();
        this.reservaData = { // Nuevo objeto para la vista de reserva
            servicio_id: null,
            barbero_id: null,
            fecha: null,
            hora: null,
            metodo_pago: 'EFECTIVO' // Default para la cita
        };
        // No llamamos a init aquí, sino en el DOMContentLoaded del index.html
    }

    async init() {
        Loader.show('Inicializando D\'GALA Barbershop...');
        
        try {
            // Asegurarse de que las dependencias están cargadas
            if (typeof DataManager === 'undefined') {
                 throw new Error('DataManager no cargado. Revise config.js y dataManager.js');
            }
            
            this.currentUser = DataManager.getCurrentUser();
            this.carrito = DataManager.getCarrito() || [];
            this.filtrosCitas = SimpleStorage.get('filtrosCitas') || {};
            
            if (this.currentUser) {
                this.currentView = 'home';
                if (this.currentUser.rol === 'ADMIN') {
                    // Cargar estadísticas iniciales si es admin
                    this.estadisticas = await DataManager.getEstadisticas();
                }
            }
            
            await this.render();
            
            if (this.currentUser && !SimpleStorage.get('welcomeShown')) {
                setTimeout(() => {
                    Notifier.show(`¡Bienvenido a D'GALA Barbershop, ${this.currentUser.nombre}!`, 'info', 5000);
                    SimpleStorage.set('welcomeShown', true);
                }, 1000);
            }
        } catch (error) {
            console.error('Error inicializando app:', error);
            Notifier.show(`Error al iniciar la aplicación: ${error.message}`, 'error');
        } finally {
            Loader.hide();
        }
    }

    async render() {
        const appDiv = document.getElementById('app');
        
        try {
            if (!this.currentUser) {
                appDiv.innerHTML = this.renderLogin();
                this.attachLoginEvents(); 
            } else {
                const sidebar = this.renderSidebar();
                const mobileMenu = this.renderMobileMenu();
                let content = await this.renderDashboardContent();

                appDiv.innerHTML = `
                    <div class="min-h-screen bg-darkCharcoal pb-16 md:pb-0 flex">
                        ${sidebar}
                        <div class="flex-1 flex flex-col content-area">
                            ${this.renderTopHeader()}
                            <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                                ${content}
                            </main>
                        </div>
                        ${mobileMenu}
                    </div>
                `;
                this.attachDashboardEvents();
            }
        } catch (error) {
            console.error('Error renderizando la aplicación principal:', error);
            Notifier.show('Error interno del sistema.', 'error');
        }
    }
    
    // --- RENDERIZADORES DE LAYOUT Y CORE ---

    renderLogin() {
        return `
            <div class="min-h-screen flex items-center justify-center px-4 gradient-bg relative overflow-hidden">
                <div class="absolute inset-0 opacity-10">
                    <div class="absolute top-10 left-10 text-6xl text-gold">✂️</div>
                    <div class="absolute top-1/4 right-20 text-5xl text-gold">💈</div>
                    <div class="absolute bottom-20 left-20 text-4xl text-gold">👨‍💼</div>
                    <div class="absolute bottom-1/3 right-10 text-6xl text-gold">🪒</div>
                </div>
                
                <div class="bg-charcoal border border-gold rounded-2xl shadow-2xl p-8 w-full max-w-md slide-in relative z-10 glass-effect">
                    <div class="text-center mb-8">
                        <div class="text-6xl mb-4 text-gold">💈</div>
                        <h1 class="text-5xl font-display font-bold text-gold mb-2 text-shadow">D'GALA</h1>
                        <p class="text-cream text-lg">Barbershop Premium</p>
                        <div class="mt-2 h-1 w-20 bg-gold rounded-full mx-auto"></div>
                    </div>

                    <div class="mb-6">
                        <div class="flex rounded-lg bg-navy p-1">
                            <button id="tab-login" class="flex-1 py-3 px-4 rounded-md font-medium bg-gold text-charcoal transition-all duration-300 hover-lift">
                                <i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión
                            </button>
                            <button id="tab-register" class="flex-1 py-3 px-4 rounded-md font-medium text-cream transition-all duration-300 hover-lift">
                                <i class="fas fa-user-plus mr-2"></i>Registrarse
                            </button>
                        </div>
                    </div>

                    <div id="login-form">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-cream">
                                    <i class="fas fa-envelope mr-2"></i>Email
                                </label>
                                <input type="email" id="login-email" class="form-input w-full px-4 py-3 rounded-lg bg-navy border border-gold text-white" placeholder="tu@email.com" value="admin@dgala.com">
                                <div id="login-email-error" class="text-red-400 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2 text-cream">
                                    <i class="fas fa-lock mr-2"></i>Contraseña
                                </label>
                                <input type="password" id="login-password" class="form-input w-full px-4 py-3 rounded-lg bg-navy border border-gold text-white" placeholder="••••••••" value="admin123">
                                <div id="login-password-error" class="text-red-400 text-sm mt-1 hidden"></div>
                            </div>
                            <button id="btn-login" class="btn-primary w-full text-charcoal font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-lift pulse-gold">
                                <i class="fas fa-sign-in-alt mr-2"></i>INICIAR SESIÓN
                            </button>
                        </div>

                        <div class="mt-6 p-4 bg-gold/10 border border-gold/20 rounded-lg">
                            <p class="text-sm text-gold mb-2 font-semibold">
                                <i class="fas fa-info-circle mr-2"></i>Usuarios de prueba:
                            </p>
                            <div class="text-xs text-cream space-y-1">
                                <p><span class="font-semibold">Admin:</span> admin@dgala.com / admin123</p>
                                <p><span class="font-semibold">Cliente:</span> cliente@test.com / cliente123</p>
                                <p><span class="font-semibold">Barbero:</span> barbero@test.com / barbero123</p>
                            </div>
                        </div>
                    </div>

                    <div id="register-form" class="hidden">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-cream">
                                    <i class="fas fa-user mr-2"></i>Nombre completo
                                </label>
                                <input type="text" id="register-nombre" class="form-input w-full px-4 py-3 rounded-lg bg-navy border border-gold text-white" placeholder="Juan Pérez">
                                <div id="register-nombre-error" class="text-red-400 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2 text-cream">
                                    <i class="fas fa-envelope mr-2"></i>Email
                                </label>
                                <input type="email" id="register-email" class="form-input w-full px-4 py-3 rounded-lg bg-navy border border-gold text-white" placeholder="tu@email.com">
                                <div id="register-email-error" class="text-red-400 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2 text-cream">
                                    <i class="fas fa-phone mr-2"></i>Teléfono (opcional)
                                </label>
                                <input type="tel" id="register-telefono" class="form-input w-full px-4 py-3 rounded-lg bg-navy border border-gold text-white" placeholder="+1234567890">
                                <div id="register-telefono-error" class="text-red-400 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2 text-cream">
                                    <i class="fas fa-lock mr-2"></i>Contraseña
                                </label>
                                <input type="password" id="register-password" class="form-input w-full px-4 py-3 rounded-lg bg-navy border border-gold text-white" placeholder="••••••••">
                                <div id="register-password-error" class="text-red-400 text-sm mt-1 hidden"></div>
                            </div>
                            <button id="btn-register" class="btn-primary w-full text-charcoal font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-lift">
                                <i class="fas fa-user-plus mr-2"></i>CREAR CUENTA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTopHeader() {
        const totalCarrito = this.currentUser.rol === 'CLIENTE' ? this.carrito.reduce((sum, item) => sum + item.cantidad, 0) : 0;
        
        // Ajuste de color del texto en el header móvil para el tema claro
        const textColor = 'text-dark';

        return `
            <div class="gradient-navbar border-b border-gold sticky top-0 z-40 shadow-lg h-16 flex justify-between items-center px-4 md:hidden">
                <div class="flex items-center space-x-4">
                    <button id="btn-sidebar-toggle-mobile" class="text-gold p-2 rounded-lg hover:bg-gold/10 transition-colors">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                    <h1 class="text-2xl font-display font-bold ${textColor}">D'GALA</h1>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium ${textColor} hidden sm:inline">${this.currentUser.nombre}</span>
                    <div class="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-charcoal font-bold text-sm">
                        ${this.currentUser.nombre.charAt(0).toUpperCase()}
                    </div>
                    ${this.currentUser.rol === 'CLIENTE' && totalCarrito > 0 ? `
                        <div class="relative">
                            <i class="fas fa-shopping-cart text-lg ${textColor}"></i>
                            <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                ${totalCarrito}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="hidden md:block h-4"></div>
        `;
    }

    async renderDashboardContent() {
        try {
            switch(this.currentView) {
                case 'admin-citas':
                    return await this.renderAdminCitas();
                case 'admin-barberos':
                    return await this.renderAdminBarberos();
                case 'calendario':
                    return await this.renderCalendario();
                case 'servicios':
                    return await this.renderServicios();
                case 'inventario':
                    return await this.renderInventario();
                case 'tienda':
                    return await this.renderTienda();
                case 'carrito':
                    return await this.renderCarrito();
                case 'reservar':
                    return await this.renderReservar();
                case 'mis-citas':
                    return await this.renderMisCitas();
                case 'perfil':
                    return await this.renderPerfil();
                case 'configuracion':
                    return this.renderConfiguracion(); 
                case 'estadisticas':
                    return await this.renderEstadisticas();
                case 'admin-compras':
                    return await this.renderAdminCompras();
                case 'mis-compras':
                    return await this.renderMisCompras();
                default:
                    // Dispatcher para la vista 'home'
                    return await this.renderHome(); 
            }
        } catch (error) {
            console.error(`Error al cargar la vista ${this.currentView}:`, error);
            Notifier.show(`Error al cargar la vista: ${this.currentView}`, 'error'); 
            return `<div class="bg-red-900/30 border border-red-500 rounded-xl p-6 text-center text-red-300">
                        <i class="fas fa-exclamation-circle mr-2"></i> No se pudo cargar la vista ${this.currentView}.
                    </div>`;
        }
    }
    
    // RENDER DISPATCHER
    async renderHome() {
        if (this.currentUser.rol === 'ADMIN') {
            return await this.renderClientHome('ADMIN'); // Admin usa la misma estructura con métricas
        }
        if (this.currentUser.rol === 'BARBERO') {
            return await this.renderBarberoHome(); // NUEVA VISTA R1
        }
        return await this.renderClientHome('CLIENTE');
    }

    renderSidebar() {
        const totalCarrito = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const role = this.currentUser.rol;
        const menuItems = [];
        
        // Definición de Menús por Rol
        menuItems.push({ name: 'Inicio', view: 'home', icon: 'fas fa-home', roles: ['ADMIN', 'BARBERO', 'CLIENTE'] });

        if (role === 'ADMIN') {
            menuItems.push(
                { name: 'Citas', view: 'admin-citas', icon: 'fas fa-calendar-alt', roles: ['ADMIN'] },
                { name: 'Barberos', view: 'admin-barberos', icon: 'fas fa-user-tie', roles: ['ADMIN'] },
                { name: 'Calendario', view: 'calendario', icon: 'fas fa-calendar-week', roles: ['ADMIN'] },
                { name: 'Servicios', view: 'servicios', icon: 'fas fa-cut', roles: ['ADMIN'] },
                { name: 'Inventario', view: 'inventario', icon: 'fas fa-boxes', roles: ['ADMIN'] },
                { name: 'Compr. Prod.', view: 'admin-compras', icon: 'fas fa-receipt', roles: ['ADMIN'] },
                { name: 'Estadísticas', view: 'estadisticas', icon: 'fas fa-chart-bar', roles: ['ADMIN'] },
                { name: 'Configuración', view: 'configuracion', icon: 'fas fa-cog', roles: ['ADMIN'] }
            );
        } else if (role === 'CLIENTE') {
            menuItems.push(
                { name: 'Reservar Cita', view: 'reservar', icon: 'fas fa-calendar-plus', roles: ['CLIENTE'] },
                { name: 'Tienda', view: 'tienda', icon: 'fas fa-store', roles: ['CLIENTE'] },
                { name: 'Mis Citas', view: 'mis-citas', icon: 'fas fa-history', roles: ['CLIENTE'] },
                { name: 'Mis Compras', view: 'mis-compras', icon: 'fas fa-shopping-basket', roles: ['CLIENTE'] },
                { name: `Carrito ${totalCarrito > 0 ? `(${totalCarrito})` : ''}`, view: 'carrito', icon: 'fas fa-shopping-cart', roles: ['CLIENTE'] }
            );
        } else if (role === 'BARBERO') {
            // FIX R2: Menú de Barbero simplificado
            menuItems.push(
                { name: 'Mi Agenda', view: 'calendario', icon: 'fas fa-calendar-day', roles: ['BARBERO'] },
                { name: 'Servicios', view: 'servicios', icon: 'fas fa-cut', roles: ['BARBERO'] }
            );
        }

        // Filtrar items por rol
        const filteredItems = menuItems.filter(item => item.roles.includes(role));
        
        // Determinar el estado de la barra lateral (abierta/cerrada)
        const isDesktopOpen = this.sidebarOpen;
        const transformClass = isDesktopOpen ? 'translate-x-0' : '-translate-x-full';

        // Ajustar color del texto en el sidebar para el tema claro
        const textColor = 'text-dark';

        return `
            <div id="sidebar" class="sidebar md:flex md:flex-col w-64 bg-charcoal border-r border-gold min-h-screen fixed inset-y-0 left-0 z-30 transform ${transformClass} md:translate-x-0 transition-transform duration-300">
                <div class="flex items-center justify-center h-16 border-b border-gold px-4">
                    <h1 class="text-2xl font-display font-bold text-dark">
                        <i class="fas fa-cut mr-2 text-gold"></i>D'GALA
                    </h1>
                    <button id="btn-sidebar-close" class="md:hidden ml-auto p-2 text-dark hover:bg-gold/10 rounded-lg">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto py-4">
                    <nav class="space-y-1 px-4">
                        ${filteredItems.map(item => `
                            <button class="nav-item w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                                this.currentView === item.view 
                                    ? 'bg-gold text-dark shadow-lg' 
                                    : `${textColor} hover:text-gold hover:bg-gold/10`
                            }" data-view="${item.view}">
                                <i class="${item.icon} mr-3 w-5 text-center"></i>
                                ${item.name}
                            </button>
                        `).join('')}
                    </nav>
                    
                    <div class="mt-8 px-4">
                        <div class="bg-navy/50 border border-gold/30 rounded-lg p-4">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-dark font-bold">
                                    ${this.currentUser.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gold">${this.currentUser.nombre}</p>
                                    <p class="text-xs text-dark capitalize">${this.currentUser.rol.toLowerCase()}</p>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <button class="user-menu-item w-full text-left px-3 py-2 text-sm text-dark hover:bg-gold/10 rounded transition-colors" data-action="perfil">
                                    <i class="fas fa-user mr-2"></i>Mi Perfil
                                </button>
                                <button class="user-menu-item w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded transition-colors" data-action="logout">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="border-t border-gold p-4">
                    <div class="text-center text-xs text-dark">
                        <p>D'GALA Barbershop v2.0</p>
                        <p class="mt-1">Sistema Premium</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderMobileMenu() {
        const totalCarrito = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
        
        return `
            <div class="md:hidden mobile-menu">
                <div class="flex">
                    <button class="mobile-menu-item flex flex-col items-center ${
                        this.currentView === 'home' ? 'text-gold' : 'text-dark'
                    }" data-view="home">
                        <i class="fas fa-home text-lg mb-1"></i>
                        <span class="text-xs">Inicio</span>
                    </button>
                    
                    ${this.currentUser.rol === 'CLIENTE' ? `
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'reservar' ? 'text-gold' : 'text-dark'
                        }" data-view="reservar">
                            <i class="fas fa-calendar-plus text-lg mb-1"></i>
                            <span class="text-xs">Reservar</span>
                        </button>
                        
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'tienda' ? 'text-gold' : 'text-dark'
                        }" data-view="tienda">
                            <i class="fas fa-store text-lg mb-1"></i>
                            <span class="text-xs">Tienda</span>
                        </button>
                        
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'mis-citas' ? 'text-gold' : 'text-dark'
                        }" data-view="mis-citas">
                            <i class="fas fa-history text-lg mb-1"></i>
                            <span class="text-xs">Mis Citas</span>
                        </button>
                        
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'carrito' ? 'text-gold' : 'text-dark'
                        }" data-view="carrito">
                            <div class="relative">
                                <i class="fas fa-shopping-cart text-lg mb-1"></i>
                                ${totalCarrito > 0 ? `
                                    <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        ${totalCarrito}
                                    </span>
                                ` : ''}
                            </div>
                            <span class="text-xs">Carrito</span>
                        </button>
                    ` : ''}
                    
                    ${this.currentUser.rol === 'BARBERO' ? `
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'calendario' ? 'text-gold' : 'text-dark'
                        }" data-view="calendario">
                            <i class="fas fa-calendar-day text-lg mb-1"></i>
                            <span class="text-xs">Agenda</span>
                        </button>
                         <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'servicios' ? 'text-gold' : 'text-dark'
                        }" data-view="servicios">
                            <i class="fas fa-cut text-lg mb-1"></i>
                            <span class="text-xs">Servicios</span>
                        </button>
                    ` : ''}

                    ${this.currentUser.rol === 'ADMIN' ? `
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'admin-citas' ? 'text-gold' : 'text-dark'
                        }" data-view="admin-citas">
                            <i class="fas fa-calendar-alt text-lg mb-1"></i>
                            <span class="text-xs">Citas</span>
                        </button>
                        
                        <button class="mobile-menu-item flex flex-col items-center ${
                            this.currentView === 'admin-barberos' ? 'text-gold' : 'text-dark'
                        }" data-view="admin-barberos">
                            <i class="fas fa-user-tie text-lg mb-1"></i>
                            <span class="text-xs">Barberos</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async renderClientHome(rol) {
        // Esta es la vista original, usada por CLIENTE y ADMIN (con más métricas)

        // Actualizar estadísticas si es admin
        if (rol === 'ADMIN') {
            this.estadisticas = await DataManager.getEstadisticas();
        }
        
        const servicios = await DataManager.getServicios();
        const citas = await DataManager.getCitas();
        const inventario = await DataManager.getInventario();
        const barberos = await DataManager.getBarberos();

        const citasUsuario = rol === 'CLIENTE' 
            ? citas.filter(c => c.cliente_id === this.currentUser.id)
            : citas;

        const citasRecientes = citasUsuario
            .slice(0, 5)
            .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

        return `
            <div class="slide-in stagger-animation">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h2 class="text-4xl font-display font-bold text-gold mb-2">
                            ¡Bienvenido, ${this.currentUser.nombre}!
                        </h2>
                        <p class="text-dark text-lg">
                            ${rol === 'ADMIN' 
                                ? 'Panel de Administración - D\'GALA Barbershop' 
                                : 'Panel de Cliente - Reserva y Servicios'
                            }
                        </p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <span class="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium capitalize">
                            <i class="fas fa-user-shield mr-2"></i>${this.currentUser.rol.toLowerCase()}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">Servicios Disponibles</p>
                                <p class="text-4xl font-bold text-gold">${servicios.length}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-gold">
                                <i class="fas fa-cut"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            Catálogo completo de servicios
                        </div>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">${
                                    rol === 'CLIENTE' ? 'Mis Citas' : 'Total Citas'
                                }</p>
                                <p class="text-4xl font-bold text-gold">${citasUsuario.length}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-gold">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            ${rol === 'CLIENTE' ? 'Tus citas programadas' : 'Todas las citas del sistema'}
                        </div>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">Productos en Stock</p>
                                <p class="text-4xl font-bold text-gold">${inventario.filter(p => p.cantidad > 0).length}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-gold">
                                <i class="fas fa-boxes"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            Productos disponibles en tienda
                        </div>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">Barberos Activos</p>
                                <p class="text-4xl font-bold text-gold">${barberos.filter(b => b.activo).length}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-gold">
                                <i class="fas fa-user-tie"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            Profesionales disponibles
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <div class="bg-charcoal border border-gold rounded-xl p-8 card-hover">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-2xl font-display font-bold text-gold">
                                    <i class="fas fa-star mr-2"></i>Servicios Populares
                                </h3>
                                ${rol === 'CLIENTE' ? `
                                    <button class="nav-item px-4 py-2 bg-gold text-dark rounded-lg font-bold text-sm" data-view="reservar">
                                        <i class="fas fa-plus mr-1"></i>Reservar
                                    </button>
                                ` : ''}
                            </div>
                            <div class="space-y-4">
                                ${servicios.slice(0, 4).map((s, index) => `
                                    <div class="bg-navy rounded-lg p-4 border border-gold/20 hover-lift transition-all duration-300">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <h4 class="font-semibold mb-1 text-dark text-lg">${s.nombre}</h4>
                                                <p class="text-sm text-cream">
                                                    <i class="fas fa-clock mr-1"></i>${s.duracion} min | 
                                                    <i class="fas fa-dollar-sign mr-1 ml-2"></i>$${s.precio}
                                                </p>
                                            </div>
                                            <div class="text-3xl text-gold opacity-70">
                                                ${index === 0 ? '👑' : '✂️'}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bg-charcoal border border-gold rounded-xl p-8 mt-8 card-hover">
                            <h3 class="text-2xl font-display font-bold mb-6 text-gold">
                                <i class="fas fa-history mr-2"></i>
                                ${rol === 'CLIENTE' ? 'Mis Citas Recientes' : 'Citas Recientes'}
                            </h3>
                            ${citasRecientes.length > 0 ? `
                                <div class="space-y-4">
                                    ${citasRecientes.map(cita => {
                                        const fecha = new Date(cita.fecha_hora);
                                        return `
                                            <div class="bg-navy rounded-lg p-4 border border-gold/20">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <h4 class="font-semibold mb-1 text-dark">${cita.servicio?.nombre || 'Servicio'}</h4>
                                                        <p class="text-sm text-cream">
                                                            <i class="fas fa-calendar mr-1"></i>${fecha.toLocaleDateString('es-ES')}
                                                            <i class="fas fa-clock ml-3 mr-1"></i>${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        ${cita.barbero ? `
                                                            <p class="text-sm text-gold mt-1">
                                                                <i class="fas fa-user-tie mr-1"></i>${cita.barbero.usuario?.nombre || 'Barbero'}
                                                            </p>
                                                        ` : ''}
                                                    </div>
                                                    <span class="px-3 py-1 rounded-full text-xs font-semibold estado-${cita.estado_asignacion.toLowerCase()}">
                                                        ${cita.estado_asignacion}
                                                    </span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-8">
                                    <div class="text-6xl mb-4 opacity-50 text-gold">
                                        <i class="fas fa-calendar-times"></i>
                                    </div>
                                    <h4 class="text-xl font-semibold mb-2 text-gold">No hay citas</h4>
                                    <p class="text-dark mb-4">${rol === 'CLIENTE' 
                                        ? '¡Reserva tu primera cita ahora!' 
                                        : 'No hay citas programadas recientemente'
                                    }</p>
                                    ${rol === 'CLIENTE' ? `
                                        <button class="nav-item px-6 py-3 gradient-gold text-dark rounded-lg font-bold" data-view="reservar">
                                            <i class="fas fa-calendar-plus mr-2"></i>Reservar Mi Primera Cita
                                        </button>
                                    ` : ''}
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="space-y-8">
                        <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                            <h3 class="text-xl font-display font-bold text-gold">
                                <i class="fas fa-bolt mr-2"></i>Acciones Rápidas
                            </h3>
                            <div class="space-y-3">
                                ${rol === 'CLIENTE' ? `
                                    <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="reservar">
                                        <i class="fas fa-calendar-plus mr-3"></i>
                                        <span>Reservar Cita</span>
                                    </button>
                                    <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="tienda">
                                        <i class="fas fa-store mr-3"></i>
                                        <span>Ir a la Tienda</span>
                                    </button>
                                    <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="mis-citas">
                                        <i class="fas fa-history mr-3"></i>
                                        <span>Ver Mis Citas</span>
                                    </button>
                                ` : rol === 'ADMIN' ? `
                                    <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="admin-citas">
                                        <i class="fas fa-calendar-alt mr-3"></i>
                                        <span>Gestionar Citas</span>
                                    </button>
                                    <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="admin-barberos">
                                        <i class="fas fa-user-tie mr-3"></i>
                                        <span>Gestionar Barberos</span>
                                    </button>
                                    <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="inventario">
                                        <i class="fas fa-boxes mr-3"></i>
                                        <span>Control de Inventario</span>
                                    </button>
                                ` : ``}
                            </div>
                        </div>

                        <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                            <h3 class="text-xl font-display font-bold text-gold mb-4">
                                <i class="fas fa-gem mr-2"></i>Productos Destacados
                            </h3>
                            <div class="space-y-3">
                                ${inventario.filter(p => p.cantidad > 0).slice(0, 3).map(p => `
                                    <div class="bg-navy rounded-lg p-3 border border-gold/20">
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <h4 class="font-semibold text-dark text-sm">${p.nombre}</h4>
                                                <p class="text-xs text-cream">
                                                    <i class="fas fa-dollar-sign mr-1"></i>$${p.precio}
                                                </p>
                                            </div>
                                            ${rol === 'CLIENTE' ? `
                                                <button class="btn-agregar-carrito p-2 bg-gold text-dark rounded-lg text-xs" data-id="${p.id}">
                                                    <i class="fas fa-cart-plus"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            ${rol === 'CLIENTE' ? `
                                <div class="mt-4">
                                    <button class="nav-item w-full px-4 py-2 bg-gold/20 text-gold rounded-lg font-medium text-sm" data-view="tienda">
                                        <i class="fas fa-store mr-2"></i>Ver Todos los Productos
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                            <h3 class="text-xl font-display font-bold text-gold mb-4">
                                <i class="fas fa-info-circle mr-2"></i>Información
                            </h3>
                            <div class="space-y-3 text-sm text-dark">
                                <div class="flex justify-between">
                                    <span>Versión del Sistema:</span>
                                    <span class="text-gold font-semibold">v2.0 Premium</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Estado:</span>
                                    <span class="text-green-500 font-semibold">
                                        <i class="fas fa-circle text-xs mr-1"></i>Operativo
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Última Actualización:</span>
                                    <span class="text-gold">${new Date().toLocaleDateString('es-ES')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderBarberoHome() {
        // VISTA R1: Panel de Control del Barbero
        const citas = await DataManager.getCitas({ barbero_id: this.currentUser.id });
        const misCitasHoy = citas.filter(c => new Date(c.fecha_hora).toDateString() === new Date().toDateString());
        const misCitasPendientes = misCitasHoy.filter(c => c.estado_asignacion === 'ASIGNADO' || c.estado_asignacion === 'PENDIENTE');

        // Buscar el perfil de barbero
        const barberos = await DataManager.getBarberos();
        const miBarbero = barberos.find(b => b.usuario_id === this.currentUser.id);
        const horario = miBarbero ? `${miBarbero.horario_inicio} - ${miBarbero.horario_fin}` : 'No definido';
        
        return `
            <div class="slide-in stagger-animation">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h2 class="text-4xl font-display font-bold text-gold mb-2">
                            ¡Bienvenido, ${this.currentUser.nombre}!
                        </h2>
                        <p class="text-dark text-lg">
                            Panel de Barbero - Tu Agenda y Servicios
                        </p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <span class="px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium capitalize">
                            <i class="fas fa-user-tie mr-2"></i>Barbero
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">Mi Agenda Hoy</p>
                                <p class="text-4xl font-bold text-gold">${misCitasHoy.length}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-gold">
                                <i class="fas fa-calendar-day"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            Citas totales en tu agenda para hoy
                        </div>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">Citas Activas</p>
                                <p class="text-4xl font-bold text-green-500">${misCitasPendientes.length}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-green-500">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            Pendientes y Asignadas para hoy
                        </div>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-dark text-sm mb-1">Horario de Trabajo</p>
                                <p class="text-xl font-bold text-dark mt-2">${horario}</p>
                            </div>
                            <div class="text-4xl opacity-20 text-gold">
                                <i class="fas fa-clock"></i>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-cream">
                            <i class="fas fa-info-circle mr-1"></i>
                            Tu horario de servicio de hoy
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <div class="bg-charcoal border border-gold rounded-xl p-8 card-hover">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-2xl font-display font-bold text-gold">
                                    <i class="fas fa-calendar-alt mr-2"></i>Próximas Citas
                                </h3>
                                <button class="nav-item px-4 py-2 bg-gold text-dark rounded-lg font-bold text-sm" data-view="calendario">
                                    <i class="fas fa-calendar-week mr-1"></i>Ver Agenda
                                </button>
                            </div>
                            <div class="space-y-4">
                                ${misCitasHoy.slice(0, 5).map(cita => {
                                    const fecha = new Date(cita.fecha_hora);
                                    return `
                                        <div class="bg-navy rounded-lg p-4 border border-gold/20">
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <h4 class="font-semibold mb-1 text-dark">${cita.servicio?.nombre || 'Servicio'}</h4>
                                                    <p class="text-sm text-cream">
                                                        <i class="fas fa-clock mr-1"></i>${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} (${cita.servicio?.[0]?.duracion} min)
                                                    </p>
                                                    <p class="text-sm text-gold mt-1">
                                                        <i class="fas fa-user mr-1"></i>${cita.cliente?.nombre || 'Cliente'}
                                                    </p>
                                                </div>
                                                <span class="px-3 py-1 rounded-full text-xs font-semibold estado-${cita.estado_asignacion.toLowerCase()}">
                                                    ${cita.estado_asignacion}
                                                </span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${misCitasHoy.length === 0 ? `
                                    <div class="text-center py-8 text-dark">
                                        <div class="text-6xl mb-4 opacity-50 text-gold">
                                            <i class="fas fa-calendar-check"></i>
                                        </div>
                                        <h4 class="text-xl font-semibold mb-2 text-gold">¡Día Libre!</h4>
                                        <p class="text-cream mb-4">No tienes citas programadas para hoy.</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="space-y-8">
                        <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                            <h3 class="text-xl font-display font-bold text-gold">
                                <i class="fas fa-bolt mr-2"></i>Acciones Rápidas
                            </h3>
                            <div class="space-y-3">
                                <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="calendario">
                                    <i class="fas fa-calendar-day mr-3"></i>
                                    <span>Mi Agenda Completa</span>
                                </button>
                                <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-view="servicios">
                                    <i class="fas fa-cut mr-3"></i>
                                    <span>Ver Servicios</span>
                                </button>
                                <button class="nav-item w-full text-left px-4 py-3 bg-navy border border-gold/30 rounded-lg text-dark hover:bg-gold/10 transition-all" data-action="perfil">
                                    <i class="fas fa-user-tie mr-3"></i>
                                    <span>Actualizar Perfil</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderAdminCitas() {
        const citas = await DataManager.getCitas(this.filtrosCitas);
        const barberos = await DataManager.getBarberos();

        return `
            <div class="slide-in">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold mb-4 md:mb-0">
                        <i class="fas fa-calendar-alt mr-2"></i>Gestión de Citas
                    </h2>
                    <div class="flex space-x-3">
                        <button id="btn-refresh-citas" class="px-4 py-2 bg-navy border border-gold text-gold rounded-lg font-medium transition-all hover:bg-gold/10">
                            <i class="fas fa-sync-alt mr-2"></i>Actualizar
                        </button>
                        <button id="btn-export-citas" class="px-4 py-2 bg-green-600 text-white rounded-lg font-medium transition-all hover:bg-green-700">
                            <i class="fas fa-file-export mr-2"></i>Exportar
                        </button>
                    </div>
                </div>

                <div class="bg-charcoal border border-gold rounded-xl p-6 mb-6 card-hover">
                    <h3 class="text-lg font-semibold mb-4 text-gold">
                        <i class="fas fa-filter mr-2"></i>Filtros Avanzados
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-calendar-day mr-2"></i>Fecha
                            </label>
                            <input type="date" id="filtro-fecha" value="${this.filtrosCitas.fecha || ''}" class="w-full px-3 py-2 rounded-lg bg-navy border border-gold text-dark form-input">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-tag mr-2"></i>Estado
                            </label>
                            <select id="filtro-estado" class="w-full px-3 py-2 rounded-lg bg-navy border border-gold text-dark form-input">
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE" ${this.filtrosCitas.estado === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                                <option value="ASIGNADO" ${this.filtrosCitas.estado === 'ASIGNADO' ? 'selected' : ''}>Asignado</option>
                                <option value="COMPLETADO" ${this.filtrosCitas.estado === 'COMPLETADO' ? 'selected' : ''}>Completado</option>
                                <option value="CANCELADO" ${this.filtrosCitas.estado === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-user-tie mr-2"></i>Barbero
                            </label>
                            <select id="filtro-barbero" class="w-full px-3 py-2 rounded-lg bg-navy border border-gold text-dark form-input">
                                <option value="">Todos los barberos</option>
                                ${barberos.map(b => `
                                    <option value="${b.id}" ${this.filtrosCitas.barbero_id === b.id ? 'selected' : ''}>
                                        ${b.usuario?.nombre || 'Barbero'}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="flex items-end space-x-3">
                            <button id="btn-aplicar-filtros" class="flex-1 px-4 py-2 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                                <i class="fas fa-check mr-2"></i>Aplicar
                            </button>
                            <button id="btn-limpiar-filtros" class="px-4 py-2 bg-burgundy text-white rounded-lg font-medium transition-all hover:bg-burgundy/80">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-navy rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-gold mb-1">${citas.filter(c => c.estado_asignacion === 'PENDIENTE').length}</div>
                        <div class="text-xs text-dark">Pendientes</div>
                    </div>
                    <div class="bg-navy rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-green-500 mb-1">${citas.filter(c => c.estado_asignacion === 'ASIGNADO').length}</div>
                        <div class="text-xs text-dark">Asignadas</div>
                    </div>
                    <div class="bg-navy rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-blue-500 mb-1">${citas.filter(c => c.estado_asignacion === 'COMPLETADO').length}</div>
                        <div class="text-xs text-dark">Completadas</div>
                    </div>
                    <div class="bg-navy rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-red-500 mb-1">${citas.filter(c => c.estado_asignacion === 'CANCELADO').length}</div>
                        <div class="text-xs text-dark">Canceladas</div>
                    </div>
                </div>

                <div class="bg-charcoal border border-gold rounded-xl overflow-hidden card-hover">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-navy border-b border-gold">
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">
                                        <i class="fas fa-user mr-2"></i>Cliente
                                    </th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">
                                        <i class="fas fa-cut mr-2"></i>Servicio
                                    </th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">
                                        <i class="fas fa-clock mr-2"></i>Fecha/Hora
                                    </th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">
                                        <i class="fas fa-user-tie mr-2"></i>Barbero
                                    </th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">
                                        <i class="fas fa-tag mr-2"></i>Estado
                                    </th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">
                                        <i class="fas fa-cog mr-2"></i>Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gold/10">
                                ${citas.map(cita => {
                                    const fecha = new Date(cita.fecha_hora);
                                    return `
                                        <tr class="hover:bg-navy/50 transition-colors">
                                            <td class="px-6 py-4">
                                                <div>
                                                    <p class="font-medium text-dark">${cita.cliente?.nombre || 'Cliente'}</p>
                                                    <p class="text-sm text-cream">${cita.cliente?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <p class="font-medium text-dark">${cita.servicio?.nombre || 'Servicio'}</p>
                                                <p class="text-sm text-cream">
                                                    $${cita.servicio?.[0]?.precio || '0'} | ${cita.servicio?.[0]?.duracion || '0'}min
                                                </p>
                                            </td>
                                            <td class="px-6 py-4">
                                                <p class="text-dark font-medium">${fecha.toLocaleDateString('es-ES')}</p>
                                                <p class="text-sm text-cream">${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td class="px-6 py-4">
                                                ${cita.barbero ? `
                                                    <p class="text-dark font-medium">${cita.barbero.usuario?.nombre || 'Barbero'}</p>
                                                    <p class="text-sm text-cream">${cita.barbero.telefono || ''}</p>
                                                ` : `
                                                    <p class="text-yellow-600 font-medium">
                                                        <i class="fas fa-exclamation-triangle mr-1"></i>Por asignar
                                                    </p>
                                                `}
                                            </td>
                                            <td class="px-6 py-4">
                                                <span class="px-3 py-1 rounded-full text-xs font-semibold estado-${cita.estado_asignacion.toLowerCase()}">
                                                    ${cita.estado_asignacion}
                                                </span>
                                                <p class="text-xs text-cream/70 mt-1">${cita.estado_pago}</p>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex space-x-2">
                                                    ${!cita.barbero_id && cita.estado_asignacion === 'PENDIENTE' ? `
                                                        <button class="btn-asignar-barbero px-3 py-1 bg-blue-600 text-white rounded text-sm transition-all hover:bg-blue-700" data-id="${cita.id}">
                                                            <i class="fas fa-user-tie mr-1"></i>Asignar
                                                        </button>
                                                    ` : cita.barbero_id && cita.estado_asignacion === 'ASIGNADO' ? `
                                                        <button class="btn-reasignar-barbero px-3 py-1 bg-yellow-600 text-white rounded text-sm transition-all hover:bg-yellow-700" data-id="${cita.id}">
                                                            <i class="fas fa-sync-alt mr-1"></i>Reasignar
                                                        </button>
                                                    ` : ''}
                                                    ${(cita.estado_asignacion === 'ASIGNADO' || cita.estado_asignacion === 'PENDIENTE') && new Date(cita.fecha_hora) < new Date() ? `
                                                        <button class="btn-completar-cita px-3 py-1 bg-green-600 text-white rounded text-sm transition-all hover:bg-green-700" data-id="${cita.id}">
                                                            <i class="fas fa-check mr-1"></i>Completar
                                                        </button>
                                                    ` : ''}
                                                    
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${citas.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center mt-6 card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-calendar-times"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No hay citas</h3>
                        <p class="text-dark mb-6">No se encontraron citas con los filtros aplicados</p>
                        <button id="btn-limpiar-filtros-empty" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                            <i class="fas fa-filter mr-2"></i>Limpiar Filtros
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderAdminBarberos() {
        const barberos = await DataManager.getBarberos();

        return `
            <div class="slide-in">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold">
                        <i class="fas fa-user-tie mr-2"></i>Gestión de Barberos
                    </h2>
                    <button id="btn-add-barbero" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                        <i class="fas fa-plus mr-2"></i>NUEVO BARBERO
                    </button>
                </div>

                ${barberos.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No hay barberos registrados</h3>
                        <p class="text-dark mb-6">¡Agrega tu primer barbero para comenzar!</p>
                        <button id="btn-add-barbero-empty" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                            <i class="fas fa-user-plus mr-2"></i>AGREGAR BARBERO
                        </button>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${barberos.map(barbero => `
                            <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover transition-all duration-300">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <h3 class="text-xl font-bold mb-2 text-gold">${barbero.usuario?.nombre || 'Barbero'}</h3>
                                        <div class="space-y-2">
                                            <p class="text-dark flex items-center">
                                                <i class="fas fa-envelope mr-2 w-4 text-center"></i>
                                                ${barbero.usuario?.email || 'No email'}
                                            </p>
                                            <p class="text-dark flex items-center">
                                                <i class="fas fa-phone mr-2 w-4 text-center"></i>
                                                ${barbero.telefono || 'No teléfono'}
                                            </p>
                                            <p class="text-dark flex items-center">
                                                <i class="fas fa-clock mr-2 w-4 text-center"></i>
                                                ${barbero.horario_inicio} - ${barbero.horario_fin}
                                            </p>
                                            ${barbero.descripcion ? `
                                                <p class="text-dark text-sm mt-2">${barbero.descripcion}</p>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button class="btn-edit-barbero p-2 text-blue-600 hover:bg-blue-900/20 rounded-lg transition-colors" data-id="${barbero.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-delete-barbero p-2 text-red-600 hover:bg-red-900/20 rounded-lg transition-colors" data-id="${barbero.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mt-4 flex justify-between items-center">
                                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                                        barbero.activo ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                                    }">
                                        <i class="fas fa-circle text-xs mr-1"></i>
                                        ${barbero.activo ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                    <button class="btn-ver-agenda px-3 py-1 bg-purple-600 text-white rounded text-sm transition-all hover:bg-purple-700" data-id="${barbero.id}">
                                        <i class="fas fa-calendar-day mr-1"></i>Agenda
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    async renderCalendario() {
        // FIX: El barbero solo ve sus citas, usando su usuario_id para buscar su barbero_id
        const citas = await DataManager.getCitas(this.currentUser.rol === 'BARBERO' ? { barbero_id: this.currentUser.id } : {});
        
        // Generar días del mes actual
        const year = this.calendarioMesActual.getFullYear();
        const month = this.calendarioMesActual.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 para domingo, 1 para lunes, etc.
        
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        let diasHTML = '';
        
        // Días de la semana
        diasHTML += diasSemana.map(dia => `
            <div class="p-2 text-center font-semibold text-gold border-b border-gold/20">
                ${dia}
            </div>
        `).join('');

        // Espacios vacíos al inicio
        for (let i = 0; i < startingDay; i++) {
            diasHTML += `<div class="calendar-day p-2 bg-charcoal/30"></div>`;
        }

        // Días del mes
        for (let dia = 1; dia <= daysInMonth; dia++) {
            const fechaActual = new Date(year, month, dia);
            const citasDelDia = citas.filter(cita => {
                const fechaCita = new Date(cita.fecha_hora);
                return fechaCita.toDateString() === fechaActual.toDateString();
            });

            diasHTML += `
                <div class="calendar-day p-2 bg-charcoal/50 hover:bg-charcoal/70 transition-colors cursor-pointer" data-date="${fechaActual.toISOString().split('T')[0]}">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-medium ${dia === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? 'text-gold bg-gold/20 rounded-full px-2 py-1' : 'text-dark'}">
                            ${dia}
                        </span>
                        ${citasDelDia.length > 0 ? `
                            <span class="bg-gold text-dark text-xs px-2 py-1 rounded-full">${citasDelDia.length}</span>
                        ` : ''}
                    </div>
                    <div class="space-y-1 max-h-20 overflow-y-auto">
                        ${citasDelDia.slice(0, 3).map(cita => {
                            const hora = new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', minute: '2-digit' 
                            });
                            return `
                                <div class="text-xs p-1 rounded bg-navy border-l-2 ${
                                    cita.estado_asignacion === 'COMPLETADO' ? 'border-green-500' :
                                    cita.estado_asignacion === 'CANCELADO' ? 'border-red-500' :
                                    'border-gold'
                                }">
                                    <div class="font-medium truncate text-dark">${cita.servicio?.nombre}</div>
                                    <div class="text-cream/70">${hora}</div>
                                </div>
                            `;
                        }).join('')}
                        ${citasDelDia.length > 3 ? `
                            <div class="text-xs text-center text-gold/70">
                                +${citasDelDia.length - 3} más
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="slide-in">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold mb-4 md:mb-0">
                        <i class="fas fa-calendar-week mr-2"></i>Calendario
                    </h2>
                    <div class="flex space-x-3">
                        <button id="btn-mes-anterior" class="px-4 py-2 bg-navy border border-gold text-dark rounded-lg font-medium transition-all hover:bg-gold/10">
                            <i class="fas fa-chevron-left mr-2"></i>Mes Anterior
                        </button>
                        <span class="px-4 py-2 bg-gold text-dark rounded-lg font-bold text-lg">
                            ${meses[month]} ${year}
                        </span>
                        <button id="btn-mes-siguiente" class="px-4 py-2 bg-navy border border-gold text-dark rounded-lg font-medium transition-all hover:bg-gold/10">
                            Mes Siguiente <i class="fas fa-chevron-right ml-2"></i>
                        </button>
                    </div>
                </div>

                <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                    <div class="calendar-grid">
                        ${diasHTML}
                    </div>
                </div>

                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 bg-gold rounded"></div>
                        <span class="text-dark text-sm">Pendiente/Asignado</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 bg-green-500 rounded"></div>
                        <span class="text-dark text-sm">Completado</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 bg-red-500 rounded"></div>
                        <span class="text-dark text-sm">Cancelado</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="w-4 h-4 bg-gold text-dark rounded-full text-xs flex items-center justify-center font-bold">3</div>
                        <span class="text-dark text-sm">Citas del día</span>
                    </div>
                </div>
            </div>
        `;
    }

    async renderServicios() {
        const servicios = await DataManager.getServicios();
        return `
            <div class="slide-in">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold">
                        <i class="fas fa-cut mr-2"></i>Gestión de Servicios
                    </h2>
                    ${this.currentUser.rol === 'ADMIN' ? `
                        <button id="btn-add-servicio" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                            <i class="fas fa-plus mr-2"></i>NUEVO SERVICIO
                        </button>
                    ` : ''}
                </div>

                ${servicios.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-cut"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No hay servicios registrados</h3>
                        <p class="text-dark mb-6">¡Agrega tu primer servicio ahora!</p>
                        ${this.currentUser.rol === 'ADMIN' ? `
                            <button id="btn-add-servicio-empty" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                                <i class="fas fa-plus mr-2"></i>AGREGAR SERVICIO
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${servicios.map(s => `
                            <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover transition-all duration-300">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex-1">
                                        <h3 class="text-xl font-bold mb-2 text-gold">${s.nombre}</h3>
                                        <div class="space-y-2">
                                            <p class="text-dark flex items-center">
                                                <i class="fas fa-clock mr-2 w-4 text-center"></i>
                                                ${s.duracion} minutos
                                            </p>
                                            <p class="text-2xl font-bold text-gold">
                                                <i class="fas fa-dollar-sign mr-1"></i>$${s.precio}
                                            </p>
                                        </div>
                                    </div>
                                    ${this.currentUser.rol === 'ADMIN' ? `
                                        <div class="flex space-x-2">
                                            <button class="btn-edit-servicio p-2 text-blue-600 hover:bg-blue-900/20 rounded-lg transition-colors" data-id="${s.id}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-delete-servicio p-2 text-red-600 hover:bg-red-900/20 rounded-lg transition-colors" data-id="${s.id}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    async renderInventario() {
        const items = await DataManager.getInventario();
        return `
            <div class="slide-in">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold">
                        <i class="fas fa-boxes mr-2"></i>Gestión de Inventario
                    </h2>
                    ${this.currentUser.rol === 'ADMIN' ? `
                        <button id="btn-add-inventario" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                            <i class="fas fa-plus mr-2"></i>NUEVO PRODUCTO
                        </button>
                    ` : ''}
                </div>

                ${items.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-boxes"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No hay productos en inventario</h3>
                        <p class="text-dark mb-6">¡Agrega tu primer producto ahora!</p>
                        ${this.currentUser.rol === 'ADMIN' ? `
                            <button id="btn-add-inventario-empty" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                                <i class="fas fa-plus mr-2"></i>AGREGAR PRODUCTO
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${items.map(item => `
                            <div class="bg-charcoal border ${
                                item.cantidad <= item.minimo ? 'border-red-500' : 'border-gold'
                            } rounded-xl p-6 card-hover transition-all duration-300">
                                ${item.cantidad <= item.minimo ? `
                                    <div class="bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>STOCK BAJO
                                    </div>
                                ` : ''}
                                <h3 class="text-lg font-bold mb-2 text-gold">${item.nombre}</h3>
                                <div class="space-y-2">
                                    <p class="text-dark text-sm">${item.descripcion || 'Sin descripción'}</p>
                                    <div class="flex justify-between items-center">
                                        <span class="text-2xl font-bold ${
                                            item.cantidad <= item.minimo ? 'text-red-500' : 'text-gold'
                                        }">${item.cantidad}</span>
                                        <span class="text-xs text-cream">Mín: ${item.minimo}</span>
                                    </div>
                                    <p class="text-gold font-semibold">
                                        <i class="fas fa-dollar-sign mr-1"></i>$${item.precio}
                                    </p>
                                </div>
                                ${this.currentUser.rol === 'ADMIN' ? `
                                    <div class="flex space-x-2 mt-4">
                                        <button class="btn-edit-inventario flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-all" data-id="${item.id}">
                                            <i class="fas fa-edit mr-1"></i>Editar
                                        </button>
                                        <button class="btn-delete-inventario flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-all" data-id="${item.id}">
                                            <i class="fas fa-trash mr-1"></i>Eliminar
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }
    
    async renderAdminCompras() {
        const compras = await DataManager.getCompras({});
        const estadosPago = {
            PENDIENTE: 'bg-yellow-600/20 text-yellow-500',
            PAGADO: 'bg-green-600/20 text-green-500',
            CANCELADO: 'bg-red-600/20 text-red-500'
        };

        return `
            <div class="slide-in">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-receipt mr-2"></i>Gestión de Compras de Productos
                </h2>

                <div class="bg-charcoal border border-gold rounded-xl overflow-hidden card-hover">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-navy border-b border-gold">
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Fecha</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Cliente (Contacto)</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Monto Total</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Método</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Estado Pago</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gold/10">
                                ${compras.map(compra => {
                                    const fecha = new Date(compra.created_at);
                                    const estadoClass = estadosPago[compra.estado_pago] || 'bg-gray-600/20 text-gray-500';
                                    return `
                                        <tr class="hover:bg-navy/50 transition-colors">
                                            <td class="px-6 py-4 text-sm text-dark">${fecha.toLocaleDateString('es-ES')}</td>
                                            <td class="px-6 py-4">
                                                <p class="font-medium text-dark">${compra.cliente?.nombre || 'Cliente Desconocido'}</p>
                                                <p class="text-xs text-cream"><i class="fas fa-envelope mr-1"></i>${compra.cliente?.email || 'N/A'}</p>
                                                <p class="text-xs text-cream"><i class="fas fa-phone mr-1"></i>${compra.cliente?.telefono || 'N/A'}</p>
                                            </td>
                                            <td class="px-6 py-4 text-lg font-bold text-gold">$${compra.monto_total?.toFixed(2) || '0.00'}</td>
                                            <td class="px-6 py-4 text-sm text-dark">${compra.metodo_pago}</td>
                                            <td class="px-6 py-4">
                                                <span class="px-3 py-1 rounded-full text-xs font-semibold ${estadoClass}">
                                                    ${compra.estado_pago}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="flex space-x-2">
                                                    <button class="btn-ver-detalles-compra px-3 py-1 bg-blue-600 text-white rounded text-xs transition-all hover:bg-blue-700" data-id="${compra.id}">
                                                        <i class="fas fa-eye mr-1"></i>Detalles
                                                    </button>
                                                    ${compra.estado_pago === 'PENDIENTE' && compra.metodo_pago === 'EFECTIVO' ? `
                                                        <button class="btn-marcar-pagado-compra px-3 py-1 bg-green-600 text-white rounded text-xs transition-all hover:bg-green-700" data-id="${compra.id}">
                                                            <i class="fas fa-check mr-1"></i>Marcar Pagado
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${compras.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center mt-6 card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No hay registros de compras</h3>
                        <p class="text-dark mb-6">El inventario aún no ha generado ventas.</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderEstadisticas() {
        const estadisticas = await DataManager.getEstadisticas();
        const citas = await DataManager.getCitas();
        const servicios = await DataManager.getServicios();

        // Calcular ingresos por servicio
        const ingresosPorServicio = servicios.map(servicio => {
            const citasServicio = citas.filter(c => 
                c.servicio_id === servicio.id && c.estado_asignacion === 'COMPLETADO'
            );
            return {
                nombre: servicio.nombre,
                ingresos: citasServicio.reduce((sum, c) => sum + (c.servicio?.[0]?.precio || 0), 0),
                cantidad: citasServicio.length
            };
        }).filter(s => s.ingresos > 0).sort((a, b) => b.ingresos - a.ingresos);

        return `
            <div class="slide-in">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-chart-bar mr-2"></i>Estadísticas y Reportes
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stats-card rounded-xl p-6 text-center card-hover">
                        <div class="text-3xl font-bold text-gold mb-2">$${(estadisticas.ingresosEsteMes || 0).toFixed(2)}</div>
                        <p class="text-dark text-sm">Ingresos Este Mes</p>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 text-center card-hover">
                        <div class="text-3xl font-bold text-green-500 mb-2">${estadisticas.citasEsteMes || 0}</div>
                        <p class="text-dark text-sm">Citas Este Mes</p>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 text-center card-hover">
                        <div class="text-3xl font-bold text-blue-500 mb-2">${estadisticas.citasHoy || 0}</div>
                        <p class="text-dark text-sm">Citas Hoy</p>
                    </div>
                    
                    <div class="stats-card rounded-xl p-6 text-center card-hover">
                        <div class="text-3xl font-bold text-yellow-500 mb-2">${estadisticas.productosBajoStock || 0}</div>
                        <p class="text-dark text-sm">Productos Bajo Stock</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                        <h3 class="text-xl font-display font-bold text-gold mb-6">
                            <i class="fas fa-chart-pie mr-2"></i>Estado de Citas
                        </h3>
                        
                        <div class="space-y-4">
                            ${Object.entries(estadisticas.citasPorEstado || {}).map(([estado, cantidad]) => {
                                const totalCitas = estadisticas.totalCitas || 1;
                                const porcentaje = ((cantidad / totalCitas) * 100).toFixed(1);
                                const colores = {
                                    pendiente: 'bg-yellow-500',
                                    asignado: 'bg-blue-500',
                                    completado: 'bg-green-500',
                                    cancelado: 'bg-red-500'
                                };
                                
                                return `
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-4 h-4 rounded-full ${colores[estado.toLowerCase()] || 'bg-gray-500'}"></div>
                                            <span class="text-dark capitalize">${estado}</span>
                                        </div>
                                        <div class="flex items-center space-x-3">
                                            <span class="text-gold font-bold">${cantidad}</span>
                                            <span class="text-cream/70 text-sm">${porcentaje}%</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                        <h3 class="text-xl font-display font-bold text-gold mb-6">
                            <i class="fas fa-dollar-sign mr-2"></i>Ingresos por Servicio
                        </h3>
                        
                        <div class="space-y-4">
                            ${ingresosPorServicio.slice(0, 5).map((servicio, index) => `
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                                            ${index + 1}
                                        </div>
                                        <div>
                                            <p class="text-dark font-medium">${servicio.nombre}</p>
                                            <p class="text-cream/70 text-sm">${servicio.cantidad} citas</p>
                                        </div>
                                    </div>
                                    <span class="text-gold font-bold">$${servicio.ingresos.toFixed(2)}</span>
                                </div>
                            `).join('')}
                            
                            ${ingresosPorServicio.length === 0 ? `
                                <p class="text-cream/70 text-center py-4">No hay datos de ingresos disponibles</p>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-charcoal border border-gold rounded-xl p-6 card-hover">
                    <h3 class="text-xl font-display font-bold text-gold mb-6">
                        <i class="fas fa-file-alt mr-2"></i>Reportes Detallados
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button class="p-4 bg-navy border border-gold rounded-lg text-dark transition-all hover:bg-gold/10">
                            <i class="fas fa-calendar text-2xl mb-2 text-gold"></i>
                            <p class="font-medium">Reporte de Citas</p>
                            <p class="text-sm text-cream/70">Descargar reporte mensual</p>
                        </button>
                        
                        <button class="p-4 bg-navy border border-gold rounded-lg text-dark transition-all hover:bg-gold/10">
                            <i class="fas fa-chart-line text-2xl mb-2 text-gold"></i>
                            <p class="font-medium">Reporte Financiero</p>
                            <p class="text-sm text-cream/70">Ingresos y gastos</p>
                        </button>
                        
                        <button class="p-4 bg-navy border border-gold rounded-lg text-dark transition-all hover:bg-gold/10">
                            <i class="fas fa-boxes text-2xl mb-2 text-gold"></i>
                            <p class="font-medium">Reporte de Inventario</p>
                            <p class="text-sm text-cream/70">Stock y ventas</p>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderReservar() {
        const servicios = await DataManager.getServicios();
        const barberos = await DataManager.getBarberos();
        
        // Si la fecha está seleccionada, calcular los horarios disponibles
        let horariosDisponibles = [];
        const selectedService = servicios.find(s => s.id === this.reservaData.servicio_id);
        let duracion = selectedService?.duracion || 30;

        if (this.reservaData.fecha && this.reservaData.servicio_id) {
            horariosDisponibles = await DataManager.getHorariosDisponibles(
                this.reservaData.fecha, 
                duracion, 
                this.reservaData.barbero_id
            );
        }

        return `
            <div class="slide-in max-w-4xl mx-auto">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-calendar-plus mr-2"></i>Reservar Cita
                </h2>

                <div class="bg-charcoal border border-gold rounded-xl p-8 card-hover">
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-cut mr-2"></i>Servicio
                            </label>
                            <select id="select-servicio" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                                <option value="">Seleccione un servicio</option>
                                ${servicios.map(s => `
                                    <option value="${s.id}" data-duracion="${s.duracion}" ${this.reservaData.servicio_id === s.id ? 'selected' : ''}>
                                        ${s.nombre} - $${s.precio} (${s.duracion} min)
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-user-tie mr-2"></i>Barbero (Opcional)
                            </label>
                            <select id="select-barbero" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                                <option value="">Cualquier barbero disponible</option>
                                ${barberos.filter(b => b.activo).map(b => `
                                    <option value="${b.id}" ${this.reservaData.barbero_id === b.id ? 'selected' : ''}>
                                        ${b.usuario?.nombre} - ${b.horario_inicio} a ${b.horario_fin}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-calendar-day mr-2"></i>Fecha
                            </label>
                            <input type="date" id="input-fecha" value="${this.reservaData.fecha || ''}"
                                   class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-credit-card mr-2"></i>Método de Pago
                            </label>
                            <select id="select-pago-cita" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                                <option value="EFECTIVO" ${this.reservaData.metodo_pago === 'EFECTIVO' ? 'selected' : ''}>Efectivo (Pagar en Barbería)</option>
                                <option value="TARJETA" ${this.reservaData.metodo_pago === 'TARJETA' ? 'selected' : ''}>Tarjeta (Pago en Línea)</option>
                            </select>
                        </div>

                        <div id="horarios-disponibles" class="${(this.reservaData.fecha && this.reservaData.servicio_id) ? '' : 'hidden'}">
                            <label class="block text-sm font-medium mb-2 text-dark">
                                <i class="fas fa-clock mr-2"></i>Horarios Disponibles
                            </label>
                            <div id="slots-container" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                ${horariosDisponibles.length > 0 ? 
                                    horariosDisponibles.map(hora => `
                                        <div class="time-slot" data-hora="${hora}">
                                            ${hora}
                                        </div>
                                    `).join('')
                                    : this.reservaData.fecha && this.reservaData.servicio_id ? 
                                    `<p class="text-red-600 md:col-span-4">No hay horarios disponibles para esta combinación. Intenta con otro día o barbero.</p>`
                                    : ''}
                            </div>
                            <input type="hidden" id="input-hora" value="${this.reservaData.hora || ''}">
                        </div>

                        <button id="btn-confirmar-reserva" 
                                class="w-full gradient-gold text-dark font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                ${(this.reservaData.servicio_id && this.reservaData.fecha && this.reservaData.hora) ? '' : 'disabled'}>
                            <i class="fas fa-calendar-check mr-2"></i>CONFIRMAR RESERVA
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderMisCitas() {
        const citas = await DataManager.getCitas({ cliente_id: this.currentUser.id });
        const misCitas = citas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

        return `
            <div class="slide-in">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-history mr-2"></i>Mis Citas
                </h2>

                ${misCitas.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-calendar-times"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No tienes citas programadas</h3>
                        <p class="text-dark mb-6">¡Agenda tu primera cita ahora!</p>
                        <button class="nav-item px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift" data-view="reservar">
                            <i class="fas fa-calendar-plus mr-2"></i>RESERVAR CITA
                        </button>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${misCitas.map(c => {
                            const fecha = new Date(c.fecha_hora);
                            const isPast = fecha < new Date();
                            const isToday = fecha.toDateString() === new Date().toDateString();
                            
                            return `
                                <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover transition-all duration-300 ${
                                    isPast ? 'opacity-60' : ''
                                }">
                                    <div class="flex justify-between items-start mb-4">
                                        <div>
                                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                                                c.estado_asignacion === 'ASIGNADO' ? 'bg-green-600/20 text-green-500' : 
                                                c.estado_asignacion === 'PENDIENTE' ? 'bg-yellow-600/20 text-yellow-500' :
                                                c.estado_asignacion === 'COMPLETADO' ? 'bg-blue-600/20 text-blue-500' :
                                                'bg-red-600/20 text-red-500'
                                            }">
                                                ${c.estado_asignacion}
                                            </span>
                                            ${isPast ? '<span class="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-cream">PASADA</span>' : ''}
                                            ${isToday ? '<span class="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gold/20 text-gold">HOY</span>' : ''}
                                        </div>
                                    </div>
                                    <h3 class="text-xl font-bold mb-2 text-gold">${c.servicio?.nombre || 'Servicio eliminado'}</h3>
                                    <div class="space-y-2 text-sm text-dark">
                                        <p><i class="fas fa-calendar mr-2"></i>${fecha.toLocaleDateString('es-ES', { 
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                        })}</p>
                                        <p><i class="fas fa-clock mr-2"></i>${fecha.toLocaleTimeString('es-ES', { 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}</p>
                                        ${c.barbero ? `
                                            <p><i class="fas fa-user-tie mr-2"></i>${c.barbero.usuario?.nombre || 'Barbero'}</p>
                                        ` : '<p><i class="fas fa-user-tie mr-2"></i>Por asignar</p>'}
                                        ${c.servicio ? `
                                            <p class="text-gold font-bold text-lg mt-2">
                                                <i class="fas fa-dollar-sign mr-1"></i>$${c.servicio?.[0]?.precio}
                                                <span class="text-sm text-cream/70 ml-2">(${c.estado_pago})</span>
                                            </p>
                                        ` : ''}
                                    </div>
                                    ${!isPast && (c.estado_asignacion === 'PENDIENTE' || c.estado_asignacion === 'ASIGNADO') ? `
                                        <button class="btn-cancelar-cita w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium" data-id="${c.id}">
                                            <i class="fas fa-times mr-2"></i>Cancelar Cita
                                        </button>
                                    ` : ''}
                                    ${c.estado_asignacion === 'ASIGNADO' && !isPast && c.estado_pago === 'PENDIENTE' && c.metodo_pago === 'TARJETA' ? `
                                        <button class="btn-pagar-cita w-full mt-4 px-4 py-2 gradient-gold text-dark rounded-lg font-bold transition-all shadow-lg hover:shadow-xl" 
                                                data-id="${c.id}" data-precio="${c.servicio?.[0]?.precio || 0}">
                                            <i class="fas fa-credit-card mr-2"></i>PAGAR $${c.servicio?.[0]?.precio || 0}
                                        </button>
                                    ` : ''}
                                    ${c.estado_pago === 'PAGADO' ? `
                                         <p class="text-green-500 font-medium mt-4"><i class="fas fa-check-circle mr-2"></i>Pago confirmado</p>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    async renderMisCompras() {
        const compras = await DataManager.getCompras({ cliente_id: this.currentUser.id });
        const misCompras = compras.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        const estadosPago = {
            PENDIENTE: 'bg-yellow-600/20 text-yellow-500',
            PAGADO: 'bg-green-600/20 text-green-500',
            CANCELADO: 'bg-red-600/20 text-red-500'
        };

        return `
            <div class="slide-in">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-shopping-basket mr-2"></i>Mi Historial de Compras
                </h2>

                ${misCompras.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-store"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">Aún no has realizado compras</h3>
                        <p class="text-dark mb-6">¡Descubre nuestros productos premium!</p>
                        <button class="nav-item px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift" data-view="tienda">
                            <i class="fas fa-store mr-2"></i>IR A LA TIENDA
                        </button>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${misCompras.map(compra => {
                            const fecha = new Date(compra.created_at);
                            const estadoClass = estadosPago[compra.estado_pago] || 'bg-gray-500/20 text-gray-500';
                            
                            return `
                                <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover transition-all duration-300">
                                    <div class="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 class="text-xl font-bold mb-1 text-gold">Compra #${compra.id.slice(0, 8)}</h3>
                                            <p class="text-sm text-dark">
                                                <i class="fas fa-calendar mr-1"></i>${fecha.toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${estadoClass}">
                                            ${compra.estado_pago}
                                        </span>
                                    </div>
                                    <div class="space-y-2 text-sm">
                                        <p class="text-dark font-bold text-lg mt-2">
                                            <i class="fas fa-dollar-sign mr-1"></i>Total: $${compra.monto_total?.toFixed(2) || '0.00'}
                                            <span class="text-cream/70 ml-2">(${compra.metodo_pago})</span>
                                        </p>
                                        <p class="text-dark">
                                            <i class="fas fa-box mr-2"></i>Items: ${compra.detalles_productos?.length || 0} productos
                                        </p>
                                    </div>
                                    ${compra.estado_pago === 'PENDIENTE' && compra.metodo_pago === 'TARJETA' ? `
                                        <button class="btn-pagar-compra-final w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all" data-id="${compra.id}" data-monto="${compra.monto_total}">
                                            <i class="fas fa-redo mr-2"></i>Finalizar Pago
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    async renderTienda() {
        const productos = await DataManager.getInventario();
        const disponibles = productos.filter(p => p.cantidad > 0);

        return `
            <div class="slide-in">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold">
                        <i class="fas fa-store mr-2"></i>Tienda D'GALA
                    </h2>
                    <div class="flex items-center space-x-4">
                        <span class="text-dark">${disponibles.length} productos disponibles</span>
                        <button class="nav-item px-4 py-2 bg-gold text-dark rounded-lg font-bold" data-view="carrito">
                            <i class="fas fa-shopping-cart mr-2"></i>
                            Ver Carrito (${this.carrito.reduce((sum, item) => sum + item.cantidad, 0)})
                        </button>
                    </div>
                </div>

                ${disponibles.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-store-slash"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">No hay productos disponibles</h3>
                        <p class="text-dark">Estamos trabajando para traerte nuevos productos premium</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${disponibles.map(producto => `
                            <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover transition-all duration-300">
                                <div class="mb-4">
                                    <span class="px-2 py-1 bg-gold/20 text-gold rounded text-xs font-semibold">
                                        <i class="fas fa-tag mr-1"></i>En Stock
                                    </span>
                                </div>
                                <h3 class="text-xl font-bold mb-2 text-gold">${producto.nombre}</h3>
                                <p class="text-dark text-sm mb-3">${producto.descripcion || 'Producto premium de barbería'}</p>
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-2xl font-bold text-gold">$${producto.precio || 0}</span>
                                    <span class="text-dark text-sm">
                                        <i class="fas fa-box mr-1"></i>${producto.cantidad} disponibles
                                    </span>
                                </div>
                                <button class="btn-agregar-carrito w-full py-2 bg-gold text-dark rounded-lg font-bold transition-all hover-lift" data-id="${producto.id}">
                                    <i class="fas fa-cart-plus mr-2"></i>Agregar al Carrito
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    async renderCarrito() {
        const total = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const totalItems = this.carrito.reduce((sum, item) => sum + item.cantidad, 0);

        return `
            <div class="slide-in max-w-6xl mx-auto">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-3xl font-display font-bold text-gold">
                        <i class="fas fa-shopping-cart mr-2"></i>Mi Carrito
                    </h2>
                    ${this.carrito.length > 0 ? `
                        <div class="text-right">
                            <p class="text-2xl font-bold text-gold">Total: $${total.toFixed(2)}</p>
                            <p class="text-dark text-sm">${totalItems} producto${totalItems !== 1 ? 's' : ''}</p>
                        </div>
                    ` : ''}
                </div>

                ${this.carrito.length === 0 ? `
                    <div class="bg-charcoal border border-gold rounded-xl p-12 text-center card-hover">
                        <div class="text-6xl mb-4 opacity-50 text-gold">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2 text-gold">Tu carrito está vacío</h3>
                        <p class="text-dark mb-6">Descubre nuestros productos premium para el cuidado masculino</p>
                        <button class="nav-item px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift" data-view="tienda">
                            <i class="fas fa-store mr-2"></i>IR A LA TIENDA
                        </button>
                    </div>
                ` : `
                    <div class="bg-charcoal border border-gold rounded-xl overflow-hidden card-hover">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="bg-navy border-b border-gold">
                                        <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Producto</th>
                                        <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Precio Unitario</th>
                                        <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Cantidad</th>
                                        <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Subtotal</th>
                                        <th class="px-6 py-4 text-left text-sm font-semibold text-gold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gold/10">
                                    ${this.carrito.map((item, index) => {
                                        const subtotal = item.precio * item.cantidad;
                                        return `
                                            <tr class="hover:bg-navy/50 transition-colors">
                                                <td class="px-6 py-4">
                                                    <div>
                                                        <p class="font-medium text-dark">${item.nombre}</p>
                                                        <p class="text-sm text-cream">${item.descripcion || ''}</p>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <p class="text-gold font-semibold">$${item.precio}</p>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="flex items-center space-x-2">
                                                        <button class="btn-disminuir w-8 h-8 bg-burgundy text-white rounded-lg transition-all hover:bg-burgundy/80" data-index="${index}">
                                                            <i class="fas fa-minus"></i>
                                                        </button>
                                                        <span class="w-12 text-center text-dark font-medium">${item.cantidad}</span>
                                                        <button class="btn-aumentar w-8 h-8 bg-green-600 text-white rounded-lg transition-all hover:bg-green-700" data-index="${index}">
                                                            <i class="fas fa-plus"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <p class="text-gold font-semibold">$${subtotal.toFixed(2)}</p>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <button class="btn-eliminar-item px-3 py-1 bg-red-600 text-white rounded text-sm transition-all hover:bg-red-700" data-index="${index}">
                                                        <i class="fas fa-trash mr-1"></i>Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="p-6 bg-navy border-t border-gold">
                            <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                                <div>
                                    <p class="text-dark text-lg mb-2">
                                        Total: <span class="text-2xl font-bold text-gold ml-2">$${total.toFixed(2)}</span>
                                    </p>
                                    <select id="select-pago-carrito" class="px-4 py-2 rounded-lg bg-charcoal border border-gold text-dark form-input text-sm">
                                        <option value="EFECTIVO">Pagar en Efectivo (en Barbería)</option>
                                        <option value="TARJETA">Pagar con Tarjeta (en Línea)</option>
                                    </select>
                                </div>
                                <div class="flex space-x-3">
                                    <button onclick="app.limpiarCarrito()" class="px-6 py-3 bg-burgundy text-white rounded-lg font-bold transition-all hover:bg-burgundy/80">
                                        <i class="fas fa-trash mr-2"></i>Vaciar Carrito
                                    </button>
                                    <button id="btn-procesar-pago" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                                        <i class="fas fa-credit-card mr-2"></i>Proceder al Pago
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    async renderPerfil() {
        const user = this.currentUser;
        const barberos = await DataManager.getBarberos();
        const barberoData = barberos.find(b => b.usuario_id === user.id);
        
        // Nota: Asumimos que la biografia y avatar_url se guardan directamente en la tabla usuarios

        return `
            <div class="slide-in max-w-4xl mx-auto">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-user mr-2"></i>Mi Perfil
                </h2>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="space-y-6 lg:col-span-1">
                        <div class="bg-charcoal border border-gold rounded-xl p-6 text-center card-hover">
                            <div class="w-24 h-24 rounded-full bg-gold flex items-center justify-center text-dark font-bold mx-auto mb-4">
                                ${user.nombre.charAt(0).toUpperCase()}
                            </div>
                            <h3 class="text-xl font-bold text-gold mb-2">${user.nombre}</h3>
                            <p class="text-dark mb-1">${user.email}</p>
                            <span class="inline-block px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-medium capitalize">
                                ${user.rol.toLowerCase()}
                            </span>
                            <div class="mt-4 pt-4 border-t border-gold/20 text-sm text-dark">
                                <p><i class="fas fa-phone mr-2"></i>${user.telefono || 'No registrado'}</p>
                                <p class="mt-1"><i class="fas fa-calendar-alt mr-2"></i>Miembro desde: ${new Date(user.created_at).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                        
                        ${barberoData ? `
                        <div class="bg-charcoal border border-gold rounded-xl p-6 text-center card-hover">
                            <h4 class="text-lg font-display font-bold text-gold mb-2">Rol de Barbero</h4>
                            <p class="text-sm text-cream/70">${barberoData.descripcion || 'Barbero profesional de D\'GALA'}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="lg:col-span-2">
                        <div class="bg-charcoal border border-gold rounded-xl p-8 card-hover">
                            <h3 class="text-2xl font-display font-bold text-gold mb-6">
                                Editar Información
                            </h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium mb-2 text-dark">Nombre Completo</label>
                                    <input type="text" id="perfil-nombre" value="${user.nombre}" 
                                           class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium mb-2 text-dark">Email</label>
                                    <input type="email" id="perfil-email" value="${user.email}" 
                                           class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                                </div>
                                
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium mb-2 text-dark">Teléfono</label>
                                    <input type="tel" id="perfil-telefono" value="${user.telefono || ''}" 
                                           class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                                </div>
                                
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium mb-2 text-dark">Biografía (Opcional)</label>
                                    <textarea id="perfil-biografia" rows="4" 
                                                      class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input"
                                                      placeholder="Cuéntanos sobre ti...">${user.biografia || ''}</textarea>
                                </div>
                            </div>
                            
                            <div class="mt-8 flex space-x-3">
                                <button id="btn-guardar-perfil" class="px-6 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                                    <i class="fas fa-save mr-2"></i>Guardar Cambios
                                </button>
                                <button id="btn-cancelar-perfil" class="px-6 py-3 bg-navy border border-gold text-dark rounded-lg font-medium transition-all hover:bg-gold/10">
                                    <i class="fas fa-times mr-2"></i>Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderConfiguracion() {
        return `
            <div class="slide-in max-w-4xl mx-auto">
                <h2 class="text-3xl font-display font-bold text-gold mb-8">
                    <i class="fas fa-cog mr-2"></i>Configuración
                </h2>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                        <h3 class="text-xl font-display font-bold text-gold mb-4">
                            <i class="fas fa-bell mr-2"></i>Notificaciones
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-dark font-medium">Recordatorios de Citas</p>
                                    <p class="text-sm text-cream/70">Recibir recordatorios antes de mis citas</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-navy peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                                </label>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-dark font-medium">Ofertas Especiales</p>
                                    <p class="text-sm text-cream/70">Recibir ofertas y promociones</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-navy peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                        <h3 class="text-xl font-display font-bold text-gold mb-4">
                            <i class="fas fa-shield-alt mr-2"></i>Privacidad
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-dark font-medium">Perfil Público</p>
                                    <p class="text-sm text-cream/70">Mostrar mi perfil a otros usuarios</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-navy peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                                </label>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-dark font-medium">Compartir Estadísticas</p>
                                    <p class="text-sm text-cream/70">Compartir mis estadísticas anónimamente</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked>
                                    <div class="w-11 h-6 bg-navy peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="bg-charcoal border border-gold rounded-xl p-6 card-hover">
                        <h3 class="text-xl font-display font-bold text-gold mb-4">
                            <i class="fas fa-user-cog mr-2"></i>Cuenta
                        </h3>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-2 text-dark">Cambiar Contraseña</label>
                                <input type="password" placeholder="Nueva contraseña" 
                                       class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input mb-2">
                                <input type="password" placeholder="Confirmar nueva contraseña" 
                                       class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                            </div>
                            
                            <button class="w-full px-4 py-3 bg-navy border border-gold text-dark rounded-lg font-medium transition-all hover:bg-gold/10">
                                <i class="fas fa-key mr-2"></i>Actualizar Contraseña
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-charcoal border border-red-600 rounded-xl p-6">
                    <h3 class="text-xl font-display font-bold text-red-600 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Zona de Peligro
                    </h3>
                    
                    <div class="space-y-4">
                        <p class="text-dark">
                            Estas acciones son irreversibles. Por favor, procede con cuidado.
                        </p>
                        
                        <div class="flex space-x-3">
                            <button class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium transition-all hover:bg-red-700">
                                <i class="fas fa-trash mr-2"></i>Eliminar Cuenta
                            </button>
                            <button class="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium transition-all hover:bg-yellow-700">
                                <i class="fas fa-file-export mr-2"></i>Exportar Mis Datos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- MANEJADORES DE EVENTOS ---
    
    attachLoginEvents() {
        // Tabs de login/registro
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        const switchToLogin = () => {
            tabLogin.classList.add('bg-gold', 'text-charcoal');
            tabLogin.classList.remove('text-cream');
            tabRegister.classList.remove('bg-gold', 'text-charcoal');
            tabRegister.classList.add('text-cream');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        };

        const switchToRegister = () => {
            tabRegister.classList.add('bg-gold', 'text-charcoal');
            tabRegister.classList.remove('text-cream');
            tabLogin.classList.remove('bg-gold', 'text-charcoal');
            tabLogin.classList.add('text-cream');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        };

        tabLogin?.addEventListener('click', switchToLogin);
        tabRegister?.addEventListener('click', switchToRegister);

        // Validación en tiempo real
        const setupFieldValidation = (fieldId, rules) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    const value = field.value.trim();
                    this.clearFieldError(fieldId);
                    
                    if (rules.required && !this.validateRequired(value)) {
                        this.showFieldError(fieldId, `${this.getFieldLabel(fieldId)} es requerido`);
                        return;
                    }
                    
                    if (rules.email && value && !FormValidator.validateEmail(value)) {
                        this.showFieldError(fieldId, 'Email inválido');
                        return;
                    }
                    
                    if (rules.minLength && value && value.length < rules.minLength) {
                        this.showFieldError(fieldId, `Mínimo ${rules.minLength} caracteres`);
                    }
                });
                
                field.addEventListener('input', () => {
                    this.clearFieldError(fieldId);
                });
            }
        };

        // Configurar validación para todos los campos
        setupFieldValidation('login-email', { required: true, email: true });
        setupFieldValidation('login-password', { required: true, minLength: 6 });
        setupFieldValidation('register-nombre', { required: true, minLength: 2 });
        setupFieldValidation('register-email', { required: true, email: true });
        setupFieldValidation('register-password', { required: true, minLength: 6 });

        // Login
        document.getElementById('btn-login')?.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            const isValid = this.validateFormFields(
                { 'login-email': email, 'login-password': password },
                {
                    'login-email': { required: true, email: true },
                    'login-password': { required: true, minLength: 6 }
                }
            );

            if (!isValid) return;

            try {
                const user = await DataManager.login(email, password);
                this.currentUser = user;
                this.currentView = 'home';
                Notifier.show(`¡Bienvenido ${user.nombre}!`, 'success');
                await this.render();
            } catch (error) {
                Notifier.show(error.message, 'error');
            }
        });

        // Registro
        document.getElementById('btn-register')?.addEventListener('click', async () => {
            const nombre = document.getElementById('register-nombre').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const telefono = document.getElementById('register-telefono').value.trim();
            const password = document.getElementById('register-password').value.trim();

            const isValid = this.validateFormFields(
                { 'register-nombre': nombre, 'register-email': email, 'register-password': password },
                {
                    'register-nombre': { required: true, minLength: 2 },
                    'register-email': { required: true, email: true },
                    'register-password': { required: true, minLength: 6 }
                }
            );

            if (!isValid) return;

            try {
                const result = await DataManager.register(email, password, nombre, telefono);
                Notifier.show(result.message, 'success');
                switchToLogin();
            } catch (error) {
                Notifier.show(error.message, 'error');
            }
        });

        // Enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.currentUser) {
                if (loginForm && !loginForm.classList.contains('hidden')) {
                    document.getElementById('btn-login').click();
                } else if (registerForm && !registerForm.classList.contains('hidden')) {
                    document.getElementById('btn-register').click();
                }
            }
        });
    }

    attachDashboardEvents() {
        // Navegación principal (sidebar)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                this.currentView = e.currentTarget.dataset.view;
                
                // Cierra el sidebar en móvil después de la navegación (OPTIMIZADO)
                if (window.innerWidth < 768 && this.sidebarOpen) {
                    // Llama a la función de manipulación directa del DOM
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar) {
                        this.sidebarOpen = false;
                        sidebar.classList.add('-translate-x-full');
                        sidebar.classList.remove('translate-x-0');
                    }
                }

                await this.render();
            });
        });

        // Toggle sidebar (Escritorio/Móvil) - OPTIMIZADO
        const sidebar = document.getElementById('sidebar');
        
        const toggleSidebarDOM = () => {
            this.sidebarOpen = !this.sidebarOpen;
            if (sidebar) {
                if (this.sidebarOpen) {
                    sidebar.classList.remove('-translate-x-full');
                    sidebar.classList.add('translate-x-0');
                } else {
                    sidebar.classList.remove('translate-x-0');
                    sidebar.classList.add('-translate-x-full');
                }
            }
        };
        
        document.getElementById('btn-sidebar-toggle-mobile')?.addEventListener('click', toggleSidebarDOM);
        document.getElementById('btn-sidebar-close')?.addEventListener('click', toggleSidebarDOM);


        // Menú de usuario (en el sidebar)
        document.querySelectorAll('.user-menu-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const action = e.currentTarget.dataset.action;
                
                // Cierra el sidebar después de la acción
                this.sidebarOpen = false;
                
                switch(action) {
                    case 'perfil':
                        this.currentView = 'perfil';
                        await this.render();
                        break;
                    case 'configuracion':
                        this.currentView = 'configuracion';
                        await this.render();
                        break;
                    case 'logout':
                        this.showConfirmModal(
                            'Cerrar Sesión',
                            '¿Estás seguro de que quieres cerrar sesión?',
                            () => {
                                DataManager.logout();
                                this.currentUser = null;
                                this.currentView = 'login';
                                Notifier.show('Sesión cerrada correctamente', 'info');
                                this.render();
                            }
                        );
                        break;
                }
            });
        });
        
        // Attach eventos específicos de vista
        this.attachViewSpecificEvents();
    }

    attachViewSpecificEvents() {
        switch(this.currentView) {
            case 'home':
                this.attachHomeEvents();
                break;
            case 'admin-citas':
                this.attachAdminCitasEvents();
                break;
            case 'admin-barberos':
                this.attachAdminBarberosEvents();
                break;
            case 'calendario':
                this.attachCalendarioEvents();
                break;
            case 'servicios':
                this.attachServiciosEvents();
                break;
            case 'inventario':
                this.attachInventarioEvents();
                break;
            case 'tienda':
                this.attachTiendaEvents();
                break;
            case 'carrito':
                this.attachCarritoEvents();
                break;
            case 'reservar':
                this.attachReservarEvents();
                break;
            case 'mis-citas':
                this.attachMisCitasEvents();
                break;
            case 'perfil':
                this.attachPerfilEvents();
                break;
            case 'configuracion':
                this.attachConfiguracionEvents();
                break;
            case 'admin-compras':
                this.attachAdminComprasEvents();
                break;
            case 'mis-compras':
                this.attachMisComprasEvents();
                break;
        }
    }
    
    // --- Métodos de Ayuda ---

    validateFormFields(formData, rules) {
        let isValid = true;
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            this.clearFieldError(field);
            
            if (rule.required && !FormValidator.validateRequired(value)) {
                this.showFieldError(field, `${this.getFieldLabel(field)} es requerido`);
                isValid = false;
                continue;
            }
            
            if (rule.email && value && !FormValidator.validateEmail(value)) {
                this.showFieldError(field, 'Email inválido');
                isValid = false;
                continue;
            }
            
            if (rule.minLength && value && value.length < rule.minLength) {
                this.showFieldError(field, `Mínimo ${rule.minLength} caracteres`);
                isValid = false;
            }
        }
        
        return isValid;
    }

    getFieldLabel(fieldId) {
        const labels = {
            'login-email': 'Email',
            'login-password': 'Contraseña',
            'register-nombre': 'Nombre',
            'register-email': 'Email',
            'register-password': 'Contraseña',
            'register-telefono': 'Teléfono'
        };
        
        return labels[fieldId] || fieldId;
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            inputElement.classList.add('border-red-600');
            inputElement.classList.remove('border-gold');
        }
    }

    clearFieldError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement && inputElement) {
            errorElement.classList.add('hidden');
            inputElement.classList.remove('border-red-600');
            inputElement.classList.add('border-gold');
        }
    }

    showConfirmModal(title, message, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4 fade-in';
        modal.innerHTML = `
            <div class="bg-charcoal border border-gold rounded-xl p-8 w-full max-w-md slide-in">
                <div class="text-center mb-2">
                    <div class="text-4xl text-yellow-600 mb-4">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="text-2xl font-display font-bold text-gold mb-2">${title}</h3>
                </div>
                <p class="text-dark mb-6 text-center">${message}</p>
                <div class="flex space-x-3">
                    <button id="modal-cancel" class="flex-1 px-4 py-3 bg-navy border border-gold text-dark rounded-lg font-medium transition-all hover:bg-gold/10">
                        <i class="fas fa-times mr-2"></i>${cancelText}
                    </button>
                    <button id="modal-confirm" class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold transition-all hover:bg-red-700">
                        <i class="fas fa-check mr-2"></i>${confirmText}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#modal-confirm').addEventListener('click', () => {
            onConfirm();
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showSuccessModal(title, message, buttonText = 'Aceptar') {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4 fade-in';
        modal.innerHTML = `
            <div class="bg-charcoal border border-gold rounded-xl p-8 w-full max-w-md slide-in">
                <div class="text-center mb-4">
                    <div class="text-4xl text-green-600 mb-2">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 class="text-2xl font-display font-bold text-gold">${title}</h3>
                </div>
                <p class="text-dark mb-6 text-center">${message}</p>
                <button id="modal-ok" class="w-full px-4 py-3 gradient-gold text-dark rounded-lg font-bold transition-all hover-lift">
                    <i class="fas fa-thumbs-up mr-2"></i>${buttonText}
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#modal-ok').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
    }

    resetApp() {
        SimpleStorage.clear();
        location.reload();
    }

    // --- EVENT HANDLERS ---
    
    attachHomeEvents() {
        document.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productoId = e.currentTarget.dataset.id;
                await this.agregarAlCarrito(productoId);
            });
        });
    }

    attachAdminCitasEvents() {
        // Filtros
        document.getElementById('btn-aplicar-filtros')?.addEventListener('click', async () => {
            this.filtrosCitas = {
                fecha: document.getElementById('filtro-fecha').value || null,
                estado: document.getElementById('filtro-estado').value || null,
                barbero_id: document.getElementById('filtro-barbero').value || null
            };
            
            SimpleStorage.set('filtrosCitas', this.filtrosCitas);
            await this.render();
        });

        document.getElementById('btn-limpiar-filtros')?.addEventListener('click', async () => {
            this.filtrosCitas = {};
            SimpleStorage.set('filtrosCitas', {});
            await this.render();
        });

        document.getElementById('btn-limpiar-filtros-empty')?.addEventListener('click', async () => {
            this.filtrosCitas = {};
            SimpleStorage.set('filtrosCitas', {});
            await this.render();
        });

        document.getElementById('btn-refresh-citas')?.addEventListener('click', async () => {
            await this.render();
        });

        // Asignación de barberos
        document.querySelectorAll('.btn-asignar-barbero, .btn-reasignar-barbero').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const citaId = e.currentTarget.dataset.id;
                await this.mostrarModalAsignacion(citaId);
            });
        });
        
        // Completar Cita
        document.querySelectorAll('.btn-completar-cita').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const citaId = e.currentTarget.dataset.id;

                // FIX: Fetch cita data before asking for confirmation to use real IDs
                Loader.show('Cargando datos de cita...');
                const citas = await DataManager.getCitas();
                const cita = citas.find(c => c.id === citaId);
                Loader.hide();

                if (!cita) {
                    Notifier.show('Error: Cita no encontrada para la actualización.', 'error');
                    return;
                }

                this.showConfirmModal(
                    'Completar Cita',
                    `¿Confirmas que el servicio de ${cita.servicio?.[0]?.nombre} ha sido completado y el pago ha sido procesado?`,
                    async () => {
                        Loader.show('Completando cita...');
                        try {
                            // FIX: Usar los IDs originales de la cita para pasar la validación de UUIDs
                            await DataManager.saveCita({
                                id: citaId,
                                cliente_id: cita.cliente_id, 
                                servicio_id: cita.servicio_id, 
                                barbero_id: cita.barbero_id, 
                                fecha_hora: cita.fecha_hora, 
                                estado_asignacion: 'COMPLETADO',
                                estado_pago: 'PAGADO' // Forzamos el pago al completar desde Admin
                            });
                            Notifier.show('Cita completada y marcada como pagada', 'success');
                            await this.render();
                        } catch (error) {
                            Notifier.show(`Error al completar cita: ${error.message}`, 'error');
                        } finally {
                            Loader.hide();
                        }
                    },
                    'Completar y Pagar',
                    'Cancelar'
                );
            });
        });
    }

    attachAdminBarberosEvents() {
        document.getElementById('btn-add-barbero')?.addEventListener('click', () => {
            this.showBarberoModal();
        });

        document.getElementById('btn-add-barbero-empty')?.addEventListener('click', () => {
            this.showBarberoModal();
        });

        document.querySelectorAll('.btn-edit-barbero').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const barberoId = e.currentTarget.dataset.id;
                const barberos = await DataManager.getBarberos();
                const barbero = barberos.find(b => b.id === barberoId);
                this.showBarberoModal(barbero);
            });
        });

        document.querySelectorAll('.btn-delete-barbero').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const barberoId = e.currentTarget.dataset.id;
                this.showConfirmModal(
                    'Eliminar Barbero',
                    '¿Estás seguro de que quieres eliminar este barbero? Esta acción no se puede deshacer.',
                    async () => {
                        Loader.show('Eliminando barbero...');
                        const success = await DataManager.deleteBarbero(barberoId);
                        Loader.hide();
                        
                        if (success) {
                            Notifier.show('Barbero eliminado correctamente', 'success');
                            await this.render();
                        } else {
                            Notifier.show('Error al eliminar barbero', 'error');
                        }
                    }
                );
            });
        });
    }

    attachCalendarioEvents() {
        document.getElementById('btn-mes-anterior')?.addEventListener('click', () => {
            this.calendarioMesActual.setMonth(this.calendarioMesActual.getMonth() - 1);
            this.render();
        });

        document.getElementById('btn-mes-siguiente')?.addEventListener('click', () => {
            this.calendarioMesActual.setMonth(this.calendarioMesActual.getMonth() + 1);
            this.render();
        });
    }

    attachServiciosEvents() {
        document.getElementById('btn-add-servicio')?.addEventListener('click', () => {
            this.showServicioModal();
        });

        document.getElementById('btn-add-servicio-empty')?.addEventListener('click', () => {
            this.showServicioModal();
        });

        document.querySelectorAll('.btn-edit-servicio').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const servicioId = e.currentTarget.dataset.id;
                const servicios = await DataManager.getServicios();
                const servicio = servicios.find(s => s.id === servicioId);
                this.showServicioModal(servicio);
            });
        });

        document.querySelectorAll('.btn-delete-servicio').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const servicioId = e.currentTarget.dataset.id;
                this.showConfirmModal(
                    'Eliminar Servicio',
                    '¿Estás seguro de que quieres eliminar este servicio? Las citas asociadas podrían verse afectadas.',
                    async () => {
                        Loader.show('Eliminando servicio...');
                        const success = await DataManager.deleteServicio(servicioId);
                        Loader.hide();
                        
                        if (success) {
                            Notifier.show('Servicio eliminado correctamente', 'success');
                            await this.render();
                        } else {
                            Notifier.show('Error al eliminar servicio', 'error');
                        }
                    }
                );
            });
        });
    }

    attachInventarioEvents() {
        document.getElementById('btn-add-inventario')?.addEventListener('click', () => {
            this.showInventarioModal();
        });

        document.getElementById('btn-add-inventario-empty')?.addEventListener('click', () => {
            this.showInventarioModal();
        });

        document.querySelectorAll('.btn-edit-inventario').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = e.currentTarget.dataset.id;
                const items = await DataManager.getInventario();
                const item = items.find(i => i.id === itemId);
                this.showInventarioModal(item);
            });
        });

        document.querySelectorAll('.btn-delete-inventario').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = e.currentTarget.dataset.id;
                this.showConfirmModal(
                    'Eliminar Producto',
                    '¿Estás seguro de que quieres eliminar este producto del inventario? Esta acción no se puede deshacer.',
                    async () => {
                        Loader.show('Eliminando producto...');
                        const success = await DataManager.deleteInventario(itemId);
                        Loader.hide();
                        
                        if (success) {
                            Notifier.show('Producto eliminado correctamente', 'success');
                            await this.render();
                        } else {
                            Notifier.show('Error al eliminar producto', 'error');
                        }
                    }
                );
            });
        });
    }

    attachTiendaEvents() {
        document.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productoId = e.currentTarget.dataset.id;
                await this.agregarAlCarrito(productoId);
            });
        });
    }

    attachCarritoEvents() {
        document.querySelectorAll('.btn-aumentar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.actualizarCantidadCarrito(index, 1);
            });
        });

        document.querySelectorAll('.btn-disminuir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.actualizarCantidadCarrito(index, -1);
            });
        });

        document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.eliminarDelCarrito(index);
            });
        });
        
        document.getElementById('btn-procesar-pago')?.addEventListener('click', async () => {
            this.procesarPago();
        });
    }

    attachReservarEvents() {
        // Función para re-renderizar solo la sección de horarios
        const updateHorarios = async () => {
            const servicioEl = document.getElementById('select-servicio');
            const barberoEl = document.getElementById('select-barbero');
            const fechaEl = document.getElementById('input-fecha');
            const btnConfirmar = document.getElementById('btn-confirmar-reserva');
            const slotsContainer = document.getElementById('slots-container');
            const horariosDiv = document.getElementById('horarios-disponibles');
            const inputHora = document.getElementById('input-hora');
            const pagoCitaEl = document.getElementById('select-pago-cita');

            // 1. Actualizar estado interno
            this.reservaData.servicio_id = servicioEl.value || null;
            this.reservaData.barbero_id = barberoEl.value || null;
            this.reservaData.fecha = fechaEl.value || null;
            this.reservaData.hora = null; // Reiniciar hora al cambiar inputs
            this.reservaData.metodo_pago = pagoCitaEl.value; // Capturar método de pago
            inputHora.value = '';
            btnConfirmar.disabled = true;

            if (!this.reservaData.servicio_id || !this.reservaData.fecha) {
                horariosDiv?.classList.add('hidden');
                return;
            }

            // 2. Mostrar loader/calculando
            horariosDiv?.classList.remove('hidden');
            slotsContainer.innerHTML = '<div class="md:col-span-4 text-center py-4"><div class="loader mx-auto"></div><p class="text-gold mt-2">Buscando horarios...</p></div>';

            // 3. Obtener duración del servicio
            const selectedOption = servicioEl.options[servicioEl.selectedIndex];
            const duracion = parseInt(selectedOption.dataset.duracion || 30);

            // 4. Obtener horarios disponibles con la lógica robusta
            try {
                const horarios = await DataManager.getHorariosDisponibles(
                    this.reservaData.fecha, 
                    duracion, 
                    this.reservaData.barbero_id
                );

                // 5. Renderizar slots
                if (horarios.length === 0) {
                    slotsContainer.innerHTML = `<p class="text-red-600 md:col-span-4 py-4 text-center">No hay horarios disponibles para esta combinación. Intenta con otro día o barbero.</p>`;
                } else {
                    slotsContainer.innerHTML = horarios.map(hora => `
                        <div class="time-slot" data-hora="${hora}">
                            ${hora}
                        </div>
                    `).join('');
                    this.attachSlotEvents(); // Re-adjuntar eventos a los nuevos slots
                }
            } catch (error) {
                console.error("Error al obtener horarios:", error);
                slotsContainer.innerHTML = `<p class="text-red-600 md:col-span-4 py-4 text-center">Error al cargar la disponibilidad.</p>`;
            }
        };

        // Event Listeners para actualizar horarios
        document.getElementById('select-servicio')?.addEventListener('change', updateHorarios);
        document.getElementById('select-barbero')?.addEventListener('change', updateHorarios);
        document.getElementById('input-fecha')?.addEventListener('change', updateHorarios);
        document.getElementById('select-pago-cita')?.addEventListener('change', updateHorarios);
        
        // Evento de confirmación de reserva
        document.getElementById('btn-confirmar-reserva')?.addEventListener('click', async () => {
            const { servicio_id, barbero_id, fecha, hora, metodo_pago } = this.reservaData;

            if (!servicio_id || !fecha || !hora) {
                Notifier.show('Faltan datos para la reserva', 'error');
                return;
            }

            const fechaHora = new Date(`${fecha}T${hora}:00`);

            this.showConfirmModal(
                'Confirmar Cita',
                `¿Deseas reservar el servicio para el ${fecha} a las ${hora} pagando con ${metodo_pago}?`,
                async () => {
                    Loader.show('Creando reserva...');
                    try {
                        const estado_pago = (metodo_pago === 'TARJETA') ? 'PAGADO' : 'PENDIENTE';

                        const newCita = {
                            cliente_id: this.currentUser.id,
                            servicio_id: servicio_id,
                            barbero_id: barbero_id || null, 
                            fecha_hora: fechaHora.toISOString(),
                            estado_asignacion: barbero_id ? 'ASIGNADO' : 'PENDIENTE',
                            estado_pago: estado_pago,
                            metodo_pago: metodo_pago // Guardar método de pago en la cita
                        };

                        const success = await DataManager.saveCita(newCita);
                        
                        // Si no se asignó barbero, intentar asignación automática
                        if (success && !barbero_id && estado_pago !== 'PAGADO') {
                            const citas = await DataManager.getCitas({ cliente_id: this.currentUser.id, estado: 'PENDIENTE' });
                            const citaRecienCreada = citas.find(c => new Date(c.fecha_hora).getTime() === fechaHora.getTime());
                            
                            if (citaRecienCreada) {
                                const barberoAsignado = await DataManager.asignarBarberoAutomatico(citaRecienCreada.id);
                                if (barberoAsignado) {
                                    Notifier.show(`Cita reservada y asignada a ${barberoAsignado.usuario.nombre} con éxito!`, 'success');
                                } else {
                                    Notifier.show('Cita reservada. Barbero pendiente de asignación.', 'warning');
                                }
                            } else {
                                Notifier.show('Cita reservada. Barbero pendiente de asignación.', 'warning');
                            }
                        } else if (success) {
                            Notifier.show('¡Cita reservada y asignada con éxito!', 'success');
                        }

                        this.reservaData = {}; // Limpiar data
                        this.currentView = 'mis-citas';
                        await this.render();

                    } catch (error) {
                        Notifier.show(`Error al reservar: ${error.message}`, 'error');
                    } finally {
                        Loader.hide();
                    }
                },
                'Confirmar',
                'Volver'
            );
        });
        
        // Asegurar que la fecha mínima sea hoy
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('input-fecha').setAttribute('min', today);
    }

    attachSlotEvents() {
        // Event Listener para seleccionar hora
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                
                this.reservaData.hora = e.currentTarget.dataset.hora;
                document.getElementById('input-hora').value = this.reservaData.hora;
                document.getElementById('btn-confirmar-reserva').disabled = false;
            });
        });
    }

    attachMisCitasEvents() {
         document.querySelectorAll('.btn-cancelar-cita').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const citaId = e.currentTarget.dataset.id;
                this.showConfirmModal(
                    'Cancelar Cita',
                    '¿Estás seguro de que quieres cancelar esta cita? Solo puedes cancelar citas PENDIENTES o ASIGNADAS.',
                    async () => {
                        Loader.show('Cancelando cita...');
                        try {
                            // 1. Obtener el estado actual
                            const citas = await DataManager.getCitas();
                            const cita = citas.find(c => c.id === citaId);
                            
                            // 2. Aplicar regla de negocio del cliente
                            if (!cita || (cita.estado_asignacion !== 'PENDIENTE' && cita.estado_asignacion !== 'ASIGNADO')) {
                                Notifier.show('No se puede cancelar la cita: ya está completada o cancelada.', 'error');
                                return;
                            }
                            
                            // 3. Ejecutar actualización
                            await DataManager.saveCita({
                                id: citaId,
                                cliente_id: cita.cliente_id,
                                servicio_id: cita.servicio_id,
                                fecha_hora: cita.fecha_hora,
                                estado_asignacion: 'CANCELADO',
                                motivo_cancelacion: 'Cancelado por el cliente'
                            });

                            Notifier.show('Cita cancelada correctamente', 'success');
                            await this.render();
                        } catch (error) {
                            Notifier.show(`Error al cancelar cita: ${error.message}`, 'error');
                        } finally {
                            Loader.hide();
                        }
                    },
                    'Confirmar Cancelación',
                    'Volver'
                );
            });
        });
        // Evento para simular pago de cita
        document.querySelectorAll('.btn-pagar-cita').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const citaId = e.currentTarget.dataset.id;
                const precio = e.currentTarget.dataset.precio;

                this.showConfirmModal(
                    'Finalizar Pago de Cita',
                    `¿Confirmas el pago de $${precio} por el servicio?`,
                    async () => {
                        Loader.show('Procesando pago...');
                        try {
                            const citas = await DataManager.getCitas();
                            const cita = citas.find(c => c.id === citaId);
                            
                            await DataManager.saveCita({
                                id: citaId,
                                cliente_id: cita.cliente_id, 
                                servicio_id: cita.servicio_id, 
                                barbero_id: cita.barbero_id, 
                                fecha_hora: cita.fecha_hora, 
                                estado_pago: 'PAGADO'
                            });

                            Notifier.show('Pago registrado con éxito.', 'success');
                            await this.render();
                        } catch (error) {
                            Notifier.show(`Error al procesar el pago: ${error.message}`, 'error');
                        } finally {
                            Loader.hide();
                        }
                    }
                );
            });
        });
    }

    attachMisComprasEvents() {
        // Evento de pago de compras
         document.querySelectorAll('.btn-pagar-compra-final').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const compraId = e.currentTarget.dataset.id;
                const monto = e.currentTarget.dataset.monto;

                this.showConfirmModal(
                    'Confirmar Pago de Compra',
                    `¿Desea confirmar el pago en línea de $${monto}?`,
                    async () => {
                        Loader.show('Procesando pago en línea...');
                        try {
                            // Simular pago y actualizar estado
                            const compras = await DataManager.getCompras({ cliente_id: this.currentUser.id });
                            const compra = compras.find(c => c.id === compraId);
                            
                            await DataManager.saveCompra({ 
                                id: compraId, 
                                cliente_id: compra.cliente.id,
                                monto_total: compra.monto_total,
                                metodo_pago: compra.metodo_pago,
                                detalles_productos: compra.detalles_productos,
                                estado_pago: 'PAGADO' 
                            });
                            Notifier.show('Pago de compra realizado con éxito.', 'success');
                            await this.render();
                        } catch (error) {
                            Notifier.show(`Error al procesar el pago: ${error.message}`, 'error');
                        } finally {
                            Loader.hide();
                        }
                    }
                );
            });
        });
    }

    attachAdminComprasEvents() {
         document.querySelectorAll('.btn-marcar-pagado-compra').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const compraId = e.currentTarget.dataset.id;
                this.showConfirmModal(
                    'Marcar Compra como Pagada',
                    '¿Confirmas que el cliente ha pagado esta compra en efectivo?',
                    async () => {
                        Loader.show('Actualizando estado...');
                        try {
                            // Para que saveCompra funcione, necesitamos los campos no nulos.
                            const compras = await DataManager.getCompras({});
                            const compra = compras.find(c => c.id === compraId);

                            await DataManager.saveCompra({ 
                                id: compraId, 
                                cliente_id: compra.cliente.id,
                                monto_total: compra.monto_total,
                                metodo_pago: compra.metodo_pago,
                                detalles_productos: compra.detalles_productos,
                                estado_pago: 'PAGADO' 
                            });
                            Notifier.show('Compra marcada como PAGADA.', 'success');
                            await this.render();
                        } catch (error) {
                            Notifier.show(`Error al actualizar el pago: ${error.message}`, 'error');
                        } finally {
                            Loader.hide();
                        }
                    }
                );
            });
        });
    }

    attachPerfilEvents() {
        document.getElementById('btn-guardar-perfil')?.addEventListener('click', async () => {
            const user = this.currentUser;
            const updatedUser = {
                id: user.id,
                nombre: document.getElementById('perfil-nombre').value,
                email: document.getElementById('perfil-email').value,
                telefono: document.getElementById('perfil-telefono').value,
                biografia: document.getElementById('perfil-biografia').value,
            };

            try {
                const result = await DataManager.updateUsuario(updatedUser);
                this.currentUser = { ...this.currentUser, ...result };
                SimpleStorage.set('currentUser', this.currentUser);
                Notifier.show('Perfil actualizado con éxito.', 'success');
                await this.render(); // Re-render para actualizar el sidebar
            } catch (error) {
                Notifier.show(`Error al guardar perfil: ${error.message}`, 'error');
            }
        });

        document.getElementById('btn-cancelar-perfil')?.addEventListener('click', async () => {
            this.currentView = 'home';
            await this.render();
        });
    }
    
    attachConfiguracionEvents() {
        // No hay eventos complejos, solo simulaciones de toggle, pero se deja el método para futuras implementaciones.
    }
    
    async showBarberoModal(barbero = null) {
        const usuarios = await DataManager.getUsuariosDisponiblesParaBarbero();
        const isEdit = !!barbero;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4 fade-in';
        modal.innerHTML = `
            <div class="bg-charcoal border border-gold rounded-xl p-8 w-full max-w-2xl slide-in">
                <h3 class="text-2xl font-display font-bold mb-6 text-gold">
                    ${isEdit ? 'Editar Barbero' : 'Nuevo Barbero'}
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Usuario</label>
                        <select id="modal-usuario" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input" ${isEdit ? 'disabled' : ''}>
                            <option value="">Seleccionar usuario</option>
                            ${usuarios.map(u => `
                                <option value="${u.id}" ${barbero?.usuario_id === u.id ? 'selected' : ''}>
                                    ${u.nombre} - ${u.email}
                                </option>
                            `).join('')}
                        </select>
                        ${isEdit ? `<p class="text-xs text-cream/70 mt-1">El usuario no se puede cambiar.</p>` : ''}
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Teléfono</label>
                        <input type="tel" id="modal-telefono" value="${barbero?.telefono || ''}" 
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Horario Inicio</label>
                        <input type="time" id="modal-horario-inicio" value="${barbero?.horario_inicio || '09:00'}" 
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Horario Fin</label>
                        <input type="time" id="modal-horario-fin" value="${barbero?.horario_fin || '18:00'}" 
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                    </div>
                    
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-2 text-dark">Descripción</label>
                        <textarea id="modal-descripcion" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input" 
                                  rows="3">${barbero?.descripcion || ''}</textarea>
                    </div>
                    
                    <div class="md:col-span-2 flex items-center">
                        <input type="checkbox" id="modal-activo" ${barbero?.activo !== false ? 'checked' : ''} 
                               class="mr-2 w-4 h-4 text-gold bg-navy border-gold rounded focus:ring-gold">
                        <label for="modal-activo" class="text-dark">Barbero activo</label>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button id="modal-cancel" class="flex-1 px-4 py-3 bg-navy border border-gold text-dark rounded-lg font-medium">
                        Cancelar
                    </button>
                    <button id="modal-save" class="flex-1 px-4 py-3 gradient-gold text-dark rounded-lg font-bold">
                        ${isEdit ? 'Guardar Cambios' : 'Crear Barbero'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#modal-save').addEventListener('click', async () => {
            const barberoData = {
                usuario_id: modal.querySelector('#modal-usuario').value || (barbero ? barbero.usuario_id : null),
                telefono: modal.querySelector('#modal-telefono').value,
                horario_inicio: modal.querySelector('#modal-horario-inicio').value,
                horario_fin: modal.querySelector('#modal-horario-fin').value,
                descripcion: modal.querySelector('#modal-descripcion').value,
                activo: modal.querySelector('#modal-activo').checked
            };

            if (isEdit) {
                barberoData.id = barbero.id;
            }
            
            if (!barberoData.usuario_id) {
                 Notifier.show('Debe seleccionar un usuario para el barbero', 'error');
                 return;
            }

            try {
                await DataManager.saveBarbero(barberoData);
                Notifier.show(`Barbero ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
                modal.remove();
                await this.render();
            } catch (error) {
                Notifier.show(`Error al ${isEdit ? 'actualizar' : 'crear'} barbero: ${error.message}`, 'error');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async mostrarModalAsignacion(citaId) {
        const barberos = await DataManager.getBarberos();
        const citas = await DataManager.getCitas();
        const cita = citas.find(c => c.id === citaId);

        // Si la cita no se encuentra o ya está cancelada/completada, salir
        if (!cita || cita.estado_asignacion === 'COMPLETADO' || cita.estado_asignacion === 'CANCELADO') {
            Notifier.show('La cita no puede ser asignada o reasignada en su estado actual.', 'warning');
            return;
        }

        const servicios = await DataManager.getServicios();
        const servicio = servicios.find(s => s.id === cita?.servicio_id);
        const duracion = servicio?.duracion || 30;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4 fade-in';
        modal.innerHTML = `
            <div class="bg-charcoal border border-gold rounded-xl p-8 w-full max-w-md slide-in">
                <h3 class="text-2xl font-display font-bold mb-6 text-gold">
                    <i class="fas fa-user-tie mr-2"></i>Asignar Barbero
                </h3>
                
                <div class="mb-6">
                    <p class="text-dark mb-2"><strong>Cliente:</strong> ${cita?.cliente?.nombre}</p>
                    <p class="text-dark mb-2"><strong>Servicio:</strong> ${cita?.servicio?.[0]?.nombre}</p>
                    <p class="text-dark"><strong>Fecha:</strong> ${new Date(cita?.fecha_hora).toLocaleString('es-ES')}</p>
                    <p class="text-xs text-red-600 mt-2">Duración del servicio: ${duracion} minutos</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2 text-dark">Seleccionar Barbero</label>
                    <select id="modal-barbero-asignacion" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                        <option value="">Seleccionar barbero</option>
                        ${barberos.filter(b => b.activo).map(barbero => `
                            <option value="${barbero.id}" ${cita?.barbero_id === barbero.id ? 'selected' : ''}>
                                ${barbero.usuario?.nombre} (${barbero.horario_inicio} a ${barbero.horario_fin})
                            </option>
                        `).join('')}
                    </select>
                    <p id="disponibilidad-msg" class="text-xs text-red-600 mt-1 hidden">Verificando disponibilidad...</p>
                </div>
                
                <div class="flex space-x-3">
                    <button id="modal-cancel" class="flex-1 px-4 py-3 bg-navy border border-gold text-dark rounded-lg font-medium">
                        Cancelar
                    </button>
                    <button id="modal-asignar" class="flex-1 px-4 py-3 gradient-gold text-dark rounded-lg font-bold" disabled>
                        Asignar Barbero
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const selectBarbero = modal.querySelector('#modal-barbero-asignacion');
        const btnAsignar = modal.querySelector('#modal-asignar');
        const msgDisponibilidad = modal.querySelector('#disponibilidad-msg');

        const checkAvailability = async (barberoId) => {
            if (!barberoId) {
                msgDisponibilidad.classList.add('hidden');
                btnAsignar.disabled = true;
                return;
            }
            
            msgDisponibilidad.textContent = 'Verificando disponibilidad...';
            msgDisponibilidad.classList.remove('hidden', 'text-green-600', 'text-red-600');
            msgDisponibilidad.classList.add('text-yellow-600');
            btnAsignar.disabled = true;

            const isAvailable = await DataManager.estaDisponible(barberoId, cita.fecha_hora, duracion, cita.id);

            if (isAvailable) {
                msgDisponibilidad.textContent = 'Barbero disponible en este horario.';
                msgDisponibilidad.classList.remove('text-yellow-600', 'text-red-600');
                msgDisponibilidad.classList.add('text-green-600');
                btnAsignar.disabled = false;
            } else {
                msgDisponibilidad.textContent = '¡Barbero NO disponible! El horario se solapa.';
                msgDisponibilidad.classList.remove('text-yellow-600', 'text-green-600');
                msgDisponibilidad.classList.add('text-red-600');
                btnAsignar.disabled = true;
            }
        };

        selectBarbero.addEventListener('change', (e) => {
            checkAvailability(e.target.value);
        });
        
        // Cargar disponibilidad inicial si ya hay una selección
        if (selectBarbero.value) {
            checkAvailability(selectBarbero.value);
        }

        modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#modal-asignar').addEventListener('click', async () => {
            const barberoId = selectBarbero.value;
            
            if (!barberoId) {
                Notifier.show('Por favor selecciona un barbero', 'error');
                return;
            }

            try {
                // Asignar y cambiar estado a ASIGNADO
                await DataManager.saveCita({
                    id: citaId,
                    cliente_id: cita.cliente_id, 
                    servicio_id: cita.servicio_id, 
                    fecha_hora: cita.fecha_hora,
                    barbero_id: barberoId,
                    estado_asignacion: 'ASIGNADO'
                });
                
                Notifier.show('Barbero asignado correctamente', 'success');
                modal.remove();
                await this.render();
            } catch (error) {
                Notifier.show(`Error al asignar barbero: ${error.message}`, 'error');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async showServicioModal(servicio = null) {
        const isEdit = !!servicio;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4 fade-in';
        modal.innerHTML = `
            <div class="bg-charcoal border border-gold rounded-xl p-8 w-full max-w-md slide-in">
                <h3 class="text-2xl font-display font-bold text-gold mb-6">
                    ${isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Nombre</label>
                        <input type="text" id="modal-nombre" value="${servicio?.nombre || ''}" 
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                        <div id="modal-nombre-error" class="text-red-600 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Duración (minutos)</label>
                        <input type="number" id="modal-duracion" value="${servicio?.duracion || 30}" min="15" step="5"
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                        <div id="modal-duracion-error" class="text-red-600 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Precio ($)</label>
                        <input type="number" id="modal-precio" value="${servicio?.precio || 10.00}" min="0" step="0.01"
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                        <div id="modal-precio-error" class="text-red-600 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Descripción (Opcional)</label>
                        <textarea id="modal-descripcion" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input" 
                                  rows="2">${servicio?.descripcion || ''}</textarea>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button id="modal-cancel" class="flex-1 px-4 py-3 bg-navy border border-gold text-dark rounded-lg font-medium">
                        Cancelar
                    </button>
                    <button id="modal-save" class="flex-1 px-4 py-3 gradient-gold text-dark rounded-lg font-bold">
                        ${isEdit ? 'Guardar Cambios' : 'Crear Servicio'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#modal-save').addEventListener('click', async () => {
            const servicioData = {
                nombre: modal.querySelector('#modal-nombre').value,
                duracion: parseInt(modal.querySelector('#modal-duracion').value),
                precio: parseFloat(modal.querySelector('#modal-precio').value),
                descripcion: modal.querySelector('#modal-descripcion').value,
            };

            if (isEdit) {
                servicioData.id = servicio.id;
            }

            try {
                await DataManager.saveServicio(servicioData);
                Notifier.show(`Servicio ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
                modal.remove();
                await this.render();
            } catch (error) {
                Notifier.show(`Error al ${isEdit ? 'actualizar' : 'crear'} servicio: ${error.message}`, 'error');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async showInventarioModal(item = null) {
        const isEdit = !!item;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4 fade-in';
        modal.innerHTML = `
            <div class="bg-charcoal border border-gold rounded-xl p-8 w-full max-w-md slide-in">
                <h3 class="text-2xl font-display font-bold text-gold mb-6">
                    ${isEdit ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Nombre</label>
                        <input type="text" id="modal-nombre" value="${item?.nombre || ''}" 
                               class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                        <div id="modal-nombre-error" class="text-red-600 text-sm mt-1 hidden"></div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2 text-dark">Descripción (Opcional)</label>
                        <textarea id="modal-descripcion" class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input" 
                                  rows="2">${item?.descripcion || ''}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">Cantidad</label>
                            <input type="number" id="modal-cantidad" value="${item?.cantidad || 0}" min="0"
                                   class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                            <div id="modal-cantidad-error" class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">Mínimo</label>
                            <input type="number" id="modal-minimo" value="${item?.minimo || 5}" min="1"
                                   class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                            <div id="modal-minimo-error" class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2 text-dark">Precio ($)</label>
                            <input type="number" id="modal-precio" value="${item?.precio || 15.00}" min="0" step="0.01"
                                   class="w-full px-4 py-3 rounded-lg bg-navy border border-gold text-dark form-input">
                            <div id="modal-precio-error" class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button id="modal-cancel" class="flex-1 px-4 py-3 bg-navy border border-gold text-dark rounded-lg font-medium">
                        Cancelar
                    </button>
                    <button id="modal-save" class="flex-1 px-4 py-3 gradient-gold text-dark rounded-lg font-bold">
                        ${isEdit ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#modal-save').addEventListener('click', async () => {
            const itemData = {
                nombre: modal.querySelector('#modal-nombre').value,
                descripcion: modal.querySelector('#modal-descripcion').value,
                cantidad: parseInt(modal.querySelector('#modal-cantidad').value),
                minimo: parseInt(modal.querySelector('#modal-minimo').value),
                precio: parseFloat(modal.querySelector('#modal-precio').value),
            };

            if (isEdit) {
                itemData.id = item.id;
            }

            try {
                await DataManager.saveInventario(itemData);
                Notifier.show(`Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
                modal.remove();
                await this.render();
            } catch (error) {
                Notifier.show(`Error al ${isEdit ? 'actualizar' : 'crear'} producto: ${error.message}`, 'error');
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // --- LÓGICA DE CARRITO Y PAGOS ---

    async agregarAlCarrito(productoId) {
        Loader.showToast('Agregando al carrito...', 'info');
        const productos = await DataManager.getInventario();
        const producto = productos.find(p => p.id === productoId);
        
        if (!producto) {
            Notifier.show('Producto no encontrado.', 'error');
            return;
        }

        const existingItemIndex = this.carrito.findIndex(item => item.id === productoId);
        
        if (existingItemIndex !== -1) {
            // Verificar stock
            if (this.carrito[existingItemIndex].cantidad + 1 > producto.cantidad) {
                Notifier.show(`Stock insuficiente para ${producto.nombre}.`, 'error');
                return;
            }
            this.carrito[existingItemIndex].cantidad += 1;
        } else {
            this.carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                descripcion: producto.descripcion,
                cantidad: 1,
                stockDisponible: producto.cantidad // Para referencia de límite
            });
        }
        
        DataManager.saveCarrito(this.carrito);
        Notifier.showToast(`${producto.nombre} agregado al carrito`, 'success');
        
        // Actualizar UI del carrito en el header/mobile menu
        if (this.currentView === 'tienda' || this.currentView === 'home') {
            await this.render();
        } else if (this.currentView === 'carrito') {
            await this.render();
        }
    }

    actualizarCantidadCarrito(index, delta) {
        if (index < 0 || index >= this.carrito.length) return;

        const item = this.carrito[index];
        const newQuantity = item.cantidad + delta;
        
        if (newQuantity <= 0) {
            this.eliminarDelCarrito(index);
            return;
        }
        
        if (newQuantity > item.stockDisponible) {
            Notifier.show(`No hay más stock disponible para ${item.nombre}.`, 'warning');
            return;
        }

        item.cantidad = newQuantity;
        DataManager.saveCarrito(this.carrito);
        this.render(); // Re-renderizar la vista de carrito
    }

    eliminarDelCarrito(index) {
        if (index >= 0 && index < this.carrito.length) {
            const nombre = this.carrito[index].nombre;
            this.carrito.splice(index, 1);
            DataManager.saveCarrito(this.carrito);
            Notifier.showToast(`${nombre} eliminado del carrito`, 'info');
            this.render();
        }
    }

    async procesarPago() {
        if (this.carrito.length === 0) {
            Notifier.show('El carrito está vacío.', 'error');
            return;
        }

        const montoTotal = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const metodoPago = document.getElementById('select-pago-carrito').value;
        const estadoPago = (metodoPago === 'TARJETA') ? 'PAGADO' : 'PENDIENTE';

        this.showConfirmModal(
            'Confirmar Compra',
            `El total es $${montoTotal.toFixed(2)}. ¿Desea proceder con el pago mediante ${metodoPago}?`,
            async () => {
                Loader.show('Procesando compra...');
                try {
                    const detallesProductos = this.carrito.map(item => ({
                        id: item.id,
                        nombre: item.nombre,
                        cantidad: item.cantidad,
                        precio: item.precio
                    }));

                    const compraPayload = {
                        cliente_id: this.currentUser.id,
                        monto_total: montoTotal,
                        metodo_pago: metodoPago,
                        estado_pago: estadoPago,
                        detalles_productos: detallesProductos,
                    };

                    const success = await DataManager.saveCompra(compraPayload);

                    if (success) {
                        // 1. Actualizar inventario (restar stock)
                        // Esto debería ser una función transaccional en el backend, aquí se simula.
                        const inventarioActual = await DataManager.getInventario();
                        for (const item of this.carrito) {
                            const dbItem = inventarioActual.find(i => i.id === item.id);
                            if (dbItem) {
                                await DataManager.saveInventario({
                                    id: dbItem.id,
                                    cantidad: dbItem.cantidad - item.cantidad,
                                    nombre: dbItem.nombre, // Asegurar campos no nulos
                                    minimo: dbItem.minimo,
                                    precio: dbItem.precio
                                });
                            }
                        }

                        // 2. Limpiar carrito
                        this.carrito = [];
                        DataManager.limpiarCarrito();

                        // 3. Notificar
                        if (estadoPago === 'PAGADO') {
                            Notifier.show('¡Compra realizada con éxito! Pago confirmado.', 'success', 5000);
                        } else {
                            Notifier.show('Compra registrada. Finalice el pago en caja.', 'warning', 5000);
                        }

                        this.currentView = 'mis-compras';
                        await this.render();
                    } else {
                        throw new Error('Error desconocido al registrar la compra.');
                    }
                } catch (error) {
                    Notifier.show(`Error al procesar la compra: ${error.message}`, 'error');
                } finally {
                    Loader.hide();
                }
            },
            'Pagar',
            'Volver'
        );
    }
}