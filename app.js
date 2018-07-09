const express = require('express')
const app = express()
const port = process.env.PORT || 4000
app.post('https://mst-line-bot.herokuapp.com', (req, res) => res.sendStatus(200))
app.listen(port)
