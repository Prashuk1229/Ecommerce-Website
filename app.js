const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const crypto = require('crypto'); 
const errorController = require('./controllers/error');
const User = require('./models/user');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const https = require('https');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.9ronrfd.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;
console.log(MONGODB_URI);
// const accessLogstream = fs.createWriteStream(path.join(__dirname , 'access.log') , {flags: 'a'});

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, crypto.randomBytes(1).toString('hex') + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');



// app.use(helmet());
// app.use(compression());
// app.use(morgan('combined', {stream: accessLogstream}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    // throw new Error('Sync Dummy');
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        console.log('connection sucessfull');
        // https.createServer({
        //     key: privateKey,
        //     cert: certificate
        // }, app).listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => {
        console.log(err);
    });
