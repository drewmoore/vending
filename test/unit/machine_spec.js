'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var fs = require('fs');
var exec = require('child_process').exec;
var Mongo = require('mongodb');
var Machine;

describe('Machine', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Machine = require('../../app/models/machine');
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
      var m1 = new Machine({whatever: 'stuff'});
      m1.insert(function(err, records){
        m1.whatever = 'stuff changed';
        m1.update(function(result){
          var id = (m1._id).toString();
          Machine.findById(id, function(record){
            expect(record.whatever).to.deep.equal(m1.whatever);
            done();
          });
        });
      });
    });
  });



  describe('destroy', function(){
    it('should delete a Machine from the DB', function(done){
      var m1 = new Machine({whatever: 'stuff'});
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
});
