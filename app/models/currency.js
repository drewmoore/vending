'use strict';

var Currency;
var currencies = global.nss.db.collection('currencies');
var _ = require('lodash');


Currency.limit = {
  'nickel': 80,
  'dime': 100,
  'quarter': 80,
  'dollarCoin': 50,
  'paperBill': 100
};

Currency.denominationsAccepted = ['nickel', 'dime', 'quarter', 'dollarCoin', 'dollarBill', 'fiveDollarBill'];
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

Currency.insertMany = function(currenciesIn, fn){
  currencies.insert(currenciesIn, function(err, records){
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
      total = (Math.ceil((total * 100)) / 100);
    });
    fn(err, total);
  });
};

Currency.isPaper = function(type){
  var isPaper = false;
  _.each(Currency.paperBillsAccepted, function(billType){
    if(billType === type){
      isPaper = true;
    }
  });
  return isPaper;
};

Currency.slotsLeftByType = function(type, fn){
  var slotsLeft;
  var upperLimit;
  if(Currency.isPaper(type)){
    slotsLeft = Currency.limit.paperBill;
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
        upperLimit = Currency.limit[type];
        break;
      case 'dime':
        upperLimit = Currency.limit[type];
        break;
      case 'quarter':
        upperLimit = Currency.limit[type];
        break;
      case 'dollarCoin':
        upperLimit = Currency.limit[type];
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
    var iterator = 0;
    if(records.length > 0){
      _.each(records, function(record){
        total += record.value;
        iterator ++;
        if(iterator === records.length){
          total = (Math.ceil((total * 100)) / 100);
          fn(err, total);
        }
      });
    } else {
      fn(err, 0);
    }
  });
};

Currency.totalChange = function(fn){
  Currency.totalAll(function(err, total){
    var bills = Currency.paperBillsAccepted;
    var iterator = 0;
    _.each(bills, function(bill){
      Currency.totalByType(bill, function(err, paperAmount){
        total = (total - paperAmount).toFixed(2);
        iterator ++;
        if(iterator === bills.length){
          total = (Math.ceil((total * 100)) / 100);
          fn(err, total);
        }
      });
    });
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








