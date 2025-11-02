// ========================================
// DATA MANAGER COMPLETO Y MEJORADO
// Depende de: supabase (config.js), SimpleStorage, Notifier, Loader, FormValidator (utils.js)
// ========================================
class DataManager {
    // AUTENTICACIÓN
    static async login(email, password) {
        try {
            Loader.showProgress(30, 'Verificando credenciales...');
            
            // Simular auth para obtener el rol, la autenticación real debería usar auth.signInWithPassword
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', email)
                .eq('password', password) // En una app real, nunca se guarda password en texto plano
                .single();
            
            if (error || !data) {
                throw new Error('Credenciales inválidas. Verifique su email y contraseña.');
            }
            
            // L2 CORREGIDO: Ya no se necesita forzar el rol BARBERO aquí si está corregido en la BD.

            Loader.showProgress(80, 'Iniciando sesión...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            SimpleStorage.set('currentUser', data);
            return data;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        } finally {
            Loader.hide();
        }
    }

    static async register(email, password, nombre, telefono = null) {
        try {
            const validation = FormValidator.validateForm(
                { email, password, nombre },
                {
                    email: { required: true, email: true },
                    password: { required: true, minLength: 6 },
                    nombre: { required: true, minLength: 2 }
                }
            );
            
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            Loader.showProgress(20, 'Verificando email...');

            const { data: existing } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            
            if (existing) {
                throw new Error('El email ya está registrado. Intente con otro email.');
            }

            Loader.showProgress(60, 'Creando cuenta...');

            const { data, error } = await supabase
                .from('usuarios')
                .insert([{ 
                    email, 
                    password, 
                    nombre, 
                    telefono,
                    rol: 'CLIENTE',
                    // Los campos avatar_url, created_at se completan con DEFAULT en SQL
                }])
                .select()
                .single();
            
            if (error) {
                throw new Error('Error al registrar usuario. Intente nuevamente.');
            }
            
            Loader.showProgress(100, 'Cuenta creada exitosamente!');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true, message: 'Usuario registrado exitosamente', user: data };
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        } finally {
            Loader.hide();
        }
    }
    
