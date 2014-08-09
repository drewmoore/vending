'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var fs = require('fs');
var exec = require('child_process').exec;
var Mongo = require('mongodb');
var Beverage;
var BeverageType;

describe('BeverageType', function(){
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
    var testdir = __dirname + '/../../app/static/img/beverageTypes';
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
    it('should create a new BeverageType object', function(done){
      var b1 = new BeverageType('Cheerwine');
      expect(b1).to.be.instanceof(BeverageType);
      expect(b1.name).to.equal('Cheerwine');
      done();
    });
  });
  describe('#insert', function(){
    it('should add a new BeverageType record to the database', function(done){
      var b1 = new BeverageType('Cheerwine');
      b1.insert(function(err, records){
        expect(b1._id).to.be.instanceof(Mongo.ObjectID);
        expect(records[0].name).to.equal(b1.name);
        done();
      });
    });
    it('should not add a duplicate BeverageType record to the database', function(done){
      var b1 = new BeverageType('Cheerwine');
      var b2 = new BeverageType('Cheerwine');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          expect(b2._id).to.be.undefined;
          expect(records).to.be.undefined;
          expect(typeof err).to.deep.equal('string');
          done();
        });
      });
    });
    it('should not add too many BeverageTypes to the database, limited number of slots in machine', function(done){
      var b1 = new BeverageType('Cheerwine');
      var b2 = new BeverageType('Jarritos Lime');
      var b3 = new BeverageType('Jarritos Tamarindo');
      var b4 = new BeverageType('Jarritos Mandarin');
      var b5 = new BeverageType('RC Cola');
      var b6 = new BeverageType('Dr. Pepper');
      var b7 = new BeverageType('Monster Juice');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          b3.insert(function(err, records){
            b4.insert(function(err, records){
              b5.insert(function(err, records){
                b6.insert(function(err, records6){
                  b7.insert(function(err, records7){
                    expect(records6[0].name).to.equal('Dr. Pepper');
                    expect(records7).to.be.undefined;
                    expect(typeof err).to.deep.equal('string');
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
  describe('findById', function(){
    it('should find a beverage type by its database id', function(done){
      var b1 = new BeverageType('Cheerwine');
      b1.insert(function(err, records){
        var id = (b1._id).toString();
        BeverageType.findById(id, function(err, record){
          expect(record._id).to.deep.equal(b1._id);
          expect(record.name).to.deep.equal('Cheerwine');
          done();
        });
      });
    });
  });
  describe('findByProductName', function(){
    it('should find an array of all beverage types with the same product name', function(done){
      var b1 = new BeverageType('Cheerwine');
      var b2 = new BeverageType('Jarritos Lime');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          BeverageType.findByProductName('Cheerwine', function(err, records){
            expect(records.length).to.equal(1);
            expect(records[0].name).to.equal('Cheerwine');
            done();
          });
        });
      });
    });
  });
  describe('index', function(){
    it('should find and return all beverage types', function(done){
      var b1 = new BeverageType('Cheerwine');
      var b2 = new BeverageType('Jarritos Lime');
      b1.insert(function(err, records){
        b2.insert(function(err, records2){
          BeverageType.index(function(records3){
            expect(records3.length).to.equal(2);
            done();
          });
        });
      });
    });
  });
  describe('#addImage', function(){
    it('should add/update an image', function(done){
      var b1 = new BeverageType('Cheerwine');
      b1.insert(function(err, records){
        var oldname = __dirname + '/../fixtures/test-copy.jpg';
        b1.addImage(oldname, function(){
          expect(b1.image).to.equal('/img/beverageTypes/' + b1.name + '.jpg');
          done();
        });
      });
    });
  });
  describe('#changeName', function(){
    it('should change the name of a beverage type in the database', function(done){
      var b1 = new BeverageType('Cheerwine');
      b1.insert(function(err, records){
        b1.changeName('RC Cola', function(err, result){
          var id = (b1._id).toString();
          BeverageType.findById(id, function(err, record){
            expect(record.name).to.equal('RC Cola');
            done();
          });
        });
      });
    });
    it('should change the name of all beverages in DB that are the same type as the BeverageType', function(done){
      var bt1 = new BeverageType('Cheerwine');
      var b1 = new Beverage('Cheerwine');
      var b2 = new Beverage('Cheerwine');
      var b3 = new Beverage('Jarritos Lime');
      bt1.insert(function(err, records){
        b1.insert(function(err, records){
          b2.insert(function(err, records){
            b3.insert(function(err, records){
              bt1.changeName('RC Cola', function(err, result){
                Beverage.findByProductName('Cheerwine', function(err, recordsOldName){
                  Beverage.findByProductName('RC Cola', function(err, recordsNewName){
                    Beverage.findByProductName('Jarritos Lime', function(err, recordsOtherName){
                      expect(recordsOldName.length).to.equal(0);
                      expect(recordsNewName.length).to.equal(2);
                      expect(recordsOtherName.length).to.equal(1);
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
  describe('purchase', function(){
    it('should carry out all the functions of purchasing a drink in regards to beverage and currency quantity', function(done){
      expect(1).to.equal(0);
      done();
    });
  });
  describe('destroy', function(){
    it('should delete a BeverageType from the DB, as well as all associated beverages', function(done){
      var bt1 = new BeverageType('Cheerwine');
      var b1 = new Beverage('Cheerwine');
      var b2 = new Beverage('Cheerwine');
      var b3 = new Beverage('Jarritos Lime');
      bt1.insert(function(err, records){
        b1.insert(function(err, records){
          b2.insert(function(err, records){
            b3.insert(function(err, records){
              BeverageType.destroy(bt1.name, function(err, count){
                BeverageType.findById(records[0]._id.toString(), function(beverageTypeRecord){
                  Beverage.findByProductName('Cheerwine', function(err, beveragesRecords){
                    expect(beverageTypeRecord).to.deep.equal(null);
                    expect(beveragesRecords.length).to.equal(0);
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
