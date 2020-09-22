"use strict";
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const express = require("express");
const myDB = require('./connection');
const ObjectID = require('mongodb').ObjectID;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();
fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Set View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug')

//Session and passport
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

//Middleware function check if user is authenticated?
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};

myDB(async client => {
    const myDataBase = await client.db('database').collection('users');

    // Be sure to change the title
    app.route('/').get((req, res) => {
        //Change the response to render the Pug template
        res.render('pug/index', {
            title: 'Connected to Database',
            message: 'Please login',
            showLogin: true,
            showRegistration: true
        });
    });

    //Serialize | Deserialize User
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
            done(null, doc);
        });
    });

    passport.use(new LocalStrategy(
        function(username, password, done) {
            myDataBase.findOne({ username: username }, function(err, user) {
                console.log('User ' + username + ' attempted to log in.');
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false);
                }
                return done(null, user);
            });
        }
    ));

    app.route('/login').post((req, res, next) => {
        passport.authenticate('local', {
            successRedirect: '/profile',
            failureRedirect: '/'
        })(req, res, next);
    })

    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    });

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render('pug/profile', {
            username: req.user.username
        });
    })

    app.route('/register').post((req, res, next) => {
            myDataBase.findOne({ username: req.body.username }, function(err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/');
                } else {
                    const hash = bcrypt.hashSync(req.body.password, 12);
                    myDataBase.insertOne({
                            username: req.body.username,
                            password: hash
                        },
                        (err, doc) => {
                            if (err) {
                                res.redirect('/');
                            } else {
                                // The inserted document is held within
                                // the ops property of the doc
                                next(null, doc.ops[0]);
                            }
                        }
                    )
                }
            })
        },
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
            res.redirect('/profile');
        }
    );

    //Error Handle
    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });


}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('pug/index', {
            title: e,
            showLogin: true,
            showRegistration: true,
            message: 'Unable to login'
        });
    });
});


app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
});