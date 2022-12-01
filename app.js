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
    https://www.youtube.com/watch?v=-RCnNyD0L-s
    https://www.passportjs.org/tutorials/password/
    https://stackoverflow.com/questions/58849990/i-am-trying-to-display-flash-error-message-in-express-js-but-req-flasherror
    https://qawithexperts.com/questions/124/how-to-show-confirm-box-when-clicking-link-a-href-tag - used for the onclick for deleting Account in profile
    https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
    https://stackoverflow.com/questions/46807385/passport-js-serializeuser-deserializeuser
    
    Usefull Bootstrap Links:
    https://getbootstrap.com/docs/5.0/layout/breakpoints/

	Additional Information:
	run this file to connect to DB then go to: http://localhost:3000, on web browser to view the code. 
*/

// Not sure how this works at present
// Keys are not defined when hosting to dreamhost, removing the if not in production allows it to work.
// Unsure of the full understanding of these right now but requiring the file be default allows it to work.
// Further investigation on this is stil required

//if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
//}

// Accessing both the Database and the Passport Configuration so need to require both files
const db = require('./db');
const initializePassport = require('./passport-config');

const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

// flash messages
const flash = require('express-flash');

/* Need to look into app.use middleware more */

const app = express();
// Use flash messages
app.use(flash())
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
// Use the assets folder to allow Usage if images stored there
app.use(express.static('assets'));
// setting up EJS filetype
app.set('view engine', 'ejs');

//listen for the user to access port 3000 in the localhost
app.listen(3000);


 // If the user is not authenticated but is trying to access a page that required you to be logged into, redirect them to the login page
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

 // If the user is authenticated but is trying to access a page they shouldnt be becuase of this (such as the register/login page), redirect them to their profile page
function isNotAuth(request, response, next)
{
    if(request.isAuthenticated())
    {
        response.redirect('/profile');
    }
    else {
        next();
    }
}4

// Function to check if an account already exists with the entered Username
function userExists(request, response, next)
{
    db.query('SELECT * FROM users WHERE username = ?', [request.body.username], function(error, results, fields) {
        if (error)
        {
            console.log("Error");
        }
        else if (results.length > 0)
        {
            request.flash('error', '<B>User Already Exists</B>');
            response.redirect('/register');
        }
        else
        {
            next()
        }
    });
}



//Create an array of All the food that is either: public or created by the user.
function renderFood(request, response, next) {
    /* 
        Error: user.id is undefined if user is not logged in.
        To work around this:
        Create a variable (id):
        User logged-in: set to user.id
        User NOT logged-in: set to blank to still be defined but no results will be found
    */
    if(request.isAuthenticated()) {
        id = request.user.id;
    } else {
        id = '';
    }
    db.query('SELECT * FROM food where isPrivate = 0 or addedByID = ?', [id], function(error, results) {
        if (error)
        {
            console.log(error);
        }
            allFood = [];
            results.forEach(result => {
                foodItem = {
                    id: result.id, // Not going to be shown to user by used in other functions
                    name: result.name,
                    measurement: result.amount + ' ' + result.measurement,
                    calories: result.calories,
                    // Will be visible in desktop mode to provide more info on larger screen but removed in mobile
                    carbohydrates: result.carbohydrates,
                    fat: result.fat,
                    protein: result.protein,
                    isPrivate: result.isPrivate
                }
                allFood.push(foodItem);
                //console.log(allFood);
            });
            next();
    });
}

//Create an array of All the USERS food
function renderUsersFood(request, response, next) {
    /* 
        Error: user.id is undefined if user is not logged in.
        To work around this:
        Create a variable (id):
        User logged-in: set to user.id
        User NOT logged-in: set to blank to still be defined but no results will be found
    */
    if(request.isAuthenticated()) {
        id = request.user.id;
    } else {
        id = '';
    }
    db.query('SELECT * FROM food where addedByID = ?', [id], function(error, results) {
        if (error)
        {
            console.log(error);
        }
            allFood = [];
            results.forEach(result => {
                foodItem = {
                    id: result.id, // Not going to be shown to user by used in other functions
                    name: result.name,
                    measurement: result.amount + ' ' + result.measurement,
                    calories: result.calories,
                    // Will be visible in desktop mode to provide more info on larger screen but removed in mobile
                    carbohydrates: result.carbohydrates,
                    fat: result.fat,
                    protein: result.protein,
                    isPrivate: result.isPrivate
                }
                allFood.push(foodItem);
                //console.log(allFood);
            });
            next();
    });
}

