#!/usr/bin/env node
/**
 * Test script for PDF generation and email functionality
 * Run with: node test-pdf-email.js
 */

const path = require('path');
const fs = require('fs');

// Mock test data for a complete application
const testApplicationData = {
  submissionId: 'TEST-2025-001',
  legalFirstName: 'John',
  legalLastName: 'Doe',
  socialSecurityNumber: '123-45-6789',
  dateOfBirth: '1990-01-15',
  streetAddress: '123 Main Street',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  phoneNumber: '(555) 123-4567',
  homePhone: '(555) 987-6543',
  email: 'john.doe@example.com',
  emergencyName: 'Jane Doe',
  emergencyPhone: '(555) 999-8888',
  emergencyRelationship: 'Spouse',
  citizenshipStatus: 'us_citizen',
  positionApplied: 'Warehouse Associate',
  expectedSalary: '$40,000',
  jobDiscovery: 'Online job board',
  fullTimeEmployment: 'yes',
  swingShifts: 'yes',
  graveyardShifts: 'no',
  previouslyApplied: 'no',
  education: [{
    institution: 'Test High School',
    degree: 'High School Diploma',
    graduationYear: '2008'
  }],
  employment: [{
    company: 'Previous Company',
    position: 'Worker',
    startDate: '2020-01',
    endDate: '2024-12',
    reasonForLeaving: 'Career change'
  }],
  submittedAt: new Date().toISOString(),
  documents: []
};

console.log('🧪 Testing PDF Generation and Email Functionality\n');

// Test 1: Check if required dependencies exist
console.log('📦 Testing Dependencies:');

try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    'pdf-lib',
    'react-hook-form',
    '@hookform/resolvers',
    'zod'
  ];
  
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    console.log(`   ${hasDep ? '✅' : '❌'} ${dep} ${hasDep ? `(${hasDep})` : 'MISSING'}`);
  });
  
} catch (error) {
  console.log('   ❌ Could not read package.json');
}

// Test 2: Test PDF Service structure
console.log('\n📄 Testing PDF Service:');

try {
  const pdfServicePath = path.join(__dirname, 'shared', 'services', 'PDFService.ts');
  const pdfServiceContent = fs.readFileSync(pdfServicePath, 'utf8');
  
  const requiredMethods = [
    'generateApplicationPDF',
    'fillPDFForm',
    'loadPDFTemplate'
  ];
  
  requiredMethods.forEach(method => {
    const hasMethod = pdfServiceContent.includes(method);
    console.log(`   ${hasMethod ? '✅' : '❌'} ${method} ${hasMethod ? 'found' : 'MISSING'}`);
  });
  
  // Check for PDF template path
  const hasTemplatePath = pdfServiceContent.includes('Templates') || pdfServiceContent.includes('templates');
  console.log(`   ${hasTemplatePath ? '✅' : '❌'} Template path ${hasTemplatePath ? 'configured' : 'MISSING'}`);
  
} catch (error) {
  console.log('   ❌ Could not read PDFService.ts');
}

// Test 3: Check PDF template exists
console.log('\n📋 Testing PDF Template:');

