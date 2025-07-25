#!/usr/bin/env node
/**
 * Test script to verify each form step functionality
 * Run with: node test-form-steps.js
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Form Steps and Components\n');

// Test 1: Verify all step components exist
const stepComponents = [
  'PersonalInfoStep.tsx',
  'ContactInfoStep.tsx', 
  'CitizenshipStep.tsx',
  'PositionStep.tsx',
  'AvailabilityStep.tsx',
  'EducationEmploymentStep.tsx',
  'DocumentsStep.tsx',
  'ReviewStep.tsx',
  'SuccessStep.tsx'
];

const stepsDir = path.join(__dirname, 'apps', 'form-app', 'src', 'components', 'steps');

console.log('📁 Testing Step Components:');
let componentsExist = true;

stepComponents.forEach(component => {
  const componentPath = path.join(stepsDir, component);
  const exists = fs.existsSync(componentPath);
  console.log(`   ${exists ? '✅' : '❌'} ${component} ${exists ? 'found' : 'MISSING'}`);
  if (!exists) componentsExist = false;
});

// Test 2: Verify schema exists and has required fields
console.log('\n📋 Testing Form Schema:');
const schemaPath = path.join(__dirname, 'shared', 'validation', 'schemas.ts');
const schemaExists = fs.existsSync(schemaPath);
console.log(`   ${schemaExists ? '✅' : '❌'} Schema file ${schemaExists ? 'found' : 'MISSING'}`);

if (schemaExists) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for key fields
  const requiredFields = [
    'legalFirstName',
    'legalLastName', 
    'phoneNumber',
    'homePhone',
    'socialSecurityNumber',
    'citizenshipStatus',
    'emergencyName',
    'emergencyPhone'
  ];
  
  requiredFields.forEach(field => {
    const hasField = schemaContent.includes(field);
    console.log(`   ${hasField ? '✅' : '❌'} ${field} ${hasField ? 'defined' : 'MISSING'}`);
  });
  
  // Check that cellPhone is removed
  const hasCellPhone = schemaContent.includes('cellPhone');
  console.log(`   ${!hasCellPhone ? '✅' : '❌'} cellPhone ${!hasCellPhone ? 'properly removed' : 'still exists'}`);
}

// Test 3: Verify service files exist
console.log('\n🔧 Testing Service Files:');
const serviceFiles = [
  'ApplicationService.ts',
  'EmailService.ts', 
  'PDFService.ts',
  'FileUploadService.ts'
];

const servicesDir = path.join(__dirname, 'shared', 'services');

serviceFiles.forEach(service => {
  const servicePath = path.join(servicesDir, service);
  const exists = fs.existsSync(servicePath);
  console.log(`   ${exists ? '✅' : '❌'} ${service} ${exists ? 'found' : 'MISSING'}`);
});

// Test 4: Check API routes
console.log('\n🌐 Testing API Routes:');
const apiRoutes = [
  'submit-application/route.ts',
  'csrf-token/route.ts'
];

const apiDir = path.join(__dirname, 'apps', 'form-app', 'src', 'app', 'api');

apiRoutes.forEach(route => {
  const routePath = path.join(apiDir, route);
  const exists = fs.existsSync(routePath);
  console.log(`   ${exists ? '✅' : '❌'} ${route} ${exists ? 'found' : 'MISSING'}`);
});

// Test 5: Check Netlify functions
console.log('\n⚡ Testing Netlify Functions:');
const netlifyFunctions = [
  'send-email.ts',
  'submit-application.ts',
  'upload-file.ts'
];

const functionsDir = path.join(__dirname, 'netlify', 'functions');

netlifyFunctions.forEach(func => {
  const funcPath = path.join(functionsDir, func);
  const exists = fs.existsSync(funcPath);
  console.log(`   ${exists ? '✅' : '❌'} ${func} ${exists ? 'found' : 'MISSING'}`);
});

// Test 6: Check middleware
console.log('\n🛡️ Testing Security Middleware:');
const middlewareFiles = [
  'rateLimiting.ts',
  'csrfProtection.ts'
];

const middlewareDir = path.join(__dirname, 'shared', 'middleware');

middlewareFiles.forEach(middleware => {
  const middlewarePath = path.join(middlewareDir, middleware);
  const exists = fs.existsSync(middlewarePath);
  console.log(`   ${exists ? '✅' : '❌'} ${middleware} ${exists ? 'found' : 'MISSING'}`);
});

// Test 7: Language functionality
console.log('\n🌍 Testing Language Support:');
const translationsPath = path.join(__dirname, 'apps', 'form-app', 'src', 'translations', 'index.ts');
const translationsExist = fs.existsSync(translationsPath);
console.log(`   ${translationsExist ? '✅' : '❌'} Translations ${translationsExist ? 'found' : 'MISSING'}`);

if (translationsExist) {
  const translationsContent = fs.readFileSync(translationsPath, 'utf8');
  const hasEnglish = translationsContent.includes('en:');
  const hasSpanish = translationsContent.includes('es:');
  console.log(`   ${hasEnglish ? '✅' : '❌'} English translations ${hasEnglish ? 'found' : 'MISSING'}`);
  console.log(`   ${hasSpanish ? '✅' : '❌'} Spanish translations ${hasSpanish ? 'found' : 'MISSING'}`);
}

// Summary
console.log('\n📊 Test Summary:');
if (componentsExist && schemaExists && translationsExist) {
  console.log('✅ All critical components appear to be in place');
  console.log('✅ Ready for form step testing');
} else {
  console.log('❌ Some critical components are missing');
  console.log('❌ Fix missing components before testing');
}

console.log('\n🚀 Next Steps:');
console.log('1. Start development server: npm run dev');
console.log('2. Test each form step manually');
console.log('3. Test PDF generation and email sending');
console.log('4. Verify CSRF protection is working');
console.log('5. Test file upload functionality');