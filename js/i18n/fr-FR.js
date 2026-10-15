/* CM Studio — i18n/fr-FR.js — Français (France), com variantes fr-CA e fr-CH. */
CM.i18n.register('fr-FR', {
  meta: { name: 'Francês (França)', nativeName: 'Français (France)', intl: 'fr-FR', suggestions: 'own' },
  titles: {
    summary: 'Objectif', experience: 'Expérience professionnelle', education: 'Formation', courses: 'Formations complémentaires',
    certifications: 'Certifications', skills: 'Compétences', techSkills: 'Compétences techniques',
    computerSkills: 'Informatique', softSkills: 'Savoir-être', languages: 'Langues',
    projects: 'Projets', schoolProjects: 'Projets scolaires', scienceFairs: 'Concours scientifiques',
    olympiads: 'Olympiades et concours', clubs: 'Clubs et groupes de travail', studentOrgs: 'Vie associative étudiante',
    extracurricular: 'Activités extrascolaires', volunteer: 'Bénévolat', subjects: 'Matières préférées',
    monitoring: 'Tutorat', research: 'Projets de recherche', publications: 'Publications',
    presentations: 'Communications', awards: 'Prix et distinctions', scholarships: 'Bourses',
    researchInterests: 'Thèmes de recherche', interests: "Centres d'intérêt", links: 'Portfolio et liens',
    additional: 'Informations complémentaires', references: 'Références', custom: 'Rubrique personnalisée',
    motivation: 'Motivation', selfPR: 'Présentation', personalWishes: 'Remarques',
    contact: 'Contact', personalData: 'Informations personnelles',
    professionalSummary: 'Profil', coursesCertifications: 'Formations et certifications',
    careerObjective: 'Objectif professionnel', schoolEducation: 'Scolarité',
    schoolPersonalProjects: 'Projets scolaires et personnels', skillsGeneral: 'Compétences', portfolio: 'Portfolio',
    availability: 'Disponibilités et informations complémentaires', schoolObjective: 'Objectif', freeCourses: 'Formations',
    academicObjective: "Projet d'études", academicEducation: 'Formation universitaire', projectsResearch: 'Projets et recherche',
    awardsScholarships: 'Prix et bourses', academicLinks: 'Profils académiques et liens',
    academicPersonalProjects: 'Projets universitaires et personnels', experienceIfAny: 'Expérience',
    personalPresentation: 'Présentation', presentation: 'Présentation', volunteerExperience: 'Bénévolat',
    professionalExperienceIfAny: 'Expérience professionnelle', academicSummary: 'Profil de recherche',
    academicLinksShort: 'Liens académiques', keySkills: 'Compétences clés', profile: 'Profil',
    researchExperience: 'Expérience de recherche', teaching: "Expérience d'enseignement", honors: 'Prix et distinctions',
    conferences: 'Communications en colloques', grants: 'Bourses et financements', digitalSkills: 'Compétences numériques',
    trainings: 'Formation continue', referees: 'Références', activities: 'Activités', researchStatement: 'Axe de recherche'
  },
  labels: {
    photo: 'Photo',
    present: "aujourd'hui", expected: 'prévu', inProgress: 'en cours', contact: 'Contact', email: 'E-mail',
    phone: 'Téléphone', location: 'Ville', linkedin: 'LinkedIn', github: 'GitHub', website: 'Site web',
    birthDate: 'Date de naissance', nationality: 'Nationalité', address: 'Adresse',
    workPermit: 'Autorisation de travail', drivingLicense: 'Permis de conduire', page: 'Page {n} sur {t}',
    placeDate: 'Lieu et date', signature: 'Signature', referencesOnRequest: 'Références disponibles sur demande.',
    privacyConsent: "J'autorise le traitement de mes données personnelles aux seules fins du recrutement.",
    workload: 'Durée', end: 'Fin'
  },
  levels: { basic: 'Notions', intermediate: 'Intermédiaire', advanced: 'Avancé', fluent: 'Courant', native: 'Langue maternelle' },
  status: { cursando: 'en cours', trancado: 'suspendu', interrompido: 'interrompu', concluido: 'obtenu' },
  docTitles: { cv: 'Curriculum vitae', resume: 'CV', academicCV: 'CV académique' },
  letter: {
    salutation: 'Madame, Monsieur,', closing: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    subjectLabel: 'Objet :', enclosures: 'Pièce jointe : CV',
    coverTitle: 'Lettre de motivation', motivationTitle: 'Lettre de motivation', defaultSubject: 'Candidature au poste de [poste]'
  }
});

/* Francês canadense: terminologia de Québec (courriel, curriculum vitæ). */
CM.i18n.derive('fr-CA', 'fr-FR', {
  meta: { name: 'Francês (Canadá)', nativeName: 'Français (Canada)', intl: 'fr-CA', suggestions: 'base' },
  titles: { profile: 'Profil', professionalSummary: 'Sommaire des compétences', volunteer: 'Bénévolat' },
  labels: { email: 'Courriel', phone: 'Téléphone', drivingLicense: 'Permis de conduire' },
  docTitles: { cv: 'Curriculum vitæ', resume: 'Curriculum vitæ', academicCV: 'CV universitaire' },
  letter: { closing: "Veuillez agréer, Madame, Monsieur, l'expression de mes sentiments distingués.", coverTitle: 'Lettre de présentation' }
});

/* Francês suíço: base francesa; termos suíços para autorização de trabalho. */
CM.i18n.derive('fr-CH', 'fr-FR', {
  meta: { name: 'Francês (Suíça)', nativeName: 'Français (Suisse)', intl: 'fr-CH', suggestions: 'base' },
  labels: { workPermit: 'Permis de travail', phone: 'Téléphone' },
  letter: { closing: "Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées." }
});
