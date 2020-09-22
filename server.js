"use strict";
const path = require('path');
require('dotenv').config();
const express = require("express");
const myDB = require('./connection');
const ObjectID = require('mongodb').ObjectID;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require('express-session');
const passport = require('passport');
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

myDB(async client => {
    const myDataBase = await client.db('database').collection('users');

    // Be sure to change the title
    app.route('/').get((req, res) => {
        //Change the response to render the Pug template
        res.render('pug/index', {
            title: 'Connected to Database',
            message: 'Please login'
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
}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('pug/index', { title: e, message: 'Unable to login' });
    });
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
});