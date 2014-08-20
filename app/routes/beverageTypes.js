'use strict';

var BeverageType = require('../models/beverageType');
var Beverage = require('../models/beverage');
var Machine = require('../models/machine');
var _ = require('lodash');


exports.createPage = function(req, res){
  Machine.index(function(records){
    var machine = records[0];
    machine.id = records[0]._id.toString();
    var quantityLimit = Beverage.quantityLimit;
    res.render('beverageTypes/create', {quantityLimit: quantityLimit, machine:machine});
  });
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
        Machine.index(function(records){
          var machine = records[0];
          machine.id = records[0]._id.toString();
          var quantityLimit = Beverage.quantityLimit;
          res.render('beverageTypes/create', {quantityLimit: quantityLimit, machine:machine, err:modelErr});
        });
      } else {
        var quantity = req.body.quantity;
        Beverage.stockNew(bt1.name, quantity, function(err, count){
          res.redirect('/');
        });
      }
    });
  });
};

exports.edit = function(req, res){
  Machine.index(function(records){
    var machine = records[0];
    machine.id = records[0]._id.toString();
    var quantityLimit = Beverage.quantityLimit;
    BeverageType.index(function(types){
      var iteration = 0;
      _.each(types, function(type){
        Beverage.countByProductName(type.name, function(err, count){
          type.count = count;
          iteration ++;
          if(iteration === types.length){
            res.render('beverageTypes/edit', {types:types, quantityLimit:quantityLimit,  machine:machine});
          }
        });
      });
    });
  });
};

exports.update = function(req, res){
  if(req.body.beverageId){
    BeverageType.findById(req.body.beverageId, function(err, beverageType){
      var bt1 = new BeverageType(beverageType.name);
      bt1._id = beverageType._id;
      bt1.image = beverageType.image;
      var name = bt1.name;
      if(req.body.name.length > 0){
        name = req.body.name;
      }
      bt1.changeName(name, function(err, changedType){
        if(req.files.imageFile.size > 0){
          var imageFile = req.body.imageFile || req.files.imageFile.path;
          bt1.addImage(imageFile, function(err){
            bt1.update(function(err, record){
              var quantity = req.body.quantity;
              if(quantity){
                Beverage.emptyByName(changedType.name, function(err, count){
                  Beverage.stockNew(changedType.name, quantity, function(err, count){
                    res.redirect('/');
                  });
                });
              } else {
                res.redirect('/');
              }
            });
          });
        } else {
          var quantity = req.body.quantity;
          if(quantity.length > 0){
            Beverage.emptyByName(changedType.name, function(err, count){
              Beverage.stockNew(changedType.name, quantity, function(err, count){
                res.redirect('/');
              });
            });
          } else {
            res.redirect('/');
          }
        }
      });
    });
  } else {
    res.redirect('beverageTypes/edit');
  }
};
