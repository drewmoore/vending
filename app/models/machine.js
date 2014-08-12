'use strict';

var Machine;
var machines = global.nss.db.collection('machines');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Currency = require('./currency');

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

  console.log('MACHINE MAKE CHANGE: THESE ARE THE TYPES: ', types, types.length);

  var iterator = 0;

  getTotalsByType();
  function getTotalsByType(){

    var type = types[iterator];

    console.log('MACHINE MAKE CHANGE: GET TOTALS BY TYPE: ', type.type, iterator);

    Currency.totalByType(type.type, function(err, totalByType){

      console.log('MACHINE MAKE CHANGE: EACH TYPE: CURRENCY TOTAL BY TYPE: ', type.type, types[iterator].type, totalByType, iterator);

      if(totalByType >= type.value){
        coinsDispensed[type.type] = 0;
        dispenseCoins(type, totalByType, function(err){

          console.log('DISPENSE COINS CALLBACK: ', err);

          iterator ++;
          getTotalsByType();
        });
      } else {
        iterator ++;
        if(iterator === types.length){
          fn(err, coinsDispensed);
        }
      }
    });
  }

  function dispenseCoins(type, totalByType, dispenseCallBack){

    console.log('DISPENSE COINS CALLED: ', moneyOut, type, types[iterator], totalByType, iterator);

    Currency.dispenseOneByType(type.type, function(err, count){
      if(err){

        console.log('THIS TYPE RAN OUT OR WAS EMPTY: ', moneyOut, type, totalByType, iterator);

        dispenseCallBack(err);
      } else {
        coinsDispensed[type.type] ++;
        moneyOut += type.value * count;
        totalByType -= type.value;
        if(moneyOut >= changeNeeded){
          fn(err, coinsDispensed);
        } else {

          console.log('DISPENSE COINS MONEY OUT < CHANGE NEEDED: ', moneyOut, type, totalByType, coinsDispensed, iterator);

          dispenseCoins(type, totalByType, dispenseCallBack);
        }
      }
    });
  }
};












