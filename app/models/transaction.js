'use strict';

var Transaction;
var transactions = global.nss.db.collection('transactions');
var Mongo = require('mongodb');

module.exports = Transaction;

function Transaction(transaction){
  this.beverageType = transaction.beverageType;
  this.currencyInTotal = transaction.currencyInTotal;
  this.totalChange = transaction.totalChange;
  this.coinsDispensed = transaction.coinsDispensed;
}

Transaction.index = function(fn){
  transactions.find().toArray(function(err, records){
    fn(records);
  });
};

Transaction.prototype.insert = function(fn){
  var self = this;
  transactions.find({_id:self._id}).toArray(function(err, foundEntries){
    if(foundEntries.length === 0){
      self.time = new Date();
      transactions.insert(self, function(err, records){
        fn(err, records);
      });
    } else {
      fn('That transaction is already in here, yo!');
    }
  });
};

Transaction.findById = function(id, fn){
  var mongoId = new Mongo.ObjectID(id);
  transactions.findOne({_id:mongoId}, function(err, record){
    fn(record);
  });
};

Transaction.findByBeverageType = function(type, fn){
  transactions.find({beverageType:type}).toArray(function(err, records){
    fn(err, records);
  });
};

Transaction.destroy = function(id, fn){
  if((typeof id) === 'string'){
    id = Mongo.ObjectID(id);
  }
  transactions.remove({_id:id}, function(err, count){
    fn(err, count);
  });
};

Transaction.destroyAll = function(fn){
  transactions.remove({}, function(err, count){
    fn(err, count);
  });
};
