'use strict';
var Machines = require('./machines');

exports.index = function(req, res){
  Machines.getStateOfMachine(req, function(data, err){
    if(err){
      if(err.indexOf('Machines') > -1){
        res.redirect('/machines/create');
      } else {
        res.redirect('/beverageTypes/create');
      }
    } else {
      res.render('home/index', data);
    }
  });
};