//Create an array of All the Recipes that are either: public or created by the user.
function renderRecipes (request, response, next){
        /* 
        Error: user.id is undefined if user is not logged in.
        To work around this:
        Create a variable (id):
        User logged-in: set to user.id
        User NOT logged-in: set to blank to still be defined but no results will be found
    */
        if(request.isAuthenticated()) {
            id = request.user.id;
        } else {
            id = '';
        }
    db.query('SELECT * FROM recipes where isPrivate = 0 or addedByID = ?', [id], function(error, results, fields) {
        if (error)
        {
            console.log(error);
        }
            allRecipes = [];
            results.forEach(result => {
                recipe = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    type: result.type,
                    serves: result.serves,
                    isPrivate: result.isPrivate,
                }
                allRecipes.push(recipe);
                // console.log(allRecipes);
            });
            next();
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

function calculateServing(perServingLogged, actualServingRequired, nutrition){
    /*Example: nutrition = 80, perServingLogged = 100, actualServingRequired = 50,
    80 nutrition / 100 Serving logged = 0.8,
    0.8 * by the 50g requiredServing = 40,
    return actualServingRequired is 40 nutrition
    */
   const result = nutrition / perServingLogged * actualServingRequired;
   // Reound result to 1 decimal place if required
    return Math.round(result * 10) / 10;
}

// Creating account, First run userExists function, if the user does not exist then continue through the createAccount
app.post('/createAccount',userExists,  async function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	let passwordConfirm = request.body.passwordConfirm;
    let currentDateTime = new Date();
	//hash/bcrypt the password, run through the process 10 times and await for all to be completed, then store in a new variable
	const hashedPassword = await bcrypt.hash(password, 10)
	// Ensure the input fields exists and are not empty
	if (username && password && passwordConfirm) {
		// If the Password matches the confirmed password
		if(password == passwordConfirm){
            // Create Account
            db.query('INSERT INTO users (username, password, email, addedDateTime) VALUES (?, ?, ?, ?)', [username, hashedPassword, username, currentDateTime], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                // If the account gets created
                console.log("Account Created");
                response.redirect('/login');
            });
		} // If The password and Confirmed Password do not match, inform the user and don't create the account
        else {
			response.send('Password does not match the confirmed password!');
			response.end();
        }
	}
    else {
        // If ANY of the fields are blank, inform the user and don't create the account
		response.send('Please enter Username, Password and confirm the Password!');
		response.end();
	}
});

// The Homepage can be accessed by directing to '/'
app.get('/', function(request, response) {
	response.render('index.ejs', {user:request.user});
});

// User should only be able to try to log in if they are NOT already logged in
app.get('/login', isNotAuth, function(request,response) {
	response.render('login.ejs');
});

// When posting the login details, run the authentication process, go to profile if succesfull or back to login page with an error if failed.
app.post('/login', passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect:'/login',
    failureFlash: true
}));

// User should only be able to register if they are NOT already logged in
app.get('/register', isNotAuth, function(request,response) {
	response.render('register.ejs');
});

// User should only be able to create Food if they are logged in
app.get('/createFood', isAuth, function(request,response) {
	response.render('createFood.ejs', {user:request.user});
});

/* Food/Ingredient Page will be accessable two different ways:
1. Food - User is wanting to view the existing Food items
2. Ingredient - User is selecting an Ingredient from the list of their Food to add to their Recipe
*/

