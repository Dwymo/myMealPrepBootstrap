/*!
* Start Bootstrap - Bare v5.0.7 (https://startbootstrap.com/template/bare)
* Copyright 2013-2021 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-bare/blob/master/LICENSE)
*/
// This file is intentionally blank
// Use this file to add JavaScript to your project

/*
	Usefull Links:

	https://expressjs.com/en/starter/basic-routing.html
	https://www.w3schools.com/nodejs/nodejs_mysql.asp
	https://jodiss-tri.medium.com/build-a-login-system-in-node-js-using-passport-js-and-mysql-52667cf3cc40
    https://bootcamp.rocketacademy.co/3-backend-applications/3.2-ejs/3.2.1-ejs-loops

    
	Additional Information:
	run this file to connect to DB then go to: http://localhost:3000, on web browser to view the code. 
*/

/*
	Modules: Need to research more about modules
	
	db - Database connection in db.js file - Currently removed this file to test if gitignore will work for uploading to Github
	express - web framework
	path - navigation
*/

if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const mysql = require('mysql2');
var session = require('express-session');
const { localsName } = require('ejs');
const { runInNewContext } = require('vm');
var MySQLStore = require('express-mysql-session')(session);

/* Need to look into app.use middleware more */

const app = express();

app.use(session({
//Removed private information to test gitignore and upload to GitHub.
key: process.env.SESSION_KEY,
secret: process.env.SESSION_SECRET,
store: new MySQLStore({
    host     : process.env.SESSION_HOST,
    user     : process.env.SESSION_USER,
    password : process.env.SESSION_PASSWORD,
    database : process.env.SESSION_DATABASE,
}),
resave: false,
saveUninitialized: false,
cookie:{
    maxAge:1000*60*60*24,
}
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(express.static('public'));
app.use(express.static('views'));

// setting up EJS filetype
app.set('view engine', 'ejs');

//listen for the user to access port 3000 in the localhost
app.listen(3000);



const customFields= {
	usernameField: 'username',
	passwordField: 'password',
};
// const usernameField = 'uname';
// const passwordField = 'pw';


function verifyUser(username, password, done) {

    db.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
        //console.log(results[0]);
        if (error){
            return done(error);
        }
        if (results.length==0)
        {
            return done(null, false, {message: 'No user with that email'});
        }
        const isValid=validPassword(password,results[0].password);
        user = {
            id: results[0].id,
            username: results[0].username,
            password: results[0].password
        };
        //console.log(user);
        if(isValid)
        {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    });  
}


const Strategy = new LocalStrategy(customFields, verifyUser);
passport.use(Strategy);


passport.serializeUser((user, done) => {
    console.log('inside serialize');
    done(null,user.id)
});

passport.deserializeUser(function(userId, done){
    console.log('deserializeUser ' + userId);
    db.query('SELECT * FROM users WHERE id = ?', [userId], function(error, results) {
        done(null, results[0]);
		user = {
            id: results[0].id,
            username: results[0].username,
            password: results[0].password
        };
		console.log(user);
    });
});

async function validPassword(password,usersPassword)
{
    var hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword === usersPassword;
}

function isAuth(request, response, next)
{
    if(request.isAuthenticated())
    {
        next();
    }
    else {
        response.redirect('/login');
    }
}

function isNotAuth(request, response, next)
{
    if(request.isAuthenticated())
    {
        response.redirect('/profile');
    }
    else {
        next();
    }
}

function isLoggedIn(request, response, next)
{
    if(request.isAuthenticated())
    {
        console.log(user);
		next();
    }
    else {
        next();
    }
}

function userExists(request, response, next)
{
    db.query('SELECT * FROM users WHERE username = ?', [request.body.username], function(error, results, fields) {
        if (error)
        {
            console.log("Error");
        }
        else if (results.length > 0)
        {
            response.redirect('/userAlreadyExists')
        }
        else
        {
            next()
        }
    });
}

function renderFood (request, response, next){
    db.query('SELECT * FROM food', function(error, results, fields) {
        if (error)
        {
            console.log("Error");
        }
        else if (results.length > 0)
        {
            allFood = [];
            results.forEach(result => {
                foodItem = {
                    id: result.id,
                    name: result.name,
                    weight: result.amount + ' ' + result.measurement,
                    calories: result.calories,
                    carbohydrates: result.carbohydrates,
                    fat: result.fat,
                    protein: result.protein,
                    saturates: result.saturates,
                    sugars: result.sugars,
                    salt: result.salt,
                    fiber: result.fiber,
                    addedByID: result.id,     
                }
                allFood.push(foodItem);
            });
            console.log(allFood[0]);
            next();
        }
    });
}

// when the follow page is accessed: http://localhost:3000/auth
app.post('/createAccount', async function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	let passwordConfirm = request.body.passwordConfirm;
	//hash/bcrypt the password, run through the process 10 times and await for all to be completed, then store in a new variable
	const hashedPassword = await bcrypt.hash(password, 10)
	// Ensure the input fields exists and are not empty
	if (username && password && passwordConfirm) {
		// If the Password matches the confirmed password
		if(password == passwordConfirm){
			// Execute SQL query to check if an account already existsbased on the specified username and password
			db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
				// If there is an issue with the query, output the error
				if (error) throw error;
				// If the account exists
				if (results.length > 0) {
					// Inform that Account already exists
					response.send('Account already exists!');	
				} else {
					// Execute SQL query to Create Account for User using entered details
					db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, username], function(error, results, fields) {
						// If there is an issue with the query, output the error
						if (error) throw error;
						// If the account gets created
						console.log("Account Created");
						response.redirect('/login');
					});
				}
			});
		} else {
			response.send('Password does not match the confirmed password!');
			response.end();
		}
	} else {
		response.send('Please enter Username, Password and confirm the Password!');
		response.end();
	}
});


