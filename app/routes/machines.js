'use strict';

var Machine = require('../models/machine');
var Currency = require('../models/currency');
var _ = require('lodash');

/*
exports.index = function(req, res){
  SampleModel.index(function(sampleModels){
    User.findById(req.session.userId, function(err, user){
      res.render('sampleModels/index', {title: 'All Sample Models', sampleModels:sampleModels, user:user});
    });
  });
};
*/

exports.createPage = function(req, res){
  var currencies = [];
  _.each(Currency.denominationsAccepted, function(denom){
    if(!Currency.isPaper(denom)){
      var c = {};
      c.type = denom;
      c.limit = Currency.limit[denom];
      currencies.push(c);
    }
  });
  res.render('machines/create', {currencies:currencies});
};

exports.create = function(req, res){
  var machine =  {
    price: parseFloat(req.body.price) || 0.75
  };
  var imageFile = req.body.imageFile || req.files.imageFile.path;
  var m1 = new Machine(machine.price);
  m1.addImage(imageFile, function(err){
    m1.insert(function(err, records){
      Currency.emptyAll(function(err, count){
        var iteration = 0;
        var types = Currency.denominationsAccepted;
        _.each(types, function(type){
          if(Currency.isPaper(type)){
            iteration ++;
          } else {
            var quantity = req.body[type];
            Currency.stockNewByType(type, quantity, function(err, count){
              iteration ++;
              if(iteration === types.length){
                if(typeof err === 'string'){
                  res.redirect('/machines/create');
                } else {
                  res.redirect('/');
                }
              }
            });
          }
        });
      });
    });
  });
};

/*
exports.edit = function(req, res){
  SampleModel.findById(req.params.id, function(sampleModel){
    User.findById(req.session.userId, function(err, user){
      res.render('sampleModels/edit', {title:'Edit a Sample Model', sampleModel:sampleModel, user:user});
    });
  });
};

exports.update = function(req, res){
  var s1 = new SampleModel(req.body.sampleModel || req.body);
  var imageFile = req.body.imageFile || req.files.imageFile.path;
  s1._id = new Mongo.ObjectID(req.params.id);
  s1.addImage(imageFile, function(err){
    s1.update(function(record){
      res.redirect('/sampleModels/' + req.params.id);
    });
  });
};

exports.remove = function(req, res){
  SampleModel.destroy(req.params.id, function(err, count){
    res.redirect('/sampleModels');
  });
};

exports.show = function(req, res){
  User.findById(req.session.userId, function(err, user){
    SampleModel.findById(req.params.id, function(sampleModel){
      if(sampleModel){
        res.render('sampleModels/show', {title:'Sample Model Show', sampleModel:sampleModel, user:user});
      } else {
        res.render('sampleModels/', {title:'Sample Models', err:'sampleModel not found', user:user});
      }
    });
  });
};
*/
