// ─────────────────────────────────────────────────────
// JACKOT — App-Wide Configuration
// Change values HERE instead of hunting through code
// ─────────────────────────────────────────────────────

module.exports = {

  app: {
    name:        process.env.APP_NAME || 'Jackot',
    version:     '1.0.0',
    description: 'The universal business platform',
    apiVersion:  'v1',
  },

  defaults: {
    currency:        'KES',
    currencySymbol:  'KSh',
    language:        'en',
    dateFormat:      'DD/MM/YYYY',
    timezone:        'Africa/Nairobi',
    itemsPerPage:    20,
    taxRate:         0.16,
    taxLabel:        'VAT',
  },

  theme: {
    primaryColor:    '#1D4ED8',
    accentColor:     '#0EA5E9',
    backgroundColor: '#F8FAFC',
    darkMode:        false,
  },

  limits: {
    freeMaxProjects:  999,
    freeMaxStorage:   500,
    sessionTimeout:   86400,
  },

  features: {
    aiHealthReport: true,
    offlineMode:    true,
    multiLanguage:  true,
    pdfExport:      true,
  },

  pagination: {
    defaultPage:  1,
    defaultLimit: 20,
    maxLimit:     100,
  },

};