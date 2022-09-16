// Passport-Config is currently a little difficult to fully understand
// Creating a separate file for this from 'Server.js' should reduce the amount of page bloating and make this easier to read/go-through/ understand.

//
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')


function initialize(passport, getUserByEmail, getUserById) {
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
}

module.exports = initialize