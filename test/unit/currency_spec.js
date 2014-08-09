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
      var c1 = new Currency('nickel');
      var c2 = new Currency('dime');
      var c3 = new Currency('quarter');
      var c4 = new Currency('dollarCoin');
      var c5 = new Currency('dollarBill');
      var c6 = new Currency('fiveDollarBill');
      c1.insert(function(err, records){
        c2.insert(function(err, records2){
          c3.insert(function(err, records2){
            c4.insert(function(err, records2){
              c5.insert(function(err, records2){
                c6.insert(function(err, records2){
                  Currency.totalAll(function(err, total){
                    expect(total).to.equal(7.40);
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
  describe('quantityLimit', function(){
    it('should return the specified limit for a given coin/bill denomination', function(done){
      var denominations = ['nickel', 'dime', 'quarter', 'dollarCoin', 'dollarBill', 'fiveDollarBill'];
      _.each(denominations, function(denomination){
        expect(typeof Currency.quantityLimit(denomination)).to.equal('number');
      });
      done();
    });
  });
  describe('stockNewByType', function(){
    it('should add a specified number of coins/bills of a given denomination to the machine', function(done){
      var nickelLimit = Currency.quantityLimit('nickel');
      var dimeLimit = Currency.quantityLimit('dime');
      var quarterLimit = Currency.quantityLimit('quarter');
      var dollarCoinLimit = Currency.quantityLimit('dollarCoin');
      var dollarBillLimit = Currency.quantityLimit('dollarBill') / 2;
      var fiveDollarBillLimit = Currency.quantityLimit('fiveDollarBill') / 2;
      Currency.stockNewByType('nickel', nickelLimit, function(err, nickelCountReturn){
        Currency.stockNewByType('dime', dimeLimit, function(err, dimeCountReturn){
          Currency.stockNewByType('quarter', quarterLimit, function(err, quarterCountReturn){
            Currency.stockNewByType('dollarCoin', dollarCoinLimit, function(err, dollarCoinCountReturn){
              Currency.stockNewByType('dollarBill', dollarBillLimit, function(err, dollarBillCountReturn){
                Currency.stockNewByType('fiveDollarBill', fiveDollarBillLimit, function(err, fiveDollarBillCountReturn){
                  Currency.countByType('nickel', function(err, nickelCount){
                    Currency.countByType('dime', function(err, dimeCount){
                      Currency.countByType('quarter', function(err, quarterCount){
                        Currency.countByType('dollarCoin', function(err, dollarCoinCount){
                          Currency.countByType('dollarBill', function(err, dollarBillCount){
                            Currency.countByType('fiveDollarBill', function(err, fiveDollarBillCount){
                              expect(nickelCountReturn).to.equal(nickelLimit);
                              expect(nickelCount).to.equal(nickelLimit);
                              expect(dimeCountReturn).to.equal(dimeLimit);
                              expect(dimeCount).to.equal(dimeLimit);
                              expect(quarterCountReturn).to.equal(quarterLimit);
                              expect(quarterCount).to.equal(quarterLimit);
                              expect(dollarCoinCountReturn).to.equal(dollarCoinLimit);
                              expect(dollarCoinCount).to.equal(dollarCoinLimit);
                              expect(dollarBillCountReturn).to.equal(dollarBillLimit);
                              expect(dollarBillCount).to.equal(dollarBillLimit);
                              expect(fiveDollarBillCount).to.equal(fiveDollarBillLimit);
                              expect(fiveDollarBillCountReturn).to.equal(fiveDollarBillLimit);
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
    it('should not add more coins/bills than the specified limit per denomination', function(done){
      var nickelOverLimit = Currency.quantityLimit('nickel') + 1;
      var dimeOverLimit = Currency.quantityLimit('dime') + 1;
      var quarterOverLimit = Currency.quantityLimit('quarter') + 1;
      var dollarCoinOverLimit = Currency.quantityLimit('dollarCoin') + 1;
      var dollarBillLimit = Currency.quantityLimit('dollarBill');
      var dollarBillOverLimit = (Currency.quantityLimit('dollarBill') / 2) + 1;
      var fiveDollarBillOverLimit = (Currency.quantityLimit('fiveDollarBill') / 2) + 1;
      Currency.stockNewByType('nickel', nickelOverLimit, function(nickelErr, nickelCountReturn){
        Currency.stockNewByType('dime', dimeOverLimit, function(dimeErr, dimeCountReturn){
          Currency.stockNewByType('quarter', quarterOverLimit, function(quarterErr, quarterCountReturn){
            Currency.stockNewByType('dollarCoin', dollarCoinOverLimit, function(dollarCoinErr, dollarCoinCountReturn){
              Currency.stockNewByType('dollarBill', dollarBillLimit, function(dollarBillInitialErr, dollarBillInitialCountReturn){
                Currency.stockNewByType('dollarBill', dollarBillOverLimit, function(dollarBillErr, dollarBillCountReturn){
                  Currency.stockNewByType('fiveDollarBill', fiveDollarBillOverLimit, function(fiveDollarBillErr, fiveDollarBillCountReturn){
                    Currency.countByType('nickel', function(err, nickelCount){
                      Currency.countByType('dime', function(err, dimeCount){
                        Currency.countByType('quarter', function(err, quarterCount){
                          Currency.countByType('dollarCoin', function(err, dollarCoinCount){
                            Currency.countByType('dollarBill', function(err, dollarBillCount){
                              Currency.countByType('fiveDollarBill', function(err, fiveDollarBillCount){
                                expect(nickelCountReturn).to.equal(0);
                                expect(nickelCount).to.equal(0);
                                expect(typeof nickelErr).to.equal('string');
                                expect(dimeCountReturn).to.equal(0);
                                expect(dimeCount).to.equal(0);
                                expect(typeof dimeErr).to.equal('string');
                                expect(quarterCountReturn).to.equal(0);
                                expect(quarterCount).to.equal(0);
                                expect(typeof quarterErr).to.equal('string');
                                expect(dollarCoinCountReturn).to.equal(0);
                                expect(dollarCoinCount).to.equal(0);
                                expect(typeof dollarCoinErr).to.equal('string');
                                expect(dollarBillInitialCountReturn).to.equal(dollarBillLimit);
                                expect(dollarBillCount).to.equal(dollarBillLimit);
                                expect(typeof dollarBillInitialErr).to.equal(null);
                                expect(dollarBillCountReturn).to.equal(0);
                                expect(typeof dollarBillErr).to.equal('string');
                                expect(fiveDollarBillCount).to.equal(0);
                                expect(fiveDollarBillCountReturn).to.equal(0);
                                expect(typeof fiveDollarBillErr).to.equal('string');
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
});
