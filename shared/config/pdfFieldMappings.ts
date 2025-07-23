export interface FieldMapping {
  primary: string
  fallbacks?: string[]
}

export interface PDFFieldMappings {
  personalInfo: {
    legalFirstName: FieldMapping
    legalLastName: FieldMapping
    middleInitial: FieldMapping
  }
  contactInfo: {
    streetAddress: FieldMapping
    city: FieldMapping
    state: FieldMapping
    zipCode: FieldMapping
    homePhone: FieldMapping
    cellPhone: FieldMapping
    email: FieldMapping
    socialSecurityNumber: FieldMapping
  }
  emergencyContact: {
    name: FieldMapping
    phone: FieldMapping
    relationship: FieldMapping
  }
  weeklyAvailability: {
    sunday: FieldMapping
    monday: FieldMapping
    tuesday: FieldMapping
    wednesday: FieldMapping
    thursday: FieldMapping
    friday: FieldMapping
    saturday: FieldMapping
  }
  position: {
    positionApplied: FieldMapping
    jobDiscovery: FieldMapping
    expectedSalary: FieldMapping
  }
  equipment: {
    sd: FieldMapping
    su: FieldMapping
    sur: FieldMapping
    cp: FieldMapping
    cl: FieldMapping
    rj: FieldMapping
  }
  skills: {
    skill1: FieldMapping
    skill2: FieldMapping
    skill3: FieldMapping
  }
  education: {
    school1Name: FieldMapping
    school1Year: FieldMapping
    school1Major: FieldMapping
    school2Name: FieldMapping
    school2Year: FieldMapping
    school2Major: FieldMapping
  }
  employment: {
    company1Name: FieldMapping
    company1StartPosition: FieldMapping
    company1EndPosition: FieldMapping
    company1Phone: FieldMapping
    company1Supervisor: FieldMapping
    company1Responsibilities: FieldMapping
    company1ReasonLeaving: FieldMapping
    company2Name: FieldMapping
    company2StartPosition: FieldMapping
    company2EndPosition: FieldMapping
    company2Phone: FieldMapping
    company2Supervisor: FieldMapping
    company2Responsibilities: FieldMapping
    company2ReasonLeaving: FieldMapping
  }
}

