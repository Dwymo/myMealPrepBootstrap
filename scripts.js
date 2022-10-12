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

//not sure how this works at present
if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

// Accessing both the Database and the Passport Configuration so need to require both files
const db = require('./db');
const initializePassport = require('./passport-config');

const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
var session = require('express-session');
const e = require('express');
var MySQLStore = require('express-mysql-session')(session);

/* Need to look into app.use middleware more */

const app = express();
app.use(session({
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

initializePassport (passport);
// Currently deserialize runs 3 times, need to invetigate why this is happening but code works regardless currently
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// Use the public folder to enable the Bootstrap CSS file
app.use(express.static('public'));
// Use the views folder to allow navigation to these files
app.use(express.static('views'));
// setting up EJS filetype
app.set('view engine', 'ejs');

//listen for the user to access port 3000 in the localhost
app.listen(3000);



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
        //console.log(user);
		next();
    }
    else {
        next();
    }
}

// function userExists(request, response, next)
// {
//     db.query('SELECT * FROM users WHERE username = ?', [request.body.username], function(error, results, fields) {
//         if (error)
//         {
//             console.log("Error");
//         }
//         else if (results.length > 0)
//         {
//             response.redirect('/userAlreadyExists')
//         }
//         else
//         {
//             next()
//         }
//     });
// }

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
            next();
        }
    });
}

function renderRecipes (request, response, next){
    db.query('SELECT * FROM recipes', function(error, results, fields) {
        if (error)
        {
            console.log("Error");
        }
        else if (results.length > 0)
        {
            allRecipes = [];
            results.forEach(result => {
                recipe = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    type: result.type,
                    serves: result.serves,
                }
                allRecipes.push(recipe);
                console.log(allRecipes);
            });
            next();
        }
    });
}


/*
Data Validation was originally being done for each field individually but some validation (such as checking for blank field), was required for multiple fields.
Doing it this way resulted in haveng a lot of duplicate code (multiple lines for each validation) in each field.
Could remove bloating by separating each validation into a method here and call the required validations in each field later.
*/
function validateBlankField (input, field, messages) {
//replace each string(/s) with '' to make it empty, /g continues to go through each string even after a succesfull replace (removing /g will stop the replace after first success)
//if the length does not (!) exist (there are no valid characters in the string).
//return(stop the code) and log that the input field is blank
    if(!input.replace(/\s/g, '').length)
    {
        messages.push(`${field} is blank`);
    }
}

function validateNumber (input, field, messages){
    //if the input is not a number
    if(input < 0)
    {
        messages.push(`${field} cannot be less than 0`);
    }

}

//First: Ensure the 'required fields' actually contain data.



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

app.get('/', isLoggedIn, function(request, response) {
	// Render the page index.html
	response.render('index.ejs', {error: false});
});

app.get('/login', isNotAuth, function(request,response) {
	response.render('login.ejs');
});

app.post('/login',passport.authenticate('local',{failureRedirect:'/login-failure',successRedirect:'/profile'}));
//app.post('/login', passport.authenticate('', { successRedirect: '/profile', failureRedirect: '/login' }));


app.get('/login-failure', (request, response, next) => {
    response.send('you entered the wrong password')
});

app.get('/register', function(request,response) {
	response.render('register.ejs');
});

app.get('/createFood', function(request,response) {
	response.render('createFood.ejs');
});

app.get('/viewFood/food=:id', function(request, response) {
    // response.render('viewFood.ejs', {id: request.params.id});
    console.log("button working " + request.params.id)

    db.query('SELECT * FROM food where id = ?', [request.params.id], function(error, result, fields) {
        if (error)
        {
            console.log("Error");
        }
        else if (result.length > 0)
        {
            const food = {
                    id: result[0].id,
                    name: result[0].name,
                    brand: result[0].brand,
                    shop: result[0].shop,
                    cost: result[0].cost,
                    amount: result[0].amount,
                    measurement: result[0].measurement,
                    servings: result[0].servings,
                    calories: result[0].calories,
                    carbohydrates: result[0].carbohydrates,
                    fat: result[0].fat,
                    protein: result[0].protein,
                    saturates: result[0].saturates,
                    sugars: result[0].sugars,
                    salt: result[0].salt,
                    fiber: result[0].fiber,
                    addedByID: result[0].addedByID,
                    addedDateTime: result[0].addedDateTime,
                    isPrivate: result[0].isPrivate
                };
                console.log(food.name);
                response.render('viewFood.ejs', {food});

        }
    });

});

app.get('/editRecipe/recipe=:id', function(request, response) {
    // response.render('viewFood.ejs', {id: request.params.id});
    console.log("button working " + request.params.id)

    db.query('SELECT * FROM recipes where id = ?', [request.params.id], function(error, result, fields) {
        if (error)
        {
            console.log("Error");
        }
        else if (result.length > 0)
        {
            const recipe = {
                    id: result[0].id,
                    name: result[0].name,
                    description: result[0].description,
                    type: result[0].type,
                    serves: result[0].serves,
                };
                console.log(recipe.name);
                response.render('editRecipe.ejs', {recipe});

        }
    });

});

