const test = require('node:test')
const assert = require('node:assert/strict')

const app = require('../src/app.js')

test('API gateway exposes /api/health and proxies to backend', async () => {
  const server = app.listen(0)
  const port = server.address().port

  try {
    const res = await fetch(`http://localhost:${port}/api/health`)
    const json = await res.json()

    assert.equal(res.status, 200)
    assert.equal(json.success, true)
    assert.equal(json.data.status, 'up')
  } finally {
    server.close()
  }
})
