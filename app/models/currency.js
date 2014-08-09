'use strict';

var Currency;
var currencies = global.nss.db.collection('currencies');
var _ = require('lodash');

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

Currency.quantityLimit = function(type){
  var quantityLimit;
  var nickelLimit = 80;
  var dimeLimit = 100;
  var quarterLimit = 80;
  var dollarCoinLimit = 50;
  var paperBillLimit = 100;

  var isPaper = false;
  _.each(Currency.paperBillsAccepted, function(bill){
    if(bill === type){
      isPaper = true;
    }
  });
  if(isPaper){
    var totalBillsInMachine = 0;
    _.each(Currency.paperBillsAccepted, function(bill){
      Currency.countByType(bill, function(err, count){
        totalBillsInMachine += count;

        console.log('QUANTITY LIMIT: ITS PAPER: GETTING TOTAL BILLS IN MACHINE:  ', type, bill, err, count, totalBillsInMachine);

      });
    });
    quantityLimit = paperBillLimit - totalBillsInMachine;
    return quantityLimit;
  } else {

    console.log('QUANTITY LIMIT: ITS NOT PAPER: ', type);

    switch(type) {
      case 'nickel':
        quantityLimit = nickelLimit;
        break;
      case 'dime':
        quantityLimit = dimeLimit;
        break;
      case 'quarter':
        quantityLimit = quarterLimit;
        break;
      case 'dollarCoin':
        quantityLimit = dollarCoinLimit;
        break;
    }
    return quantityLimit;
  }
};

Currency.stockNewByType = function(type, quantity, fn){
  Currency.countByType(type, function(err, count){
    if(quantity <= Currency.quantityLimit(type)){

      console.log('STOCK NEW BY TYPE QUANTITY LESS THAN QUANTITY LIMIT: ', type, quantity, Currency.quantityLimit(type));

      var currenciesToStock = [];
      for(var i=0; i<quantity; i++){
        var c1 = new Currency(type);
        currenciesToStock.push(c1);
      }
      currencies.insert(currenciesToStock, function(err, records){
        fn(err, records.length);
      });
    } else {
      var customError = 'You tried to add too many new coins/bills.';
      fn(customError, 0);
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
