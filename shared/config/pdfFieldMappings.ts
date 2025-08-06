export interface FieldMapping {
  primary: string
  fallbacks?: string[]
}

export interface PDFFieldMappings {
  personalInfo: {
    legalFirstName: FieldMapping
    legalLastName: FieldMapping
    middleInitial: FieldMapping
    // Split date of birth fields
    dobMonth: FieldMapping
    dobDay: FieldMapping
    dobYear: FieldMapping
  }
  contactInfo: {
    streetAddress: FieldMapping
    city: FieldMapping
    state: FieldMapping
    zipCode: FieldMapping
    homePhone: FieldMapping
    cellPhone: FieldMapping
    email: FieldMapping
    // Split SSN fields
    ssnPart1: FieldMapping
    ssnPart2: FieldMapping
    ssnPart3: FieldMapping
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
    jobDiscoveryContinued: FieldMapping
    expectedSalary: FieldMapping
  }
  // Checkbox fields for yes/no questions
  checkboxFields: {
    ageOver18Yes: FieldMapping
    ageOver18No: FieldMapping
    reliableTransportYes: FieldMapping
    reliableTransportNo: FieldMapping
    workAuthorizedYes: FieldMapping
    workAuthorizedNo: FieldMapping
    fullTimeYes: FieldMapping
    fullTimeNo: FieldMapping
    swingShiftsYes: FieldMapping
    swingShiftsNo: FieldMapping
    graveyardShiftsYes: FieldMapping
    graveyardShiftsNo: FieldMapping
    previouslyAppliedYes: FieldMapping
    previouslyAppliedNo: FieldMapping
    forkliftCertYes: FieldMapping
    forkliftCertNo: FieldMapping
  }
  forklift: {
    sd: FieldMapping
    su: FieldMapping
    sur: FieldMapping
    cp: FieldMapping
    cl: FieldMapping
    rj: FieldMapping
  }
  // COMMENTED OUT - SIGNATURE FEATURE
  // signature: {
  //   signature: FieldMapping
  //   signatureDateMonth: FieldMapping
  //   signatureDateDay: FieldMapping
  //   signatureDateYear: FieldMapping
  // }
  skills: {
    skill1: FieldMapping
    skill2: FieldMapping
    skill3: FieldMapping
  }
  education: {
    school1Name: FieldMapping
    school1Year: FieldMapping
    school1Major: FieldMapping
    school1DiplomaYes: FieldMapping
    school1DiplomaNo: FieldMapping
    school2Name: FieldMapping
    school2Year: FieldMapping
    school2Major: FieldMapping
    school2DiplomaYes: FieldMapping
    school2DiplomaNo: FieldMapping
  }
  employment: {
    company1Name: FieldMapping
    company1StartMonth: FieldMapping
    company1StartDay: FieldMapping
    company1StartYear: FieldMapping
    company1EndMonth: FieldMapping
    company1EndDay: FieldMapping
    company1EndYear: FieldMapping
    company1StartPosition: FieldMapping
    company1EndPosition: FieldMapping
    company1Phone: FieldMapping
    company1Supervisor: FieldMapping
    company1MayContactYes: FieldMapping
    company1MayContactNo: FieldMapping
    company1Responsibilities: FieldMapping
    company1ResponsibilitiesContinued: FieldMapping
    company1ReasonLeaving: FieldMapping
    company1ReasonLeavingContinued: FieldMapping
    company2Name: FieldMapping
    company2StartMonth: FieldMapping
    company2StartDay: FieldMapping
    company2StartYear: FieldMapping
    company2EndMonth: FieldMapping
    company2EndDay: FieldMapping
    company2EndYear: FieldMapping
    company2StartPosition: FieldMapping
    company2EndPosition: FieldMapping
    company2Phone: FieldMapping
    company2Supervisor: FieldMapping
    company2MayContactYes: FieldMapping
    company2MayContactNo: FieldMapping
    company2Responsibilities: FieldMapping
    company2ResponsibilitiesContinued: FieldMapping
    company2ReasonLeaving: FieldMapping
    company2ReasonLeavingContinued: FieldMapping
  }
}

