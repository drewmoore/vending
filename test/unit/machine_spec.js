'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var fs = require('fs');
var exec = require('child_process').exec;
var Mongo = require('mongodb');
var _ = require('lodash');
var Machine;
var Currency;
var Beverage;

describe('Machine', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Machine = require('../../app/models/machine');
      Currency = require('../../app/models/currency');
      Beverage = require('../../app/models/beverage');
      done();
    });
  });
  beforeEach(function(done){
    var testdir = __dirname + '/../../app/static/img/machines';
    var cmd = 'rm -rf ' + testdir;
    exec(cmd, function(){
      var origfile = __dirname + '/../fixtures/test.jpg';
      var copyfile = __dirname + '/../fixtures/test-copy.jpg';
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile));
      global.nss.db.dropDatabase(function(err, result){
        done();
      });
    });
  });
  describe('new', function(){
    it('should create a new Machine object', function(done){
      var m1 = new Machine(0.75);
      expect(m1).to.be.instanceof(Machine);
      expect(m1.price).to.equal(0.75);
      done();
    });
  });
  describe('#insert', function(){
    it('should add a new Machine record to the database', function(done){
      var m1 = new Machine(0.75);
      m1.insert(function(err, records){
        expect(m1._id).to.be.instanceof(Mongo.ObjectID);
        expect(records[0].price).to.equal(m1.price);
        done();
      });
    });
  });
  describe('#addImage', function(){
    it('should add an image', function(done){
      var m1 = new Machine(0.75);
      var oldname = __dirname + '/../fixtures/test-copy.jpg';
      m1.addImage(oldname, function(){
        expect(m1.image).to.equal('/img/machines/skin.jpg');
        done();
      });
    });
  });
  describe('#update', function(){
    it('should update a Machine info in the database', function(done){
      var m1 = new Machine(0.75);
      m1.insert(function(err, records){
        m1.price = 1.00;
        m1.update(function(result){
          var id = (m1._id).toString();
          Machine.findById(id, function(record){
            expect(record.price).to.deep.equal(m1.price);
            done();
          });
        });
      });
    });
  });
  describe('destroy', function(){
    it('should delete a Machine from the DB', function(done){
      var m1 = new Machine(0.75);
      m1.insert(function(err, records){
        Machine.destroy(m1._id, function(err, count){
          Machine.findById(records[0]._id.toString(), function(record){
            expect(record).to.deep.equal(null);
            done();
          });
        });
      });
    });
  });
  describe('#canMakeChange', function(){
    it('should determine whether or not there is sufficient change for the highest accepted currency denomination.', function(done){
      var m1 = new Machine(0.75);
      Currency.stockNewByType('quarter', 17, function(err, count){
        m1.canMakeChange(function(hasChange){
          expect(hasChange).to.equal(true);
          Currency.dispenseOneByType('quarter', function(err, count){
            m1.canMakeChange(function(hasChange){
              expect(hasChange).to.equal(false);
              done();
            });
          });
        });
      });
    });
  });
  describe('#makeChange', function(){
    it('should provide accurate change for any purchase (price: 1.5, three of each denomination)', function(done){
      var m1 = new Machine(1.5);
      var iterator = 0;
      var types = Currency.denominationsAccepted;
      _.each(types, function(type){
        Currency.stockNewByType(type, 3, function(err, count){
          iterator ++;
          if(iterator === types.length){
            m1.makeChange(5, function(err, coinsDispensed){
              Currency.countByType('dollarCoin', function(err, dollarCoinCount){
                Currency.countByType('quarter', function(err, quarterCount){
                  expect(coinsDispensed.dollarCoin).to.equal(3);
                  expect(coinsDispensed.quarter).to.equal(2);
                  expect(dollarCoinCount).to.equal(0);
                  expect(quarterCount).to.equal(1);
                  done();
                });
              });
            });
          }
        });
      });
    });
    it('should provide accurate change for any purchase (price: 1.25, 13 quarters, 4 dimes, 3 nickels)', function(done){
      var m1 = new Machine(1.25);
      Currency.stockNewByType('quarter', 13, function(err, count){
        Currency.stockNewByType('dime', 4, function(err, count){
          Currency.stockNewByType('nickel', 3, function(err, count){
            m1.makeChange(5, function(err, coinsDispensed){
              Currency.countByType('quarter', function(err, quarterCount){
                Currency.countByType('dime', function(err, dimeCount){
                  Currency.countByType('nickel', function(err, nickelCount){
                    expect(coinsDispensed.dollarCoin).to.equal(0);
                    expect(coinsDispensed.quarter).to.equal(13);
                    expect(quarterCount).to.equal(0);
                    expect(dimeCount).to.equal(0);
                    expect(nickelCount).to.equal(1);
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
    it('should provide accurate change for any purchase (price: .75, 2 dimes, 3 nickels)', function(done){
      var m1 = new Machine(0.75);
      Currency.stockNewByType('dime', 2, function(err, count){
        Currency.stockNewByType('nickel', 3, function(err, count){
          m1.makeChange(1, function(err, coinsDispensed){
            Currency.countByType('quarter', function(err, quarterCount){
              Currency.countByType('dime', function(err, dimeCount){
                Currency.countByType('nickel', function(err, nickelCount){
                  expect(coinsDispensed.dollarCoin).to.equal(0);
                  expect(coinsDispensed.quarter).to.equal(0);
                  expect(coinsDispensed.dime).to.equal(2);
                  expect(coinsDispensed.nickel).to.equal(1);
                  expect(quarterCount).to.equal(0);
                  expect(dimeCount).to.equal(0);
                  expect(nickelCount).to.equal(2);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('vend', function(){
    it('should complete all processes necessary to vend a beverage, track in the database, save and return the state of the machine', function(done){
      var m1 = new Machine(0.75);
      Beverage.stockNew('Cheerwine', 10, function(err, count){
        Currency.stockNewByType('dime', 2, function(err, count){
          Currency.stockNewByType('nickel', 3, function(err, count){
            var currencyIn = [{'type': 'dollarBill', 'quantity': 1}];
            m1.vend('Cheerwine', currencyIn, function(vendErr, vended){
              Beverage.countByProductName('Cheerwine', function(err, beverageCount){
                Currency.countByType('dime', function(err, dimeCount){
                  Currency.countByType('nickel', function(err, nickelCount){
                    expect(vendErr).to.equal(null);
                    expect(vended.beverageType).to.equal('Cheerwine');
                    expect(vended.coinsDispensed.dime).to.equal(2);
                    expect(vended.coinsDispensed.nickel).to.equal(1);
                    expect(beverageCount).to.equal(9);
                    expect(dimeCount).to.equal(0);
                    expect(nickelCount).to.equal(2);
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
