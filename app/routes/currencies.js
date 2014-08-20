'use strict';

var Currency = require('../models/currency');
var _ = require('lodash');


exports.update = function(req, res){
  var iterator = 0;
  _.each(Currency.denominationsAccepted, function(type){
    var quantity = req.body[type];
    Currency.emptyByType(type, function(err, count){
      Currency.stockNewByType(type, quantity, function(err, count){
        iterator ++;
        if(iterator === Currency.denominationsAccepted.length){
          res.redirect('/');
        }
      });
    });
  });
};
