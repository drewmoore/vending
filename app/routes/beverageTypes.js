'use strict';

var BeverageType = require('../models/beverageType');
var Beverage = require('../models/beverage');

/*
exports.index = function(req, res){
  BeverageType.index(function(beverageTypes){
    res.render('beverageTypes/index', {beverageTypes:beverageTypes});
  });
};
*/

exports.createPage = function(req, res){
  var quantityLimit = Beverage.quantityLimit;
  res.render('beverageTypes/create', {quantityLimit: quantityLimit});
};

exports.create = function(req, res){
  var beverageType =  {
    name: req.body.name
  };
  var imageFile = req.body.imageFile || req.files.imageFile.path;
  var bt1 = new BeverageType(beverageType.name);
  bt1.addImage(imageFile, function(err){
    bt1.insert(function(modelErr, records){
      if(typeof modelErr === 'string'){
        res.render('beverageTypes/create', {err:modelErr});
      } else {
        var quantity = req.body.quantity;
        Beverage.stockNew(bt1.name, quantity, function(err, count){
          res.redirect('/');
        });
      }
    });
  });
};
/*
exports.edit = function(req, res){
  BeverageType.findById(req.params.id, function(beverageType){
    User.findById(req.session.userId, function(err, user){
      res.render('beverageTypes/edit', {title:'Edit a Sample Model', beverageType:beverageType, user:user});
    });
  });
};

exports.update = function(req, res){
  var bt1 = new BeverageType(req.body.beverageType || req.body);
  var imageFile = req.body.imageFile || req.files.imageFile.path;
  bt1._id = new Mongo.ObjectID(req.params.id);
  bt1.addImage(imageFile, function(err){
    bt1.update(function(record){
      res.redirect('/beverageTypes/' + req.params.id);
    });
  });
};

exports.remove = function(req, res){
  BeverageType.destroy(req.params.id, function(err, count){
    res.redirect('/beverageTypes');
  });
};

exports.show = function(req, res){
  User.findById(req.session.userId, function(err, user){
    BeverageType.findById(req.params.id, function(beverageType){
      if(beverageType){
        res.render('beverageTypes/show', {title:'Sample Model Show', beverageType:beverageType, user:user});
      } else {
        res.render('beverageTypes/', {title:'Sample Models', err:'beverageType not found', user:user});
      }
    });
  });
};
*/
