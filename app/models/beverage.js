'use strict';

var Beverage;
var beverages = global.nss.db.collection('beverages');
Beverage.quantityLimit = 30;

module.exports = Beverage;

function Beverage(name){
  this.name = name;
}

Beverage.prototype.insert = function(fn){
  var self = this;
  beverages.find({_id:self._id}).toArray(function(err, foundEntries){
    if(foundEntries.length === 0){
      beverages.insert(self, function(err, records){
        fn(err, records);
      });
    } else {
      fn('That beverage is already in the database.');
    }
  });
};

Beverage.findByProductName = function(name, fn){
  beverages.find({name:name}).toArray(function(err, foundEntries){
    fn(err, foundEntries);
  });
};

Beverage.countAll = function(fn){
  beverages.find().toArray(function(err, foundEntries){
    fn(err, foundEntries.length);
  });
};

Beverage.countByProductName = function(name, fn){
  beverages.find({name:name}).toArray(function(err, foundEntries){
    fn(err, foundEntries.length);
  });
};

Beverage.stockNew = function(name, quantity, fn){
  Beverage.findByProductName(name, function(err, foundEntries){
    if((foundEntries.length + quantity) <= Beverage.quantityLimit){
      var beveragesToStock = [];
      for(var i=0; i<quantity; i++){
        var b1 = new Beverage(name);
        beveragesToStock.push(b1);
      }
      beverages.insert(beveragesToStock, function(err, records){
        fn(err, records.length);
      });
    } else {
      var spacesForNewBeverages = Beverage.quantityLimit - foundEntries.length;
      var customError = 'You tried to add too many new beverages.  There are only ' + spacesForNewBeverages + ' slots left open.';
      fn(customError, []);
    }
  });
};

Beverage.dispenseOneByType = function(name, fn){
  Beverage.countByProductName(name, function(err, productCount){
    if(productCount >= 1){
      beverages.findOne({name:name}, function(err, record){
        beverages.remove(record, function(err, count){
          fn(err, productCount - 1);
        });
      });
    } else {
      err = 'There is no more ' + name + ' to dispense.';
      fn(err, 0);
    }
  });
};

Beverage.changeNames = function(oldName, newName, fn){
  beverages.update({name:oldName}, {$set: {name: newName}}, {multi: true}, function(err, count){
    fn(err, count);
  });
};

Beverage.emptyByName = function(name, fn){
  beverages.remove({name:name}, function(err, count){
    fn(err, count);
  });
};

Beverage.emptyAll = function(fn){
  beverages.remove({}, function(err, count){
    fn(err, count);
  });
};
