// Passport-Config is currently a little difficult to fully understand
// Creating a separate file for this from 'Server.js' should reduce the amount of page bloating and make this easier to read/go-through/ understand.

//
const bcrypt = require('bcrypt');
const db = require('./db');

//const username = username;
//const password = password;

function verifyUser(username, password, done) {

    db.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
        console.log(user);
        if (error){
            return done(error);
        }
        if (results.length==0)
        {
            return done(null, false, {message: 'No user with that email'});
        }
        console.log(user);
        const isValid=validPassword(password,results[0].password);
        user = {
            id: results[0].id,
            username: results[0].username,
            password: results[0].password
        };

        if(isValid)
        {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    });  
}

const Strategy = new LocalStrategy(username, password, verifyUser);
passport.use(Strategy);


passport.serializeUser((user, done) => {
    console.log('inside serialize');
    done(null,user.id)
});

passport.deserializeUser(function(userId, done){
    console.log('deserializeUser' + userId);
    db.query('SELECT * FROM users WHERE id = ?', [userId], function(error, results) {
        done(null, results[0]);
    });
});

async function validPassword(password,usersPassword)
{
    var hashedPassword = await bcrypt.hash(password, 10)
    return usersPassword === hashedPassword;
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
        response.redirect('/notAuthorized');
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


//module.exports = initialize




/*
const authenticateUser = async (email, password, done) => {
    const user = getUserByEmail(email)
    if (user == null) {
        return done(null, false, {message: 'No user with that email'})
    }

    try {
        if (await bcrypt.compare(password, user.password)){
            return done (null, user)
        } else {
            return done(null, false, {message: 'Password incorrect'})
        }
    }
    catch (e){
        return done(e)
    }
}

passport.use(new LocalStrategy({ usernameField: 'email'}, authenticateUser))
passport.serializeUser((user, done)=> done(null, user.id))
passport.deserializeUser((id, done)=> {
    return done(null, getUserById(id))
})

*/