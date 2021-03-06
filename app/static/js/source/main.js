(function(){

  'use strict';

  var Machine = {};

  var Currency = {
    denominations : {},
    slotsLeft : {}
  };

  var PurchaseQueue = {
    currencies: {},
    value: 0,
    machineId: $($('#machine')[0]).attr('data-id')
  };

  $(document).ready(initialize);

  function initialize(){
    $(document).foundation();
    initializeMachine();
    initializeCurrency();
    initializePurchaseQueue();
    loadWallet();
    defineEventHandlers();
  }

  function initializeMachine(){
    var $machineDiv = $($('#machine')[0]);
    Machine.price = parseFloat($machineDiv.attr('data-price'));
    Machine.inService = $machineDiv.attr('data-in-service');
    Machine.hasChange = $machineDiv.attr('data-has-change');
    Machine.hasOverheadInBank = $machineDiv.attr('data-has-overhead-in-bank');
  }

  function initializeCurrency(){
    var denominationDivs = $('.currency');
    _.each(denominationDivs, function(div){
      // Define types of denominations accepted and their values.
      var type = $(div).attr('data-type');
      Currency.denominations[type] = {};
      Currency.denominations[type].name = type;
      Currency.denominations[type].value = $(div).attr('data-value') - 0;

      // Define the types of money slots and their current limits.
      if(isPaper(type)){
        type = 'paperBill';
      }
      var $dataElement = $('.slots-left[data-type="' + type + '"]');
      var overhead = parseInt($dataElement.attr('data-overhead'));
      Currency.slotsLeft[type] = {};
      Currency.slotsLeft[type].name = type;
      Currency.slotsLeft[type].count = overhead;

    });
  }

  function initializePurchaseQueue(){
    PurchaseQueue.value = 0;
    _.each(Currency.denominations, function(denom){
      PurchaseQueue.currencies[denom.name] = 0;
    });
  }

  function loadWallet(){
    // Starts off every denomination in wallet with a specified count.
    var bankForEach = 30;
    _.each(Currency.denominations, function(denom){
      adjustWalletCount(denom.name, bankForEach);
    });
  }

  function defineEventHandlers(){
    if(Machine.inService !== undefined){
      $('.currency').click(currencyClick);
      $('#coin-return').click(coinReturnClick);
      $('.beverage-logo').click(beverageLogoClick);
    } else {
      adjustCoinDisplay('out of service');
    }
    $('#transaction-reset').click(resetTransactions);
  }

  function currencyClick(){
    var self = this;
    var type = $(self).attr('data-type');
    // Determine if there is sufficient space in machine to add a given coin or bill and that the user has sufficient money in wallet.
    // Adjust coin count display.
    var walletCount = getWalletCount(type);
    if(bankHasOverhead(type) && walletCount > 0 && !isSuperflous()){
      adjustWalletCount(type, -1);
      incrementPurchaseQueue(type);
      adjustCoinDisplay(PurchaseQueue.value);
      if(isPaper(type)){
        Currency.slotsLeft.paperBill.count -= 1;
      } else {
        Currency.slotsLeft[type].count -= 1;
      }
    } else if(!bankHasOverhead(type)){
      adjustCoinDisplay(type + ' slot full');
    } else if(isSuperflous){
      adjustCoinDisplay('make selection');
    }

    // Determines if there is sufficient space for a given denomination, different rules apply to paper bills
    function bankHasOverhead(type){
      if(isPaper(type)){
        type = 'paperBill';
      }
      var overhead = Currency.slotsLeft[type].count;
      if(overhead >= 1){
        return true;
      } else {
        return false;
      }
    }

    // Sets a limit on how much money can be put into queue.
    // Prevents users from inserting, say, 100 dollars and depleting the bank of change.
    function isSuperflous(){
      if(PurchaseQueue.value >= Machine.price){
        return true;
      } else {
        return false;
      }
    }

    function incrementPurchaseQueue(type) {
      PurchaseQueue.currencies[type] ++;
      PurchaseQueue.value += (Currency.denominations[type].value - 0);
    }
  }

  function coinReturnClick(){
    var url = '/machines/return-coins/';
    $.ajax({url:url, type:'post', data: PurchaseQueue, success:getChange});
  }

  function beverageLogoClick(){
    var self = this;
    if($(self).attr('data-is-out') === undefined){
      if(PurchaseQueue.value >= Machine.price){
        var id = $(self).attr('data-id');
        var image = $(self).attr('style').split('(')[1].split(')')[0];
        makePurchase(id, image);
      } else {
        adjustCoinDisplay('insert money');
      }
    } else {
      adjustCoinDisplay('sold out');
    }
  }

  function makePurchase(beverageTypeId, image){
    var $dispenseSlot = $($('#dispense-slot')[0]);
    var $imageElement = $('<img>');
    var url = '/machines/make-purchase/';
    PurchaseQueue.beverageTypeId = beverageTypeId;

    $.ajax({url:url, type:'post', data: PurchaseQueue, success:receivePurchase});

    initializePurchaseQueue();

    console.log('purchaseQueue: ', PurchaseQueue);

    $imageElement.attr('src', image);
    $dispenseSlot.prepend($imageElement);
    adjustCoinDisplay('vending');
  }

  function receivePurchase(data){

    _.each(data.stateOfMachine.beverageTypes, function(bevType){
      if(bevType.isOut){
        var id = bevType._id.toString();
        var $bevDiv = $('.beverage-logo[data-id="' + id + '"]');
        var $bevOut = $('<div>');
        if($bevDiv.attr('data-is-out') === undefined) {
          $bevOut.addClass('beverage-empty');
          $bevDiv.attr('data-is-out', '');
          $bevDiv.append($bevOut);
        }
      }
    });
    Machine = data.stateOfMachine.machine;
    _.each(data.stateOfMachine.slotsLeft, function(denom){
      if(isPaper(denom.type)){
        denom.type = 'paperBill';
      }
      Currency.slotsLeft[denom.type].count = denom.overhead;
    });

    // getChange(data.vended);

    _.each(data.vended.coinsDispensed, function(denom){
      adjustWalletCount(denom.name, denom.count);
    });
    initializePurchaseQueue();
    adjustCoinDisplay(0);
    _.each(data.stateOfMachine.slotsLeft, function(denom){
      Currency.slotsLeft[denom.type].count = denom.overhead;
    });

    if(!Machine.inService){
      adjustCoinDisplay('out of service');
      $('.beverage-logo').unbind('click');
      $('.currency').unbind('click');
      $('#coin-return').unbind('click');
    }


    console.log('receivePurchase: data', data);


    console.log('receivePurchase, Machine', Machine);

    console.log('receivePurchase, Currency', Currency);


  }

  function isPaper(type){
    var $dataElement = $('.paper-bills-accepted[data-type="' + type + '"]');
    if($dataElement.length < 1){
      return false;
    } else {
      return true;
    }
  }

  function adjustWalletCount(denom, toIncrement){
    var currentCount = getWalletCount(denom);
    var newCount = currentCount += toIncrement;
    var $countDisplay = $('.currency-in-wallet[data-type="' + denom + '"]');

    $countDisplay.text(newCount.toString());
  }

  function getWalletCount(denom){
    var $countDisplay = $('.currency-in-wallet[data-type="' + denom + '"]');
    var currentCount = parseInt($countDisplay.text());
    return currentCount;
  }

  function adjustCoinDisplay(input){
    var $coinCount = $($('#coin-count')[0]);
    var $coinDisplayDivider = $($('#coin-display-divider')[0]);
    var $coinDisplayPrice = $($('#coin-display-price')[0]);
    var doms = [$coinDisplayDivider, $coinDisplayPrice];

    if((typeof input) !== 'string'){
      $coinCount.text(input.toFixed(2));
      $coinDisplayDivider.text('|');
      $coinDisplayPrice.text(Machine.price.toFixed(2));
      _.each(doms, function($dom){
        $dom.show();
      });
    } else {
      $coinCount.text(input.toUpperCase());
      _.each(doms, function($dom){
        $dom.hide();
      });
    }
  }

  function getChange(data){
    _.each(data.coinsDispensed, function(denom){
      adjustWalletCount(denom.name, denom.count);
    });
    initializePurchaseQueue();
    adjustCoinDisplay(0);
    _.each(data.stateOfMachine.slotsLeft, function(denom){
      Currency.slotsLeft[denom.type].count = denom.overhead;
    });
  }

  function resetTransactions(){
    var url = '/transactions/reset/';
    $.ajax({url:url, type:'post', success:transactionsReset});
  }

  function transactionsReset(data){
    $('#transaction-log > table > tbody').empty();
  }

})();

