# Guía de Modales - Planix

## 🚫 IMPORTANTE: Nunca usar alert(), confirm(), prompt()

**ESTÁ PROHIBIDO** usar las funciones nativas del navegador:
- ❌ `alert()`
- ❌ `confirm()`
- ❌ `prompt()`

En su lugar, usar los modales personalizados del sistema.

## 📋 Modales Disponibles

### 1. AlertModal
Para mostrar mensajes informativos, advertencias o errores.

```typescript
import { useModals } from '@/components/Modal'

const { showAlert } = useModals()

// Tipos disponibles: 'info' | 'warning' | 'error' | 'success'
showAlert('Título', 'Mensaje del modal', 'error')
```

### 2. ConfirmModal
Para pedir confirmación al usuario antes de ejecutar una acción destructiva.

```typescript
const { showConfirm } = useModals()

showConfirm(
    'Eliminar Viaje',
    '¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.',
    () => {
        // Acción a ejecutar si confirma
        await deleteTrip(tripId)
    },
    'danger' // 'warning' | 'danger'
)
```

### 3. PromptModal
Para pedir entrada de texto al usuario.

```typescript
const { showPrompt } = useModals()

showPrompt(
    'Nueva Versión',
    'Ingresa el nombre para el nuevo plan:',
    (name) => {
        // Acción a ejecutar con el valor ingresado
        createVersion(name)
    },
    'Ej: Plan Alternativo', // placeholder
    'Plan 2' // valor por defecto
)
```

## 🎨 Características de los Modales

### ✨ Comportamiento
- **Cierre al hacer click en el fondo**: Los modales se cierran automáticamente al hacer click en el fondo oscurecido (backdrop)
- **Prevención de cierre accidental**: Los formularios dentro de los modales previenen que se cierren al hacer click
- **Accesibilidad**: Navegación con teclado y focus management
- **Responsive**: Adaptados para móviles y desktop

### 🎭 Estilos
- **Diseño consistente**: Todos usan la clase `glass-card`
- **Tipos con colores**: Cada tipo tiene su esquema de colores
- **Animaciones suaves**: Transiciones elegantes
- **Iconos consistentes**: Usan Lucide React icons

## 🛠️ Uso en Componentes

### Paso 1: Importar el hook
```typescript
import { useModals } from '@/components/Modal'
```

### Paso 2: Usar en el componente
```typescript
export default function MiComponente() {
    const { showAlert, showConfirm, showPrompt } = useModals()
    
    const handleDelete = () => {
        showConfirm(
            'Confirmar Eliminación',
            '¿Eliminar este elemento?',
            async () => {
                await deleteItem()
                // El modal se cierra automáticamente
            },
            'danger'
        )
    }
    
    return (
        <button onClick={handleDelete}>
            Eliminar
        </button>
    )
}
```

## 📁 Estructura de Archivos

```
src/components/
├── Modal.tsx          # Componentes de modales y hook
└── icons.tsx          # Iconos reutilizables

src/pages/
├── Dashboard.tsx       # Ejemplo de uso
├── TripDetails.tsx     # Ejemplo de uso
└── ...

src/components/
├── ItineraryItemCard.tsx  # Ejemplo de uso
├── InboxDrawer.tsx        # Ejemplo de uso
└── ...
```

## 🎯 Mejores Prácticas

### ✅ Buenas prácticas
1. **Siempre usar el hook**: `const { showAlert } = useModals()`
2. **Mensajes descriptivos**: Títulos claros y mensajes específicos
3. **Tipos apropiados**: Usar 'danger' para acciones destructivas
4. **Manejo de errores**: Siempre mostrar errores con `showAlert`
5. **Cierre automático**: Los modales se cierran solos después de la acción

### ❌ Malas prácticas
1. **NO usar alert/confirm/prompt nativos**
2. **No olvidar manejar el estado**: Los modales se cierran automáticamente
3. **No anidar modales**: Evitar abrir un modal dentro de otro
4. **No bloquear la UI**: Los modales ya tienen backdrop

## 🔧 Tipos TypeScript

```typescript
type ModalType = 'info' | 'warning' | 'error' | 'success'
type ConfirmType = 'warning' | 'danger'

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: ModalType
}

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: ConfirmType
}
```

## 🎨 Clases CSS

Los modales usan las siguientes clases CSS:
- `.modal-overlay`: Fondo oscurecido
- `.modal-card`: Contenedor principal
- `.modal-card--sm`: Tamaño pequeño
- `.modal-header`: Cabecera con título y cierre
- `.modal-body`: Contenido del modal
- `.modal-actions`: Botones de acción
- `.btn-close`: Botón de cierre (X)

## 🚀 Ejemplos de Uso

Ver los siguientes archivos para ejemplos reales:
- `src/pages/Dashboard.tsx` - Confirmación para eliminar viajes
- `src/pages/TripDetails.tsx` - Prompt para crear versiones
- `src/components/ItineraryItemCard.tsx` - Confirmación para eliminar documentos
- `src/components/InboxDrawer.tsx` - Alertas para errores

---

**Recuerda**: Una mejor experiencia de usuario se logra con modales consistentes y bien diseñados. 🎉
