'use strict';

var d = require('../lib/request-debug');
var initialized = false;

module.exports = function(req, res, next){
  if(!initialized){
    initialized = true;
    load(req.app, next);
  }else{
    next();
  }
};

function load(app, fn){
  var home = require('../routes/home');
  var machines = require('../routes/machines');
  var beverageTypes = require('../routes/beverageTypes');
  //var beverages = require('../routes/beverages');
  //var beverageTypes = require('../routes/beverageTypes');
  //var transactions = require('../routes/transactions');

  app.get('/', d, home.index);
  app.get('/machines/create', d, machines.createPage);
  app.get('/beverageTypes/create', d, beverageTypes.createPage);
  app.post('/machines/create', d, machines.create);
  /*
  app.get('/sampleModels', d, sampleModels.index);
  app.get('/sampleModels/create', d, sampleModels.createPage);
  app.get('/sampleModels/:id', d, sampleModels.show);
  app.get('/sampleModels/edit/:id', d, sampleModels.edit);
  app.get('/auth', d, users.auth);
  app.post('/sampleModels/create', d, sampleModels.create);
  app.post('/register', d, users.register);
  app.post('/login', d, users.login);
  app.post('/logout', d, users.logout);
  app.post('/sampleModels/update/:id', d, sampleModels.update);
  app.post('/sampleModels/delete/:id', d, sampleModels.remove);
  */
  console.log('Routes Loaded');
  fn();
}