// renderFood will load all the users created Food items (If user is logges in) and all the public Food items that are available to view
app.get('/food', renderFood, function(request,response) {
    console.log('Viewing all Food in System')
    response.render('food.ejs', {user: request.user});
});

// Since user is selecting already created Food items to add to their Recipe and are unable to use public Food, they will only be able to render Food that they have created 
app.get('/food/recipe=:id', renderUsersFood, function(request,response) {
    const recipeid = request.params.id;
    console.log('Selecting Ingredient for Recipe id: ' + recipeid); // Ensure the recipeID has successfully pulled through
    // Check if the recipe being edited was created by the user
    db.query('SELECT addedByID FROM recipes where id = ?', [recipeid], function(error, result, fields){
        // If it is then allow the user to select a Food item to add to the Recipe
        if(result[0].addedByID == request.user.id) {
            response.render('food.ejs', {recipeid: recipeid, user: request.user});
        } else {
            // If not, Redirect back to the recipe page and inform the user that they cannot add Food to a Recipe they did not create
            request.flash('adderror', '<B>Unable to add Ingredients to a Recipe you did not create</B>');
            response.redirect('/viewRecipe/recipe=' + recipeid, {user: request.user});
            console.log("Unable to add Ingredients");
        }
    });
});

/* viewFood Page will be required for three different reasons:
1. viewFood - User is viewing a public Food or one that they created
2. selectIngredient - User is viewing a selected Ingredient they want to add to the selected Recipe
3. editIngredient - User is editing a selected Ingredient from a selected recipe
*/

// Viewing a Food item from the full list of vaiable Foods
app.get('/viewFood/food=:id', function(request, response) {
    db.query('SELECT * FROM food where id = ?', [request.params.id], function(error, result, fields) {
        if (error)
        {
            console.log(error);
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
            console.log("Viewing Food " + food.name); // Ensuring the Food Object has been created and pulled through correctly and that the user is Viewing a Food
            response.render('viewFood.ejs', {food, user:request.user});
        }
    });
});

// Viewing a Food the user created to possibily select it as an ingredient
app.get('/selectIngredient/recipe=:recipeid&food=:foodid', function(request, response) {
    db.query('SELECT * FROM food where id = ?', [request.params.foodid], function(error, result, fields) {
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
            console.log(`Viewing Ingredient: ${food.name} for Recipe: ${request.params.recipeid}`) // Ensuring the Food object has been created correctly, the Food and Recipe have pulled through correctly and that the user is Viewing an Ingredient
            response.render('viewFood.ejs', {food, recipeid: request.params.recipeid, user: request.user});
        }
    });
});

