'use strict';

var BeverageType;
var beverageTypes = global.nss.db.collection('beverageTypes');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');
var Beverage = require('./beverage');
BeverageType.quantityLimit = 6;

module.exports = BeverageType;

function BeverageType(name){
  this.name = name;
}

BeverageType.index = function(fn){
  beverageTypes.find().toArray(function(err, records){
    fn(records);
  });
};

BeverageType.prototype.insert = function(fn){
  var self = this;
  beverageTypes.find({_id:self._id}).toArray(function(err, foundEntriesById){
    BeverageType.findByProductName(self.name, function(err, foundEntriesByName){
      BeverageType.index(function(foundEntriesByIndex){
        var shouldAdd = false;
        if(foundEntriesById.length === 0 && foundEntriesByName.length === 0 && foundEntriesByIndex.length < BeverageType.quantityLimit){
          shouldAdd = true;
        }
        if(shouldAdd){
          beverageTypes.insert(self, function(err, records){
            fn(err, records);
          });
        } else {
          fn('That beverageType is already in here, yo!');
        }
      });
    });
  });
};
BeverageType.prototype.addImage = function(oldname, fn){
  var self = this;
  var extension = path.extname(oldname);
  var absolutePath = __dirname + '/../static';
  var beverageTypesPath = absolutePath + '/img/beverageTypes';
  var relativePath = '/img/beverageTypes/' + self.name + extension;
  fs.mkdir(beverageTypesPath, function(){
    fs.rename(oldname, absolutePath + relativePath, function(err){
      self.image = relativePath;
      fn(err);
    });
  });
};

BeverageType.findById = function(id, fn){
  var mongoId = new Mongo.ObjectID(id);
  beverageTypes.findOne({_id:mongoId}, function(err, record){
    fn(err, record);
  });
};

BeverageType.findByProductName = function(name, fn){
  beverageTypes.find({name:name}).toArray(function(err, foundEntries){
    fn(err, foundEntries);
  });
};

BeverageType.prototype.changeName = function(newName, fn){
  var self = this;
  var oldName = self.name;
  self.name = newName;
  beverageTypes.update({_id:self._id}, self, function(err, count){
    Beverage.changeNames(oldName, newName, function(err, count){
      BeverageType.findById(self._id.toString(), function(err, record){
        fn(err, record);
      });
    });
  });
};

BeverageType.destroy = function(id, fn){
  if((typeof id) === 'string'){
    id = Mongo.ObjectID(id);
  }
  beverageTypes.remove({_id:id}, function(err, count){
    fn(err, count);
  });
};
