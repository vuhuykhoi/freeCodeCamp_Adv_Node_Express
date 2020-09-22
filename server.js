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

//Library for authenticate User in Socket
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

const MongoStore = require('connect-mongo')(session);;
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

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
    cookie: { secure: false },
    key: 'express.sid',
    store: store
}));

app.use(passport.initialize());
app.use(passport.session());

//INIT SOCKET
io.use(
    passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: 'express.sid',
        secret: process.env.SESSION_SECRET,
        store: store,
        success: onAuthorizeSuccess,
        fail: onAuthorizeFail
    })
);

myDB(async client => {
    const myDataBase = await client.db('freecodecamp').collection('users');

    routes(app, myDataBase);
    auth(app, myDataBase);

    //SOCKET PROGRAMING
    let currentUsers = 0;
    io.on('connection', (socket) => {
        console.log('user ' + socket.request.user.username + ' connected');
        ++currentUsers;
        io.emit('user', {
            name: socket.request.user.username,
            currentUsers,
            connected: true
        });

        socket.on('disconnect', () => {
            console.log('user ' + socket.request.user.username + ' disconnected');
            --currentUsers;
            io.emit('user', {
                name: socket.request.user.username,
                currentUsers,
                connected: false
            });
        });

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

//SOCKET FUNCTION
function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');

    accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    console.log('failed connection to socket.io:', message);
    accept(null, false);
}

http.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
});