var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// this is a fake db which should be replaced with a real SQL db
const users = [{
    id: 1,
    name: 'chen',
    password: 'ilovecats'
}, {
    id: 2,
    name: 'zohar',
    password: 'ihatecats'
}];

// this is where we define how to authenticate a login request of name & password
passport.use(new LocalStrategy({
    // this defines that the POST request will contain the fields "name" and "password"
    usernameField: 'name',
    passwordField: 'password',
},
    // this is the function that runs for each authentication request and decides if the authentication is successful or not
    function (name, password, done) {

        // this is a fake query and should be replaced with a real SQL query to match the user and password in the db
        const user = users.find(user => user.name === name && user.password === password)

        if (!user) {
            // if name and password don't match or user doesn't even exist, we return an error using `done(error: string)` call
            return done('invalid credentials!');
        }
        /* successful authentication, continue request. 
        `null` indicates there's no error, and the second argument is the actual user object that matches the auth request
        */
        return done(null, user);
    }
));

/* when the user authenticates, we send the browser some data to store in the cookies so the user would be automatically identified in future visits.
   we don't want to store a lot of data in the cookie - just something that identifies that user uniquely.
   passport.serializeUser is a function that lets choose what to return to the browser for storing in the cookie
   so instead of storing the whole user object, we only store the id
*/
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

/* this is the reverse function of serializeUser - if the user has already auth data in the browser cookies, the browser will send that data to the server
   passport middleware will take the data in the cookie (e.g. the user's id) and use that data to find the matching user in the db
*/
passport.deserializeUser(function (id, done) {
    const user = users.find(user => user.id === id)
    if (!user) {
        return done(`user doesn't exist!`);
    }
    return done(null, user);
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// we add express-session middleware so we can store encrypted data in the browser cookie (the original data is encrypted using the `secret` field below)
app.use(require('express-session')({
    secret: 'type-any-string-you-like-here',
    resave: false,
    saveUninitialized: false
}));
// we add passport middleware, so it automatically try to authenticate the user in every request
// if the user is authenticated, its details would be available at req.user in every route
app.use(passport.initialize());
// we use passport's session middleware to store data in the browser which identifies an authenticated user in future requests
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


// this is the endpoint for trying to login/authenticate the user. this POST endpoint expects a form body request with 'name' and 'password' fields
app.post('/login', passport.authenticate('local'), (req, res) => {
    // if the request successful, this code executes and we can for example let the browser know the login is complete by sending 200
    if (req.user) {
        res.status(200).send('ok');
    }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
