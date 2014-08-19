'use strict';

var Machine = require('../models/machine');
var Beverage = require('../models/beverage');
var BeverageType = require('../models/beverageType');
var Currency = require('../models/currency');
var _ = require('lodash');
var self = this;

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
        m1.makeChange(totalIn, function(err, coinsDispensed, totalChange){
          self.getStateOfMachine(req, function(data, err){


            console.log('RETURN COINS: GET STATE OF MACHINE CALLBACK: ', data, '\n', totalChange);

            res.send({coinsDispensed:coinsDispensed, totalChange:totalChange, stateOfMachine:data});

          });
        });
      }
    });
  });
};

exports.getStateOfMachine = function(req, fn) {
  Machine.index(function(records){
    if(records.length > 0){
      var machine = new Machine(records[0].price);
      machine.image = records[0].image;
      machine._id = records[0]._id;
      machine.id = records[0]._id.toString();
      machine.canMakeChange(function(hasChange){
        machine.hasChange = hasChange;
        BeverageType.index(function(beverageTypes){
          if(beverageTypes.length > 0){
            var iterator = 0;

            // Get a listing of all beverage Types in the machine.  Report if a given beverage is out. If there are no beverage Types,
            // User will have to create at least one to proceed.
            _.each(beverageTypes, function(beverage){
              Beverage.countByProductName(beverage.name, function(err, count){
                if(count < 1){
                  beverage.isOut = true;
                }
                iterator ++;
                if(iterator === beverageTypes.length) {
                  iterator = 0;

                  // Calculate how many slots are left in change bank for each given denomination.  Report if any are full. Also check to see if 
                  // there are enough open slots to make a purchase, based on machine's price.
                  var currencyTypes = Currency.denominationsAccepted;
                  var slotsLeft = [];
                  var overheadValue = 0;
                  var denominations = [];
                  _.each(currencyTypes, function(type){

                    // Create an array of currency objects with the name of the type and its value
                    var denom = new Currency(type);
                    denominations.push(denom);

                    Currency.slotsLeftByType(type, function(overhead){
                      // Create an object that will contain the type of currency, and how much space is reserved for it in the machine.
                      // Accrue value of slots left open, calculated by type, to make sure a beverage can still be purchased.
                      var slot = {};
                      var c = new Currency(type);
                      overheadValue += (overhead * c.value);
                      // Apply different rules to paper currency
                      if(Currency.isPaper(type)){
                        type = 'paperBill';
                      }
                      // Make sure we're not entering multiple records for paper bills. Make sure dollar/five dollar bills counted together.
                      var alreadyThere = false;
                      _.each(slotsLeft, function(slotInQuestion){
                        if(slotInQuestion.type === type){
                          alreadyThere = true;
                        }
                      });
                      if(!alreadyThere){
                        slot.type = type;
                        slot.overhead = overhead;
                        slotsLeft.push(slot);
                      }

                      iterator ++;

                      if(iterator === currencyTypes.length) {

                        machine.hasOverheadInBank = true;
                        machine.inService = true;
                        if(overheadValue < machine.price){
                          machine.hasOverheadInBank = false;
                        }
                        if(!machine.hasChange && !machine.hasOverheadInBank){
                          machine.inService = false;
                        }
                        fn({machine:machine, beverageTypes:beverageTypes, slotsLeft:slotsLeft,
                          denominationsAccepted: denominations, paperBillsAccepted:Currency.paperBillsAccepted});
                      }
                    });
                  });
                }
              });
            });
          } else {
            fn({}, 'No Beverages In Machine');
          }
        });
      });
    } else {
      fn({}, 'No Machines in Database');
    }
  });
};
