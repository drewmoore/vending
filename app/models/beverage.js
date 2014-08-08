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
      fn('That beverage is already in here, yo!');
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

/*
Beverage.index = function(fn){
  beverages.find().toArray(function(err, records){
    fn(records);
  });
};
Beverage.prototype.addImage = function(oldname, fn){
  var self = this;
  var extension = path.extname(oldname);
  var absolutePath = __dirname + '/../static';
  var beveragesPath = absolutePath + '/img/beverages';
  var relativePath = '/img/beverages/' + this.name + extension;
  fs.mkdir(beveragesPath, function(){
    fs.rename(oldname, absolutePath + relativePath, function(err){
      self.image = relativePath;
      fn(err);
    });
  });
};
Beverage.findById = function(id, fn){
  var mongoId = new Mongo.ObjectID(id);
  beverages.findOne({_id:mongoId}, function(err, record){
    fn(record);
  });
};

Beverage.findByUserId = function(id, fn){
  beverages.find({userId:id.toString()}).toArray(function(err, records){
    fn(records);
  });
};

Beverage.prototype.update = function(fn){
  var self = this;
  beverages.update({_id:self._id}, self, function(err, count){
    Beverage.findById(self._id.toString(), function(record){
      fn(record);
    });
  });
};

Beverage.destroy = function(id, fn){
  if((typeof id) === 'string'){
    id = Mongo.ObjectID(id);
  }
  beverages.remove({_id:id}, function(err, count){
    fn(err, count);
  });
};
*/
