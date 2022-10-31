var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var hbs =require('express-handlebars');
const { dirname } = require('path');
var app = express();
var fileupload = require('express-fileupload')
var db = require('./config/connection')
var session = require('express-session')
// const apiErrorHandler = require('./helpers/ApiError-handler')
const dotenv = require('dotenv');
dotenv.config()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({helpers:{
  inc: function(value,options){
    return parseInt(value)+1
  },
  ifEquals: function(arg1,arg2,options){
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  }
},
extname:'hbs',
defaultLayout:'layout',
layoutsDir:__dirname+'/views/layout/',
partialsDir:__dirname+'/views/partials/'}
))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())
app.use(session({secret:"key",cookie:{maxAge:6000000}}))

db.connect((err)=>{
  if(err)
  console.log("connection error"+err)
  else
  console.log("datatbase connected to port 27017")
})

app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use('*', function(req, res, next) {
  // next(createError(404));
  res.render('users/404error',{layout:'error-layout'})
});

// app.use(apiErrorHandler);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // res.status(err.status || 500);
  console.log(err.message, err.stack)
  res.render('users/500error',{layout:'error-layout'});
});

module.exports = app;
