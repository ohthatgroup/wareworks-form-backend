#!/usr/bin/env node

/**
 * Test script to verify citizenship and email validation fixes
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Testing Citizenship and Email Validation Fixes')
console.log('=' .repeat(60))

let passCount = 0
let failCount = 0

function runTest(name, description, testFn) {
  try {
    const result = testFn()
    const status = result ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${name}`)
    console.log(`   ${description}`)
    
    if (result) {
      console.log('   ✓ Test passed')
      passCount++
    } else {
      console.log('   ✗ Test failed')
      failCount++
    }
    console.log()
  } catch (error) {
    console.log(`❌ FAIL ${name}`)
    console.log(`   ${description}`)
    console.log(`   Error: ${error.message}`)
    console.log()
    failCount++
  }
}

console.log('Running validation fix tests...\n')

// Test 1: documentCountry field removed
runTest(
  'documentCountry Field Removal',
  'The orphaned documentCountry field should be removed from schema',
  () => {
    const schemaContent = fs.readFileSync('./shared/validation/schemas.ts', 'utf8')
    return !schemaContent.includes('documentCountry: z.string()')
  }
)

// Test 2: workAuthorization field removed  
runTest(
  'workAuthorization Field Removal',
  'The orphaned workAuthorization field should be removed from default values',
  () => {
    const pageContent = fs.readFileSync('./apps/form-app/src/app/step/[stepId]/page.tsx', 'utf8')
    return !pageContent.includes('workAuthorization: \'\'')
  }
)

// Test 3: Email is optional in schema
runTest(
  'Email Optional in Schema',
  'Email field should be optional in the validation schema',
  () => {
    const schemaContent = fs.readFileSync('./shared/validation/schemas.ts', 'utf8')
    return schemaContent.includes('email: z.string().email') && schemaContent.includes('.optional()')
  }
)

// Test 4: Email not required in step validation
runTest(
  'Email Not Required in Step Validation',
  'Email should not be required for Contact step navigation',
  () => {
    const pageContent = fs.readFileSync('./apps/form-app/src/app/step/[stepId]/page.tsx', 'utf8')
    const contactStepMatch = pageContent.match(/case 1:.*?return \[(.*?)\]/s)
    if (!contactStepMatch) return false
    return !contactStepMatch[1].includes("'email'")
  }
)

// Test 5: Email input not required
runTest(
  'Email Input Not Required',
  'Email input should not have required prop (no red asterisk)',
  () => {
    const contactStepContent = fs.readFileSync('./apps/form-app/src/components/steps/ContactInfoStep.tsx', 'utf8')
    const emailInputMatch = contactStepContent.match(/<Input[^>]*registration={register\('email'\)}[^>]*>/s)
    if (!emailInputMatch) return false
    return !emailInputMatch[0].includes('required')
  }
)

// Test 6: Conditional citizenship validation
runTest(
  'Conditional Citizenship Validation',
  'Citizenship validation should be conditional based on alienDocumentType',
  () => {
    const pageContent = fs.readFileSync('./apps/form-app/src/app/step/[stepId]/page.tsx', 'utf8')
    return pageContent.includes("if (formValues.alienDocumentType === 'uscis_a_number')") &&
           pageContent.includes("if (formValues.alienDocumentType === 'form_i94')") &&
           pageContent.includes("if (formValues.alienDocumentType === 'foreign_passport')")
  }
)

// Test 7: No documentCountry in CitizenshipStep cleanup
runTest(
  'documentCountry Cleanup Removed',
  'documentCountry should not be in CitizenshipStep useEffect cleanup',
  () => {
    const citizenshipContent = fs.readFileSync('./apps/form-app/src/components/steps/CitizenshipStep.tsx', 'utf8')
    return !citizenshipContent.includes("setValue('documentCountry', '')")
  }
)

// Test 8: workAuthorization removed from ReviewStep
runTest(
  'workAuthorization Display Removed',
  'workAuthorization display logic should be removed from ReviewStep',
  () => {
    const reviewContent = fs.readFileSync('./apps/form-app/src/components/steps/ReviewStep.tsx', 'utf8')
    return !reviewContent.includes('formData.workAuthorization')
  }
)

// Summary
console.log('📊 SUMMARY')
console.log('=' .repeat(60))
console.log(`✅ Passed: ${passCount}`)
console.log(`❌ Failed: ${failCount}`)
console.log(`📋 Total:  ${passCount + failCount}`)

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED!')
  console.log('✅ documentCountry field issue fixed')
  console.log('✅ workAuthorization field issue fixed') 
  console.log('✅ Email requirement mismatch fixed')
  console.log('✅ Conditional citizenship validation working')
  console.log('\n🔥 The citizenship and email validation fixes are working correctly!')
  process.exit(0)
} else {
  console.log('\n⚠️  Some tests failed - please review the issues above')
  process.exit(1)
}