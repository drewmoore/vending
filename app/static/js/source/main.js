(function(){

  'use strict';

  $(document).ready(initialize);

  function initialize(){
    $(document).foundation();
    loadWallet();
    defineEventHandlers();
  }

  function loadWallet(){
    // Starts off every denomination in wallet with a count of 100, or whatever we want to specify.
    var bankForEach = 30;
    var denominationDivs = $('.currency');

    _.each(denominationDivs, function(div){
      var type = $(div).attr('data-type');
      var $countDisplay = $('.currency-in-wallet[data-type="' + type + '"]');
      $countDisplay.text(bankForEach.toString());
    });
  }

  function defineEventHandlers(){
    $('.currency').click(currencyClick);
  }

  function currencyClick(){
    var self = this;
    var type = $(self).attr('data-type');
    var value = $(self).attr('data-value');
    var $element = $('.currency-in-wallet[data-type="' + type + '"]');
    var domCount = parseInt($element.text());

    // Determine if there is sufficient space in machine to add a given coin or bill
    if(bankHasOverhead(type) && domCount > 0){
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

      console.log('bank has overhead and domCount > 0', '\n');
    } else if(!bankHasOverhead(type)){

      console.log('bank is full, damnit', '\n');
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

    console.log('currencyClick called: ', self, type, value, '\n');
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



})();