app.get('/createRecipe', function(request,response) {
	response.render('createRecipe.ejs');
});

app.post('/createRecipe', function(request,response, next) {
    // Capture the input fields
    let name = request.body.name;
    let description = request.body.description;
    let type = request.body.type;
    let serves = request.body.serves;
    let isPrivate = 0; //temp for private field

    // Create an array to store all failed field messages (allow all messages to display at once)
    let messages = [];
    validateBlankField(name,'Name', messages);
    validateBlankField(description,'Description', messages);
	
    if(messages.length > 0) {
        console.log(messages.join('\n'))
        return {message: messages.join('\n')};
    }

    if(user){
        db.query('INSERT INTO recipes (name, description, type, serves, isPrivate)'
        + 'VALUES (?, ?, ?, ?, ?)',
        [name, description, type, serves, isPrivate],
        function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the food item is added
            console.log(`recipe: ${name} has been Created`);
       
            db.query('SELECT * FROM recipes where name = ?', [name], function(error, results, fields){
                if (error) throw error;
                const id = results[0].id;
                console.log(results[0]);
                response.redirect('/editRecipe/recipe='+id);
            });
            console.log('Test end of creating recipe')
        });
        
    }
    
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


// app.get('/food', renderFood, function(request,response) {
//     response.render('food.ejs');
// });

app.get('/food/recipe=:id', renderFood, function(request,response) {
    console.log('Recipe id is: '+request.params.id);
    if(request.params.id){
        const recipeID = request.params.id;
    response.render('food.ejs', {id: recipeID});

    }
    else{
        response.render('food.ejs');
    }

    // console.log("button working " + request.params.id)
});




app.get('/recipes', renderRecipes, function(request,response) {
    response.render('recipes.ejs');
});

app.post('/createFoodItem', function(request, response, next) {
    // Capture the input fields
    let name = request.body.name;
    let brand = request.body.brand;
    let shop = request.body.shop;
    let cost = request.body.pound * 100 + request.body.pence; //multiply the pound by 100 to convert it to pense
    //let cost = request.body.pence; //easier to test temporarily without the calculation
    let amount = request.body.amount;
    let measurement = request.body.measurement;
    let servings = request.body.servings;
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
    // Validate the entered food details above
    
    /* 
        Too much bloating.
        After the first fail the code stops so you cant log all errors at once.
        Removing the returns will prevent the code from stopping if one or more has an error
            if(!name.replace(/\s/g, '').length){
                return console.log('Name is blank');
            }
            if(!amount.replace(/\s/g, '').length){
                return console.log('Amount is blank');
            }
            if(!measurement.replace(/\s/g, '').length){
                return console.log('Measurement is blank');
            }
            if(!servings.replace(/\s/g, '').length){
                return console.log('Servings is blank');
            }
            if(!calories.replace(/\s/g, '').length){
                return console.log('Calories is blank');
            }
            if(!carbohydrates.replace(/\s/g, '').length){
                return console.log('Carbohydrates is blank');
            }
            if(!fat.replace(/\s/g, '').length){
                return console.log('Fat is blank');
            }
            if(!protein.replace(/\s/g, '').length){
                return console.log('Protein is blank');
            }
    */
    // Create an array to store all failed field messages (allow all messages to display at once)
    let messages = [];
    // Create a single method that will check for blank fields that can be used throughout all the app to remove bloating
    //send through the value of the field, the name of the field and the messages array to add the new message if required
    validateBlankField(name,'Name', messages);
    validateBlankField(amount,'Amount', messages);
    validateBlankField(measurement,'Measurement', messages);
    validateBlankField(servings,'Servings', messages);
    validateBlankField(calories,'Calories', messages);
    validateBlankField(carbohydrates,'Carbohydrates', messages);
    validateBlankField(fat,'Fat', messages);
    validateBlankField(protein,'Protein', messages);

    validateNumber(calories, 'Calories', messages)
    validateNumber(carbohydrates,'Carbohydrates', messages);
    validateNumber(fat,'Fat', messages);
    validateNumber(protein,'Protein', messages);
    validateNumber(request.body.pound,'Pound', messages);
    validateNumber(request.body.pence,'Pence', messages);

    if(messages.length > 0) {
        console.log(messages.join('\n'))
        return {message: messages.join('\n')};
    }

    if(user){
        db.query('INSERT INTO food (name, brand, shop, cost, amount, measurement, servings, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, addedByID, addedDateTime, isPrivate)'
        + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, brand, shop, cost, amount, measurement, servings, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, addedByID, currentDateTime, isPrivate],
        function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the food item is added
            console.log(`Food Item ${name} has been Created`);
            response.redirect('/food');
        });
        
    }
        
      });