export const pdfFieldMappings: PDFFieldMappings = {
  personalInfo: {
    legalFirstName: { primary: 'Applicant Legal First Name', fallbacks: ['Legal First Name', 'First Name', 'FirstName'] },
    legalLastName: { primary: 'Applicant Legal Last Name', fallbacks: ['Legal Last Name', 'Last Name', 'LastName'] },
    middleInitial: { primary: 'Applicant Middle Initials', fallbacks: ['Middle Initial', 'MI', 'Middle'] },
    dobMonth: { primary: 'Applicant DOB - Month', fallbacks: ['DOB Month', 'Birth Month'] },
    dobDay: { primary: 'Applicant DOB - Day', fallbacks: ['DOB Day', 'Birth Day'] },
    dobYear: { primary: 'Applicant DOB - Year', fallbacks: ['DOB Year', 'Birth Year'] }
  },
  contactInfo: {
    streetAddress: { primary: 'Applicant Street Address', fallbacks: ['Street Address', 'Address', 'Street'] },
    city: { primary: 'Applicant City', fallbacks: ['City', 'City Name'] },
    state: { primary: 'Applicant State', fallbacks: ['State', 'State/Province'] },
    zipCode: { primary: 'Applicant Zip Code', fallbacks: ['Zip Code', 'ZIP', 'Postal Code'] },
    homePhone: { primary: 'Applicant Home Phone', fallbacks: ['Home Phone', 'Phone', 'Home Phone Number'] },
    cellPhone: { primary: 'Applicant Cell Phone Number', fallbacks: ['Cell Phone Number', 'Cell Phone', 'Mobile'] },
    email: { primary: 'Applicant Email', fallbacks: ['Email', 'Email Address', 'E-mail'] },
    ssnPart1: { primary: 'Applicant SSN - P1', fallbacks: ['SSN Part 1', 'SSN P1'] },
    ssnPart2: { primary: 'Applicant SSN - P2', fallbacks: ['SSN Part 2', 'SSN P2'] },
    ssnPart3: { primary: 'Applicant SSN - P3', fallbacks: ['SSN Part 3', 'SSN P3'] }
  },
  emergencyContact: {
    name: { primary: 'Emergency Contact Name', fallbacks: ['Name', 'Contact Name'] },
    phone: { primary: 'Emergency Contact Phone Number', fallbacks: ['Number', 'Emergency Phone', 'Contact Phone'] },
    relationship: { primary: 'Emergency Contact Relationship', fallbacks: ['Relationship', 'Contact Relationship'] }
  },
  weeklyAvailability: {
    sunday: { primary: 'Sunday Hours', fallbacks: ['Sunday', 'Sun'] },
    monday: { primary: 'Monday  Hours', fallbacks: ['Monday', 'Mon'] },
    tuesday: { primary: 'Tuesday  Hours', fallbacks: ['Tuesday', 'Tue'] },
    wednesday: { primary: 'Wednesday  Hours', fallbacks: ['Wednesday', 'Wed'] },
    thursday: { primary: 'Thursday  Hours', fallbacks: ['Thursday', 'Thu'] },
    friday: { primary: 'Friday  Hours', fallbacks: ['Friday', 'Fri'] },
    saturday: { primary: 'Saturday Hours', fallbacks: ['Saturday', 'Sat'] }
  },
  position: {
    positionApplied: { primary: 'Position Applied For', fallbacks: ['Position', 'Job Title'] },
    jobDiscovery: { primary: 'How did you discover this job opening', fallbacks: ['Job Discovery', 'How did you hear'] },
    jobDiscoveryContinued: { primary: 'How did you discover this job opening - Continued', fallbacks: ['Job Discovery Continued'] },
    expectedSalary: { primary: 'Expected Salary', fallbacks: ['Salary', 'Expected Pay'] }
  },
  checkboxFields: {
    ageOver18Yes: { primary: 'Are you 18 years of age or older? Yes', fallbacks: ['Age 18+ Yes'] },
    ageOver18No: { primary: 'Are you 18 years of age or older? No', fallbacks: ['Age 18+ No'] },
    reliableTransportYes: { primary: 'Do you have a reliable means of transportation? Yes', fallbacks: ['Transport Yes'] },
    reliableTransportNo: { primary: 'Do you have a reliable means of transportation? No', fallbacks: ['Transport No'] },
    workAuthorizedYes: { primary: 'Are you legally authorized to work in the country where you are applying? Yes', fallbacks: ['Work Auth Yes'] },
    workAuthorizedNo: { primary: 'Are you legally authorized to work in the country where you are applying? No', fallbacks: ['Work Auth No'] },
    fullTimeYes: { primary: 'Are you looking for full-time employment? Yes', fallbacks: ['Full Time Yes'] },
    fullTimeNo: { primary: 'Are you looking for full-time employment? No', fallbacks: ['Full Time No'] },
    swingShiftsYes: { primary: 'Are you open to working swing shifts? Yes', fallbacks: ['Swing Shifts Yes'] },
    swingShiftsNo: { primary: 'Are you open to working swing shifts? No', fallbacks: ['Swing Shifts No'] },
    graveyardShiftsYes: { primary: 'Are you willing to work graveyard shifts? Yes', fallbacks: ['Graveyard Yes'] },
    graveyardShiftsNo: { primary: 'Are you willing to work graveyard shifts? No', fallbacks: ['Graveyard No'] },
    previouslyAppliedYes: { primary: 'Have you previously applied at WareWorks? Yes', fallbacks: ['Previously Applied Yes'] },
    previouslyAppliedNo: { primary: 'Have you previously applied at WareWorks? No', fallbacks: ['Previously Applied No'] },
    forkliftCertYes: { primary: 'Do you have forklift certification? Yes', fallbacks: ['Forklift Cert Yes'] },
    forkliftCertNo: { primary: 'Do you have forklift certification? No', fallbacks: ['Forklift Cert No'] }
  },
  forklift: {
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
  // COMMENTED OUT - SIGNATURE FEATURE
  // signature: {
  //   signature: { primary: 'Signature', fallbacks: ['Applicant Signature'] },
  //   signatureDateMonth: { primary: 'Signature Date - Month', fallbacks: ['Sig Month'] },
  //   signatureDateDay: { primary: 'Signature Date - Day', fallbacks: ['Sig Day'] },
  //   signatureDateYear: { primary: 'Signature Date - Year', fallbacks: ['Sig Year'] }
  // },
  education: {
    school1Name: { primary: 'School Name and Location 1', fallbacks: ['School Name and Location', 'School 1', 'Education 1'] },
    school1Year: { primary: 'School Year 1', fallbacks: ['Year', 'Year 1', 'Graduation Year'] },
    school1Major: { primary: 'School Major 1', fallbacks: ['Major', 'Major 1', 'Degree'] },
    school1DiplomaYes: { primary: 'School Diploma 1 - yes', fallbacks: ['Diploma 1 Yes'] },
    school1DiplomaNo: { primary: 'School Diploma 1 - No', fallbacks: ['Diploma 1 No'] },
    school2Name: { primary: 'School Name and Location 2', fallbacks: ['School Name and Location_2', 'School 2', 'Education 2'] },
    school2Year: { primary: 'School Year 2', fallbacks: ['Year_2', 'Year 2', 'Graduation Year 2'] },
    school2Major: { primary: 'School Major 2', fallbacks: ['Major_2', 'Major 2', 'Degree 2'] },
    school2DiplomaYes: { primary: 'School Diploma 2 - yes', fallbacks: ['Diploma 2 Yes'] },
    school2DiplomaNo: { primary: 'School Diploma 2 - No', fallbacks: ['Diploma 2 No'] }
  },
  employment: {
    company1Name: { primary: 'Company Name and Location 1', fallbacks: ['Company Name and Location', 'Company 1', 'Employer 1'] },
    company1StartMonth: { primary: 'Company Date Started 1 - Month', fallbacks: ['Start Month 1'] },
    company1StartDay: { primary: 'Company Date Started 1 - Day', fallbacks: ['Start Day 1'] },
    company1StartYear: { primary: 'Company Date Started 1 - Year', fallbacks: ['Start Year 1'] },
    company1EndMonth: { primary: 'Company Date Ended 1 - Month', fallbacks: ['End Month 1'] },
    company1EndDay: { primary: 'Company Date Ended 1 - Day', fallbacks: ['End Day 1'] },
    company1EndYear: { primary: 'Company Date Ended 1 - Year', fallbacks: ['End Year 1'] },
    company1StartPosition: { primary: 'Company Starting Position 1', fallbacks: ['Starting Position', 'Start Position', 'Initial Position'] },
    company1EndPosition: { primary: 'Company Ending Position 1', fallbacks: ['Ending Position', 'End Position', 'Final Position'] },
    company1Phone: { primary: 'Company Telephone Number 1', fallbacks: ['Telephone Number', 'Company Phone', 'Phone'] },
    company1Supervisor: { primary: 'Company Supervisor Name 1', fallbacks: ['Supervisor Name', 'Supervisor', 'Manager'] },
    company1MayContactYes: { primary: 'Company May we contact 1? Yes', fallbacks: ['May Contact 1 Yes'] },
    company1MayContactNo: { primary: 'Company May we contact 1? No', fallbacks: ['May Contact 1 No'] },
    company1Responsibilities: { primary: 'Company Responsibilities 1', fallbacks: ['Responsibilities 1', 'Duties', 'Job Description'] },
    company1ResponsibilitiesContinued: { primary: 'Company Responsibilities 1 Continued', fallbacks: ['Responsibilities 1 Continued'] },
    company1ReasonLeaving: { primary: 'Company Reason for Leaving 1', fallbacks: ['Reason for Leaving 1', 'Reason Leaving', 'Why Left'] },
    company1ReasonLeavingContinued: { primary: 'Company Reason for Leaving 1 Conitnued', fallbacks: ['Reason Leaving 1 Continued'] },
    company2Name: { primary: 'Company Name and Location 2', fallbacks: ['Company Name and Location_2', 'Company 2', 'Employer 2'] },
    company2StartMonth: { primary: 'Company Date Started 2 - Month', fallbacks: ['Start Month 2'] },
    company2StartDay: { primary: 'Company Date Started 2 - Day', fallbacks: ['Start Day 2'] },
    company2StartYear: { primary: 'Company Date Started 2 - Year', fallbacks: ['Start Year 2'] },
    company2EndMonth: { primary: 'Company Date Ended 2 - Month', fallbacks: ['End Month 2'] },
    company2EndDay: { primary: 'Company Date Ended 2 - Day', fallbacks: ['End Day 2'] },
    company2EndYear: { primary: 'Company Date Ended 2 - Year', fallbacks: ['End Year 2'] },
    company2StartPosition: { primary: 'Company Starting Position 2', fallbacks: ['Starting Position_2', 'Start Position 2', 'Initial Position 2'] },
    company2EndPosition: { primary: 'Company Ending Position 2', fallbacks: ['Ending Position_2', 'End Position 2', 'Final Position 2'] },
    company2Phone: { primary: 'Company Telephone Number 2', fallbacks: ['Telephone Number_2', 'Company Phone 2', 'Phone 2'] },
    company2Supervisor: { primary: 'Company Supervisor Name 2', fallbacks: ['Supervisor Name_2', 'Supervisor 2', 'Manager 2'] },
    company2MayContactYes: { primary: 'Company May we contact 2? Yes', fallbacks: ['May Contact 2 Yes'] },
    company2MayContactNo: { primary: 'Company May we contact 2? No', fallbacks: ['May Contact 2 No'] },
    company2Responsibilities: { primary: 'Company Responsibilities 2', fallbacks: ['Responsibilities 1_2', 'Duties 2', 'Job Description 2'] },
    company2ResponsibilitiesContinued: { primary: 'Company Responsibilities 2 Continued', fallbacks: ['Responsibilities 2 Continued'] },
    company2ReasonLeaving: { primary: 'Company Reason for Leaving 2', fallbacks: ['Reason for Leaving 1_2', 'Reason Leaving 2', 'Why Left 2'] },
    company2ReasonLeavingContinued: { primary: 'Company Reason for Leaving 2 Continued', fallbacks: ['Reason Leaving 2 Continued'] }
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
    uscisANumberCB3: FieldMapping  // For permanent residents (CB_3)
    uscisANumberCB4: FieldMapping  // For authorized aliens (CB_4)
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
    uscisANumberCB3: { primary: '3 A lawful permanent resident Enter USCIS or ANumber', fallbacks: ['CB_3 USCIS', 'Permanent Resident A-Number'] },
    uscisANumberCB4: { primary: 'USCIS ANumber', fallbacks: ['CB_4 USCIS', 'A-Number'] },
    expirationDate: { primary: 'Exp Date mmddyyyy', fallbacks: ['Expiration Date', 'Exp Date'] },
    i94AdmissionNumber: { primary: 'Form I94 Admission Number', fallbacks: ['I-94 Number', 'Admission Number'] },
    foreignPassportNumber: { primary: 'Foreign Passport Number and Country of IssuanceRow1', fallbacks: ['Passport Number', 'Foreign Passport'] }
  }
}