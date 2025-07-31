# Field Mapping Analysis: Schema → PDF Templates → Form Steps

## **WareWorks Application PDF - Field Mapping**

### **Page 1 - Personal Information:**
- `legalFirstName` → "Legal First Name"
- `middleInitial` → "undefined" (field #10)
- `legalLastName` → "Legal Last Name"
- `streetAddress` → "Street Address"
- `city` → "City"
- `state` → "State"
- `zipCode` → "Zip Code"
- `homePhone` → "Home Phone"
- `phoneNumber` → "Cell Phone Number"
- `socialSecurityNumber` → "Social Security Number"
- `dateOfBirth` → "undefined_2" (field #11)
- `email` → "Email"

### **Page 1 - Emergency Contact:**
- `emergencyName` → "Name"
- `emergencyPhone` → "Number"
- `emergencyRelationship` → "Relationship"

### **Page 1 - Basic Questions:**
- `age18` → "Are you 18 years of age or older?" (Yes/No text)
- `transportation` → "Do you have a reliable means of transportation?" (Yes/No text)
- `workAuthorizationConfirm` → "Are you legally authorized to work..." (Yes/No text)
- `fullTimeEmployment` → "Are you looking for full-time employment?" (Yes/No text)
- `swingShifts` → "Are you open to working swing shifts?" (Yes/No text)
- `graveyardShifts` → "Are you willing to work graveyard shifts?" (Yes/No text)

### **Page 1 - Weekly Availability:**
- `availabilitySunday` → "Sunday"
- `availabilityMonday` → "Monday"
- `availabilityTuesday` → "Tuesday"
- `availabilityWednesday` → "Wednesday"
- `availabilityThursday` → "Thursday"
- `availabilityFriday` → "Friday"
- `availabilitySaturday` → "Saturday"

### **Page 2 - Position & Experience:**
- `positionApplied` → "Position Applied For"
- `jobDiscovery` → "How did you discover this job opening"
- `previouslyApplied` → "Have you previously applied at WareWorks" (Yes/No text)
- `previousApplicationWhen` → "If yes please specify when and where"
- `expectedSalary` → "Expected Salary"

### **Page 2 - Equipment Experience:**
- `equipmentSD` → "SD Sit Down"
- `equipmentSU` → "SU Stand Up"
- `equipmentSUR` → "SUR Stand Up Reach"
- `equipmentCP` → "CP Cherry Picker"
- `equipmentCL` → "CL Clamps"
- `equipmentRidingJack` → "Riding Jack"

### **Page 2 - Skills & Education:**
- `skills1` → "Applicable Skills  Qualifications 1"
- `skills2` → "Applicable Skills  Qualifications 2"
- `skills3` → "Applicable Skills  Qualifications 3"
- `education[0].schoolName` → "School Name and Location"
- `education[0].graduationYear` → "Year"
- `education[0].fieldOfStudy` → "Major"
- `education[1].schoolName` → "School Name and Location_2"
- `education[1].graduationYear` → "Year_2"
- `education[1].fieldOfStudy` → "Major_2"

### **Page 3 - Employment History:**
- `employment[0].companyName` → "Company Name and Location"
- `employment[0].startDate` → "undefined_3" (Date Started)
- `employment[0].endDate` → "undefined_4" (Date Ended)
- `employment[0].supervisorPhone` → "Telephone Number"
- `employment[0].startingPosition` → "Starting Position"
- `employment[0].endingPosition` → "Ending Position"
- `employment[0].supervisorName` → "Supervisor Name"
- `employment[0].mayContact` → "May we contact?" (Yes/No text)
- `employment[0].responsibilities` → "Responsibilities 1" + "Responsibilities 2"
- `employment[0].reasonForLeaving` → "Reason for Leaving 1" + "Reason for Leaving 2"

- *(Same pattern for employment[1] with "_2" suffix fields)*

### **Page 4 - Signature:**
- `submittedAt` → "undefined_7" (Date field)

---

## **I-9 Form PDF - Field Mapping**

### **Personal Information:**
- `legalLastName` → "Last Name (Family Name)"
- `legalFirstName` → "First Name (Given Name)"
- `middleInitial` → "Middle Initial (if any)"
- `otherLastNames` → "Other Last Names Used (if any)"
- `streetAddress` → "Address (Street Number and Name)"
- `aptNumber` → "Apt. Number (if any)"
- `city` → "City or Town"
- `state` → "State" (dropdown)
- `zipCode` → "ZIP Code"
- `dateOfBirth` → "Date of Birth (mm/dd/yyyy)"
- `socialSecurityNumber` → "U.S. Social Security Number"
- `email` → "Employee's Email Address"
- `phoneNumber` → "Employee's Telephone Number"

### **Citizenship Status - Conditional:**
**Based on `citizenshipStatus`:**
- `'us_citizen'` → Check "CB_1"
- `'noncitizen_national'` → Check "CB_2"
- `'lawful_permanent'` → Check "CB_3" + `uscisANumber` → "3 A lawful permanent resident Enter USCIS or ANumber"
- `'alien_authorized'` → Check "CB_4" + `workAuthExpiration` → "Exp Date mmddyyyy" + document fields based on `alienDocumentType`

### **Work Authorization Documents (CB_4 only):**
- If `alienDocumentType === 'uscis_a_number'` → `alienDocumentNumber` → "USCIS A-Number"
- If `alienDocumentType === 'form_i94'` → `i94AdmissionNumber` → "Form I94 Admission Number"
- If `alienDocumentType === 'foreign_passport'` → `foreignPassportNumber` + `foreignPassportCountry` → "Foreign Passport Number and Country of IssuanceRow1"

### **Signature:**
- `submittedAt` → "Today's Date (mm/dd/yyyy)"

---

## **VERIFICATION CHECKPOINTS**

### **SCHEMA VERIFICATION**
**Location:** `shared/validation/schemas.ts`
**Action:** Manually verify schema fields match this document

#### **DETAILED SCHEMA ANALYSIS - Line by Line:**

**Required Fields (Lines 26-34):**
- Line 27: `legalFirstName` → REQUIRED ✓
- Line 28: `legalLastName` → REQUIRED ✓
- Line 29: `socialSecurityNumber` → REQUIRED, with SSN_REGEX pattern `/^\d{3}-\d{2}-\d{4}$/` ✓
- Line 30: `streetAddress` → REQUIRED ✓
- Line 31: `city` → REQUIRED ✓
- Line 32: `state` → REQUIRED, enum validation with US_STATES array ✓
- Line 33: `zipCode` → REQUIRED, with ZIP_REGEX pattern `/^\d{5}(-\d{4})?$/` ✓
- Line 34: `phoneNumber` → REQUIRED, with PHONE_REGEX pattern `/^\(\d{3}\) \d{3}-\d{4}$/` ✓

**Personal Information - Optional (Lines 39-41):**
- Line 39: `middleInitial` → Optional, max 1 character ✓
- Line 40: `otherLastNames` → Optional ✓
- Line 41: `dateOfBirth` → Optional ✓

**Contact Information - Optional (Lines 44-46):**
- Line 44: `aptNumber` → Optional ✓
- Line 45: `email` → Optional with email validation ✓
- Line 46: `homePhone` → Optional with PHONE_REGEX or empty string ✓

**Emergency Contact - Optional (Lines 49-51):**
- Line 49: `emergencyName` → Optional ✓
- Line 50: `emergencyPhone` → Optional with PHONE_REGEX or empty string ✓
- Line 51: `emergencyRelationship` → Optional ✓

**🚨 CITIZENSHIP/WORK AUTHORIZATION ANALYSIS (Lines 54-64):**
- Line 54: `citizenshipStatus` → Optional enum ['us_citizen', 'noncitizen_national', 'lawful_permanent', 'alien_authorized'] ✓
- Line 55: `uscisANumber` → Optional ✓
- Line 56: `workAuthExpiration` → Optional ✓
- Line 57: `alienDocumentType` → Optional enum ['uscis_a_number', 'form_i94', 'foreign_passport'] ✓
- Line 58: `alienDocumentNumber` → Optional ✓
- Line 59: `documentCountry` → Optional ⚠️ **POTENTIAL ISSUE: This field exists in schema but NOT found in any form component**
- Line 62: `i94AdmissionNumber` → Optional ✓
- Line 63: `foreignPassportNumber` → Optional ✓
- Line 64: `foreignPassportCountry` → Optional ✓

**Basic Eligibility - Optional (Lines 67-69):**
- Line 67: `age18` → Optional enum ['yes', 'no'] or empty string ✓
- Line 68: `transportation` → Optional enum ['yes', 'no'] or empty string ✓
- Line 69: `workAuthorizationConfirm` → Optional enum ['yes', 'no'] or empty string ✓

**Position & Experience - Optional (Lines 72-74):**
- Line 72: `positionApplied` → Optional ✓
- Line 73: `expectedSalary` → Optional ✓
- Line 74: `jobDiscovery` → Optional ✓

**Equipment Experience - Optional (Lines 77-82):**
- Line 77: `equipmentSD` → Optional ✓
- Line 78: `equipmentSU` → Optional ✓
- Line 79: `equipmentSUR` → Optional ✓
- Line 80: `equipmentCP` → Optional ✓
- Line 81: `equipmentCL` → Optional ✓
- Line 82: `equipmentRidingJack` → Optional ✓

**Skills - Optional (Lines 85-87):**
- Line 85: `skills1` → Optional ✓
- Line 86: `skills2` → Optional ✓
- Line 87: `skills3` → Optional ✓

**Work Preferences - Optional (Lines 90-92):**
- Line 90: `fullTimeEmployment` → Optional enum ['yes', 'no'] or empty string ✓
- Line 91: `swingShifts` → Optional enum ['yes', 'no'] or empty string ✓
- Line 92: `graveyardShifts` → Optional enum ['yes', 'no'] or empty string ✓

**Weekly Availability - Optional (Lines 95-101):**
- Line 95: `availabilitySunday` → Optional ✓
- Line 96: `availabilityMonday` → Optional ✓
- Line 97: `availabilityTuesday` → Optional ✓
- Line 98: `availabilityWednesday` → Optional ✓
- Line 99: `availabilityThursday` → Optional ✓
- Line 100: `availabilityFriday` → Optional ✓
- Line 101: `availabilitySaturday` → Optional ✓

**Previous Application - Optional (Lines 104-105):**
- Line 104: `previouslyApplied` → Optional enum ['yes', 'no'] or empty string ✓
- Line 105: `previousApplicationWhen` → Optional ✓

**Education History Array - Optional (Lines 108-113):**
- Line 109: `schoolName` → Optional ✓
- Line 110: `graduationYear` → Optional ✓
- Line 111: `fieldOfStudy` → Optional ✓
- Line 112: `degreeReceived` → Optional ✓

**Employment History Array - Optional (Lines 116-127):**
- Line 117: `companyName` → Optional ✓
- Line 118: `startDate` → Optional ✓
- Line 119: `endDate` → Optional ✓
- Line 120: `startingPosition` → Optional ✓
- Line 121: `endingPosition` → Optional ✓
- Line 122: `supervisorName` → Optional ✓
- Line 123: `supervisorPhone` → Optional with PHONE_REGEX or empty string ✓
- Line 124: `responsibilities` → Optional ✓
- Line 125: `reasonForLeaving` → Optional ✓
- Line 126: `mayContact` → Optional enum ['yes', 'no'] or empty string ✓

**Documents Array - Optional (Lines 130-136):**
- Line 131: `type` → Required enum ['identification', 'resume', 'certification'] ✓
- Line 132: `name` → Required ✓
- Line 133: `size` → Required number ✓
- Line 134: `mimeType` → Required ✓
- Line 135: `data` → Required ✓

**🚨 CONDITIONAL VALIDATION RULES (Lines 147-230):**

**Lawful Permanent Resident Validation (Lines 147-156):**
- **Rule**: If `citizenshipStatus === 'lawful_permanent'`, then `uscisANumber` is REQUIRED ✓
- **Error Path**: `["uscisANumber"]` ✓

**Alien Authorized Validation - Work Auth Expiration (Lines 157-168):**
- **Rule**: If `citizenshipStatus === 'alien_authorized'`, then `workAuthExpiration` is REQUIRED ✓
- **Error Path**: `["workAuthExpiration"]` ✓

**Alien Authorized Validation - Document Type (Lines 169-180):**
- **Rule**: If `citizenshipStatus === 'alien_authorized'`, then `alienDocumentType` is REQUIRED ✓
- **Error Path**: `["alienDocumentType"]` ✓

**Alien Authorized + USCIS A-Number (Lines 181-190):**
- **Rule**: If `citizenshipStatus === 'alien_authorized'` AND `alienDocumentType === 'uscis_a_number'`, then `alienDocumentNumber` is REQUIRED ✓
- **Error Path**: `["alienDocumentNumber"]` ✓

**Alien Authorized + Form I-94 (Lines 191-200):**
- **Rule**: If `citizenshipStatus === 'alien_authorized'` AND `alienDocumentType === 'form_i94'`, then `i94AdmissionNumber` is REQUIRED ✓
- **Error Path**: `["i94AdmissionNumber"]` ✓

**Alien Authorized + Foreign Passport - Number (Lines 201-210):**
- **Rule**: If `citizenshipStatus === 'alien_authorized'` AND `alienDocumentType === 'foreign_passport'`, then `foreignPassportNumber` is REQUIRED ✓
- **Error Path**: `["foreignPassportNumber"]` ✓

**Alien Authorized + Foreign Passport - Country (Lines 211-220):**
- **Rule**: If `citizenshipStatus === 'alien_authorized'` AND `alienDocumentType === 'foreign_passport'`, then `foreignPassportCountry` is REQUIRED ✓
- **Error Path**: `["foreignPassportCountry"]` ✓

**Previous Application Conditional (Lines 221-230):**
- **Rule**: If `previouslyApplied === 'yes'`, then `previousApplicationWhen` is REQUIRED ✓
- **Error Path**: `["previousApplicationWhen"]` ✓

#### **VALIDATION LOGIC ANALYSIS:**
**Location:** `apps/form-app/src/app/step/[stepId]/page.tsx` (Lines 310-422)

**Step-by-step validation rules:**
- Step 0 (Personal): `['legalFirstName', 'legalLastName', 'socialSecurityNumber']`
- Step 1 (Contact): `['streetAddress', 'city', 'state', 'zipCode', 'phoneNumber', 'email']`  
- Step 2 (Citizenship): Conditional based on `citizenshipStatus`
- Steps 3-7: No required fields

**Navigation Control (Line 594):**
- Next button: `isCurrentStepValid` - validates current step required fields
- Submit button: `isFormReadyForSubmission` - validates all required fields

**Field Mapping Verification Status:**
✅ All PDF template fields documented
✅ All form component fields cataloged  
✅ All schema fields analyzed line-by-line
✅ Conditional validation logic mapped
⚠️ Field mismatches identified and tracked in todo list

### **FORM STEPS VERIFICATION**
**Location:** `apps/form-app/src/components/steps/`
**Action:** Manually verify form step fields match this document

#### **PersonalInfoStep.tsx - Fields Found:**
- Line 34: `register('legalFirstName')`
- Line 41: `register('middleInitial')`
- Line 49: `register('legalLastName')`
- Line 57: `register('otherLastNames')`
- Line 66: `register('dateOfBirth')`
- Line 77: `register('socialSecurityNumber')`

#### **ContactInfoStep.tsx - Fields Found:**
- Line 87: `register('streetAddress')`
- Line 95: `register('aptNumber')`
- Line 103: `register('city')`
- Line 116: `register('state')`
- Line 132: `register('zipCode')`
- Line 149: `register('phoneNumber')`
- Line 168: `register('homePhone')`
- Line 185: `register('email')`
- Line 197: `register('emergencyName')`
- Line 209: `register('emergencyPhone')`
- Line 224: `register('emergencyRelationship')`

#### **CitizenshipStep.tsx - Fields Found:**
- Line 71: `register('citizenshipStatus')`
- Line 81: `register('uscisANumber')` (conditional - lawful_permanent)
- Line 92: `register('workAuthExpiration')` (conditional - alien_authorized)
- Line 98: `register('alienDocumentType')` (conditional - alien_authorized)
- Line 107: `register('alienDocumentNumber')` (conditional - alien_authorized + uscis_a_number)
- Line 117: `register('i94AdmissionNumber')` (conditional - alien_authorized + form_i94)
- Line 128: `register('foreignPassportNumber')` (conditional - alien_authorized + foreign_passport)
- Line 135: `register('foreignPassportCountry')` (conditional - alien_authorized + foreign_passport)
- Line 153: `register('age18')`
- Line 161: `register('transportation')`
- Line 169: `register('workAuthorizationConfirm')`

#### **PositionStep.tsx - Fields Found:**
- Line 23: `register('positionApplied')`
- Line 30: `register('expectedSalary')`
- Line 38: `register('jobDiscovery')`
- *Uses EquipmentExperience and SkillsQualifications components*

#### **AvailabilityStep.tsx - Fields Found:**
- Line 42: `register('fullTimeEmployment')`
- Line 51: `register('swingShifts')`
- Line 60: `register('graveyardShifts')`
- Line 128: `register('availabilitySunday')` (conditional availability fields)
- Line 128: `register('availabilityMonday')` (conditional availability fields)
- Line 128: `register('availabilityTuesday')` (conditional availability fields)
- Line 128: `register('availabilityWednesday')` (conditional availability fields)
- Line 128: `register('availabilityThursday')` (conditional availability fields)
- Line 128: `register('availabilityFriday')` (conditional availability fields)
- Line 128: `register('availabilitySaturday')` (conditional availability fields)
- Line 173: `register('previouslyApplied')`
- Line 181: `register('previousApplicationWhen')` (conditional - when previouslyApplied = 'yes')

#### **EducationEmploymentStep.tsx - Fields Found:**
**Education array fields (up to 3 entries):**
- Line 123: `register(`education.${index}.schoolName`)`
- Line 130: `register(`education.${index}.graduationYear`)`
- Line 137: `register(`education.${index}.fieldOfStudy`)`
- Line 149: `register(`education.${index}.degreeReceived`)` (radio buttons)
- Line 158: `register(`education.${index}.degreeReceived`)` (radio buttons)

**Employment array fields (up to 3 entries):**
- Line 202: `register(`employment.${index}.companyName`)`
- Line 211: `register(`employment.${index}.startDate`)`
- Line 218: `register(`employment.${index}.endDate`)`
- Line 226: `register(`employment.${index}.startingPosition`)`
- Line 233: `register(`employment.${index}.endingPosition`)`
- Line 242: `register(`employment.${index}.supervisorName`)`
- Line 250: `register(`employment.${index}.supervisorPhone`)`
- Line 259: `register(`employment.${index}.responsibilities`)` (textarea)
- Line 271: `register(`employment.${index}.reasonForLeaving`)` (textarea)
- Line 287: `register(`employment.${index}.mayContact`)` (radio buttons)
- Line 296: `register(`employment.${index}.mayContact`)` (radio buttons)

#### **EquipmentExperience.tsx (UI Component) - Fields Found:**
- Line 94: `register('equipmentSD')`
- Line 94: `register('equipmentSU')`
- Line 94: `register('equipmentSUR')`
- Line 94: `register('equipmentCP')`
- Line 94: `register('equipmentCL')`
- Line 94: `register('equipmentRidingJack')`

#### **SkillsQualifications.tsx (UI Component) - Fields Found:**
**Note: This component uses setValue() instead of register():**
- Line 37: `setValue('skills1', '')`
- Line 38: `setValue('skills2', '')`
- Line 39: `setValue('skills3', '')`
- Line 43: `setValue('skills1', skill.value)`
- Line 44: `setValue('skills2', skill.value)`
- Line 45: `setValue('skills3', skill.value)`

#### **DocumentsStep.tsx - Fields Found:**
**Note: This component handles file uploads and uses setValue() for documents array:**
- Line 16: `watch('documents')` (documents array)
- Line 146: `setValue('documents', convertedDocuments)` 
- Watches equipment fields to determine certification upload requirements