/* Get requests to load up the required page at http://localhost:3000/ */


app.get('/', isLoggedIn, function(request, response) {
	// Render the page index.html
	response.render('index.ejs', {error: false});
});

app.get('/login', isNotAuth, function(request,response) {
	response.render('login.ejs');
});

app.post('/login',passport.authenticate('local',{failureRedirect:'/login-failure',successRedirect:'/login-success'}));
//app.post('/login', passport.authenticate('', { successRedirect: '/profile', failureRedirect: '/login' }));


app.get('/login-success', (request, response, next) => {
	response.send('<p>you succesfully logged in. <a href="/profile"> go to your profile</a></p>')
});

app.get('/login-failure', (request, response, next) => {
    response.send('you entered the wrong password')
});

app.get('/register', function(request,response) {
	response.render('register.ejs');
});

app.get('/addIngredient', function(request,response) {
	response.render('addIngredient.ejs');
});

app.post('/logout', function(request, response, next) {
    request.logout(function(err) {
        if (err) { return next(err); }
        response.redirect('/');
        delete user;
        console.log('User has logged out');
      });
})

app.get("/profile", isAuth, (request, response) => {
	response.render('profile.ejs');
});

app.get('/ingredients', renderFood, function(request,response) {
    response.render('ingredients.ejs');
});


app.get("/recipes", (request, response) => {
	response.sendFile(path.join(__dirname + '/recipes.html'));
});

app.post('/createFoodItem', function(request, response, next) {
    // Capture the input fields
    let foodName = request.body.foodName;
    let shop = request.body.shop;
    let amount = request.body.amount;
    let measurement = request.body.measurement;
    let calories = request.body.calories;
    let carbohydrates = request.body.carbohydrates;
    let fat = request.body.fat;
    let protein = request.body.protein;
    let saturates = request.body.saturates;
    let sugars = request.body.sugars;
    let salt = request.body.salt;
    let fiber = request.body.fiber;
    let addedByID = user.id;
    let currentDateTime = new Date();
    let isPrivate = request.body.isPrivate;
    if(isPrivate == null) {
        isPrivate = 0
    } else{
        isPrivate = 1
    }

    

    if(user){
        db.query('INSERT INTO food (name, shop, amount, measurement, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, addedByID, addedDateTime, isPrivate)'
        + 'VALUES (?, ?, ?, ?, ? , ?, ? , ? , ?, ? , ?, ? , ?, ?, ?)',
        [foodName, shop, amount, measurement, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, addedByID, currentDateTime, isPrivate],
        function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the food item is added
            console.log('Food Item has been Created');
            console.log(isPrivate);
            response.redirect('/ingredients');
        });
        
    }
        
      });