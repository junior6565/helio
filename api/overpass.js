export default async function handler(req, res) {
  try {
    const body = typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body)

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    })
    const text = await response.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(text)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
