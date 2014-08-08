'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var fs = require('fs');
var exec = require('child_process').exec;
var Mongo = require('mongodb');
var Beverage;

describe('Beverage', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Beverage = require('../../app/models/beverage');
      done();
    });
  });
  beforeEach(function(done){
    var testdir = __dirname + '/../../app/static/img/beverages';
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
  /*
  describe('index', function(){
    it('should find and return all beverages', function(done){
      var b1 = new Beverage({whatever: 'stuff'});
      var s2 = new Beverage({whatever: 'other stuff'});
      b1.insert(function(err, records){
        s2.insert(function(err, records2){
          Beverage.index(function(records3){
            expect(records3.length).to.equal(2);
            done();
          });
        });
      });
    });
  });
  describe('#update', function(){
    it('should update a Beverage info in the database', function(done){
      var b1 = new Beverage({whatever: 'stuff'});
      b1.insert(function(err, records){
        b1.whatever = 'stuff changed';
        b1.update(function(result){
          var id = (b1._id).toString();
          Beverage.findById(id, function(record){
            expect(record.whatever).to.deep.equal(b1.whatever);
            done();
          });
        });
      });
    });
  });
  describe('destroy', function(){
    it('should delete a Beverage from the DB', function(done){
      var b1 = new Beverage({whatever: 'stuff'});
      b1.insert(function(err, records){
        Beverage.destroy(b1._id, function(err, count){
          Beverage.findById(records[0]._id.toString(), function(record){
            expect(record).to.deep.equal(null);
            done();
          });
        });
      });
    });
  });
  */
});
