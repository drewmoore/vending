'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var Mongo = require('mongodb');
var Beverage;
var BeverageType;

describe('Beverage', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Beverage = require('../../app/models/beverage');
      BeverageType = require('../../app/models/beverageType');
      done();
    });
  });
  beforeEach(function(done){
    global.nss.db.dropDatabase(function(err, result){
      done();
    });
  });
  describe('new', function(){
    it('should create a new Beverage object', function(done){
      var b1 = new Beverage('Cheerwine');
      expect(b1).to.be.instanceof(Beverage);
      expect(b1.name).to.equal('Cheerwine');
      done();
    });
  });
  describe('#insert', function(){
    it('should add a new Beverage record to the database', function(done){
      var b1 = new Beverage('Cheerwine');
      b1.insert(function(err, records){
        expect(b1._id).to.be.instanceof(Mongo.ObjectID);
        expect(records[0].name).to.equal(b1.name);
        done();
      });
    });
  });
  describe('findByProductName', function(){
    it('should find an array of all beverages with the same product name', function(done){
      var b1 = new Beverage('Cheerwine');
      var b2 = new Beverage('Cheerwine');
      var b3 = new Beverage('Jarritos Lime');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          b3.insert(function(err, records){
            Beverage.findByProductName('Cheerwine', function(err, records){
              expect(records.length).to.equal(2);
              expect(records[0].name).to.equal('Cheerwine');
              done();
            });
          });
        });
      });
    });
  });
  describe('countAll', function(){
    it('should get a count of all beverages in the machine', function(done){
      var b1 = new Beverage('Cheerwine');
      var b2 = new Beverage('Cheerwine');
      var b3 = new Beverage('Jarritos Lime');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          b3.insert(function(err, records){
            Beverage.countAll(function(err, count){
              expect(count).to.equal(3);
              done();
            });
          });
        });
      });
    });
  });
  describe('countByProductName', function(){
    it('should return a count of all beverages with the same product name', function(done){
      var b1 = new Beverage('Cheerwine');
      var b2 = new Beverage('Cheerwine');
      var b3 = new Beverage('Jarritos Lime');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          b3.insert(function(err, records){
            Beverage.countByProductName('Cheerwine', function(err, count){
              expect(count).to.equal(2);
              done();
            });
          });
        });
      });
    });
  });
  describe('stockNew', function(){
    it('should add a specified number of beverages of a given product type to the machine', function(done){
      Beverage.stockNew('Cheerwine', Beverage.quantityLimit, function(err, count){
        Beverage.findByProductName('Cheerwine', function(err, records){
          expect(records.length).to.equal(Beverage.quantityLimit);
          done();
        });
      });
    });
    it('should not add any beverages above the specified limit', function(done){
      Beverage.stockNew('Cheerwine', Beverage.quantityLimit + 1, function(stockError, count){
        Beverage.findByProductName('Cheerwine', function(err, records){
          expect(records.length).to.equal(0);
          expect(typeof stockError).to.equal('string');
          done();
        });
      });
    });
  });
  describe('dispenseOneByType', function(){
    it('should dispense a product, or remove an entry from the database by product name', function(done){
      Beverage.stockNew('Cheerwine', 10, function(err, count){
        Beverage.dispenseOneByType('Cheerwine', function(err, count){
          Beverage.countByProductName('Cheerwine', function(err, count){
            expect(count).to.equal(9);
            done();
          });
        });
      });
    });
    it('should not dispense a product if there are none left', function(done){
      Beverage.stockNew('Cheerwine', 1, function(err, count){
        Beverage.dispenseOneByType('Cheerwine', function(err, count){
          Beverage.dispenseOneByType('Cheerwine', function(err, count){
            expect(count).to.equal(0);
            expect(typeof err).to.equal('string');
            done();
          });
        });
      });
    });
  });
  describe('changeNames', function(done){
    it('should change the names of all specified beverages in machine', function(done){
      Beverage.stockNew('Cheerwine', 10, function(err, count){
        Beverage.stockNew('Jarritos Lime', 10, function(err, count){
          Beverage.changeNames('Cheerwine', 'RC Cola', function(err, records){
            Beverage.findByProductName('Cheerwine', function(err, recordsOld){
              Beverage.findByProductName('RC Cola', function(err, recordsNew){
                Beverage.findByProductName('Jarritos Lime', function(err, recordsOther){
                  expect(recordsOld.length).to.equal(0);
                  expect(recordsNew.length).to.equal(10);
                  expect(recordsOther.length).to.equal(10);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('emptyByName', function(){
    it('should delete all entries for a beverage product from the DB', function(done){
      var bt1 = new BeverageType('Cheerwine');
      bt1.insert(function(err, records){
        Beverage.stockNew('Cheerwine', 10, function(err, count){
          Beverage.stockNew('Jarritos Lime', 10, function(err, count){
            Beverage.emptyByName('Cheerwine', function(err, count){
              Beverage.findByProductName('Cheerwine', function(err, beveragesRecord){
                BeverageType.findByProductName('Cheerwine', function(err, beverageTypeRecords){
                  expect(beveragesRecord.length).to.equal(0);
                  expect(beverageTypeRecords[0].name).to.equal('Cheerwine');
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('emptyAll', function(){
    it('should delete all beverages from the machine, but retain the types, i.e. designated slots and labels', function(done){
      var bt1 = new BeverageType('Cheerwine');
      var b2 = new BeverageType('Jarritos Lime');
      bt1.insert(function(err, records){
        b2.insert(function(err, records){
          Beverage.stockNew('Cheerwine', 10, function(err, count){
            Beverage.stockNew('Jarritos Lime', 10, function(err, count){
              Beverage.emptyAll(function(err, count){
                Beverage.findByProductName('Cheerwine', function(err, beveragesRecord){
                  Beverage.findByProductName('Jarritos Lime', function(err, beveragesRecord2){
                    BeverageType.findByProductName('Cheerwine', function(err, beverageTypeRecords){
                      BeverageType.findByProductName('Jarritos Lime', function(err, beverageTypeRecords2){
                        expect(beveragesRecord.length).to.equal(0);
                        expect(beveragesRecord2.length).to.equal(0);
                        expect(beverageTypeRecords[0].name).to.equal('Cheerwine');
                        expect(beverageTypeRecords2[0].name).to.equal('Jarritos Lime');
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
