(function(){

  'use strict';

  var CurrencyValue = {};
  var PurchaseQueue = {};

  $(document).ready(initialize);

  function initialize(){
    $(document).foundation();
    loadWallet();
    defineEventHandlers();
  }

  function loadWallet(){
    // Starts off every denomination in wallet with a specified count. Define global currency denomination values.
    // Load Purchase Queue with initial values.
    var bankForEach = 30;
    var denominationDivs = $('.currency');

    _.each(denominationDivs, function(div){
      var type = $(div).attr('data-type');
      var $countDisplay = $('.currency-in-wallet[data-type="' + type + '"]');
      $countDisplay.text(bankForEach.toString());
      CurrencyValue[type] = $(div).attr('data-value') - 0;
      PurchaseQueue[type] = 0;
    });
    PurchaseQueue.value = 0;
  }

  function defineEventHandlers(){
    $('.currency').click(currencyClick);
  }

  function currencyClick(){
    var self = this;
    var type = $(self).attr('data-type');
    var $element = $('.currency-in-wallet[data-type="' + type + '"]');
    var domCount = parseInt($element.text());

    // Determine if there is sufficient space in machine to add a given coin or bill and that the user has sufficient money in wallet.
    // Adjust coin count display.
    if(bankHasOverhead(type) && domCount > 0){
      decrementWallet(type, $element, domCount);
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
      var $dataElement = $('.slots-left[data-type="' + type + '"]');
      var overhead = parseInt($dataElement.attr('data-overhead'));
      if(overhead >= 1){
        return true;
      } else {
        return false;
      }

      console.log('bankHasOverhead called: ', type, $dataElement, overhead, '\n');
    }

    function decrementWallet(type, $element, domCount){
      // Decrement wallet by denomination. Adjust overhead by denomination. Add to purchase queue by denomination.
      var $dataElement;
      if(isPaper(type)){
        $dataElement = $('.slots-left[data-type="paperBill"]');
      } else {
        $dataElement = $('.slots-left[data-type="' + type + '"]');
      }
      var overhead = parseInt($dataElement.attr('data-overhead'));
      domCount -= 1;
      overhead -= 1;
      $element.text(domCount.toString());
      $dataElement.attr('data-overhead', overhead.toString());
    }

    function incrementPurchaseQueue(type) {
      PurchaseQueue[type] ++;
      PurchaseQueue.value += (CurrencyValue[type] - 0);
    }


    console.log('currencyClick called: ', self, type, CurrencyValue, PurchaseQueue, '\n');
  }

  function isPaper(type){
    var $dataElement = $('.paper-bills-accepted[data-type="' + type + '"]');
    if($dataElement.length < 1){
      return false;
    } else {
      return true;
    }

    console.log('isPaper called: ', type, $dataElement, '\n');
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

