(function(){

  'use strict';

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
    initializeCurrency();
    initializePurchaseQueue();
    loadWallet();
    defineEventHandlers();
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
    $('.currency').click(currencyClick);
    $('#coin-return').click(coinReturnClick);
  }

  function currencyClick(){
    var self = this;
    var type = $(self).attr('data-type');

    // Determine if there is sufficient space in machine to add a given coin or bill and that the user has sufficient money in wallet.
    // Adjust coin count display.
    var walletCount = getWalletCount(type);
    if(bankHasOverhead(type) && walletCount > 0){
      adjustWalletCount(type, walletCount - 1);
      incrementPurchaseQueue(type);
      adjustCoinDisplay(PurchaseQueue.value);
    } else if(!bankHasOverhead(type)){
      adjustCoinDisplay(type + ' slot full');
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

    function incrementPurchaseQueue(type) {
      PurchaseQueue.currencies[type] ++;
      PurchaseQueue.value += (Currency.denominations[type].value - 0);
    }
  }

  function coinReturnClick(){
    var url = '/machines/make-change/';
    $.ajax({url:url, type:'post', data: PurchaseQueue, success:getChange});

    function getChange(data){

      console.log('getChange: ', data);
    }

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
    var $coinDisplay = $($('#coin-display > h1')[0]);
    var newText = '';
    if((typeof input) !== 'string'){
      newText = input.toFixed(2);
    } else {
      newText = input.toUpperCase();
    }
    $coinDisplay.text(newText);
  }

})();

