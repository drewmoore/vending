'use strict';
var Machine = require('../models/machine');
var BeverageType = require('../models/beverageType');
var Beverage = require('../models/beverage');

exports.index = function(req, res){
  Machine.index(function(records){
    if(records.length > 0){
      var machine = records[0];
      BeverageType.index(function(beverageTypes){
        if(beverageTypes.length > 0){
          var iterator = 0;
          _.each(beverageTypes, function(beverage){

            Beverage.countByProductName(beverage.name, function(err, count){
              if(count > 1){
                beverage.isOut = true;
              }
              iterator ++;
              if(iterator === beverageTypes.length) {
                res.render('home/index', {machine:machine, beverageTypes:beverageTypes});
              }
            });
          });
        } else {
          res.redirect('/beverageTypes/create');
        }
      });
    } else {
      res.redirect('/machines/create');
    }
  });
};
