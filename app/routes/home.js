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

                  // Calculate how many slots are left in change bank for each given denomination.  Report if any are full. Also check to see if 
                  // there are enough open slots to make a purchase, based on machine's price.
                  var currencyTypes = Currency.denominationsAccepted;
                  var slotsLeft = [];
                  var overheadValue = 0;
                  var denominations = [];
                  _.each(currencyTypes, function(type){

                    // Create an array of currency objects with the name of the type and its value
                    var denom = new Currency(type);
                    denominations.push(denom);

                    Currency.slotsLeftByType(type, function(overhead){
                      // Create an object that will contain the type of currency, and how much space is reserved for it in the machine.
                      // Accrue value of slots left open, calculated by type, to make sure a beverage can still be purchased.
                      var slot = {};
                      var c = new Currency(type);
                      overheadValue += (overhead * c.value);
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

                      if(iterator === currencyTypes.length) {

                        machine.hasOverheadInBank = true;
                        machine.inService = true;
                        if(overheadValue < machine.price){
                          machine.hasOverheadInBank = false;
                        }
                        if(!machine.hasChange && !machine.hasOverheadInBank){
                          machine.inService = false;
                        }

                        console.log('STUFF GOING TO VIEWS: ', machine, beverageTypes, slotsLeft, denominations, Currency.paperBillsAccepted);

                        res.render('home/index', {machine:machine, beverageTypes:beverageTypes, slotsLeft:slotsLeft,
                          denominationsAccepted: denominations, paperBillsAccepted:Currency.paperBillsAccepted});
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
