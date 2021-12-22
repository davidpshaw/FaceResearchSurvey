const express = require('express')
const app = express()
const port = 4848
const path = require('path')
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res, next) => {
  const options = {
    root: path.join('html')
  }

  const fileName = 'survey1.html'
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
})

app.post('/', (req, res, next) => {
  res.json({ req: JSON.stringify(req.body) })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