    static async updateUsuario(user) {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update({ nombre: user.nombre, email: user.email, telefono: user.telefono, biografia: user.biografia })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error actualizando usuario:', error);
            throw error;
        }
    }


    static getCurrentUser() {
        return SimpleStorage.get('currentUser');
    }

    static logout() {
        SimpleStorage.remove('currentUser');
        SimpleStorage.remove('carrito');
        SimpleStorage.remove('filtrosCitas');
    }

    // SERVICIOS
    static async getServicios() {
        try {
            const { data, error } = await supabase
                .from('servicios')
                .select('*')
                .eq('activo', true) // Solo servicios activos
                .order('nombre');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo servicios:', error);
            return [];
        }
    }

    static async saveServicio(servicio) {
        try {
            const validation = FormValidator.validateForm(
                servicio,
                {
                    nombre: { required: true, minLength: 2 },
                    duracion: { required: true, number: true, min: 15 },
                    precio: { required: true, number: true, min: 1 }
                }
            );
            
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            if (servicio.id) {
                const { error } = await supabase
                    .from('servicios')
                    .update(servicio)
                    .eq('id', servicio.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('servicios')
                    .insert([servicio]);
                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error guardando servicio:', error);
            throw error;
        }
    }

    static async deleteServicio(id) {
        try {
            // Eliminación lógica (se asume que la columna 'activo' existe)
            const { error } = await supabase
                .from('servicios')
                .update({ activo: false })
                .eq('id', id);

            // Si se desea eliminación física, usar:
            // const { error } = await supabase.from('servicios').delete().eq('id', id);

            return !error;
        } catch (error) {
            console.error('Error eliminando servicio:', error);
            return false;
        }
    }

    // BARBEROS
    static async getBarberos() {
        try {
            // Optimización de consulta: uso de inner joins con alias
            const { data, error } = await supabase
                .from('barberos')
                .select(`
                    *,
                    usuario:usuarios(id, email, nombre, telefono)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo barberos:', error);
            return [];
        }
    }
    
    static async getUsuariosDisponiblesParaBarbero() {
        try {
            const barberos = await this.getBarberos();
            const barberoUserIds = barberos.map(b => b.usuario_id);
            
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nombre, email');
            
            if (error) throw error;
            
            // Retornar solo usuarios que NO son ya barberos.
            return data.filter(u => !barberoUserIds.includes(u.id));

        } catch (error) {
            console.error('Error obteniendo usuarios disponibles:', error);
            return [];
        }
    }

    static async saveBarbero(barberoData) {
        try {
            // Validación básica
            if (!barberoData.horario_inicio || !barberoData.horario_fin || !barberoData.usuario_id) {
                throw new Error('Usuario y horarios son requeridos');
            }
            
            // Lógica para verificar que horario_inicio < horario_fin
            if (barberoData.horario_inicio >= barberoData.horario_fin) {
                throw new Error('El horario de inicio debe ser anterior al horario de fin.');
            }


            const barberoPayload = {
                usuario_id: barberoData.usuario_id,
                horario_inicio: barberoData.horario_inicio,
                horario_fin: barberoData.horario_fin,
                telefono: barberoData.telefono,
                descripcion: barberoData.descripcion,
                activo: barberoData.activo !== false,
                especialidades: barberoData.especialidades || []
            };

            if (barberoData.id) {
                const { error } = await supabase
                    .from('barberos')
                    .update(barberoPayload)
                    .eq('id', barberoData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('barberos')
                    .insert([barberoPayload]);
                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error guardando barbero:', error);
            throw error;
        }
    }

    static async deleteBarbero(id) {
        try {
            const { error } = await supabase
                .from('barberos')
                .delete()
                .eq('id', id);
            return !error;
        } catch (error) {
            console.error('Error eliminando barbero:', error);
            return false;
        }
    }

    // CITAS
    static async getCitas(filtros = {}) {
        try {
            // Optimización de consulta: uso de inner joins con alias y selección de columnas específicas
            let query = supabase
                .from('citas')
                .select(`
                    id,
                    cliente_id,
                    servicio_id,
                    barbero_id,
                    fecha_hora,
                    estado_asignacion,
                    estado_pago,
                    metodo_pago,
                    servicio:servicios(nombre, duracion, precio),
                    cliente:usuarios!cliente_id(nombre, email, telefono),
                    barbero:barberos(telefono, usuario:usuarios(nombre, id))
                `)
                .order('fecha_hora', { ascending: false });

            // Aplicar filtros
            if (filtros.fecha) {
                const fechaInicio = new Date(filtros.fecha);
                const fechaFin = new Date(filtros.fecha);
                fechaFin.setDate(fechaFin.getDate() + 1);
                
                query = query.gte('fecha_hora', fechaInicio.toISOString())
                            .lt('fecha_hora', fechaFin.toISOString());
            }

            if (filtros.estado) {
                query = query.eq('estado_asignacion', filtros.estado);
            }

            if (filtros.barbero_id) {
                const user = DataManager.getCurrentUser();
                // Si el filtro es para el barbero actual (usando su ID de usuario)
                if (user && user.rol === 'BARBERO' && filtros.barbero_id === user.id) {
                     const barberos = await this.getBarberos();
                     const miBarbero = barberos.find(b => b.usuario_id === user.id);
                     if (miBarbero) {
                        query = query.eq('barbero_id', miBarbero.id);
                     } else {
                        // Si el usuario es barbero pero no está en la tabla barberos (error de setup)
                        query = query.eq('barbero_id', 'invalid-uuid-to-prevent-leak');
                     }
                } else {
                    // Si el ID es el ID de la tabla 'barberos' (ADMIN usando filtro)
                    query = query.eq('barbero_id', filtros.barbero_id);
                }
            }

            if (filtros.cliente_id) {
                query = query.eq('cliente_id', filtros.cliente_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo citas:', error);
            return [];
        }
    }

    static async saveCita(cita) {
        try {
            // Validación de datos
            if (!cita.servicio_id || !cita.fecha_hora || !cita.cliente_id) {
                throw new Error('Servicio, fecha/hora y cliente son requeridos');
            }

            // Lógica de disponibilidad (doble chequeo)
            if (cita.barbero_id) {
                const servicios = await this.getServicios();
                const servicio = servicios.find(s => s.id === cita.servicio_id);
                const duracion = servicio?.duracion || 30; // 30 min por defecto
                
                const isAvailable = await this.estaDisponible(
                    cita.barbero_id, 
                    cita.fecha_hora, 
                    duracion, 
                    cita.id 
                );

                if (!isAvailable) {
                    throw new Error('El barbero no está disponible en este horario. ¡Superposición detectada!');
                }
                // Asegurar el estado si se asigna el barbero manualmente/automáticamente
                if (!cita.id || cita.estado_asignacion === 'PENDIENTE') {
                    cita.estado_asignacion = 'ASIGNADO';
                }
            } else if (!cita.id) {
                cita.estado_asignacion = 'PENDIENTE';
            }
            
            // Nota del DBA: Eliminación de campos redundantes/antiguos antes de guardar
            const cleanCita = { ...cita };
            delete cleanCita.motivo_cancelacion; 

            if (cleanCita.id) {
                const { error } = await supabase
                    .from('citas')
                    .update(cleanCita)
                    .eq('id', cleanCita.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('citas')
                    .insert([cleanCita]);
                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error guardando cita:', error);
            throw error;
        }
    }

    static async deleteCita(id) {
        try {
            const { error } = await supabase
                .from('citas')
                .delete()
                .eq('id', id);
            return !error;
        } catch (error) {
            console.error('Error eliminando cita:', error);
            return false;
        }
    }

    // LÓGICA DE DISPONIBILIDAD (Corregida L1)
    static async estaDisponible(barberoId, fechaHoraStr, duracionMinutos, citaAExcluirId = null) {
        try {
            const nuevaCitaInicio = new Date(fechaHoraStr);
            const nuevaCitaFin = new Date(nuevaCitaInicio.getTime() + duracionMinutos * 60000);
            
            const barberos = await DataManager.getBarberos();
            const barbero = barberos.find(b => b.id === barberoId);

            if (!barbero) return false;

            // 1. Verificar Horario de Trabajo del Barbero
            const [hInicio, mInicio] = barbero.horario_inicio.split(':').map(Number);
            const [hFin, mFin] = barbero.horario_fin.split(':').map(Number);
            
            const horaInicioBarbero = new Date(nuevaCitaInicio);
            horaInicioBarbero.setHours(hInicio, mInicio, 0, 0);
            
            const horaFinBarbero = new Date(nuevaCitaInicio);
            horaFinBarbero.setHours(hFin, mFin, 0, 0);

            // Si la cita empieza antes del inicio O termina después del fin del horario del barbero
            if (nuevaCitaInicio < horaInicioBarbero || nuevaCitaFin > horaFinBarbero) {
                return false; 
            }

            // 2. Verificar Superposición con Citas Existentes
            const diaInicio = nuevaCitaInicio.toISOString().split('T')[0];
            const diaFin = new Date(nuevaCitaInicio);
            diaFin.setDate(diaFin.getDate() + 1);
            
            let query = supabase
                .from('citas')
                .select('id, fecha_hora, servicio:servicios(duracion)')
                .eq('barbero_id', barberoId)
                .in('estado_asignacion', ['PENDIENTE', 'ASIGNADO'])
                .gte('fecha_hora', diaInicio + 'T00:00:00.000Z')
                .lt('fecha_hora', diaFin.toISOString().split('T')[0] + 'T00:00:00.000Z');

            if (citaAExcluirId) {
                query = query.neq('id', citaAExcluirId);
            }
                
            const { data: citasOcupadas, error } = await query;
            
            if (error) throw error;
            
            const estaOcupado = citasOcupadas.some(citaExistente => {
                const inicioCitaExistente = new Date(citaExistente.fecha_hora);
                // Usar la duración almacenada en el join, o 30 si no está disponible (L3 fix)
                const duracionExistente = citaExistente.servicio?.[0]?.duracion || 30; 
                const finCitaExistente = new Date(inicioCitaExistente.getTime() + duracionExistente * 60000);
                
                // Lógica de Solapamiento: [A, B) y [C, D) se solapan si A < D y B > C
                const A = nuevaCitaInicio.getTime();
                const B = nuevaCitaFin.getTime();
                const C = inicioCitaExistente.getTime();
                const D = finCitaExistente.getTime();

                return (A < D && B > C);
            });

            return !estaOcupado;
        } catch (error) {
            console.error('Error verificando disponibilidad:', error);
            return false; 
        }
    }


    // HORARIOS DISPONIBLES (Genera slots para la UI de reserva - Corregida L1)
    static async getHorariosDisponibles(fechaStr, duracionMinutos, barberoId = null) {
        try {
            const fecha = new Date(fechaStr);
            const hoy = new Date();
            const esHoy = fecha.toDateString() === hoy.toDateString();
            
            // 1. Obtener barberos y citas del día
            let barberosDisponibles = [];
            if (barberoId) {
                const barbero = (await this.getBarberos()).find(b => b.id === barberoId && b.activo);
                if (barbero) barberosDisponibles = [barbero];
            } else {
                barberosDisponibles = (await this.getBarberos()).filter(b => b.activo);
            }

            if (barberosDisponibles.length === 0) return [];
            
            const citasDelDia = await this.getCitas({ fecha: fechaStr });

            let slotsGlobales = new Set();
            
            // El intervalo base para generar slots es el MÍNIMO entre 15 minutos o la duración del servicio
            const intervaloBase = Math.min(15, duracionMinutos);

            for (const barbero of barberosDisponibles) {
                const [hInicio, mInicio] = barbero.horario_inicio.split(':').map(Number);
                const [hFin, mFin] = barbero.horario_fin.split(':').map(Number);

                let horaActual = new Date(fecha);
                horaActual.setHours(hInicio, mInicio, 0, 0);
                
                let horaFinBarbero = new Date(fecha);
                horaFinBarbero.setHours(hFin, mFin, 0, 0);

                // Ajuste para el día de hoy: empezar 30 min después de ahora, redondeado al intervalo más cercano
                if (esHoy) {
                    const ahora = new Date();
                    let inicioProximoSlot = new Date(ahora.getTime() + 30 * 60000); // 30 min de colchón
                    
                    // Redondear al siguiente intervalo base
                    const minutosRedondeados = Math.ceil(inicioProximoSlot.getMinutes() / intervaloBase) * intervaloBase;
                    inicioProximoSlot.setMinutes(minutosRedondeados, 0, 0); 
                    
                    if (horaActual < inicioProximoSlot) {
                        horaActual = inicioProximoSlot;
                    }
                }
                
                // Asegurar que la hora de inicio esté dentro del horario del barbero
                if (horaActual < horaInicioBarbero) {
                    horaActual = horaInicioBarbero;
                }

                // Iterar slots: Avanzar en pasos de 15 minutos, pero asegurar que el servicio quepa.
                while (horaActual.getTime() + duracionMinutos * 60000 <= horaFinBarbero.getTime()) {
                    const horaSlot = horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
                    const finSlot = new Date(horaActual.getTime() + duracionMinutos * 60000);
                    
                    let isOccupied = false;
                    
                    // 3. Chequeo de Solapamiento con Citas Existentes
                    const citasBarbero = citasDelDia.filter(c => c.barbero_id === barbero.id);
                    
                    for (const citaExistente of citasBarbero) {
                        const inicioCitaExistente = new Date(citaExistente.fecha_hora);
                        // Usar la duración almacenada en el join, o 30 si no está disponible (L3 fix)
                        const duracionExistente = citaExistente.servicio?.[0]?.duracion || 30; 
                        const finCitaExistente = new Date(inicioCitaExistente.getTime() + duracionExistente * 60000);
                        
                        const A = horaActual.getTime();
                        const B = finSlot.getTime();
                        const C = inicioCitaExistente.getTime();
                        const D = finCitaExistente.getTime();

                        if ((A < D && B > C)) {
                            isOccupied = true;
                            break;
                        }
                    }

                    if (!isOccupied) {
                        slotsGlobales.add(horaSlot);
                    }

                    // Avanzar al siguiente punto de inicio viable (intervaloBase minutos)
                    horaActual = new Date(horaActual.getTime() + intervaloBase * 60000); 
                }
            }

            // Convertir el Set a Array y ordenar
            const horariosArray = Array.from(slotsGlobales).sort();
            return horariosArray;

        } catch (error) {
            console.error('Error calculando horarios disponibles:', error);
            return [];
        }
    }


    // ASIGNACIÓN AUTOMÁTICA (Implementación simple usando la nueva lógica)
    static async asignarBarberoAutomatico(citaId) {
        
        try {
            // Obtener la cita recién creada o pendiente.
            const citasExistentes = await this.getCitas();
            const cita = citasExistentes.find(c => c.id === citaId);
            
            if (!cita || cita.barbero_id) {
                return null;
            }
            
            // Necesitamos obtener el servicio completo para la duración
            const servicios = await this.getServicios();
            const servicio = servicios.find(s => s.id === cita.servicio_id);

            const duracion = servicio?.duracion || 30;

            const barberos = await this.getBarberos();
            
            // 1. Filtrar barberos realmente disponibles
            const barberosDisponibles = [];
            for (const barbero of barberos.filter(b => b.activo)) {
                // Se pasa la cita.id para excluir la cita actual del chequeo de disponibilidad (es una edición/actualización)
                const isAvailable = await this.estaDisponible(barbero.id, cita.fecha_hora, duracion, cita.id);
                if (isAvailable) {
                    barberosDisponibles.push(barbero);
                }
            }

            if (barberosDisponibles.length === 0) {
                return null;
            }

            // 2. Asignar al barbero con menos citas en esa fecha (balanceo de carga simple)
            const fechaCita = new Date(cita.fecha_hora).toDateString();
            
            // Contar citas en memoria para el balanceo
            const citasHoy = citasExistentes.filter(c => 
                c.barbero_id && 
                c.estado_asignacion !== 'COMPLETADO' && 
                c.estado_asignacion !== 'CANCELADO' &&
                new Date(c.fecha_hora).toDateString() === fechaCita
            );
            
            let barberoAsignado = null;
            let minCitas = Infinity;

            for (const barbero of barberosDisponibles) {
                const citasDelBarberoHoy = citasHoy.filter(c => c.barbero_id === barbero.id).length;

                if (citasDelBarberoHoy < minCitas) {
                    minCitas = citasDelBarberoHoy;
                    barberoAsignado = barbero;
                }
            }
            
            if (barberoAsignado) {
                 await this.saveCita({
                    id: citaId, // Asegurarse de actualizar el registro existente
                    cliente_id: cita.cliente_id, 
                    servicio_id: cita.servicio_id, 
                    fecha_hora: cita.fecha_hora, 
                    barbero_id: barberoAsignado.id,
                    estado_asignacion: 'ASIGNADO'
                });
                return barberoAsignado;
            }

            return null;
        } catch (error) {
            console.error('Error en asignación automática:', error);
            return null;
        }
    }

    // INVENTARIO
    static async getInventario() {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .order('nombre');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo inventario:', error);
            return [];
        }
    }

    static async saveInventario(item) {
        try {
            const validation = FormValidator.validateForm(
                item,
                {
                    nombre: { required: true, minLength: 2 },
                    cantidad: { required: true, number: true, min: 0 },
                    minimo: { required: true, number: true, min: 1 },
                    precio: { required: true, number: true, min: 0 }
                }
            );
            
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            if (item.id) {
                const { error } = await supabase
                    .from('inventario')
                    .update(item)
                    .eq('id', item.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('inventario')
                    .insert([item]);
                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error guardando inventario:', error);
            throw error;
        }
    }

    static async deleteInventario(id) {
        try {
            const { error } = await supabase
                .from('inventario')
                .delete()
                .eq('id', id);
            return !error;
        } catch (error) {
            console.error('Error eliminando inventario:', error);
            return false;
        }
    }

    // COMPRAS (PRODUCTOS VENDIDOS)
    static async getCompras(filtros = {}) {
        try {
            let query = supabase
                .from('compras')
                .select(`
                    id,
                    monto_total,
                    metodo_pago,
                    estado_pago,
                    created_at,
                    detalles_productos,
                    cliente:usuarios(id, nombre, email, telefono)
                `)
                .order('created_at', { ascending: false });

            if (filtros.cliente_id) {
                query = query.eq('cliente_id', filtros.cliente_id);
            }
            if (filtros.estado_pago) {
                query = query.eq('estado_pago', filtros.estado_pago);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo compras:', error);
            return [];
        }
    }

    static async saveCompra(compra) {
        try {
            // Asegurar que solo se envían los campos necesarios y válidos
            const compraPayload = {
                cliente_id: compra.cliente_id,
                monto_total: compra.monto_total,
                metodo_pago: compra.metodo_pago,
                estado_pago: compra.estado_pago,
                detalles_productos: compra.detalles_productos, // Array de objetos JSONB
            };

            if (compra.id) {
                 const { error } = await supabase
                    .from('compras')
                    .update(compraPayload)
                    .eq('id', compra.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('compras')
                    .insert([compraPayload]);
                if (error) throw error;
            }
            
            return true;
        } catch (error) {
            console.error('Error guardando compra:', error);
            throw error;
        }
    }

    // CARRITO (Usando SimpleStorage, no DB)
    static getCarrito() {
        try {
            const stored = SimpleStorage.get('carrito');
            return stored || [];
        } catch {
            return [];
        }
    }

    static saveCarrito(carrito) {
        return SimpleStorage.set('carrito', carrito);
    }

    static limpiarCarrito() {
        return SimpleStorage.remove('carrito');
    }

    // NOTIFICACIONES
    static async getNotificaciones(usuarioId) {
        try {
            const { data, error } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo notificaciones:', error);
            return [];
        }
    }

    static async crearNotificacion(notificacion) {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .insert([notificacion]);
            return !error;
        } catch (error) {
            console.error('Error creando notificación:', error);
            return false;
        }
    }

    // ESTADÍSTICAS
    static async getEstadisticas() {
        try {
            const [servicios, citas, barberos, inventario] = await Promise.all([
                this.getServicios(),
                this.getCitas(),
                this.getBarberos(),
                this.getInventario()
            ]);

            const hoy = new Date();
            const citasHoy = citas.filter(c => {
                const fechaCita = new Date(c.fecha_hora);
                return fechaCita.toDateString() === hoy.toDateString();
            });

            const citasEsteMes = citas.filter(c => {
                const fechaCita = new Date(c.fecha_hora);
                return fechaCita.getMonth() === hoy.getMonth() && 
                       fechaCita.getFullYear() === hoy.getFullYear();
            });

            const ingresosEsteMes = citasEsteMes
                .filter(c => c.estado_asignacion === 'COMPLETADO')
                .reduce((sum, c) => sum + (c.servicio?.[0]?.precio || 0), 0); // L3 fix

            const productosBajoStock = inventario.filter(p => p.cantidad <= p.minimo);

            return {
                totalServicios: servicios.length,
                totalCitas: citas.length,
                citasHoy: citasHoy.length,
                citasEsteMes: citasEsteMes.length,
                barberosActivos: barberos.filter(b => b.activo).length, // L3 fix: Conteo ahora es correcto
                productosBajoStock: productosBajoStock.length,
                ingresosEsteMes: ingresosEsteMes,
                citasPorEstado: {
                    pendiente: citas.filter(c => c.estado_asignacion === 'PENDIENTE').length,
                    asignado: citas.filter(c => c.estado_asignacion === 'ASIGNADO').length,
                    completado: citas.filter(c => c.estado_asignacion === 'COMPLETADO').length,
                    cancelado: citas.filter(c => c.estado_asignacion === 'CANCELADO').length
                }
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {};
        }
    }
}