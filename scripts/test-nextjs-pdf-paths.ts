#!/usr/bin/env tsx

/**
 * Test Next.js PDF Path Resolution
 * 
 * This script simulates the Next.js runtime environment to test
 * that PDF template paths resolve correctly in both dev and production.
 */

import * as path from 'path'
import * as fs from 'fs/promises'

async function testPathResolution() {
  console.log('🧪 Testing PDF Template Path Resolution...')
  console.log('=' .repeat(50))
  
  const originalCwd = process.cwd()
  console.log(`📁 Original working directory: ${originalCwd}`)
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Root Directory Context (Standalone Scripts)',
      cwd: originalCwd,
      expected: path.join(originalCwd, 'apps', 'form-app', 'public', 'templates')
    },
    {
      name: 'Next.js Development Context',
      cwd: path.join(originalCwd, 'apps', 'form-app'),
      expected: path.join(originalCwd, 'apps', 'form-app', 'public', 'templates')
    }
  ]
  
  for (const scenario of scenarios) {
    console.log(`\n🎯 Testing: ${scenario.name}`)
    console.log(`   Simulated CWD: ${scenario.cwd}`)
    
    // Simulate the PDFService path resolution logic
    const baseDir = scenario.cwd
    let templatePath: string
    
    // Check if we're in Next.js context (already in apps/form-app)
    if (baseDir.endsWith('form-app') || baseDir.includes('form-app') && !baseDir.endsWith('wareworks-form-backend')) {
      templatePath = path.join(baseDir, 'public', 'templates', 'Wareworks Application.pdf')
    } else {
      // We're in root directory context
      templatePath = path.join(baseDir, 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf')
    }
    
    console.log(`   📋 Resolved path: ${templatePath}`)
    
    // Check if files exist
    try {
      await fs.access(templatePath)
      console.log(`   ✅ WareWorks template found`)
    } catch (error) {
      console.log(`   ❌ WareWorks template NOT found`)
    }
    
    // Test I-9 template too
    const i9Path = templatePath.replace('Wareworks Application.pdf', 'i-9.pdf')
    try {
      await fs.access(i9Path)
      console.log(`   ✅ I-9 template found`)
    } catch (error) {
      console.log(`   ❌ I-9 template NOT found`)
    }
  }
  
  console.log(`\n📊 Path Resolution Test Complete`)
  console.log(`\n📝 Next Steps:`)
  console.log(`   1. Run 'npm run dev' to test development server`)
  console.log(`   2. Submit a test form with documents`)
  console.log(`   3. Verify both submission and download work`)
  console.log(`   4. Check console logs for path resolution messages`)
}

async function main() {
  console.log('🚀 Starting Next.js PDF Path Resolution Test...')
  
  await testPathResolution()
  
  console.log('\n✨ Test completed! Ready to test in Next.js runtime.')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { testPathResolution }