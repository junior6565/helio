export default async function handler(req, res) {
  try {
    // Vercel auto-parses form bodies into objects — extract and re-encode
    let body
    if (typeof req.body === 'string') {
      body = req.body
    } else if (req.body && typeof req.body === 'object') {
      const query = req.body.data || ''
      body = 'data=' + encodeURIComponent(query)
    } else {
      return res.status(400).json({ error: 'Empty body' })
    }

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    const text = await response.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(text)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