// Viewing/Editing an already Created Ingredient in a Recipe
app.get('/viewRecipeIngredient/recipe=:recipeid&recipeIngredient=:recipeIngredientid', function(request, response) {
    const recipeid = request.params.recipeid;
    const recipeIngredientid = request.params.recipeIngredientid;
    // Check if the recipe being edited was created by the user
    db.query('SELECT addedByID FROM recipes where id = ?', [recipeid], function(error, result, fields){
        if(result[0].addedByID == request.user.id) {        
            // If it was, locate the Amount and Measuermenet from the recipeIngredient page
            db.query('SELECT * FROM recipeIngredient where id = ?', [recipeIngredientid], function(error, result, fields) {
                if (error)
                {
                    console.log("Error");
                }
                else if (result.length > 0)
                {
                    const ingredientid = result[0].ingredientid;
                    const selectedIngredientAmount = result[0].amount;
                    const selectedIngredientMeasurement = result[0].measurement;
                    // Next, Grab the rest of information from the main Food page
                    db.query('SELECT * FROM food where id = ?', [ingredientid], function(error, result, fields) {
                        if (error)
                        {
                            console.log("Error");
                        }
                        else if (result.length > 0)
                        {
                            // Create an object of the Food to view but change the amount/measurement to the results from the recipeIngredient
                            const food = {
                                id: result[0].id,
                                name: result[0].name,
                                brand: result[0].brand,
                                shop: result[0].shop,
                                cost: result[0].cost,
                                amount: selectedIngredientAmount,
                                measurement: selectedIngredientMeasurement,
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
                        // Render the Food Item from the above created object
                        response.render('viewFood.ejs', {food, recipeid: recipeid, recipeingredientid: recipeIngredientid, user: request.user});
                        }
                    });
                }
            });
        }
        else {
            // If user did NOT create the Recipe, redirect them back to the recipe page and inform them they cannot edit Ingredients from a Recipe they did not create
            request.flash('editerror', '<B>Unable to edit Ingredients from a Recipe you did not create</B>');
            response.redirect('/viewRecipe/recipe=' + recipeid, {user:request.user});
        }
    });

        


});

// Viewing the Create Recipe Page
app.get('/createRecipe', function(request,response) {
	response.render('createRecipe.ejs', {user: request.user});
});

// User should only be able to create a Recipe if they are logged in
app.post('/createRecipe', isAuth, function(request,response, next) {
    // Capture the input fields
    let name = request.body.name;
    let description = request.body.description;
    let type = request.body.type;
    let serves = request.body.serves;
    let addedByID = request.user.id;
    let currentDateTime = new Date();
    let isPrivate = 1; //All created Recipe's should always be set to private
    // Create an array to store all failed field messages (allow all messages to display at once)
    let messages = [];
    validateBlankField(name,'Name', messages);
    // Display the error messages if there are any
    if(messages.length > 0) {
        request.flash('error', messages.join('</br>'));
        response.redirect('/createRecipe');
    } // If there are no issues, create the Recipe
    else {
        db.query('INSERT INTO recipes (name, description, type, serves, addedByID, addedDateTime, isPrivate) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, description, type, serves, addedByID, currentDateTime, isPrivate], function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the Recipe has been created, redirect the user back to the list of recipe's so they can either create more recipes or open the newly created recipe
            console.log(`recipe: ${name} has been Created`);
            response.redirect('/recipes');
        });
    }    
});

