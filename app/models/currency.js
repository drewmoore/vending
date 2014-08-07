'use strict';

var Currency;
var currencies = global.nss.db.collection('currencies');
var Mongo = require('mongodb');
var _ = require('lodash');

module.exports = Currency;

function Currency(type){
  this.type = type;
  switch(type) {
    case 'nickel':
      this.value = .05;
      break;
    case 'dime':
      this.value = .10;
      break;
    case 'quarter':
      this.value = .25;
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

Currency.dispenseOneByType = function(type, fn){
  currencies.findOne({type:type}, function(err, record){
    currencies.remove(record, function(err, count){
      fn(err, count);
    });
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
