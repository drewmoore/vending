'use strict';
var Machine = require('../models/machine');
var BeverageType = require('../models/beverageType');
var Beverage = require('../models/beverage');
var Currency = require('../models/currency');
var _ = require('lodash');

exports.index = function(req, res){
  Machine.index(function(records){
    if(records.length > 0){
      var machine = new Machine(records[0].price);
      machine.image = records[0].image;
      machine._id = records[0]._id;
      machine.id = records[0]._id.toString();
      machine.canMakeChange(function(hasChange){
        machine.hasChange = hasChange;
        BeverageType.index(function(beverageTypes){
          if(beverageTypes.length > 0){
            var iterator = 0;

            // Get a listing of all beverage Types in the machine.  Report if a given beverage is out. If there are no beverage Types,
            // User will have to create at least one to proceed.
            _.each(beverageTypes, function(beverage){
              Beverage.countByProductName(beverage.name, function(err, count){
                if(count < 1){
                  beverage.isOut = true;
                }
                iterator ++;
                if(iterator === beverageTypes.length) {
                  iterator = 0;

                  // Calculate how many slots are left in change bank for each given denomination.  Report if any are full.
                  var types = Currency.denominationsAccepted;
                  var slotsLeft = [];
                  _.each(types, function(type){
                    Currency.slotsLeftByType(type, function(overhead){
                      // Create an object that will contain the type of currency, and how much space is reserved for it in the machine.
                      var slot = {};
                      // Apply different rules to paper currency
                      if(Currency.isPaper(type)){
                        type = 'paperBill';
                      }
                      // Make sure we're not entering multiple records for paper bills. Make sure dollar/five dollar bills counted together.
                      var alreadyThere = false;
                      _.each(slotsLeft, function(slotInQuestion){
                        if(slotInQuestion.type === type){
                          alreadyThere = true;
                        }
                      });
                      if(!alreadyThere){
                        slot.type = type;
                        slot.overhead = overhead;
                        slotsLeft.push(slot);
                      }
                      iterator ++;

                      if(iterator === types.length) {

                        console.log('SLOTS LEFT: ', slotsLeft);

                        res.render('home/index', {machine:machine, beverageTypes:beverageTypes, slotsLeft:slotsLeft,
                          denominationsAccepted: types, paperBillsAccepted:Currency.paperBillsAccepted});
                      }
                    });
                  });
                }
              });
            });
          } else {
            res.redirect('/beverageTypes/create');
          }
        });
      });
    } else {
      res.redirect('/machines/create');
    }
  });
};
