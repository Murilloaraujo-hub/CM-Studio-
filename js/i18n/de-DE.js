/* CM Studio — i18n/de-DE.js — Deutsch (Deutschland).
   Inclui a variante suíça de-CH (sem "ß", conforme a ortografia suíça). */
CM.i18n.register('de-DE', {
  meta: { name: 'Alemão (Alemanha)', nativeName: 'Deutsch (Deutschland)', intl: 'de-DE', suggestions: 'own' },
  titles: {
    summary: 'Ziel', experience: 'Berufserfahrung', education: 'Ausbildung', courses: 'Weiterbildung',
    certifications: 'Zertifikate', skills: 'Kenntnisse', techSkills: 'Fachkenntnisse',
    computerSkills: 'EDV-Kenntnisse', softSkills: 'Persönliche Stärken', languages: 'Sprachkenntnisse',
    projects: 'Projekte', schoolProjects: 'Schulprojekte', scienceFairs: 'Wissenschaftswettbewerbe',
    olympiads: 'Schülerwettbewerbe und Olympiaden', clubs: 'AGs und Lerngruppen', studentOrgs: 'Schülervertretung und Gremien',
    extracurricular: 'Außerschulisches Engagement', volunteer: 'Ehrenamtliches Engagement', subjects: 'Interessensfächer',
    monitoring: 'Tutorentätigkeit', research: 'Forschungsprojekte', publications: 'Publikationen',
    presentations: 'Vorträge und Tagungen', awards: 'Auszeichnungen', scholarships: 'Stipendien',
    researchInterests: 'Forschungsinteressen', interests: 'Interessen', links: 'Portfolio und Links',
    additional: 'Sonstiges', references: 'Referenzen', custom: 'Weitere Angaben',
    motivation: 'Motivation', selfPR: 'Persönliches Profil', personalWishes: 'Anmerkungen',
    contact: 'Kontakt', personalData: 'Persönliche Daten',
    professionalSummary: 'Profil', coursesCertifications: 'Weiterbildung und Zertifikate',
    careerObjective: 'Berufsziel', schoolEducation: 'Schulbildung',
    schoolPersonalProjects: 'Schul- und Privatprojekte', skillsGeneral: 'Kenntnisse und Fähigkeiten', portfolio: 'Portfolio',
    availability: 'Verfügbarkeit und Sonstiges', schoolObjective: 'Ziel', freeCourses: 'Kurse',
    academicObjective: 'Studienziel', academicEducation: 'Studium und Ausbildung', projectsResearch: 'Projekte und Forschung',
    awardsScholarships: 'Auszeichnungen und Stipendien', academicLinks: 'Akademische Profile und Links',
    academicPersonalProjects: 'Studien- und Privatprojekte', experienceIfAny: 'Praktische Erfahrung',
    personalPresentation: 'Profil', presentation: 'Profil', volunteerExperience: 'Ehrenamtliches Engagement',
    professionalExperienceIfAny: 'Berufserfahrung', academicSummary: 'Wissenschaftliches Profil',
    academicLinksShort: 'Akademische Links', keySkills: 'Kernkompetenzen', profile: 'Profil',
    researchExperience: 'Forschungserfahrung', teaching: 'Lehrerfahrung', honors: 'Auszeichnungen',
    conferences: 'Konferenzbeiträge', grants: 'Stipendien und Förderungen', digitalSkills: 'Digitale Kompetenzen',
    trainings: 'Fort- und Weiterbildung', referees: 'Referenzen', activities: 'Aktivitäten', researchStatement: 'Forschungsschwerpunkt'
  },
  labels: {
    photo: 'Foto',
    present: 'heute', expected: 'voraussichtlich', inProgress: 'laufend', contact: 'Kontakt', email: 'E-Mail',
    phone: 'Telefon', location: 'Wohnort', linkedin: 'LinkedIn', github: 'GitHub', website: 'Website',
    birthDate: 'Geburtsdatum', nationality: 'Staatsangehörigkeit', address: 'Anschrift',
    workPermit: 'Arbeitserlaubnis', drivingLicense: 'Führerschein', page: 'Seite {n} von {t}',
    placeDate: 'Ort, Datum', signature: 'Unterschrift', referencesOnRequest: 'Referenzen auf Anfrage.',
    privacyConsent: 'Ich willige in die Verarbeitung meiner personenbezogenen Daten ausschließlich zum Zweck der Bewerbung ein.',
    workload: 'Umfang', end: 'Ende'
  },
  levels: { basic: 'Grundkenntnisse', intermediate: 'Gute Kenntnisse', advanced: 'Sehr gute Kenntnisse', fluent: 'Verhandlungssicher', native: 'Muttersprache' },
  status: { cursando: 'laufend', trancado: 'unterbrochen', interrompido: 'abgebrochen', concluido: 'abgeschlossen' },
  docTitles: { cv: 'Lebenslauf', resume: 'Lebenslauf', academicCV: 'Wissenschaftlicher Lebenslauf' },
  letter: {
    salutation: 'Sehr geehrte Damen und Herren,', closing: 'Mit freundlichen Grüßen', subjectLabel: '', enclosures: 'Anlagen: Lebenslauf, Zeugnisse',
    coverTitle: 'Anschreiben', motivationTitle: 'Motivationsschreiben', defaultSubject: 'Bewerbung als [Position]'
  }
});

/* Alemão suíço: mesma terminologia, mas sem "ß" (ortografia suíça usa "ss"). */
CM.i18n.derive('de-CH', 'de-DE', {
  meta: { name: 'Alemão (Suíça)', nativeName: 'Deutsch (Schweiz)', intl: 'de-CH', suggestions: 'base' },
  labels: { location: 'Wohnort', workPermit: 'Arbeitsbewilligung' },
  docTitles: { cv: 'Lebenslauf', resume: 'Lebenslauf' }
}, function (s) { return s.replace(/ß/g, 'ss'); });
