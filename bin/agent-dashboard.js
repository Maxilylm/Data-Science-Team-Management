#!/usr/bin/env node
// bin/agent-dashboard.js

const { spawn } = require('child_process')
const path = require('path')

const PORT = process.env.PORT || 3456
const serverPath = path.join(__dirname, '../packages/server/dist/index.js')

console.log(`Starting Agent Team Dashboard on http://localhost:${PORT}`)

const server = spawn('node', [serverPath], {
  env: { ...process.env, PORT },
  stdio: 'inherit'
})

if (process.argv.includes('--open')) {
  const open = require('open')
  setTimeout(() => {
    open(`http://localhost:${PORT}`)
  }, 1000)
}

process.on('SIGINT', () => {
  server.kill()
  process.exit()
})
