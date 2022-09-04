var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs');
var fileUpload = require('express-fileupload');
var session = require('express-session');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
const { connect } = require('./config/connection');
var app = express();
var partialPath= path.join(__dirname,'views/partials');  


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(partialPath)

app.use(fileUpload())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); 
       
app.use(
  session({
    secret: "key",
    resave: true,
    saveUninitialized: true,
    cookie:{
      maxAge:86400
    }
  })
);



connect((err) => {
  if (err) console.log("Error occured", err);
  else console.log("Database connected");
});

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
     
app.use('/admin', adminRouter); 
app.use('/', indexRouter);        

     
// catch 404 and forward to error handler 
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500); 
  res.render('error');
});

module.exports = app;
