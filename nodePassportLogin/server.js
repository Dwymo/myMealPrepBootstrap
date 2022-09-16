if (process.env.NODE_ENV !== 'production' ) {
    require ('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

//Using a Local Variable for the tutorial, not connecting to a database.
const users = []

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (request, response) => {
    response.render('index.ejs')
})

app.get('/login', checkNotAuthenticated, (request, response) => {
    response.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (request, response) => {
    response.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (request, response) => {
   try {
    const hashedPassword = await bcrypt.hash(request.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: request.body.name,
      email: request.body.email,
      password: hashedPassword
    })
    response.redirect('/login')
  } catch {
    response.redirect('/register')
  }
  console.log(users)
  
})

app.delete('/logout', (request, response) => {
    request.logout(function(err) {
        if (err) { return next(err); }
        response.redirect('/');
      });
})

function checkAuthenticated (request, response, next) {
    if (request.isAuthenticated()) {
        return next()
    }

    response.redirect('/login')
}

function checkNotAuthenticated (request, response, next) {
    if (request.isAuthenticated()) {
        return response.redirect('/') 
    }
    next()
}



app.listen(3000)