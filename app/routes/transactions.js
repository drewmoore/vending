'use strict';

var Currency = require('../models/currency');
var Beverage = require('../models/beverage');
var BeverageType = require('../models/beverageType');
var Machine = require('../models/machine');
var Transaction = require('../models/transaction');
var _ = require('lodash');

exports.index = function(req, res){
  var currencyTypes = [];
  Machine.index(function(records){
    var machine = records[0];
    machine.id = records[0]._id.toString();
    BeverageType.index(function(beverageTypes){
      var iteration = 0;
      _.each(beverageTypes, function(beverageType){
        Beverage.countByProductName(beverageType.name, function(err, count){
          beverageType.count = count;
          iteration ++;
          if(iteration === beverageTypes.length){
            iteration = 0;
            _.each(Currency.denominationsAccepted, function(denom){
              Currency.totalByType(denom, function(err, total){
                var c = {};
                c.type = denom;
                c.total = total;
                currencyTypes.push(c);
                iteration ++;
                if(iteration === beverageTypes.length){
                  Transaction.index(function(transactions){
                    res.render('transactions/index', {transactions:transactions, currencyTypes:currencyTypes, beverageTypes:beverageTypes,
                    machine:machine});
                  });
                }
              });
            });
          }
        });
      });
    });
  });
};

exports.reset = function(req, res){
  Transaction.destroyAll(function(err, count){
    res.send({count:count});
  });
};
