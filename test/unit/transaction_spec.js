'use strict';

process.env.DBNAME = 'vending-test';
var expect = require('chai').expect;
var Mongo = require('mongodb');
var Transaction;

describe('Transaction', function(){
  this.timeout(10000);
  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      Transaction = require('../../app/models/transaction');
      done();
    });
  });
  beforeEach(function(done){
    global.nss.db.dropDatabase(function(err, result){
      done();
    });
  });
  describe('new', function(){
    it('should create a new Transaction object', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      expect(t1).to.be.instanceof(Transaction);
      expect(t1.beverageType).to.equal('Cheerwine');
      expect(t1.currencyInTotal).to.equal(1);
      expect(t1.coinsDispensed.dollarCoin).to.equal(1);
      done();
    });
  });
  describe('#insert', function(){
    it('should add a new Transaction record to the database', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      t1.insert(function(err, records){
        expect(t1._id).to.be.instanceof(Mongo.ObjectID);
        expect(records[0].beverageType).to.equal(t1.beverageType);
        done();
      });
    });
  });
  describe('findById', function(){
    it('should find a Transaction by its Id', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      t1.insert(function(err, records){
        var id = (t1._id).toString();
        Transaction.findById(id, function(record){
          expect(record._id).to.deep.equal(t1._id);
          done();
        });
      });
    });
  });
  describe('findByBeverageType', function(){
    it('should find a Transaction by its beverageType', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      t1.insert(function(err, records){
        Transaction.findByBeverageType('Cheerwine', function(err, records){
          expect(records[0].beverageType).to.deep.equal(transaction.beverageType);
          done();
        });
      });
    });
  });
  describe('index', function(){
    it('should find and return all transactions', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      var t2 = new Transaction(transaction);
      t1.insert(function(err, records){
        t2.insert(function(err, records2){
          Transaction.index(function(records3){
            expect(records3.length).to.equal(2);
            done();
          });
        });
      });
    });
  });
  describe('destroy', function(){
    it('should delete a Transaction from the DB', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      t1.insert(function(err, records){
        Transaction.destroy(t1._id, function(err, count){
          Transaction.findById(records[0]._id.toString(), function(record){
            expect(record).to.deep.equal(null);
            done();
          });
        });
      });
    });
  });
  describe('destroyAll', function(){
    it('should delete all Transactions from the DB', function(done){
      var transaction = {beverageType: 'Cheerwine', currencyInTotal: 1,
        coinsDispensed : {dollarCoin: 1, quarter: 2, dime: 3, nickel: 4}
      };
      var t1 = new Transaction(transaction);
      var t2 = new Transaction(transaction);
      t1.insert(function(err, records){
        t2.insert(function(err, records2){
          Transaction.destroyAll(function(err, count){
            Transaction.index(function(records3){
              expect(records3.length).to.equal(0);
              done();
            });
          });
        });
      });
    });
  });
});
