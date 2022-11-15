/*
Creating a separate file for the passport configuration to remove unnessesarry bloating in the scripts.js file.
This should also allow the ability of creating a personal 'guide' of sorts for myself on using this middleware for the future if needed.
Separating this information from the script.js page will allow me to more easily go over this specific content anytime separate from the rest of the code.

URL's that I used to assist with this:
https://www.passportjs.org/ - Main site for the middleware
https://jodiss-tri.medium.com/build-a-login-system-in-node-js-using-passport-js-and-mysql-52667cf3cc40 - connected a mysql database to passport
https://youtu.be/-RCnNyD0L-s - created a local passport system but in a separate file
*/

// Requireing the db file that has been created in a separate file
const db = require('./db');
// 'bcrypt' is being used for the password so needs to be required
const bcrypt = require('bcrypt');
// not sure how localstrategy works currently but is required
const LocalStrategy = require('passport-local').Strategy

//Creating a function to call in the scripts.js page that will take in three parameters:
//The passport middleware itself to use passport.use etc, the username and password that will be entered for login);
function initialize(passport){
    //Function to verify the user pulling through the username and password from above
    function verifyUser(username, password, done) {
        //Check to see if the username pulled through exists in the Database
        db.query('SELECT * FROM users WHERE username = ?', [username], async function(error, results, fields) {
            //Return an error if the query fails completly
            if (error){
                return done(error);
            }
            //If the query runs but there are no results, return: no error, no results, but return a message.
            if (results.length == 0)
            {
                return done(null, false, {message: 'No user with that email'});
            }
            // If there was a result (wasn't 0 results), create an object of the users: id and name, for Serialisation
            const user = {
                id: results[0].id,
                username: results[0].username,
            };
            //take both the pulled through password and the results(users) password, then compare them using bcrypt, action as required
            if (await bcrypt.compare(password, results[0].password)){
                console.log("Correct Password")
                return done (null, user)
            } else {
                console.log("Incorrect Password")
                return done(null, false, {message: 'Password incorrect'})
            }
        });  
    }

    /*
    Not sure exactly how this works yet or the full understanding of serialization/deserialization
    */
    passport.use(new LocalStrategy(verifyUser));    

    passport.serializeUser(function(user, callback) {
        console.log(`Serialize: ${user.username}`);
        callback(null, { id: user.id, username: user.username });
    });
      
    passport.deserializeUser(function(user, callback) {
        console.log(`Deserialize: ${user.username}`);
        return callback(null, user);
    });
}

//export the initialize function to be used in other files that require this file
module.exports = initialize;