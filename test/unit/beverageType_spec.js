'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var fs = require('fs');
var exec = require('child_process').exec;
var Mongo = require('mongodb');
var BeverageType;

describe('BeverageType', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
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
      var b2 = new BeverageType('Cheerwine');
      var b3 = new BeverageType('Jarritos Lime');
      b1.insert(function(err, records){
        b2.insert(function(err, records){
          b3.insert(function(err, records){
            BeverageType.findByProductName('Cheerwine', function(err, records){
              expect(records.length).to.equal(2);
              expect(records[0].name).to.equal('Cheerwine');
              done();
            });
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
  });
  describe('destroy', function(){
    it('should delete a BeverageType from the DB', function(done){
      var b1 = new BeverageType('Cheerwine');
      b1.insert(function(err, records){
        var id = (b1._id).toString();
        BeverageType.destroy(id, function(err, count){
          BeverageType.findById(records[0]._id.toString(), function(record){
            expect(record).to.deep.equal(null);
            done();
          });
        });
      });
    });
  });
});
