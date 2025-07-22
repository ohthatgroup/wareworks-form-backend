// Static translations - no loading delay, bundled with app
export const translations = {
  en: {
    // Step titles
    'steps.personal_info.title': 'Personal Information',
    'steps.contact.title': 'Contact Details', 
    'steps.citizenship.title': 'Work Authorization',
    'steps.position.title': 'Position & Experience',
    'steps.availability.title': 'Availability',
    'steps.education_employment.title': 'Education & Employment',
    'steps.documents.title': 'Documents',
    'steps.review.title': 'Review & Submit',

    // Personal Information
    'personal_info.legal_first_name': 'Legal First Name',
    'personal_info.middle_initial': 'Middle Initial',
    'personal_info.legal_last_name': 'Legal Last Name',
    'personal_info.other_last_names': 'Other Last Names Used',
    'personal_info.date_of_birth': 'Date of Birth',
    'personal_info.social_security_number': 'Social Security Number',
    'personal_info.other_names_placeholder': 'Any previous or maiden names',
    'personal_info.ssn_placeholder': 'XXX-XX-XXXX',

    // Contact Information
    'contact_info.street_address': 'Street Address',
    'contact_info.apartment_number': 'Apartment #',
    'contact_info.city': 'City',
    'contact_info.state': 'State',
    'contact_info.zip_code': 'ZIP Code',
    'contact_info.primary_phone': 'Primary Phone Number',
    'contact_info.secondary_phone': 'Secondary Phone Number',
    'contact_info.email': 'Email Address',
    'contact_info.emergency_contact.title': 'Emergency Contact',
    'contact_info.emergency_contact.name': 'Emergency Contact Name',
    'contact_info.emergency_contact.phone': 'Emergency Contact Phone',
    'contact_info.emergency_contact.relationship': 'Relationship',

    // Navigation
    'navigation.previous': 'Previous',
    'navigation.next': 'Next',
    'navigation.submit': 'Submit Application',
    'navigation.submitting': 'Submitting...',

    // Common
    'common.yes': 'Yes',
    'common.no': 'No',
  },
  es: {
    // Step titles
    'steps.personal_info.title': 'Información Personal',
    'steps.contact.title': 'Detalles de Contacto',
    'steps.citizenship.title': 'Autorización de Trabajo', 
    'steps.position.title': 'Posición y Experiencia',
    'steps.availability.title': 'Disponibilidad',
    'steps.education_employment.title': 'Educación y Empleo',
    'steps.documents.title': 'Documentos',
    'steps.review.title': 'Revisar y Enviar',

    // Personal Information
    'personal_info.legal_first_name': 'Nombre Legal',
    'personal_info.middle_initial': 'Inicial del Segundo Nombre',
    'personal_info.legal_last_name': 'Apellido Legal',
    'personal_info.other_last_names': 'Otros Apellidos Usados',
    'personal_info.date_of_birth': 'Fecha de Nacimiento',
    'personal_info.social_security_number': 'Número de Seguro Social',
    'personal_info.other_names_placeholder': 'Cualquier nombre anterior o de soltera',
    'personal_info.ssn_placeholder': 'XXX-XX-XXXX',

    // Contact Information
    'contact_info.street_address': 'Dirección',
    'contact_info.apartment_number': 'Apartamento #',
    'contact_info.city': 'Ciudad',
    'contact_info.state': 'Estado',
    'contact_info.zip_code': 'Código Postal',
    'contact_info.primary_phone': 'Número de Teléfono Primario',
    'contact_info.secondary_phone': 'Número de Teléfono Secundario',
    'contact_info.email': 'Correo Electrónico',
    'contact_info.emergency_contact.title': 'Contacto de Emergencia',
    'contact_info.emergency_contact.name': 'Nombre de Contacto de Emergencia',
    'contact_info.emergency_contact.phone': 'Teléfono de Contacto de Emergencia',
    'contact_info.emergency_contact.relationship': 'Relación',

    // Navigation
    'navigation.previous': 'Anterior',
    'navigation.next': 'Siguiente',
    'navigation.submit': 'Enviar Solicitud',
    'navigation.submitting': 'Enviando...',

    // Common
    'common.yes': 'Sí',
    'common.no': 'No',
  }
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Language = 'en' | 'es';