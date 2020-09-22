"use strict";

const routes = require('./routes.js');
const auth = require('./auth.js');
const path = require('path');
require('dotenv').config();
const express = require("express");
const myDB = require('./connection');
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require('express-session');
const passport = require('passport');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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


myDB(async client => {
    const myDataBase = await client.db('database').collection('users');

    routes(app, myDataBase);
    auth(app, myDataBase);

    //SOCKET PROGRAMING
    let currentUsers = 0;
    io.on('connection', (socket) => {
        ++currentUsers;
        io.emit('user count', currentUsers);
        console.log('A user has connected');
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

http.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
});