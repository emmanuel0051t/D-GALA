// ========================================
// ALMACENAMIENTO Y UTILIDADES MEJORADAS (SimpleStorage, Notifier, Loader)
// ========================================
class SimpleStorage {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            if (!window._memoryStorage) window._memoryStorage = {};
            window._memoryStorage[key] = value;
            return true;
        }
    }

    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            if (window._memoryStorage) {
                return window._memoryStorage[key] || null;
            }
            return null;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            if (window._memoryStorage) {
                delete window._memoryStorage[key];
            }
        }
    }

    static clear() {
        try {
            localStorage.clear();
        } catch (e) {
            if (window._memoryStorage) {
                window._memoryStorage = {};
            }
        }
    }
}

class Notifier {
    static show(message, type = 'success', duration = 3000) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 z-50 slide-in`;
        notification.innerHTML = `
            <span class="text-2xl font-bold">${icons[type]}</span>
            <span class="font-medium">${message}</span>
            <button class="ml-4 text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            // Usar fadeOut antes de remover
            notification.classList.remove('slide-in');
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        return notification;
    }
    
    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 slide-in ${type === 'info' ? 'bg-navy text-white' : type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 2000);
    }
}

class Loader {
    static show(message = 'Cargando...') {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 fade-in';
            loader.innerHTML = `
                <div class="text-center bg-charcoal border border-gold rounded-xl p-8 max-w-sm w-full mx-4">
                    <div class="loader mx-auto mb-4"></div>
                    <p class="text-gold font-medium">${message}</p>
                    <div class="mt-4 progress-bar w-1/2 mx-auto"></div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        return loader;
    }
    
    static hide() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                if (loader.parentElement) {
                    loader.remove();
                }
            }, 300);
        }
    }
    
    static showProgress(percent, message = 'Procesando...') {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = this.show(message);
        }
        
        const progressBar = loader.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        const messageEl = loader.querySelector('p');
        if (messageEl && message) {
            messageEl.textContent = message;
        }
    }
}

// ========================================
// VALIDACIÓN DE FORMULARIOS
// ========================================
class FormValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validateRequired(value) {
        return value && value.toString().trim().length > 0;
    }

    static validatePhone(phone) {
        const re = /^\+?[\d\s-()]{8,}$/;
        return re.test(phone);
    }

    static validateNumber(value, min = 0, max = Infinity) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    static validateLength(value, min = 0, max = Infinity) {
        return value.length >= min && value.length <= max;
    }

    static validateDate(date) {
        return !isNaN(Date.parse(date));
    }

    static validateTime(time) {
        const re = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return re.test(time);
    }

    static validateForm(formData, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            
            if (rule.required && !this.validateRequired(value)) {
                errors[field] = `${this.getFieldLabel(field)} es requerido`;
                continue;
            }
            
            if (rule.email && value && !this.validateEmail(value)) {
                errors[field] = 'Email inválido';
                continue;
            }
            
            if (rule.phone && value && !this.validatePhone(value)) {
                errors[field] = 'Teléfono inválido';
                continue;
            }
            
            if (rule.number && value !== undefined && !this.validateNumber(value, rule.min, rule.max)) {
                errors[field] = `Debe ser un número entre ${rule.min} y ${rule.max}`;
                continue;
            }
            
            if (rule.minLength && value && !this.validateLength(value, rule.minLength)) {
                errors[field] = `Mínimo ${rule.minLength} caracteres`;
                continue;
            }
            
            if (rule.maxLength && value && !this.validateLength(value, 0, rule.maxLength)) {
                errors[field] = `Máximo ${rule.maxLength} caracteres`;
                continue;
            }
            
            if (rule.date && value && !this.validateDate(value)) {
                errors[field] = 'Fecha inválida';
                continue;
            }
            
            if (rule.time && value && !this.validateTime(value)) {
                errors[field] = 'Hora inválida';
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
    
    static getFieldLabel(field) {
        const labels = {
            'email': 'Email',
            'password': 'Contraseña',
            'nombre': 'Nombre',
            'telefono': 'Teléfono',
            'descripcion': 'Descripción',
            'precio': 'Precio',
            'duracion': 'Duración',
            'cantidad': 'Cantidad',
            'minimo': 'Mínimo',
            'servicio_id': 'Servicio',
            'fecha': 'Fecha',
            'hora': 'Hora'
        };
        
        return labels[field] || field;
    }
}