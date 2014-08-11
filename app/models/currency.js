'use strict';

var Currency;
var currencies = global.nss.db.collection('currencies');
var _ = require('lodash');

Currency.nickelLimit = 80;
Currency.dimeLimit = 100;
Currency.quarterLimit = 80;
Currency.dollarCoinLimit = 50;
Currency.paperBillLimit = 100;
Currency.paperBillsAccepted = ['dollarBill', 'fiveDollarBill'];


module.exports = Currency;

function Currency(type){
  this.type = type;
  switch(type) {
    case 'nickel':
      this.value = 0.05;
      break;
    case 'dime':
      this.value = 0.10;
      break;
    case 'quarter':
      this.value = 0.25;
      break;
    case 'dollarCoin':
      this.value = 1.00;
      break;
    case 'dollarBill':
      this.value = 1.00;
      break;
    case 'fiveDollarBill':
      this.value = 5.00;
      break;
  }
}

Currency.prototype.insert = function(fn){
  var self = this;
  currencies.insert(self, function(err, records){
    fn(err, records);
  });
};

Currency.countByType = function(type, fn){
  currencies.find({type:type}).toArray(function(err, records){
    fn(err, records.length);
  });
};

Currency.totalByType = function(type, fn){
  currencies.find({type:type}).toArray(function(err, records){
    var total = 0;
    _.each(records, function(record){
      total += record.value;
    });
    fn(err, total);
  });
};

Currency.slotsLeftByType = function(type, fn){
  var slotsLeft;
  var isPaper;
  var upperLimit;
  _.each(Currency.paperBillsAccepted, function(billType){
    if(billType === type){
      isPaper = true;
    }
  });
  if(isPaper){
    slotsLeft = Currency.paperBillLimit;
    var bills = Currency.paperBillsAccepted;
    var iteration = 0;
    _.each(bills, function(bill){
      Currency.countByType(bill, function(err, count){
        slotsLeft -= count;
        iteration ++;
        if(iteration === Currency.paperBillsAccepted.length){
          fn(slotsLeft);
        }
      });
    });
  } else {
    switch(type) {
      case 'nickel':
        upperLimit = Currency.nickelLimit;
        break;
      case 'dime':
        upperLimit = Currency.dimeLimit;
        break;
      case 'quarter':
        upperLimit = Currency.quarterLimit;
        break;
      case 'dollarCoin':
        upperLimit = Currency.dollarCoinLimit;
        break;
    }
    Currency.countByType(type, function(err, count){
      slotsLeft = upperLimit - count;
      fn(slotsLeft);
    });
  }
};

Currency.stockNewByType = function(type, quantity, fn){
  Currency.slotsLeftByType(type, function(quantityLimit){
    if(quantity <= quantityLimit){
      var currenciesToStock = [];
      for(var i=0; i<quantity; i++){
        var c1 = new Currency(type);
        currenciesToStock.push(c1);
      }
      currencies.insert(currenciesToStock, function(err, records){
        fn(err, records.length);
      });
    } else {
      var customErr = 'You have tried to overstock the machine. There are only ' + quantityLimit + ' slots left open for ' + type + '.';
      fn(customErr, 0);
    }
  });
};

Currency.dispenseOneByType = function(type, fn){
  Currency.countByType(type, function(err, count){
    if(count >= 1){
      currencies.findOne({type:type}, function(err, record){
        currencies.remove(record, function(err, count){
          fn(err, count);
        });
      });
    } else {
      err = 'Cannot dispense another ' + type + '. There are already none left in the machine.';
      fn(err, count);
    }
  });
};

Currency.totalAll = function(fn){
  currencies.find().toArray(function(err, records){
    var total = 0;
    _.each(records, function(record){
      total += record.value;
    });
    fn(err, total);
  });
};

Currency.emptyByType = function(type, fn){
  currencies.remove({type:type}, function(err, count){
    fn(err, count);
  });
};

Currency.emptyAll = function(fn){
  currencies.remove(function(err, count){
    fn(err, count);
  });
};
