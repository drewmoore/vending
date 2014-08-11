'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var Mongo = require('mongodb');
var _ = require('lodash');
var Currency;

describe('Currency', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Currency = require('../../app/models/currency');
      done();
    });
  });
  beforeEach(function(done){
    global.nss.db.dropDatabase(function(err, result){
      done();
    });
  });
  describe('new', function(){
    it('should create a new Currency object', function(done){
      var c1 = new Currency('quarter');
      expect(c1).to.be.instanceof(Currency);
      expect(c1.type).to.equal('quarter');
      expect(c1.value).to.equal(0.25);
      done();
    });
  });
  describe('#insert', function(){
    it('should add a new Currency record to the database', function(done){
      var c1 = new Currency('quarter');
      c1.insert(function(err, records){
        expect(c1._id).to.be.instanceof(Mongo.ObjectID);
        expect(records[0].value).to.equal(0.25);
        done();
      });
    });
  });
  describe('countByType', function(){
    it('should return a count of a specified currency type', function(done){
      var c1 = new Currency('quarter');
      var c2 = new Currency('dime');
      var c3 = new Currency('quarter');
      c1.insert(function(err, records){
        c2.insert(function(err, records){
          c3.insert(function(err, records){
            Currency.countByType('quarter', function(err, count){
              expect(count).to.equal(2);
              done();
            });
          });
        });
      });
    });
  });
  describe('totalByType', function(){
    it('should return a total value of a specified currency type', function(done){
      var c1 = new Currency('quarter');
      var c2 = new Currency('dime');
      var c3 = new Currency('quarter');
      c1.insert(function(err, records){
        c2.insert(function(err, records){
          c3.insert(function(err, records){
            Currency.totalByType('quarter', function(err, total){
              expect(total).to.equal(0.50);
              done();
            });
          });
        });
      });
    });
  });
  describe('dispenseOneByType', function(){
    it('should subtract one coin or bill of a given denomination from the bank', function(done){
      var c1 = new Currency('quarter');
      var c2 = new Currency('dime');
      var c3 = new Currency('quarter');
      c1.insert(function(err, records){
        c2.insert(function(err, records){
          c3.insert(function(err, records){
            Currency.dispenseOneByType('quarter', function(err, count){
              Currency.countByType('quarter', function(err, count){
                expect(count).to.equal(1);
                done();
              });
            });
          });
        });
      });
    });
    it('should not subtract one coin or bill of a given denomination from the bank if there are already none left', function(done){
      var c1 = new Currency('quarter');
      var c2 = new Currency('dime');
      c1.insert(function(err, records){
        c2.insert(function(err, records){
          Currency.dispenseOneByType('quarter', function(err, count){
            Currency.dispenseOneByType('quarter', function(lastDispenseErr, lastDispenseCount){
              Currency.countByType('quarter', function(err, count){
                expect(count).to.equal(0);
                expect(lastDispenseCount).to.equal(0);
                expect(typeof lastDispenseErr).to.equal('string');
                done();
              });
            });
          });
        });
      });
    });
  });
  describe('totalAll', function(){
    it('should find and return the total value of all currencies in the machine', function(done){
      var types = Currency.denominationsAccepted;
      var iteration = 0;
      _.each(types, function(type){
        var c = new Currency(type);
        c.insert(function(err, records){
          iteration ++;
          if(iteration === types.length){
            Currency.totalAll(function(err, total){
              expect(total).to.equal(7.40);
              done();
            });
          }
        });
      });
    });
  });
  describe('slotsLeftByType', function(){
    it('should return the amount of space left in the machine for a given denomination', function(done){
      var iteration = 0;
      var types = Currency.denominationsAccepted;

      _.each(types, function(type){
        var c = new Currency(type);
        c.insert(function(err, records){
          iteration ++;
          if(iteration === types.length){
            iteration = 0;

            var currencyCount = {};
            _.each(types, function(type){
              Currency.slotsLeftByType(type, function(count){
                currencyCount[type] = count;
                iteration ++;
                if(iteration === types.length){
                  iteration = 0;

                  _.each(types, function(type){
                    if(Currency.isPaper(type)){
                      expect(currencyCount[type]).to.equal(Currency.limit.paperBill - 2);
                    } else {
                      expect(currencyCount[type]).to.equal(Currency.limit[type] - 1);
                    }
                    iteration ++;
                    if(iteration === types.length){
                      done();
                    }
                  });
                }
              });
            });
          }
        });
      });
    });
  });
  describe('stockNewByType', function(){
    it('should add a specified number of coins/bills of a given denomination to the machine', function(done){
      var toAdd = 5;
      Currency.stockNewByType('nickel', toAdd, function(err, count){
        Currency.stockNewByType('dime', toAdd, function(err, count){
          Currency.stockNewByType('quarter', toAdd, function(err, count){
            Currency.stockNewByType('dollarCoin', toAdd, function(err, count){
              Currency.stockNewByType('dollarBill', toAdd, function(err, count){
                Currency.stockNewByType('fiveDollarBill', toAdd, function(err, count){
                  Currency.countByType('nickel', function(err, nickelCount){
                    Currency.countByType('dime', function(err, dimeCount){
                      Currency.countByType('quarter', function(err, quarterCount){
                        Currency.countByType('dollarCoin', function(err, dollarCoinCount){
                          Currency.countByType('dollarBill', function(err, dollarBillCount){
                            Currency.countByType('fiveDollarBill', function(err, fiveDollarBillCount){
                              expect(nickelCount).to.equal(toAdd);
                              expect(dimeCount).to.equal(toAdd);
                              expect(quarterCount).to.equal(toAdd);
                              expect(dollarCoinCount).to.equal(toAdd);
                              expect(dollarBillCount).to.equal(toAdd);
                              expect(fiveDollarBillCount).to.equal(toAdd);
                              done();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    it('should not add more coins/bills than the limits set on each denomination', function(done){
      Currency.stockNewByType('nickel', 1, function(err, count){
        Currency.stockNewByType('dime', 1, function(err, count){
          Currency.stockNewByType('quarter', 1, function(err, count){
            Currency.stockNewByType('dollarCoin', 1, function(err, count){
              Currency.stockNewByType('dollarBill', 1, function(err, count){
                Currency.stockNewByType('fiveDollarBill', 1, function(err, count){

                  Currency.slotsLeftByType('nickel', function(maxNickel){
                    Currency.slotsLeftByType('dime', function(maxDime){
                      Currency.slotsLeftByType('quarter', function(maxQuarter){
                        Currency.slotsLeftByType('dollarCoin', function(maxDollarCoin){
                          Currency.slotsLeftByType('dollarBill', function(maxDollarBill){
                            Currency.slotsLeftByType('fiveDollarBill', function(maxFiveDollarBill){

                              Currency.stockNewByType('nickel', maxNickel +1, function(err, count){
                                Currency.stockNewByType('dime', maxDime +1, function(err, count){
                                  Currency.stockNewByType('quarter', maxQuarter +1, function(err, count){
                                    Currency.stockNewByType('dollarCoin', maxDollarCoin +1, function(err, count){
                                      Currency.stockNewByType('dollarBill', maxDollarBill +1, function(err, count){
                                        Currency.stockNewByType('fiveDollarBill', maxFiveDollarBill +1, function(err, count){

                                          Currency.countByType('nickel', function(err, nickelCount){
                                            Currency.countByType('dime', function(err, dimeCount){
                                              Currency.countByType('quarter', function(err, quarterCount){
                                                Currency.countByType('dollarCoin', function(err, dollarCoinCount){
                                                  Currency.countByType('dollarBill', function(err, dollarBillCount){
                                                    Currency.countByType('fiveDollarBill', function(err, fiveDollarBillCount){

                                                      expect(nickelCount).to.equal(1);
                                                      expect(dimeCount).to.equal(1);
                                                      expect(quarterCount).to.equal(1);
                                                      expect(dollarCoinCount).to.equal(1);
                                                      expect(dollarBillCount).to.equal(1);
                                                      expect(fiveDollarBillCount).to.equal(1);
                                                      done();

                                                    });
                                                  });
                                                });
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  describe('emptyByType', function(){
    it('should delete all Currencies of a given denomination from the DB', function(done){
      var c1 = new Currency('quarter');
      var c2 = new Currency('nickel');
      var c3 = new Currency('quarter');
      c1.insert(function(err, records){
        c2.insert(function(err, records){
          c3.insert(function(err, records){
            Currency.emptyByType('quarter', function(err, count){
              Currency.totalAll(function(err, total){
                expect(total).to.deep.equal(0.05);
                done();
              });
            });
          });
        });
      });
    });
  });
  describe('emptyAll', function(){
    it('should delete all Currencies from the DB', function(done){
      var c1 = new Currency('quarter');
      var c2 = new Currency('nickel');
      c1.insert(function(err, records){
        c2.insert(function(err, records){
          Currency.emptyAll(function(err, count){
            Currency.totalAll(function(err, count){
              expect(count).to.deep.equal(0);
              done();
            });
          });
        });
      });
    });
  });
  describe('isPaper', function(){
    it('should determine if a given currency denomination is a paper bill, therefore having differing requirements and uses', function(done){
      expect(Currency.isPaper('nickel')).to.equal(false);
      expect(Currency.isPaper('dime')).to.equal(false);
      expect(Currency.isPaper('quarter')).to.equal(false);
      expect(Currency.isPaper('dollarCoin')).to.equal(false);
      expect(Currency.isPaper('dollarBill')).to.equal(true);
      expect(Currency.isPaper('fiveDollarBill')).to.equal(true);
      done();
    });
  });
  describe('#canMakeChange', function(){
    it('should determine whether or not there is sufficient change for all accepted currency denominations.', function(done){
      expect('rock').to.equal('roll');
      done();
    });
  });
});
