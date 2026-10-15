/* CM Studio — i18n/en-variants.js
   Variantes regionais do inglês que herdam de en-US ou en-GB e ajustam
   apenas o que difere (terminologia e grafia locais). */

/* Inglês canadense: base americana com grafia "-our" e termos do Job Bank
   ("Work experience", "Volunteer work"). */
CM.i18n.derive('en-CA', 'en-US', {
  meta: { name: 'Inglês (Canadá)', nativeName: 'English (Canada)', intl: 'en-CA', suggestions: 'base' },
  titles: {
    experience: 'Work Experience', volunteer: 'Volunteer Work', volunteerExperience: 'Volunteer Work',
    awards: 'Honours and Awards', honors: 'Honours and Awards', professionalSummary: 'Summary of Qualifications'
  },
  labels: { drivingLicense: "Driver's licence", workPermit: 'Work authorization' },
  docTitles: { resume: 'Resume', cv: 'Curriculum Vitae', academicCV: 'Curriculum Vitae' },
  letter: { closing: 'Sincerely,', enclosures: 'Enclosure: Resume' }
});

/* Inglês australiano: base britânica; "Career objective", "Referees". */
CM.i18n.derive('en-AU', 'en-GB', {
  meta: { name: 'Inglês (Austrália)', nativeName: 'English (Australia)', intl: 'en-AU', suggestions: 'base' },
  titles: {
    summary: 'Career Objective', professionalSummary: 'Career Summary', experience: 'Employment History',
    references: 'Referees', referees: 'Referees', keySkills: 'Key Skills', skills: 'Key Skills'
  },
  labels: { workPermit: 'Work rights', referencesOnRequest: 'Referees available on request.' },
  docTitles: { resume: 'Resume', cv: 'Curriculum Vitae', academicCV: 'Academic CV' },
  letter: { enclosures: 'Enclosure: Resume' }
});

/* Inglês irlandês: base britânica; CV e carta de apresentação. */
CM.i18n.derive('en-IE', 'en-GB', {
  meta: { name: 'Inglês (Irlanda)', nativeName: 'English (Ireland)', intl: 'en-IE', suggestions: 'base' },
  titles: { experience: 'Work Experience', professionalSummary: 'Personal Profile' },
  labels: { phone: 'Mobile' }
});

/* Inglês neozelandês: base britânica; "Personal statement", "Key skills", "Referees" (Tahatū). */
CM.i18n.derive('en-NZ', 'en-GB', {
  meta: { name: 'Inglês (Nova Zelândia)', nativeName: 'English (New Zealand)', intl: 'en-NZ', suggestions: 'base' },
  titles: {
    summary: 'Personal Statement', professionalSummary: 'Personal Statement', skills: 'Key Skills', keySkills: 'Key Skills',
    experience: 'Work History', references: 'Referees', referees: 'Referees'
  },
  labels: { workPermit: 'Work rights', referencesOnRequest: 'Referees available on request.' }
});