export const pdfFieldMappings: PDFFieldMappings = {
  personalInfo: {
    legalFirstName: { primary: 'Legal First Name', fallbacks: ['First Name', 'FirstName'] },
    legalLastName: { primary: 'Legal Last Name', fallbacks: ['Last Name', 'LastName'] },
    middleInitial: { primary: 'Middle Initial', fallbacks: ['MI', 'Middle'] }
  },
  contactInfo: {
    streetAddress: { primary: 'Street Address', fallbacks: ['Address', 'Street'] },
    city: { primary: 'City', fallbacks: ['City Name'] },
    state: { primary: 'State', fallbacks: ['State/Province'] },
    zipCode: { primary: 'Zip Code', fallbacks: ['ZIP', 'Postal Code'] },
    homePhone: { primary: 'Home Phone', fallbacks: ['Phone', 'Home Phone Number'] },
    cellPhone: { primary: 'Cell Phone Number', fallbacks: ['Cell Phone', 'Mobile'] },
    email: { primary: 'Email', fallbacks: ['Email Address', 'E-mail'] },
    socialSecurityNumber: { primary: 'Social Security Number', fallbacks: ['SSN', 'SS Number'] }
  },
  emergencyContact: {
    name: { primary: 'Name', fallbacks: ['Emergency Contact Name', 'Contact Name'] },
    phone: { primary: 'Number', fallbacks: ['Emergency Phone', 'Contact Phone'] },
    relationship: { primary: 'Relationship', fallbacks: ['Contact Relationship'] }
  },
  weeklyAvailability: {
    sunday: { primary: 'Sunday', fallbacks: ['Sun'] },
    monday: { primary: 'Monday', fallbacks: ['Mon'] },
    tuesday: { primary: 'Tuesday', fallbacks: ['Tue'] },
    wednesday: { primary: 'Wednesday', fallbacks: ['Wed'] },
    thursday: { primary: 'Thursday', fallbacks: ['Thu'] },
    friday: { primary: 'Friday', fallbacks: ['Fri'] },
    saturday: { primary: 'Saturday', fallbacks: ['Sat'] }
  },
  position: {
    positionApplied: { primary: 'Position Applied For', fallbacks: ['Position', 'Job Title'] },
    jobDiscovery: { primary: 'How did you discover this job opening', fallbacks: ['Job Discovery', 'How did you hear'] },
    expectedSalary: { primary: 'Expected Salary', fallbacks: ['Salary', 'Expected Pay'] }
  },
  equipment: {
    sd: { primary: 'SD Sit Down', fallbacks: ['SD', 'Sit Down'] },
    su: { primary: 'SU Stand Up', fallbacks: ['SU', 'Stand Up'] },
    sur: { primary: 'SUR Stand Up Reach', fallbacks: ['SUR', 'Stand Up Reach'] },
    cp: { primary: 'CP Cherry Picker', fallbacks: ['CP', 'Cherry Picker'] },
    cl: { primary: 'CL Clamps', fallbacks: ['CL', 'Clamps'] },
    rj: { primary: 'Riding Jack', fallbacks: ['RJ', 'Jack'] }
  },
  skills: {
    skill1: { primary: 'Applicable Skills  Qualifications 1', fallbacks: ['Skills 1', 'Skill 1'] },
    skill2: { primary: 'Applicable Skills  Qualifications 2', fallbacks: ['Skills 2', 'Skill 2'] },
    skill3: { primary: 'Applicable Skills  Qualifications 3', fallbacks: ['Skills 3', 'Skill 3'] }
  },
  education: {
    school1Name: { primary: 'School Name and Location', fallbacks: ['School 1', 'Education 1'] },
    school1Year: { primary: 'Year', fallbacks: ['Year 1', 'Graduation Year'] },
    school1Major: { primary: 'Major', fallbacks: ['Major 1', 'Degree'] },
    school2Name: { primary: 'School Name and Location_2', fallbacks: ['School 2', 'Education 2'] },
    school2Year: { primary: 'Year_2', fallbacks: ['Year 2', 'Graduation Year 2'] },
    school2Major: { primary: 'Major_2', fallbacks: ['Major 2', 'Degree 2'] }
  },
  employment: {
    company1Name: { primary: 'Company Name and Location', fallbacks: ['Company 1', 'Employer 1'] },
    company1StartPosition: { primary: 'Starting Position', fallbacks: ['Start Position', 'Initial Position'] },
    company1EndPosition: { primary: 'Ending Position', fallbacks: ['End Position', 'Final Position'] },
    company1Phone: { primary: 'Telephone Number', fallbacks: ['Company Phone', 'Phone'] },
    company1Supervisor: { primary: 'Supervisor Name', fallbacks: ['Supervisor', 'Manager'] },
    company1Responsibilities: { primary: 'Responsibilities 1', fallbacks: ['Duties', 'Job Description'] },
    company1ReasonLeaving: { primary: 'Reason for Leaving 1', fallbacks: ['Reason Leaving', 'Why Left'] },
    company2Name: { primary: 'Company Name and Location_2', fallbacks: ['Company 2', 'Employer 2'] },
    company2StartPosition: { primary: 'Starting Position_2', fallbacks: ['Start Position 2', 'Initial Position 2'] },
    company2EndPosition: { primary: 'Ending Position_2', fallbacks: ['End Position 2', 'Final Position 2'] },
    company2Phone: { primary: 'Telephone Number_2', fallbacks: ['Company Phone 2', 'Phone 2'] },
    company2Supervisor: { primary: 'Supervisor Name_2', fallbacks: ['Supervisor 2', 'Manager 2'] },
    company2Responsibilities: { primary: 'Responsibilities 1_2', fallbacks: ['Duties 2', 'Job Description 2'] },
    company2ReasonLeaving: { primary: 'Reason for Leaving 1_2', fallbacks: ['Reason Leaving 2', 'Why Left 2'] }
  }
}