// View Selected Recipe
app.get('/viewRecipe/recipe=:id', function(request, response) {
    db.query('SELECT * FROM recipes where id = ?', [request.params.id], function(error, result, fields) {
        if (error)
        {
            console.log(error);
            return; //Stop running the function if there is an error
        }
        else if (result.length > 0)
        {
            //Create an object of the Recipe Details
            const recipe = {
                id: result[0].id,
                name: result[0].name,
                description: result[0].description,
                type: result[0].type,
                serves: result[0].serves,
                isPrivate: result[0].isPrivate,
            };
            console.log(`Recipe Name: ${recipe.name}`); //checking the object was created by selecting the Recipe Name
            db.query('Select ri.id AS recipeingredientid, ri.ingredientid, ri.recipeid, f.name, f.amount AS foodAmount, f.measurement, f.calories, f.carbohydrates, f.fat, f.protein, f.saturates, f.sugars, f.salt, f.fiber, ri.amount AS recipeingredientAmount FROM food f JOIN recipeIngredient ri ON f.id = ri.ingredientid WHERE ri.recipeid = ?', [request.params.id], function(error, results, fields) {
                if (error)
                {
                    console.log(error);
                    return; //Stop running the function if there is an error
                }
                else if (results.length > 0) // If a recipe and the Ingredients were found
                {
                    // Create an array of all the recipeIngredients
                    allRecipeIngredients = [];
                    // Set the total of each nutrition to 0 to declare if non existant or set back to 0 if already changed.
                    let totalCalories = 0;
                    let totalCarbohydrates = 0;
                    let totalFat = 0;
                    let totalProtein = 0;
                    let totalSaturates = 0;
                    let totalSugars = 0;
                    let totalSalt = 0;
                    let totalFiber = 0;

                    results.forEach( result => {
                        recipeIngredient = {
                            recipeIngredientid: result.recipeingredientid,
                            recipeid: result.recipeid,
                            ingredientName: result.name,
                            ingredientid: result.ingredientid,
                            amount: result.recipeingredientAmount,
                            measurement: result.measurement,
                            //Calculate the actual amount for each nutrition (go to calculateServing to see how this is calculated)
                            calories: calculateServing(result.foodAmount, result.recipeingredientAmount, result.calories),
                            carbohydrates: calculateServing(result.foodAmount, result.recipeingredientAmount, result.carbohydrates),
                            fat: calculateServing(result.foodAmount, result.recipeingredientAmount, result.fat),
                            protein: calculateServing(result.foodAmount, result.recipeingredientAmount, result.protein),
                            saturates: calculateServing(result.foodAmount, result.recipeingredientAmount, result.saturates),
                            sugars: calculateServing(result.foodAmount, result.recipeingredientAmount, result.sugars),
                            salt: calculateServing(result.foodAmount, result.recipeingredientAmount, result.salt),
                            fiber: calculateServing(result.foodAmount, result.recipeingredientAmount, result.fiber),
                        }
                        allRecipeIngredients.push(recipeIngredient);
                        // Add the calculated nutrition to the current totalMacros for each ingredient to use for a Total nutrition for entire meal
                        totalCalories = parseInt(totalCalories) + parseInt(recipeIngredient.calories);
                        totalCarbohydrates = parseFloat(totalCarbohydrates) + parseFloat(recipeIngredient.carbohydrates); 
                        totalFat = parseFloat(totalFat) + parseFloat(recipeIngredient.fat); 
                        totalProtein = parseFloat(totalProtein) + parseFloat(recipeIngredient.protein);
                        totalSaturates = parseFloat(totalSaturates) + parseFloat(recipeIngredient.saturates);
                        totalSugars = parseFloat(totalSugars) + parseFloat(recipeIngredient.sugars);
                        totalSalt = parseFloat(totalSalt) + parseFloat(recipeIngredient.salt);
                        totalFiber = parseFloat(totalFiber) + parseFloat(recipeIngredient.fiber);
                    });
                    // After all the ingredients have been created and the total nutrition has been added, create an object of the total for each nutrition in the meal
                    let totalNutrition = {
                        // Round each result to 1 Decmial Place
                        calories: Math.round(totalCalories * 10) / 10,
                        carbohydrates: Math.round(totalCarbohydrates * 10) / 10,
                        fat: Math.round(totalFat * 10) / 10,
                        protein: Math.round(totalProtein * 10) / 10,
                        saturates: Math.round(totalSaturates * 10) / 10,
                        Sugars: Math.round(totalSugars * 10) / 10,
                        salt: Math.round(totalSalt * 10) / 10,
                        fiber: Math.round(totalFiber * 10) / 10,
                    }
                    //console.log(`Total Calories: ${totalNutrition.calories}, Total Carbs: ${totalNutrition.carbohydrates}, Total Fat: ${totalNutrition.fat}, Total Protein: ${totalNutrition.protein}`); //checking the values are being pulled through
                    //console.log("allRecipeIngredients: " + JSON.stringify(allRecipeIngredients)); //checking the values are being pulled through
                    response.render('viewRecipe.ejs', {recipe, allRecipeIngredients, totalNutrition, user: request.user});
                } // If no ingredients were found
                else {
                    console.log("No Ingredients Exist");
                    // Empty any previous recipeList and Calculations that might still exist (such as from a previous recipe view that had this data)
                    allRecipeIngredients = [];
                    totalNutrition = [];
                    // View the selected recipe with the empty Ingredients array
                    response.render('viewRecipe.ejs', {recipe,user: request.user});
                }
            });
        }
    });
});

