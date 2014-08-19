'use strict';

var Machine = require('../models/machine');
var Beverage = require('../models/beverage');
var Currency = require('../models/currency');
var _ = require('lodash');

exports.createPage = function(req, res){
  var currencies = [];
  _.each(Currency.denominationsAccepted, function(denom){
    if(!Currency.isPaper(denom)){
      var c = {};
      c.type = denom;
      c.limit = Currency.limit[denom];
      currencies.push(c);
    }
  });
  res.render('machines/create', {currencies:currencies});
};

exports.create = function(req, res){
  var machine =  {
    price: parseFloat(req.body.price) || 0.75
  };
  var imageFile = req.body.imageFile || req.files.imageFile.path;
  var m1 = new Machine(machine.price);
  m1.addImage(imageFile, function(err){
    m1.insert(function(err, records){
      Currency.emptyAll(function(err, count){
        var iteration = 0;
        var types = Currency.denominationsAccepted;
        _.each(types, function(type){
          if(Currency.isPaper(type)){
            iteration ++;
          } else {
            var quantity = req.body[type];
            Currency.stockNewByType(type, quantity, function(err, count){
              iteration ++;
              if(iteration === types.length){
                if(typeof err === 'string'){
                  res.redirect('/machines/create');
                } else {
                  res.redirect('/');
                }
              }
            });
          }
        });
      });
    });
  });
};

exports.edit = function(req, res){
  Machine.findById(req.params.id, function(machine){
    var currencies = [];
    var iteration = 0;
    var types = Currency.denominationsAccepted;
    _.each(types, function(type){
      if(Currency.isPaper(type)){
        iteration ++;
        if(iteration === types.length){
          res.render('machines/edit', {machine:machine, currencies:currencies});
        }
      } else {
        var c = new Currency(type);
        Currency.countByType(type, function(err, count){
          c.count = count;
          c.limit = Currency.limit[type];
          currencies.push(c);
          iteration ++;
          if(iteration === types.length){
            res.render('machines/edit', {machine:machine, currencies:currencies});
          }
        });
      }
    });
  });
};

exports.update = function(req, res){
  Machine.findById(req.params.id, function(machine){
    var m1 = new Machine(machine.price);
    var imageFile = req.body.imageFile || req.files.imageFile.path;
    m1._id = machine._id;
    if(req.files.imageFile.size > 0){
      m1.addImage(imageFile, function(err){
        m1.update(function(record){
          res.redirect('/');
        });
      });
    } else {
      m1.image = machine.image;
      m1.update(function(record){
        res.redirect('/');
      });
    }
  });
};

exports.summary = function(req, res){
  Beverage.countAll(function(err, beverageCount){
    Currency.totalAll(function(err, currencyTotal){
      Machine.findById(req.params.id, function(machine){
        var m1 = new Machine(machine.price);
        m1._id = machine._id;
        m1.canMakeChange(function(hasChange){
          m1.hasChange = hasChange;
          m1.inService = false;
          if(m1.hasChange && (beverageCount > 0)){
            m1.inService = true;
          }
          res.render('machines/summary', {machine:m1, beverageCount: beverageCount, currencyTotal:currencyTotal});
        });
      });
    });
  });
};

exports.returnCoins = function(req, res){
  // Uses the Machine Model's #makeChange function, but using a 'free' machine instance, thereby returning the user's total input.
  var purchaseQueue = req.body;
  var types = Currency.denominationsAccepted;
  var iteration = 0;
  var m1 = new Machine(0);
  _.each(types, function(type){
    var quantity = purchaseQueue.currencies[type] * 1;
    Currency.stockNewByType(type, quantity, function(err, count){
      iteration ++;
      if(iteration === types.length){
        var totalIn = purchaseQueue.value * 1;

        console.log('RETURN COINS CHANGE: TOTAL IN: ', totalIn, purchaseQueue.currencies);

        m1.makeChange(totalIn, function(err, coinsDispensed, totalChange){
          res.send({data:coinsDispensed, totalChange:totalChange});
        });
      }
    });
  });
};

/*
exports.makeChange = function(req, res){
  var purchaseQueue = req.body;
  var types = Currency.denominationsAccepted;
  var iteration = 0;
  Machine.findById(purchaseQueue.machineId, function(machine){
    var m1 = new Machine(machine.price);
    _.each(types, function(type){
      var quantity = purchaseQueue.currencies[type] * 1;
      Currency.stockNewByType(type, quantity, function(err, count){
        iteration ++;
        if(iteration === types.length){
          var totalIn = purchaseQueue.value * 1;

          console.log('MAKE CHANGE: TOTAL IN: ', totalIn, purchaseQueue.currencies);

          m1.makeChange(totalIn, function(err, coinsDispensed, totalChange){
            res.send({data:coinsDispensed, totalChange:totalChange});
          });
        }
      });
    });
  });
};
*/
