'use strict';

var Machine;
var machines = global.nss.db.collection('machines');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Currency = require('./currency');
var Beverage = require('./beverage');

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
      fn('That machine is already in here, yo!');
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
  var changeNeeded = moneyIn - price;
  var moneyOut = 0;
  var coinsDispensed = {};
  var currencies = [];
  _.each(Currency.denominationsAccepted, function(type){
    if(!Currency.isPaper(type)){
      var c = new Currency(type);
      currencies.push(c);
    }
  });
  var types = _.sortBy(currencies, 'value').reverse();
  var iterator = 0;

  getTotalsByType();
  function getTotalsByType(){

    var type = types[iterator];
    Currency.totalByType(type.type, function(err, totalByType){
      coinsDispensed[type.type] = 0;
      if(totalByType >= type.value){
        dispenseCoins(type, totalByType, function(err){
          iterator ++;
          if(iterator === types.length){
            fn(err, coinsDispensed);
          } else {
            getTotalsByType();
          }
        });
      } else {
        iterator ++;
        if(iterator === types.length){
          fn(err, coinsDispensed);
        } else {
          getTotalsByType();
        }
      }
    });
  }

  function dispenseCoins(type, totalByType, dispenseCallBack){
    Currency.dispenseOneByType(type.type, function(err, count){
      if(err || moneyOut >= changeNeeded){
        dispenseCallBack(err);
      } else {
        coinsDispensed[type.type] ++;
        moneyOut += type.value * count;
        totalByType -= type.value;
        if(moneyOut >= changeNeeded){
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
  var currencyInTotal = 0;
  _.each(currencyIn, function(currency){
    var c = new Currency(currency.type);
    currencies.push(c);
    currencyInTotal += c.value;
  });
  Currency.insertMany(currencies, function(err, records){
    self.makeChange(currencyInTotal, function(err, coinsDispensed){
      vended.coinsDispensed = coinsDispensed;
      Beverage.dispenseOneByType(beverageType, function(err, count){
        vended.beverageType = beverageType;
        fn(err, vended);
      });
    });
  });
};


