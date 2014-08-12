'use strict';
var Machine = require('../models/machine');

exports.index = function(req, res){
  Machine.index(function(records){
    if(records.length > 0){
      var machine = records[0];
      res.render('home/index', {machine:machine});
    } else {
      res.redirect('/machines/create');
    }
  });
};
