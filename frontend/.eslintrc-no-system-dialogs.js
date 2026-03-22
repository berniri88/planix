module.exports = {
  rules: {
    'no-alert': 'error',
    'no-restricted-syntax': ['error', {
      restricted: ['confirm(', 'prompt('],
      message: 'Usa los modales personalizados de useModals() en lugar de las funciones nativas del navegador. Ver MODALES_GUIDE.md'
    }]
  }
}
