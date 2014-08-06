'use strict';

var Currency;
var currencies = global.nss.db.collection('currencies');
var Mongo = require('mongodb');

module.exports = Currency;

function Currency(type){
  this.type = type;
  switch(type) {
    case 'quarter':
      this.value = .25;
      break;
  }
}

Currency.prototype.insert = function(fn){
  var self = this;
  currencies.insert(self, function(err, records){
    fn(err, records);
  });
};

/*
SampleModel.index = function(fn){
  sampleModels.find().toArray(function(err, records){
    fn(records);
  });
};

SampleModel.prototype.addUser = function(userId){
  var self = this;
  self.userId = userId.toString();
};
*/



/*
SampleModel.prototype.addImage = function(oldname, fn){
  var self = this;
  var extension = path.extname(oldname);
  var sampleModelId = this._id.toString();
  var absolutePath = __dirname + '/../static';
  var sampleModelsPath = absolutePath + '/img/sampleModels';
  var relativePath = '/img/sampleModels/' + sampleModelId + extension;
  fs.mkdir(sampleModelsPath, function(){
    fs.rename(oldname, absolutePath + relativePath, function(err){
      self.image = relativePath;
      fn(err);
    });
  });
};
SampleModel.findById = function(id, fn){
  var mongoId = new Mongo.ObjectID(id);
  sampleModels.findOne({_id:mongoId}, function(err, record){
    fn(record);
  });
};

SampleModel.findByUserId = function(id, fn){
  sampleModels.find({userId:id.toString()}).toArray(function(err, records){
    fn(records);
  });
};

SampleModel.prototype.update = function(fn){
  var self = this;
  sampleModels.update({_id:self._id}, self, function(err, count){
    SampleModel.findById(self._id.toString(), function(record){
      fn(record);
    });
  });
};

SampleModel.destroy = function(id, fn){
  if((typeof id) === 'string'){
    id = Mongo.ObjectID(id);
  }
  sampleModels.remove({_id:id}, function(err, count){
    fn(err, count);
  });
};
*/

