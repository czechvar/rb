#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

const defaults = {
  keep: 3,
  project: 'rockbusters',
  scope: 'jan-antls-projects',
}

function printUsage() {
  console.log(`Usage: pnpm vercel:cleanup-deployments [options]

Options:
  --project <name>  Vercel project name (default: ${defaults.project})
  --scope <name>    Vercel team scope (default: ${defaults.scope})
  --keep <number>   Number of newest deployments to keep (default: ${defaults.keep})
  --execute         Delete deployments instead of printing the plan
  --unsafe          Do not skip deployments with active aliases
  --help            Show this help
`)
}

function parseArgs(argv) {
  const options = { ...defaults, execute: false, safe: true }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--help') {
      printUsage()
      process.exit(0)
    }

    if (argument === '--execute') {
      options.execute = true
      continue
    }

    if (argument === '--unsafe') {
      options.safe = false
      continue
    }

    const match = argument.match(/^--(project|scope|keep)=(.+)$/)
    if (match) {
      options[match[1]] = match[2]
      continue
    }

    if (['--project', '--scope', '--keep'].includes(argument)) {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value`)
      }
      options[argument.slice(2)] = value
      index += 1
      continue
    }

    throw new Error(`Unknown option: ${argument}`)
  }

  options.keep = Number(options.keep)
  if (!Number.isInteger(options.keep) || options.keep < 1) {
    throw new Error('--keep must be a positive integer')
  }

  return options
}

function runVercel(argumentsList) {
  try {
    return execFileSync(
      'npx',
      ['--yes', 'vercel@latest', '--non-interactive', ...argumentsList],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (error) {
    const command = ['npx', '--yes', 'vercel@latest', ...argumentsList].join(' ')
    const stderr = error?.stderr?.toString() ?? ''
    const structuredError = stderr
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('{') && line.endsWith('}'))
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .find(Boolean)
    const reason = structuredError?.message ?? structuredError?.reason ?? 'unknown error'
    const failure = new Error(`Vercel command failed (${reason}): ${command}`)
    failure.reason = reason
    throw failure
  }
}

function listDeployments(options) {
  const deployments = []
  let next

  do {
    const argumentsList = [
      'list',
      options.project,
      '--scope',
      options.scope,
      '--json',
      '--limit',
      '100',
    ]

    if (next) {
      argumentsList.push('--next', String(next))
    }

    const response = JSON.parse(runVercel(argumentsList))
    deployments.push(...(response.deployments ?? []))
    next = response.pagination?.next ?? null
  } while (next)

  return deployments
}

function deploymentTimestamp(deployment) {
  return Number(deployment.createdAt ?? 0)
}

function formatDeployment(deployment) {
  const environment = deployment.target ?? 'preview'
  const state = deployment.state ?? 'unknown'
  return `${deployment.url} [${environment}, ${state}]`
}

function removeDeployment(deployment, options) {
  const argumentsList = [
    'remove',
    deployment.url,
    '--scope',
    options.scope,
    '--yes',
  ]

  if (options.safe) {
    argumentsList.push('--safe')
  }

  try {
    runVercel(argumentsList)
    return { deleted: true }
  } catch (error) {
    return { deleted: false, reason: error?.reason ?? 'unknown error' }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const deployments = listDeployments(options).sort(
    (left, right) => deploymentTimestamp(right) - deploymentTimestamp(left),
  )
  const retained = deployments.slice(0, options.keep)
  const candidates = deployments.slice(options.keep)

  console.log(`Project: ${options.scope}/${options.project}`)
  console.log(`Found: ${deployments.length} deployments`)
  console.log(`Keeping: ${retained.length} newest deployments`)
  retained.forEach((deployment) => console.log(`  KEEP ${formatDeployment(deployment)}`))
  console.log(`${options.execute ? 'Deleting' : 'Would delete'}: ${candidates.length} deployments`)

  if (!options.execute) {
    candidates.forEach((deployment) => console.log(`  DELETE ${formatDeployment(deployment)}`))
    console.log('Dry run only. Re-run with --execute to delete.')
    return
  }

  let deleted = 0
  let skipped = 0
  for (const deployment of candidates) {
    const result = removeDeployment(deployment, options)
    if (result.deleted) {
      deleted += 1
      console.log(`  DELETED ${formatDeployment(deployment)}`)
    } else {
      skipped += 1
      console.log(`  SKIPPED ${formatDeployment(deployment)} [${result.reason}]`)
    }
  }

  console.log(`Completed: ${deleted} deleted, ${skipped} skipped`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Cleanup failed')
  process.exitCode = 1
}
