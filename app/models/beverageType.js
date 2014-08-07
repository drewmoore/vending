'use strict';

var BeverageType;
var beverageTypes = global.nss.db.collection('beverageTypes');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');

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
  beverageTypes.find({_id:self._id}).toArray(function(err, foundEntries){
    if(foundEntries.length === 0){
      beverageTypes.insert(self, function(err, records){
        fn(err, records);
      });
    } else {
      fn('That beverageType is already in here, yo!');
    }
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

BeverageType.prototype.changeName = function(name, fn){
  var self = this;
  self.name = name;
  beverageTypes.update({_id:self._id}, self, function(err, count){
    BeverageType.findById(self._id.toString(), function(err, record){
      fn(err, record);
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
