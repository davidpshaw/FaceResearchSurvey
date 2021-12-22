const express = require('express')
const app = express()
const port = 4848
const eta = require('eta')
const path = require('path')
const fs = require('fs')
const { parse } = require('json2csv')
const session = require('express-session')
const cookieParser = require('cookie-parser')

const numberOfImagesPerSurvey = 20

// process urlencoded form data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// config for Eta template rendering engine
app.engine('eta', eta.renderFile)
app.set('view engine', 'eta')
app.set('views', './views')

app.use('/images', express.static('images'))
app.use(cookieParser())
app.use(session({
  secret: 'DFF06695-02F7-4484-B0B2-4F89860C75B6',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: (1000 * 60 * 60 * 24) }
})) // session config

/// /

// some tools to get the images
const loadAllImageNames = () => {
  const directoryPath = path.join(__dirname, 'images')
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return console.log('Unable to scan directory: ' + err)
    }
    app.allImages = files
  })
}

const chooseRandomImagesFromArray = (originalArray, imageCount) => {
  const dupArray = originalArray.slice()
  const newArray = []

  while (newArray.length < imageCount) {
    const random = Math.floor(Math.random() * dupArray.length)
    newArray.push(dupArray[random])
    dupArray.splice(random, 1)
  }

  return newArray
}

const addImageDataToSession = (req, imageName, attractiveness, symmetrical) => {
  const data = {
    attractiveness: attractiveness,
    symmetrical: symmetrical
  }
  addDataToSession(req, imageName, data)
}

const addMetaDataToSession = (req, first, last, age, race, ethnicity, livedLocations) => {
  const data = {
    first: first,
    last: last,
    age: age,
    race: race,
    ethnicity: ethnicity,
    livedLocations: livedLocations
  }
  addDataToSession(req, 'meta', data)
}

const addDataToSession = (req, key, data) => {
  if (!req.session.surveyResponse) {
    req.session.surveyResponse = {}
  }

  req.session.surveyResponse[key] = data
}

const writeCompleteSurveyDataToFile = (data) => {
  try {
    const writeData = JSON.stringify(data)
    fs.appendFile('survey.log', writeData, (err) => {
      if (err) {
        throw err
      }
      console.log('File was updated.')
    })
  } catch (err) {
    console.error(err)
  }
}

/// /

app.get('/', (req, res, next) => {
  // for each new session, define some survey images from the full set
  if (!req.session.surveyImages) {
    req.session.surveyImages = chooseRandomImagesFromArray(app.allImages, numberOfImagesPerSurvey)
    console.log(`new ${req.session.surveyImages}`)
  } else {
    console.log(`existing ${req.session.surveyImages}`)
  }
  req.session.save()

  res.render('survey1', {
    stage: -1
  })
})

app.post('/', (req, res, next) => {
  const prevStage = req.body.stage
  const nextStage = parseInt(prevStage) + 1

  if (req.body.age) {
    console.log(req.body)
    addMetaDataToSession(req, req.body.firstName, req.body.lastName, req.body.age, req.body.ethnicity, req.body.livedLocations)
  }
  if (req.body.imageName) {
    addImageDataToSession(req, req.body.imageName, req.body.attractiveness, req.body.symmetrical)
  }

  if (req.session.surveyImages) {
    console.log(`existing ${req.session.surveyImages}`)
  } else {
    console.log('failed')
  }
  console.log(`stage ${nextStage}`)

  if (nextStage >= numberOfImagesPerSurvey) {
    writeCompleteSurveyDataToFile(req.session.surveyResponse)
    res.render('surveyComplete', {
      surveyResponse: req.session.surveyResponse
    })
  } else {
    res.render('surveyImage', {
      stage: nextStage,
      imageName: req.session.surveyImages[nextStage]
    })
  }
})

loadAllImageNames()

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
