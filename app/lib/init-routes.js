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
  var currencies = require('../routes/currencies');

  app.get('/', d, home.index);
  app.get('/machines/create', d, machines.createPage);
  app.get('/machines/edit/:id', d, machines.edit);
  app.get('/machines/summary/:id', d, machines.summary);
  app.get('/beverageTypes/create', d, beverageTypes.createPage);
  app.get('/beverageTypes/edit', d, beverageTypes.edit);
  app.post('/beverageTypes/update', d, beverageTypes.update);
  app.post('/machines/create', d, machines.create);
  app.post('/machines/update/:id', d, machines.update);
  //app.post('/machines/make-change', d, machines.makeChange);
  app.post('/machines/return-coins', d, machines.returnCoins);
  app.post('/beverageTypes/create', d, beverageTypes.create);
  app.post('/currencies/update', d, currencies.update);

  console.log('Routes Loaded');
  fn();
}
