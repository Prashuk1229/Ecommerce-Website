const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const accessRights = require('../middleware/accessRights');

const {check , body} = require('express-validator');

const router = express.Router();


// /admin/add-product => GET
router.get('/add-product', isAuth , adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth , adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    check('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    check('price')
        .isFloat({min: 0}),
    check('description')
        .isString()
        .isLength({max: 512})
        .trim(),
], isAuth , adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth ,accessRights  , adminController.getEditProduct);

router.post('/edit-product', [
    check('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    check('price')
        .isFloat({min: 0}),
    check('description')
        .isString()
        .isLength({max: 512})
        .trim(),
], isAuth , accessRights , adminController.postEditProduct);

router.delete('/product/:productId', isAuth , accessRights, adminController.deleteProduct);

module.exports = router;
