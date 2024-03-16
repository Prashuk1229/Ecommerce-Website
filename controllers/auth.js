const User = require('../models/user');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');

const { validationResult } = require('express-validator')



exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false,
        errorMessage: req.flash('error')
    });
}
exports.getSignup = (req, res, next) => {
    console.log(req.flash('error'));
    res.render('auth/signup', {
        path: 'Signup',
        pageTitle: 'Signup',
        isAuthenticated: false,
        errorMessage: false,
        oldInput:{
            email:'',
            password:'',
            confirmPassword:''
        },
        validationErrors: []
    });
};
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    console.log(errors.array());
    if(errors.array().length){
        const err =  errors.array()[0].msg;
        return res.status(422).render('auth/signup' , {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: err,
            oldInput:{
                email:email,
                password:password,
                confirmPassword:confirmPassword
            },
            validationErrors: errors.array()
        })
    }
    bcrypt.hash(password, 12).then(hashedpassword => {
        const newUser = new User({
            email: email,
            password: hashedpassword,
            cart: { items: [] }
        })
        newUser.save()
            .then(result => {
                res.redirect('/login');
            })
            .catch(err => console.log(err));
    })
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password');
                return req.session.save(() => res.redirect('/login'));
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        req.flash('error', 'Invalid email or password');
                        return req.session.save(() => res.redirect('/login'));
                    }
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    req.session.save(() => {
                        console.log(req.session);
                        res.redirect('/');
                    })
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                })

        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};