// Edit the selected recipe
app.post('/editRecipe/recipe=:id', function(request,response, next) {
    // Capture the input fields
    let name = request.body.name;
    let description = request.body.description;
    let type = request.body.type;
    let serves = request.body.serves;
    let recipeid = request.params.id;

    // Check if the recipe being edited was created by the user
    db.query('SELECT addedByID FROM recipes where id = ?', [recipeid], function(error, result, fields){
        // If Recipe was created by user
        if(result[0].addedByID == request.user.id) {
            // Create an array to store all failed field messages (allow all messages to display at once)
            let messages = [];
            validateBlankField(name,'Name', messages);
            if(messages.length > 0) {
                console.log(messages.join('\n'))
                return {message: messages.join('\n')};
            }
            db.query('UPDATE recipes SET name = ?, description = ?, type = ?, serves = ? WHERE id = ?',
            [name, description, type, serves, recipeid],
            function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                // If the Recipe has been edited
                console.log(`recipe: ${name} has been Updated`);
                response.redirect('/Recipes');
            });
        } // If Recipe was not created by user, inform them they cannot edit the selected Recipe
        else {
            request.flash('editrecipeerror', '<B>Unable to edit a Recipe you did not create</B>');
            response.redirect('/viewRecipe/recipe=' + recipeid);
        }
    });
});

// Inserting the selected Ingredient into the Selected recipe
app.post('/insertIngredient/recipe=:id&food=:foodid', function (request, response) {
    const id = request.params.id;
    const food = request.params.foodid;
    const name = request.body.name;
    const amount = request.body.amount;
    const measurement = request.body.measurement;
    const addedByID = request.user.id;
    console.log (`Trying to insert Food: ${name} into Recipe`);
    // Check the user created the Recipe
    db.query('Select addedByID from recipes where id = ?', [id], function(error, result, fields) {
        if(result[0].addedByID == request.user.id){
            // Check the user also created the Food
            db.query('Select addedByID from food where id = ?', [food], function(error, results, fields) {
                if(results[0].addedByID == request.user.id){
                    // If both pass, allow the ingredient to be insterted to the recipe
                    //Link the selected Recipe with the currently selected Ingredient
                    db.query('INSERT INTO recipeIngredient (recipeid, ingredientid, ingredientName, amount, measurement, addedByID)'
                    + 'VALUES (?, ?, ?, ?, ?, ?)',
                    [id, food, name, amount, measurement, addedByID],
                    function(error, results, fields) {
                        // If there is an issue with the query, output the error
                        if (error) throw error;
                        // If the food item is added
                        console.log(`Food: ${name}, has been Added to the Recipe`);
                        //redirect back to the edit recipe page for the currently selected recipe
                        response.redirect('/viewRecipe/recipe='+id);
                    });
                }
                else{
                    // If user did not create the ingredient then inform them they cannot add it
                    request.flash('ingredienterror', '<B>Unable to add Ingredient you did not create</B>');
                    response.redirect(`/selectIngredient/recipe=${id}&food=${food}`);
                }
            });
        } else {
            // If user did not create the Recipe then inform them they cannot add anything to it
            request.flash('recipeerror', '<B>Unable to add to a Recipe you did not create</B>');
            response.redirect(`/selectIngredient/recipe=${id}&food=${food}`);
        }
    });
});


// Removing Ingredient from Recipe
app.get('/removeIngredient/recipe=:recipeid&recipeIngredient=:recipeIngredientid', function (request, response) {
    const recipeIngredientid = request.params.recipeIngredientid;
    const recipeid = request.params.recipeid;
    
    // Check if the recipe being edited was created by the user
    db.query('SELECT addedByID FROM recipes where id = ?', [recipeid], function(error, result, fields){
        if(result[0].addedByID == request.user.id) {
            db.query('DELETE FROM recipeIngredient where id = ?', [recipeIngredientid], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                // If the food item is Removed
                console.log(`Ingredient has been Removed`);
                //redirect back to the edit recipe page for the currently selected recipe
                response.redirect('/viewRecipe/recipe=' + recipeid);
            });
        }
        else {
            // If user did not create the Recipe inform them they cannot remove Ingredients from it
            request.flash('removeerror', '<B>Unable to remove Ingredients from a Recipe you did not create</B>');
            response.redirect('/viewRecipe/recipe=' + recipeid);
        }
    });
});

