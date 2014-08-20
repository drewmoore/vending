'use strict';

var Machine;
var machines = global.nss.db.collection('machines');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Currency = require('./currency');
var Beverage = require('./beverage');
var Transaction = require('./transaction');

module.exports = Machine;

function Machine(price){
  this.price = price;
}

Machine.index = function(fn){
  machines.find().toArray(function(err, records){
    fn(records);
  });
};

Machine.prototype.addUser = function(userId){
  var self = this;
  self.userId = userId.toString();
};

Machine.prototype.insert = function(fn){
  var self = this;
  machines.find({_id:self._id}).toArray(function(err, foundEntries){
    if(foundEntries.length === 0){
      machines.insert(self, function(err, records){
        fn(err, records);
      });
    } else {
      fn('That machine is already in the database.');
    }
  });
};
Machine.prototype.addImage = function(oldname, fn){
  var self = this;
  var extension = path.extname(oldname);
  var absolutePath = __dirname + '/../static';
  var machinesPath = absolutePath + '/img/machines';
  var relativePath = '/img/machines/skin' + extension;
  fs.mkdir(machinesPath, function(){
    fs.rename(oldname, absolutePath + relativePath, function(err){
      self.image = relativePath;
      fn(err);
    });
  });
};
Machine.findById = function(id, fn){
  var mongoId = new Mongo.ObjectID(id);
  machines.findOne({_id:mongoId}, function(err, record){
    fn(record);
  });
};

Machine.findByUserId = function(id, fn){
  machines.find({userId:id.toString()}).toArray(function(err, records){
    fn(records);
  });
};

Machine.prototype.update = function(fn){
  var self = this;
  machines.update({_id:self._id}, self, function(err, count){
    Machine.findById(self._id.toString(), function(record){
      fn(record);
    });
  });
};

Machine.destroy = function(id, fn){
  if((typeof id) === 'string'){
    id = Mongo.ObjectID(id);
  }
  machines.remove({_id:id}, function(err, count){
    fn(err, count);
  });
};

Machine.prototype.canMakeChange = function(fn){
  var hasChange;
  var price = this.price;
  var highestCurrencyValue = 0;
  var totalCount = 0;
  var types = Currency.denominationsAccepted;
  _.each(types, function(type){
    var c = new Currency(type);
    if(c.value > highestCurrencyValue){
      highestCurrencyValue = c.value;
    }
  });
  var changeNeeded = highestCurrencyValue - price;
  Currency.totalChange(function(err, totalChange){
    if(totalChange >= changeNeeded){
      hasChange = true;
    } else {
      hasChange = false;
    }
    fn(hasChange);
  });
};

Machine.prototype.makeChange = function(moneyIn, fn){
  var price = this.price;
  var changeNeeded = (Math.round(moneyIn * 100) - Math.round(price * 100)) / 100;
  var coinsDispensed = {};
  var totalChange = 0.00;
  var currencies = [];
  _.each(Currency.denominationsAccepted, function(type){
    if(!Currency.isPaper(type)){
      var c = new Currency(type);
      currencies.push(c);
    }
  });
  var types = _.sortBy(currencies, 'value').reverse();
  _.each(types, function(type){
    coinsDispensed[type.type] = {};
    coinsDispensed[type.type].name = type.type;
    coinsDispensed[type.type].count = 0;
  });
  var iterator = 0;
  getTotalsByType();

  function getTotalsByType(){
    // Iterate through the different coin denominations. Check if there are enough in machine to make change.
    // If there is not enough to make change, call function again recursively to test the next coin denomination.
    // If there is enough to make change, call a function that will dispense a given coin one at a time until the amount of change needed
    // is less than the value of the denomination.
    var type = types[iterator];
    Currency.totalByType(type.type, function(err, totalByType){
      coinsDispensed[type.type].count = 0;
      if((totalByType >= type.value) && (type.value <= changeNeeded)){
        dispenseCoins(type, totalByType, function(err){
          iterator ++;
          if((iterator === types.length) || (totalChange >= changeNeeded)){
            fn(err, coinsDispensed, totalChange);
          } else {
            getTotalsByType();
          }
        });

      } else {
        iterator ++;
        if(iterator === types.length){
          fn(err, coinsDispensed, totalChange);
        } else {
          getTotalsByType();
        }
      }
    });
  }

  // Call itself recursively until the necessary number of coins of a given denomination are dispensed.
  function dispenseCoins(type, totalByType, dispenseCallBack){
    Currency.dispenseOneByType(type.type, function(err, count){
      if(err){
        dispenseCallBack(err);
      } else {
        coinsDispensed[type.type].count ++;
        totalChange = ( ( Math.round(totalChange * 100) + Math.round(type.value * 100) )/ 100);
        totalByType -= type.value;
        if(totalChange >= changeNeeded || (((changeNeeded * 100) - Math.round(totalChange * 100)) / 100) < type.value){
          dispenseCallBack(err);
        } else {
          dispenseCoins(type, totalByType, dispenseCallBack);
        }
      }
    });
  }
};

Machine.prototype.vend = function(beverageType, currencyIn, fn){
  var self = this;
  var vended = {};
  var currencies = [];
  var currencyInTotal = currencyIn.value - 0;

  _.each(Currency.denominationsAccepted, function(denom){
    var quantity = currencyIn[denom];
    for(var i=0; i<quantity; i++){
      var c = new Currency(denom);
      currencies.push(c);
    }
  });
  Currency.insertMany(currencies, function(err, records){
    self.makeChange(currencyInTotal, function(err, coinsDispensed, totalChange){
      vended.coinsDispensed = coinsDispensed;
      vended.currencyInTotal = currencyInTotal;
      vended.totalChange = totalChange;
      Beverage.dispenseOneByType(beverageType, function(err, count){
        vended.beverageType = beverageType;
        var t1 = new Transaction(vended);
        t1.insert(function(err, records){
          fn(err, vended);
        });
      });
    });
  });
};


