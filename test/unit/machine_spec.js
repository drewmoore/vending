'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var Mongo = require('mongodb');
var _ = require('lodash');
var Machine;
var Currency;
var Beverage;
var Transaction;

describe('Machine', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Machine = require('../../app/models/machine');
      Currency = require('../../app/models/currency');
      Beverage = require('../../app/models/beverage');
      Transaction = require('../../app/models/transaction');
      done();
    });
  });
  beforeEach(function(done){
    global.nss.db.dropDatabase(function(err, result){
      done();
    });
    /* To test the app's ability to add/update images, replace the above code with the code below, and comment out the #addImage test below.
     * CAUTION: Running these tests WILL delete all the images on your website. Proceed with caution, and be sure to back up all data
     * before commenting out this code!!
     *
    var fs = require('fs');
    var exec = require('child_process').exec;
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
    */
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
  describe('index', function(){
    it('should find and return all machines', function(done){
      var m1 = new Machine(0.75);
      var m2 = new Machine(1.00);
      m1.insert(function(err, records){
        m2.insert(function(err, records2){
          Machine.index(function(records3){
            expect(records3.length).to.equal(2);
            expect(records[0].price).to.equal(0.75);
            done();
          });
        });
      });
    });
  });
  /* Only uncomment if necessary to test new or revised functionality. As stated above, these tests WILL destroy website data. Only proceed
   * if a backup copy has been made.
   *
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
  */
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
                  expect(coinsDispensed.dollarCoin.count).to.equal(3);
                  expect(coinsDispensed.quarter.count).to.equal(2);
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
            m1.makeChange(5, function(err, coinsDispensed, totalDispensed){
              Currency.countByType('quarter', function(err, quarterCount){
                Currency.countByType('dime', function(err, dimeCount){
                  Currency.countByType('nickel', function(err, nickelCount){
                    expect(coinsDispensed.dollarCoin.count).to.equal(0);
                    expect(coinsDispensed.quarter.count).to.equal(13);
                    expect(totalDispensed).to.equal(3.75);
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
          m1.makeChange(1, function(err, coinsDispensed, totalDispensed){
            Currency.countByType('quarter', function(err, quarterCount){
              Currency.countByType('dime', function(err, dimeCount){
                Currency.countByType('nickel', function(err, nickelCount){
                  expect(coinsDispensed.dollarCoin.count).to.equal(0);
                  expect(coinsDispensed.quarter.count).to.equal(0);
                  expect(coinsDispensed.dime.count).to.equal(2);
                  expect(coinsDispensed.nickel.count).to.equal(1);
                  expect(totalDispensed).to.equal(0.25);
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
    it('should provide accurate change for any purchase (price: .75, 1 quarter, 2 dimes, 3 nickels)', function(done){
      var m1 = new Machine(0.75);
      Currency.stockNewByType('dime', 2, function(err, count){
        Currency.stockNewByType('nickel', 3, function(err, count){
          Currency.stockNewByType('quarter', 1, function(err, count){
            m1.makeChange(1.25, function(err, coinsDispensed, totalDispensed){
              Currency.countByType('quarter', function(err, quarterCount){
                Currency.countByType('dime', function(err, dimeCount){
                  Currency.countByType('nickel', function(err, nickelCount){
                    expect(coinsDispensed.dollarCoin.count).to.equal(0);
                    expect(coinsDispensed.quarter.count).to.equal(1);
                    expect(coinsDispensed.dime.count).to.equal(2);
                    expect(coinsDispensed.nickel.count).to.equal(1);
                    expect(totalDispensed).to.equal(0.50);
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
    it('should provide accurate change for any purchase (price: .85, 1 quarter, 2 dimes, 3 nickels)', function(done){
      var m1 = new Machine(0.85);
      Currency.stockNewByType('dime', 2, function(err, count){
        Currency.stockNewByType('nickel', 3, function(err, count){
          Currency.stockNewByType('quarter', 1, function(err, count){
            m1.makeChange(0.95, function(err, coinsDispensed, totalDispensed){
              Currency.countByType('quarter', function(err, quarterCount){
                Currency.countByType('dime', function(err, dimeCount){
                  Currency.countByType('nickel', function(err, nickelCount){
                    expect(coinsDispensed.dollarCoin.count).to.equal(0);
                    expect(coinsDispensed.quarter.count).to.equal(0);
                    expect(coinsDispensed.dime.count).to.equal(1);
                    expect(coinsDispensed.nickel.count).to.equal(0);
                    expect(totalDispensed).to.equal(0.10);
                    expect(quarterCount).to.equal(1);
                    expect(dimeCount).to.equal(1);
                    expect(nickelCount).to.equal(3);
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
  describe('#vend', function(){
    it('should complete all processes necessary to vend a beverage, track in the database, save and return the state of the machine', function(done){
      var m1 = new Machine(0.75);
      Beverage.stockNew('Cheerwine', 10, function(err, count){
        Currency.stockNewByType('dime', 2, function(err, count){
          Currency.stockNewByType('nickel', 3, function(err, count){

            //var currencyIn = [{'type': 'dollarBill', 'quantity': 1}];

            var currencyIn = {currencies: {dollarBill: '1'}, value: '1'};

            m1.vend('Cheerwine', currencyIn, function(vendErr, vended){

              Beverage.countByProductName('Cheerwine', function(err, beverageCount){
                Currency.countByType('dime', function(err, dimeCount){
                  Currency.countByType('nickel', function(err, nickelCount){
                    Transaction.findByBeverageType('Cheerwine', function(err, transactions){
                      expect(vendErr).to.equal(null);
                      expect(vended.beverageType).to.equal('Cheerwine');
                      expect(vended.coinsDispensed.dime.count).to.equal(2);
                      expect(vended.coinsDispensed.nickel.count).to.equal(1);
                      expect(vended.currencyInTotal).to.equal(1);
                      expect(vended.totalChange).to.equal(0.25);
                      expect(beverageCount).to.equal(9);
                      expect(dimeCount).to.equal(0);
                      expect(nickelCount).to.equal(2);
                      expect(transactions.length).to.equal(1);
                      expect(transactions[0].beverageType).to.equal('Cheerwine');
                      expect(transactions[0].coinsDispensed.dime.count).to.equal(2);
                      expect(transactions[0].totalChange).to.equal(0.25);
                      expect(transactions[0].currencyInTotal).to.equal(1);
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