// I-9 Form Field Mappings (separate template)
export interface I9FieldMappings {
  personalInfo: {
    lastName: FieldMapping
    firstName: FieldMapping
    middleInitial: FieldMapping
    otherLastNames: FieldMapping
  }
  address: {
    streetAddress: FieldMapping
    aptNumber: FieldMapping
    city: FieldMapping
    state: FieldMapping
    zipCode: FieldMapping
  }
  identification: {
    dateOfBirth: FieldMapping
    socialSecurityNumber: FieldMapping
    phoneNumber: FieldMapping
    email: FieldMapping
  }
  citizenship: {
    citizenCheckbox: FieldMapping
    nonCitizenNationalCheckbox: FieldMapping
    permanentResidentCheckbox: FieldMapping
    authorizedAlienCheckbox: FieldMapping
  }
  workAuthorization: {
    uscisANumber: FieldMapping
    expirationDate: FieldMapping
    i94AdmissionNumber: FieldMapping
    foreignPassportNumber: FieldMapping
  }
}

export const i9FieldMappings: I9FieldMappings = {
  personalInfo: {
    lastName: { primary: 'Last Name (Family Name)', fallbacks: ['Last Name Family Name from Section 1', 'LastName'] },
    firstName: { primary: 'First Name Given Name', fallbacks: ['First Name Given Name from Section 1', 'FirstName'] },
    middleInitial: { primary: 'Employee Middle Initial (if any)', fallbacks: ['Middle initial if any from Section 1', 'MI'] },
    otherLastNames: { primary: 'Employee Other Last Names Used (if any)', fallbacks: ['Other Names', 'Previous Names'] }
  },
  address: {
    streetAddress: { primary: 'Address Street Number and Name', fallbacks: ['Street Address', 'Address'] },
    aptNumber: { primary: 'Apt Number (if any)', fallbacks: ['Apartment', 'Unit'] },
    city: { primary: 'City or Town', fallbacks: ['City', 'Town'] },
    state: { primary: 'State', fallbacks: ['State/Province'] },
    zipCode: { primary: 'ZIP Code', fallbacks: ['Zip', 'Postal Code'] }
  },
  identification: {
    dateOfBirth: { primary: 'Date of Birth mmddyyyy', fallbacks: ['DOB', 'Birth Date'] },
    socialSecurityNumber: { primary: 'US Social Security Number', fallbacks: ['SSN', 'Social Security'] },
    phoneNumber: { primary: 'Telephone Number', fallbacks: ['Phone', 'Phone Number'] },
    email: { primary: 'Employees E-mail Address', fallbacks: ['Email', 'Email Address'] }
  },
  citizenship: {
    citizenCheckbox: { primary: 'CB_1', fallbacks: ['Citizen', 'US Citizen'] },
    nonCitizenNationalCheckbox: { primary: 'CB_2', fallbacks: ['Non-citizen National'] },
    permanentResidentCheckbox: { primary: 'CB_3', fallbacks: ['Permanent Resident'] },
    authorizedAlienCheckbox: { primary: 'CB_4', fallbacks: ['Authorized Alien', 'Work Authorized'] }
  },
  workAuthorization: {
    uscisANumber: { primary: 'USCIS ANumber', fallbacks: ['3 A lawful permanent resident Enter USCIS or ANumber', 'A-Number'] },
    expirationDate: { primary: 'Exp Date mmddyyyy', fallbacks: ['Expiration Date', 'Exp Date'] },
    i94AdmissionNumber: { primary: 'Form I94 Admission Number', fallbacks: ['I-94 Number', 'Admission Number'] },
    foreignPassportNumber: { primary: 'Foreign Passport Number and Country of IssuanceRow1', fallbacks: ['Passport Number', 'Foreign Passport'] }
  }
}