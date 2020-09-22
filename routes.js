const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {
    //Home
    app.route('/').get((req, res) => {
        res.render('pug/index', {
            title: 'Connected to Database',
            message: 'Please login',
            showLogin: true,
            showRegistration: true
        });
    });

    //User login
    app.route('/login').post((req, res, next) => {
        passport.authenticate('local', {
            successRedirect: '/profile',
            failureRedirect: '/'
        })(req, res, next);
    })

    //User logout
    app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
    });

    //User register
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

    //User profile
    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render('pug/profile', {
            username: req.user.username
        });
    })

    //Error Handle
    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });

}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};