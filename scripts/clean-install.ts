const { execSync } = require('child_process')
const { rmSync } = require('fs')
const { join } = require('path')

function cleanAndInstall(): void {
  try {
    // Clean build directories
    console.log('Cleaning build directories...')
    const dirsToClean = ['.next', 'node_modules']
    
    for (const dir of dirsToClean) {
      try {
        rmSync(join(process.cwd(), dir), { recursive: true, force: true })
        console.log(`✓ Removed ${dir}`)
      } catch (err) {
        console.warn(`Warning: Could not remove ${dir}:`, err)
      }
    }

    // Install dependencies
    console.log('\nInstalling dependencies...')
    execSync('npm install', { stdio: 'inherit' })
    console.log('✓ Dependencies installed')

    // Generate Prisma client
    console.log('\nGenerating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✓ Prisma client generated')

    console.log('\nSetup completed successfully!')
  } catch (err) {
    console.error('Error during setup:', err)
    process.exit(1)
  }
}

cleanAndInstall() 