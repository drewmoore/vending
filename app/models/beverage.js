'use strict';

var Beverage;
var beverages = global.nss.db.collection('beverages');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');

module.exports = Beverage;

function Beverage(name){
  this.name = name;
}

Beverage.index = function(fn){
  beverages.find().toArray(function(err, records){
    fn(records);
  });
};

Beverage.prototype.addUser = function(userId){
  var self = this;
  self.userId = userId.toString();
};

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
