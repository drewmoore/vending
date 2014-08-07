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
  describe('#addImage', function(){
    it('should add an image', function(done){
      var b1 = new Beverage('Cheerwine');
      var oldname = __dirname + '/../fixtures/test-copy.jpg';
      b1.addImage(oldname, function(){
        expect(b1.image).to.equal('/img/beverages/' + b1.name + '.jpg');
        done();
      });
    });
  });
  /*
  describe('findById', function(){
    it('should find a Beverage by its Id', function(done){
      var b1 = new Beverage({whatever: 'stuff'});
      b1.insert(function(err, records){
        var id = (b1._id).toString();
        Beverage.findById(id, function(record){
          expect(record._id).to.deep.equal(b1._id);
          done();
        });
      });
    });
  });
  describe('findByUserId', function(){
    it('should find a Beverage by its userId', function(done){
      var u1 = new User({email:'test@nomail.com', name:'Test', password:'1234'});
      u1.register(function(err, body){
        var b1 = new Beverage({whatever: 'stuff'});
        b1.addUser(u1._id);
        b1.insert(function(err, records){
          Beverage.findByUserId(u1._id.toString(), function(results){
            expect(results.length).to.equal(1);
            expect(results[0].whatever).to.equal('stuff');
            done();
          });
        });
      });
    });
  });
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
