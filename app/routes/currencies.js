'use strict';

var Currency = require('../models/currency');
var _ = require('lodash');

/*
exports.index = function(req, res){
  Currency.index(function(currencies){
    User.findById(req.session.userId, function(err, user){
      res.render('currencies/index', {title: 'All Currencies', currencies:currencies, user:user});
    });
  });
};

exports.createPage = function(req, res){
  if(req.session.userId){
    User.findById(req.session.userId, function(err, user){
      res.render('currencies/create', {title:'Add a New Currency', user:user});
    });
  } else {
    res.render('users/auth', {title:'Register/Login'});
  }
};

exports.create = function(req, res){
  var currency =  {
    whatever: req.body.whatever || 'default setting'
  };
  var userIdString = req.session.userId.toString();
  var imageFile = req.body.imageFile || req.files.imageFile.path;
  User.findById(userIdString, function(userErr, user){
    if(typeof userErr === 'string'){
      res.render('currencies/create', {title:'Add a New Currency', err:userErr, user:user});
    } else {
      var c1 = new Currency(currency);
      c1.addUser(user._id);
      c1.insert(function(modelErr, records){
        if(typeof modelErr === 'string'){
          res.render('currencies/create', {title:'Add a New Currency', err:modelErr, user:user});
        } else {
          var u1 = new User(user);
          u1._id = user._id;
          u1.addCurrency(c1._id);
          c1.addImage(imageFile, function(err){
            u1.update(function(err, userRecord){
              c1.update(function(err, currencyRecord){
                res.redirect('currencies/' + c1._id.toString());
              });
            });
          });
        }
      });
    }
  });
};

exports.edit = function(req, res){
  Currency.findById(req.params.id, function(currency){
    User.findById(req.session.userId, function(err, user){
      res.render('currencies/edit', {title:'Edit a Currency', currency:currency, user:user});
    });
  });
};
*/

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

/*

exports.remove = function(req, res){
  Currency.destroy(req.params.id, function(err, count){
    res.redirect('/currencies');
  });
};

exports.show = function(req, res){
  User.findById(req.session.userId, function(err, user){
    Currency.findById(req.params.id, function(currency){
      if(currency){
        res.render('currencies/show', {title:'Currency Show', currency:currency, user:user});
      } else {
        res.render('currencies/', {title:'Currencies', err:'currency not found', user:user});
      }
    });
  });
};
*/
