/* CM Studio — i18n/en-GB.js — English (United Kingdom).
   Herda do inglês americano e substitui termos e grafias britânicas
   (CV, "Work history", "Honours", "programme", "organisation"). */
CM.i18n.derive('en-GB', 'en-US', {
  meta: { name: 'Inglês (Reino Unido)', nativeName: 'English (United Kingdom)', intl: 'en-GB', suggestions: 'base' },
  titles: {
    summary: 'Profile', experience: 'Work History', education: 'Education', professionalSummary: 'Personal Profile',
    careerObjective: 'Career Objective', schoolObjective: 'Personal Statement', personalPresentation: 'Personal Statement',
    presentation: 'Personal Statement', volunteer: 'Volunteering', volunteerExperience: 'Volunteering',
    studentOrgs: 'Student Council and Societies', clubs: 'Clubs and Societies', awards: 'Awards and Achievements',
    honors: 'Honours and Awards', monitoring: 'Teaching Experience', olympiads: 'Academic Competitions and Olympiads',
    softSkills: 'Personal Skills', computerSkills: 'IT Skills', trainings: 'Training', professionalExperienceIfAny: 'Work Experience',
    academicSummary: 'Research Profile', scholarships: 'Scholarships and Funding', grants: 'Grants and Funding',
    links: 'Portfolio and Links', additional: 'Additional Information'
  },
  labels: {
    phone: 'Phone', email: 'Email', workPermit: 'Right to work', drivingLicense: 'Driving licence',
    referencesOnRequest: 'References available on request.',
    privacyConsent: 'I consent to the processing of my personal data for recruitment purposes only.'
  },
  status: { trancado: 'deferred', interrompido: 'discontinued' },
  docTitles: { cv: 'Curriculum Vitae', resume: 'CV', academicCV: 'Academic CV' },
  letter: {
    salutation: 'Dear Hiring Manager,', closing: 'Kind regards,', subjectLabel: 'Re:', enclosures: 'Enclosure: CV',
    coverTitle: 'Cover Letter', motivationTitle: 'Personal Statement', defaultSubject: 'Application for the post of [position]'
  }
});
