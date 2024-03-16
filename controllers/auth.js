const User = require('../models/user');
const bcrypt = require('bcryptjs');

const crypto = require('crypto');

const { validationResult } = require('express-validator')

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');


const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));


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
                return transporter.sendMail({
                    to: email,
                    from: 'jain1207harshit@gmail.com',
                    subject: 'successful Signup',
                    html: '<h1>Welcome aboard</h1>'
                })
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
                    req.session.save(() => res.redirect('/'))
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

exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset password',
        isAuthenticated: false,
        errorMessage: req.flash('error')
    });
}
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) { req.flash('error', 'no account found'); return req.session.save(() => res.redirect('/reset')); }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save()
                    .then(() => {
                        res.redirect('/');
                        transporter.sendMail({
                            to: req.body.email,
                            from: 'jain1207harshit@gmail.com',
                            subject: 'Reset Password',
                            html:
                                `
                                <p>you requested a password reset</p>
                                <p>click this <a href = "http://localhost:3000/reset/${token}">link</a> to reset password</p>
                                
                                `
                        })
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    })
}

exports.changePassword = (req, res, next) => {
    const token = req.params.token;
    return User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            if (!user) { return res.redirect('/'); }
            console.log(user)
            return res.render('auth/resetPassword', {
                path: '/resetPassword',
                pageTitle: 'Reset password',
                isAuthenticated: false,
                token: token,
                errorMessage: req.flash('error')
            });
        })
        .catch(err => console.log(err));
}
exports.postChangePassword = (req, res, next) => {
    const token = req.body.token;
    const password = req.body.password;
    User.findOne({ resetToken: token })
        .then(user => {
            console.log(user);
            bcrypt.hash(password, 12).then(hashedpassword => {
                console.log(user);
                user.password = hashedpassword;
                return user.save().then(() => res.redirect('/login'));
            })
        })
};
