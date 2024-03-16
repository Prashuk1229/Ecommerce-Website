const express = require('express');

const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signup', [
    check('email').isEmail().withMessage('Invalid Email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(user => {
                    if (user) {
                        return Promise.reject('Email address already exists');
                    }
                })
        }),
    check('password').isLength({ min: 5 }).withMessage('password length should be atleast 5')
        .isAlphanumeric().withMessage('password should be Alphanumeric'),
    check('confirmPassword').custom((value, { req }) => {
        if (value != req.body.password) throw new Error('Passwords dont match');
        else return true;
    })
], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.changePassword);
router.post('/resetpassword', authController.postChangePassword);

module.exports = router;