// User Logging out
app.post('/logout', function(request, response, next) {
    request.logout(function(err) {
        if (err) { return next(err); }
        response.redirect('/');
        delete user;
        console.log('User has logged out');
    });
});


// Removing Users Account
app.get('/removeUser', function(request, response) {
    // Store userid and username for after logout
    let userid = request.user.id;
    let username= request.user.username;
        console.log("Deleting account " + request.user.username);
        // Logout the User
        request.logout(function(err) {
            if (err) { return next(err); }
            delete user;
            console.log('User has logged out');
        });
        // Delete the users account from the Users table
        db.query('DELETE FROM users where id = ?', [userid], function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the users account was deleted
            console.log("Account: " + username + " has been logged out and removed from the database ");
        });
        // Redirect the user to the homepage
        response.redirect('/');
});

// Removing a created Food
app.get('/removeFood/food=:foodid', function(request, response) {
    // Store userid and username for after logout
    let userid = request.user.id;
    let foodid = request.params.foodid
    db.query('Select addedByID FROM food where id = ?', [foodid], function(error, results, fields) {
        if(results[0].addedByID == userid){
            // Delete the food from the food table
            db.query('DELETE FROM food where id = ?', [foodid], function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            console.log(`Food has been deleted`);
            });
            // Delete all food/ingredients from the recipeIngredients table
            db.query('DELETE FROM recipeIngredient where ingredientid = ?', [foodid], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                });
                console.log(`Food has been deleted from all Recipes`);
                response.redirect('/food');
        }
        else {
            // If user did not create Food, inform them they are unable to remove
            request.flash('removeerror', '<B>Unable to remove food you did not create</B>');
            response.redirect('/food');
        }
    });
});

// Removing a Recipe
app.get('/removeRecipe/food=:recipeid', function(request, response) {
    // Store userid and username for after logout
    let userid = request.user.id;
    let recipeid = request.params.recipeid
    db.query('Select addedByID FROM recipes where id = ?', [recipeid], function(error, results, fields) {
        if(results[0].addedByID == userid){
            // Delete Recipe from recipes table
            db.query('DELETE FROM recipes where id = ?', [recipeid], function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            console.log(`Recipe has been deleted`);
            });
            // Delete all food/ingredients from the recipeIngredients table
            db.query('DELETE FROM recipeIngredient where recipeid = ?', [recipeid], function(error, results, fields) {
                // If there is an issue with the query, output the error
                if (error) throw error;
                console.log(`recipeIngredients related to this Recipe have been removed`);
                });
                response.redirect('/recipes');
        }
        else {
            // If user did not create recipe, inform them they are unable to remove
            request.flash('removeerror', '<B>Unable to remove Recipe you did not create</B>');
            response.redirect('/recipes');
        }
    });
});

// Load the users profile
app.get("/profile", isAuth, (request, response) => {
	response.render('profile.ejs', {user: request.user});
});

// Load All the recipes the User has created (If a user is logged in) and all the Public Recipes available
app.get('/recipes', renderRecipes, function(request,response) {
    response.render('recipes.ejs',{user:request.user});
});


