'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var Mongo = require('mongodb');
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
      expect(c1.value).to.equal(.25);
      done();
    });
  });
  describe('#insert', function(){
    it('should add a new Currency record to the database', function(done){
      var c1 = new Currency('quarter');
      c1.insert(function(err, records){
        expect(c1._id).to.be.instanceof(Mongo.ObjectID);
        expect(records[0].value).to.equal(.25);
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
              expect(total).to.equal(.50);
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
                expect(total).to.deep.equal(.05);
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
