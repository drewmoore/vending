'use strict';

var Machine;
var machines = global.nss.db.collection('machines');
var Mongo = require('mongodb');
var path = require('path');
var fs = require('fs');

module.exports = Machine;

function Machine(price){
  this.price = price;
}

Machine.index = function(fn){
  machines.find().toArray(function(err, records){
    fn(records);
  });
};

Machine.prototype.addUser = function(userId){
  var self = this;
  self.userId = userId.toString();
};

Machine.prototype.insert = function(fn){
  var self = this;
  machines.find({_id:self._id}).toArray(function(err, foundEntries){
    if(foundEntries.length === 0){
      machines.insert(self, function(err, records){
        fn(err, records);
      });
    } else {
      fn('That machine is already in here, yo!');
    }
  });
};
Machine.prototype.addImage = function(oldname, fn){
  var self = this;
  var extension = path.extname(oldname);
  var absolutePath = __dirname + '/../static';
  var machinesPath = absolutePath + '/img/machines';
  var relativePath = '/img/machines/skin' + extension;
  fs.mkdir(machinesPath, function(){
    fs.rename(oldname, absolutePath + relativePath, function(err){
      self.image = relativePath;
      fn(err);
    });
  });
};
Machine.findById = function(id, fn){
  var mongoId = new Mongo.ObjectID(id);
  machines.findOne({_id:mongoId}, function(err, record){
    fn(record);
  });
};

Machine.findByUserId = function(id, fn){
  machines.find({userId:id.toString()}).toArray(function(err, records){
    fn(records);
  });
};

Machine.prototype.update = function(fn){
  var self = this;
  machines.update({_id:self._id}, self, function(err, count){
    Machine.findById(self._id.toString(), function(record){
      fn(record);
    });
  });
};

Machine.destroy = function(id, fn){
  if((typeof id) === 'string'){
    id = Mongo.ObjectID(id);
  }
  machines.remove({_id:id}, function(err, count){
    fn(err, count);
  });
};