// Creating a Food
app.post('/createFoodItem', function(request, response, next) {
    // Capture the input fields
    let name = request.body.name;
    let brand = request.body.brand;
    let shop = request.body.shop;
    let cost = request.body.pound * 100 + request.body.pence; //multiply the pound by 100 to convert it to pense
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
    let addedByID = request.user.id;
    let currentDateTime = new Date();
    let isPrivate = 1;  // Not allowing any user to create any public Food Items

    // Testing the isPrivate does work, keeping in case the option is to become available in the future
    // if(isPrivate == null) {
    //     isPrivate = 0
    // } else{
    //     isPrivate = 1
    // }

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
    // Send through the value of the field, the name of the field and the messages array to add the new message if required
    validateBlankField(name,'Name', messages);
    validateBlankField(amount,'Amount', messages);
    validateBlankField(measurement,'Measurement', messages);
    validateBlankField(servings,'Servings', messages);
    validateBlankField(calories,'Calories', messages);
    validateBlankField(carbohydrates,'Carbohydrates', messages);
    validateBlankField(fat,'Fat', messages);
    validateBlankField(protein,'Protein', messages);
    // Create Nmber Validation similar to the above Blank Field Validation
    validateNumber(calories, 'Calories', messages)
    validateNumber(carbohydrates,'Carbohydrates', messages);
    validateNumber(fat,'Fat', messages);
    validateNumber(protein,'Protein', messages);
    validateNumber(request.body.pound,'Pound', messages);
    validateNumber(request.body.pence,'Pence', messages);
    // If there are any messages, display all messages for the User to know what failed validation
    if(messages.length > 0) {
        // Add a new line (</br> for html) after each message
        request.flash('error', messages.join('</br>'));
        response.redirect('/createFood');
    } else {
        db.query('INSERT INTO food (name, brand, shop, cost, amount, measurement, servings, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, addedByID, addedDateTime, isPrivate)'
        + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', // Splitting onto separate line to make it easier to read
        [name, brand, shop, cost, amount, measurement, servings, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, addedByID, currentDateTime, isPrivate],
        function(error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the food is created
            console.log(`Food: ${name} has been Created`);
            response.redirect('/food');
        });
    } 
});

// Editing selected Food
app.post('/editFood/food=:id', function(request, response, next) {
    // Capture the input fields
    // Take the id from the url to know which food is being updated
    let foodid = request.params.id;
    let name = request.body.name;
    let brand = request.body.brand;
    let shop = request.body.shop;
    let cost = request.body.pound * 100 + request.body.pence; //multiply the pound by 100 to convert it to pense
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

    // Create an array to store all failed Validation messages (allow all messages to display at once)
    let messages = [];
    // Validate all the Blank Fields
    validateBlankField(name,'Name', messages);
    validateBlankField(amount,'Amount', messages);
    validateBlankField(measurement,'Measurement', messages);
    validateBlankField(servings,'Servings', messages);
    validateBlankField(calories,'Calories', messages);
    validateBlankField(carbohydrates,'Carbohydrates', messages);
    validateBlankField(fat,'Fat', messages);
    validateBlankField(protein,'Protein', messages);
    //Validate all the Fields that should contain only numbers
    validateNumber(calories, 'Calories', messages)
    validateNumber(carbohydrates,'Carbohydrates', messages);
    validateNumber(fat,'Fat', messages);
    validateNumber(protein,'Protein', messages);
    validateNumber(request.body.pound,'Pound', messages);
    validateNumber(request.body.pence,'Pence', messages);
    // If any messages exist display them to the user
    if(messages.length > 0) {
        request.flash('editvalidationerror', messages.join('</br>'));
        response.redirect('/viewFood/food=' + foodid);
    } else {        
        // Check user created the Food
        db.query('Select addedByID from food where id = ?', [foodid], function(error, result, fields) {
            if (error) throw error;
            // If the Food was created by the user
            if(result[0].addedByID == request.user.id){
                db.query('UPDATE food SET name = ?, brand = ?, shop = ?, cost = ?, amount = ?, measurement = ?, servings = ?, ' + //split some to next line to make it easier to read
                'calories = ?, carbohydrates = ?, fat = ?, protein = ?, saturates = ?, sugars = ?, salt = ?, fiber = ? WHERE id = ?',
                [name, brand, shop, cost, amount, measurement, servings, calories, carbohydrates, fat, protein, saturates, sugars, salt, fiber, foodid],
                function(error, results, fields) {
                    // If there is an issue with the query, output the error
                    if (error) throw error;
                    // If the food item has been edited
                    console.log(`Food: ${name} has been Edited`); 
                    response.redirect('/food');
                });
            }
            else {
                // If Food was not created by user, inform user they cannot edit the selected Food
                request.flash('editfooderror', '<B>Unable to edit Food you did not create</B>');
                response.redirect('/viewFood/food=' + foodid);
            }
        });
    }
});