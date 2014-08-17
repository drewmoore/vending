(function(){

  'use strict';

  // Globals
  var walletCounts = [];

  $(document).ready(initialize);

  function initialize(){
    $(document).foundation();
    loadWallet();
    defineEventHandlers();
  }

  function loadWallet(){
    // Starts off every denomination in wallet with a count of 100, or whatever we want to specify.
    var bankForEach = 100;
    var denominationDivs = $('.currency');

    _.each(denominationDivs, function(div){
      var denom = {};
      denom.type = $(div).attr('data-type');
      denom.count = bankForEach;
      walletCounts.push(denom);

      // Make counts display in Dom.

    });


    console.log('load wallet called: ', denominationDivs, walletCounts);
  }

  function defineEventHandlers(){
    $('.currency').click(currencyClick);
  }

  function currencyClick(){
    var self = this;
    var type = $(self).attr('data-type');
    var value = $(self).attr('data-value');
    console.log('currencyClick called: ', self, type, value);
  }


})();

