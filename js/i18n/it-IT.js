/* CM Studio — i18n/it-IT.js — Italiano (Italia), com variante it-CH. */
CM.i18n.register('it-IT', {
  meta: { name: 'Italiano (Itália)', nativeName: 'Italiano (Italia)', intl: 'it-IT', suggestions: 'own' },
  titles: {
    summary: 'Obiettivo', experience: 'Esperienza professionale', education: 'Istruzione e formazione', courses: 'Corsi',
    certifications: 'Certificazioni', skills: 'Competenze', techSkills: 'Competenze tecniche',
    computerSkills: 'Competenze informatiche', softSkills: 'Competenze personali', languages: 'Lingue',
    projects: 'Progetti', schoolProjects: 'Progetti scolastici', scienceFairs: 'Fiere della scienza',
    olympiads: 'Olimpiadi e gare', clubs: 'Club e gruppi di studio', studentOrgs: 'Rappresentanza studentesca',
    extracurricular: 'Attività extrascolastiche', volunteer: 'Volontariato', subjects: 'Materie di interesse',
    monitoring: 'Tutorato', research: 'Progetti di ricerca', publications: 'Pubblicazioni',
    presentations: 'Interventi e convegni', awards: 'Premi e riconoscimenti', scholarships: 'Borse di studio',
    researchInterests: 'Interessi di ricerca', interests: 'Interessi', links: 'Portfolio e link',
    additional: 'Ulteriori informazioni', references: 'Referenze', custom: 'Sezione personalizzata',
    motivation: 'Motivazione', selfPR: 'Presentazione personale', personalWishes: 'Note',
    contact: 'Contatti', personalData: 'Dati personali',
    professionalSummary: 'Profilo professionale', coursesCertifications: 'Corsi e certificazioni',
    careerObjective: 'Obiettivo professionale', schoolEducation: 'Istruzione',
    schoolPersonalProjects: 'Progetti scolastici e personali', skillsGeneral: 'Competenze', portfolio: 'Portfolio',
    availability: 'Disponibilità e ulteriori informazioni', schoolObjective: 'Obiettivo', freeCourses: 'Corsi',
    academicObjective: 'Obiettivo accademico', academicEducation: 'Formazione accademica', projectsResearch: 'Progetti e ricerca',
    awardsScholarships: 'Premi e borse di studio', academicLinks: 'Profili accademici e link',
    academicPersonalProjects: 'Progetti accademici e personali', experienceIfAny: 'Esperienza',
    personalPresentation: 'Presentazione', presentation: 'Presentazione', volunteerExperience: 'Volontariato',
    professionalExperienceIfAny: 'Esperienza professionale', academicSummary: 'Profilo di ricerca',
    academicLinksShort: 'Link accademici', keySkills: 'Competenze chiave', profile: 'Profilo',
    researchExperience: 'Esperienza di ricerca', teaching: 'Esperienza didattica', honors: 'Premi e riconoscimenti',
    conferences: 'Interventi a convegni', grants: 'Borse e finanziamenti', digitalSkills: 'Competenze digitali',
    trainings: 'Formazione professionale', referees: 'Referenze', activities: 'Attività', researchStatement: 'Linea di ricerca'
  },
  labels: {
    photo: 'Foto',
    present: 'oggi', expected: 'prevista', inProgress: 'in corso', contact: 'Contatti', email: 'E-mail',
    phone: 'Telefono', location: 'Località', linkedin: 'LinkedIn', github: 'GitHub', website: 'Sito web',
    birthDate: 'Data di nascita', nationality: 'Nazionalità', address: 'Indirizzo',
    workPermit: 'Permesso di lavoro', drivingLicense: 'Patente di guida', page: 'Pagina {n} di {t}',
    placeDate: 'Luogo e data', signature: 'Firma', referencesOnRequest: 'Referenze disponibili su richiesta.',
    privacyConsent: 'Autorizzo il trattamento dei miei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR) ai fini della selezione del personale.',
    workload: 'Durata', end: 'Fine'
  },
  levels: { basic: 'Base', intermediate: 'Intermedio', advanced: 'Avanzato', fluent: 'Fluente', native: 'Madrelingua' },
  status: { cursando: 'in corso', trancado: 'sospeso', interrompido: 'interrotto', concluido: 'conseguito' },
  docTitles: { cv: 'Curriculum vitae', resume: 'Curriculum vitae', academicCV: 'Curriculum vitae accademico' },
  letter: {
    salutation: 'Gentile Responsabile della selezione,', closing: 'Cordiali saluti,', subjectLabel: 'Oggetto:', enclosures: 'Allegato: curriculum vitae',
    coverTitle: 'Lettera di presentazione', motivationTitle: 'Lettera motivazionale', defaultSubject: 'Candidatura per la posizione di [posizione]'
  }
});

/* Italiano suíço: base italiana; termos suíços para autorização de trabalho. */
CM.i18n.derive('it-CH', 'it-IT', {
  meta: { name: 'Italiano (Suíça)', nativeName: 'Italiano (Svizzera)', intl: 'it-CH', suggestions: 'base' },
  labels: {
    workPermit: 'Permesso di lavoro',
    privacyConsent: 'Autorizzo il trattamento dei miei dati personali ai soli fini della selezione del personale.'
  }
});