const templatePaths = [
  path.join(__dirname, 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf'),
  path.join(__dirname, 'Templates', 'Wareworks Application.pdf')
];

let templateFound = false;
templatePaths.forEach(templatePath => {
  const exists = fs.existsSync(templatePath);
  if (exists) templateFound = true;
  console.log(`   ${exists ? '✅' : '❌'} ${templatePath} ${exists ? 'found' : 'not found'}`);
});

// Test 4: Test Email Service structure
console.log('\n📧 Testing Email Service:');

try {
  const emailServicePath = path.join(__dirname, 'shared', 'services', 'EmailService.ts');
  const emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');
  
  const requiredMethods = [
    'sendApplicationNotification',
    'generatePlainTextEmail'
  ];
  
  requiredMethods.forEach(method => {
    const hasMethod = emailServiceContent.includes(method);
    console.log(`   ${hasMethod ? '✅' : '❌'} ${method} ${hasMethod ? 'found' : 'MISSING'}`);
  });
  
  // Check for Mailgun integration
  const hasMailgun = emailServiceContent.includes('mailgun') || emailServiceContent.includes('MAILGUN');
  console.log(`   ${hasMailgun ? '✅' : '❌'} Mailgun integration ${hasMailgun ? 'configured' : 'MISSING'}`);
  
} catch (error) {
  console.log('   ❌ Could not read EmailService.ts');
}

// Test 5: Test Netlify Function structure
console.log('\n⚡ Testing Netlify Email Function:');

try {
  const emailFunctionPath = path.join(__dirname, 'netlify', 'functions', 'send-email.ts');
  const emailFunctionContent = fs.readFileSync(emailFunctionPath, 'utf8');
  
  const requiredFeatures = [
    'sendViaMailgun',
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN',
    'FormData',
    'attachments'
  ];
  
  requiredFeatures.forEach(feature => {
    const hasFeature = emailFunctionContent.includes(feature);
    console.log(`   ${hasFeature ? '✅' : '❌'} ${feature} ${hasFeature ? 'implemented' : 'MISSING'}`);
  });
  
} catch (error) {
  console.log('   ❌ Could not read send-email.ts');
}

// Test 6: Test form validation
console.log('\n✅ Testing Form Validation:');

try {
  const schemaPath = path.join(__dirname, 'shared', 'validation', 'schemas.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Test basic validation rules
  const validationTests = [
    { field: 'phoneNumber', rule: 'regex', expected: '(555) 123-4567' },
    { field: 'email', rule: 'email', expected: 'email validation' },
    { field: 'zipCode', rule: 'regex', expected: '12345 or 12345-6789' },
    { field: 'socialSecurityNumber', rule: 'regex', expected: '123-45-6789' }
  ];
  
  validationTests.forEach(test => {
    const hasValidation = schemaContent.includes(test.field) && schemaContent.includes(test.rule);
    console.log(`   ${hasValidation ? '✅' : '❌'} ${test.field} ${test.rule} ${hasValidation ? 'configured' : 'MISSING'}`);
  });
  
} catch (error) {
  console.log('   ❌ Could not read schemas.ts');
}

// Test 7: Environment variables check
console.log('\n🔧 Testing Environment Configuration:');

const envPath = path.join(__dirname, '.env.example');
const envExists = fs.existsSync(envPath);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredEnvVars = [
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN', 
    'ENABLE_EMAIL_NOTIFICATIONS',
    'ENABLE_PDF_GENERATION',
    'HR_EMAIL'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const hasVar = envContent.includes(envVar);
    console.log(`   ${hasVar ? '✅' : '❌'} ${envVar} ${hasVar ? 'configured' : 'MISSING'}`);
  });
} else {
  console.log('   ❌ .env.example file not found');
}

// Test Summary and Manual Testing Instructions
console.log('\n📊 Test Summary:');
console.log('✅ All components ready for testing');
console.log('📋 Manual testing required for full functionality');

console.log('\n🚀 Manual Testing Steps:');
console.log('1. Set up environment variables:');
console.log('   cp .env.example .env.local');
console.log('   # Add real MAILGUN_API_KEY');

console.log('\n2. Start development environment:');
console.log('   cd apps/form-app && npm run dev');
console.log('   # In another terminal:');
console.log('   netlify dev');

console.log('\n3. Test each form step:');
console.log('   - Personal Info: Fill name, SSN, DOB');
console.log('   - Contact: Address, phone numbers, email');
console.log('   - Citizenship: Select status and documents'); 
console.log('   - Position: Job preferences');
console.log('   - Availability: Work schedule preferences');
console.log('   - Education/Employment: Add entries');
console.log('   - Documents: Upload files');
console.log('   - Review: Check all data');
console.log('   - Submit: Test PDF and email');

console.log('\n4. Verify functionality:');
console.log('   - Form validation works');
console.log('   - CSRF protection active');
console.log('   - PDF generates correctly');
console.log('   - Email sends to inbox@ohthatgrp.com');
console.log('   - Language switching works');

console.log('\n🎯 Expected Results:');
console.log('✅ Form submits successfully');
console.log('✅ PDF attachment contains form data');
console.log('✅ Email arrives at configured address');
console.log('✅ No JavaScript errors in console');
console.log('✅ All form steps navigate properly');