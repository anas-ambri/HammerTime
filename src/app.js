
/**
 * Module dependencies.
 */

var express = require('express'),
        stylus = require ('stylus'),
        db = require('./db'),
        routes = require('./routes'),
        http = require('http'),
        nib = require('nib'),
        path = require('path');

var app = express();

app.configure(function(){
  app.set('port', 8080 );
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(stylus.middleware({
      src:__dirname + '/public',
      compile: function(str, path){
          return stylus(str).set('filename',path).set('compress',true).use(nib());
      }}));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//All the routes.* functions are defined in routes/index.js
app.get('/ribosoft/', routes.index);
app.get('/ribosoft', routes.redirect);
app.get(/^\/ribosoft\/design\/(.*)/, routes.design_page_get);
app.get(/^\/ribosoft\/summary\/(.*)/, routes.summary_page);
app.get(/^\/ribosoft\/processing\/(.*)/, routes.processing_page);
app.get(/^\/ribosoft\/results\/(.*)/, routes.results_page);

app.post('/ribosoft/design', routes.design);
app.post(/^\/ribosoft\/design\/(.*)/, routes.design_page_post);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
