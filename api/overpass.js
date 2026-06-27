export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  try {
    // Read raw body chunks (bodyParser disabled)
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()

    const response = await fetch('https://overpass.kumi.systems/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'helio-app/1.0 (helio-bay.vercel.app)'
      },
      body,
    })
    const text = await response.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(text)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
