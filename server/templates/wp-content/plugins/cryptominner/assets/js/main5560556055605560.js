/**
 * User Explorer Main Script
 *
 * @since  1.1.0
 */

( function( $ )
{
    // Update the cryptocurrency exchange data
    CryptoPlux = {};

    // Don't display the exchange rate list by default
    CryptoPlux.hideExchangeRateList        = true;

    CryptoPlux.depositRunnerSet            = false;
    CryptoPlux.depositRunner               = 0;
    CryptoPlux.depositRunnerCounter        = 0;
    CryptoPlux.depositErrorElement         = false;
    CryptoPlux.exchangeRateUpdateInterval  = 1000 * 60 * 1;

    CryptoPlux.setAdminWalletAddress       = '';
    CryptoPlux.setAdminWalletBarCodeImgUrl = '';

    CryptoPlux.selectedDepositOption       = {
        walletKey        : '',
        selectPlan       : '',
        planInterestType : ''
    };

    CryptoPlux.chartData = {};
    CryptoPlux.chartData.initialChartInterests = '';

    CryptoPlux.getSelectedPlan =  function ()
    {
        var elem = $('.select-cryptocurrency-plan:checked').parents('.cryptocurrency-plan-wrapper');
        return elem;
    };

    CryptoPlux.setPrecision = function( x )
    {
        return Number.parseFloat( x ).toPrecision( ( Cryptominner.platformDecimal + 1 ) );
    }

    /**
     * Check whether we are on a specific page
     */
    CryptoPlux.isPage = function ( pageSlug )
    {
        var pageUrl   = window.location.pathname.toString(),
            checkPage = pageUrl.match( pageSlug );

        if ( checkPage ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Disable deposit button
     */
    CryptoPlux.disableDepositBtn = function ()
    {
        $('.deposit-btn')
        .addClass('disable-deposit-btn')
            .removeClass('activate-deposit-btn')
                .attr( 'disabled', true );

        $('.acc-bal-deposit-input')
        .attr( 'disabled', true )
            .addClass('no-account-deposit');
    }

    /**
     * Properly remove the deposit error element
     */
    CryptoPlux.removeDepositErrorElement = function ( isKeypEvent )
    {
        var displayElem      = $('.cryptoplux-deposit-response'),
            highlight        = $('.highlight-error');
            depositErrorElem = CryptoPlux.depositErrorElement;

        if ( ( typeof depositErrorElem == 'object' 
                && ! depositErrorElem.hasClass( 'coin-investment-amount' )
                && ! depositErrorElem.hasClass( 'set-investment-period-data') 
            )
            || ( typeof depositErrorElem == 'object' && isKeypEvent )
        )
        {
            if ( depositErrorElem.hasClass( 'highlight-error' ) )
            {
                depositErrorElem.removeClass('highlight-error');

                if ( depositErrorElem.attr('data-hide') != '1' ) {
                    displayElem.hide( 500 );
                }
            }
        }

        if ( displayElem.hasClass('success') 
        || $('.no-deposit-markup').is( ':visible') )
        {
            displayElem.hide( 500 );
            $('.cryptocurrency-exchange-wrapper').hide( 500 );
        }
    }

    CryptoPlux.controlWithdrawalAmountError = function ( elem )
    {
        if ( typeof elem == 'object' )
        {
            var amount             = elem.val(),
            withdrawalAmount       = $('.has-withdrawal-btn'),
            setMinWithdrawalAmount = Number.parseFloat( withdrawalAmount.attr('data-min-amount' ) );
            setMaxWithdrawalAmount = Number.parseFloat( withdrawalAmount.attr('data-max-amount' ) ),
            withdrawalError        = $('.withdrawal-response-error');

            if ( elem.hasClass( 'withdrawal-error' ) 
            && withdrawalAmount.length > 0 )
            {
                if ( ! Number.isNaN( setMinWithdrawalAmount ) 
                && amount > setMinWithdrawalAmount )
                {
                    elem.removeClass('withdrawal-error')
                    .siblings('label')
                        .removeClass('amount-label-error');

                    withdrawalError.html('').hide();
                }
                else if ( ! Number.isNaN( setMaxWithdrawalAmount ) 
                && setMaxWithdrawalAmount > amount 
                && amount > setMinWithdrawalAmount )
                {
                    elem.removeClass('withdrawal-error')
                    .siblings('label')
                        .removeClass('amount-label-error');

                    withdrawalError.html('').hide();
                }
            }
        }
    }

    /**
     * Update the exchange rates
     * @param (int) usd The currency amount to convert to supported cryptocurrency
     */
    CryptoPlux.displayCryptocurrencyExchangeRates = function ( /* [usd]*/ )
    {
        var usd,
            elem,
            request,
            formData,
            exchangeRates,
            exchangeCurrency,
            cryptocurrencyLabel,
            formInput          = '',
            exchangeElemList   = $('.cryptocurrency-exchange-rates-list'),
            exchangeElemLoader = $('.cryptocurrency-exchange-rates-loader'),
            supportedCurrency  = Cryptominner.cryptocurrency;

        if ( CryptoPlux.hideExchangeRateList ) {
            return false;
        }

        // This should only run on the withdrawal or deposit page
        if ( ! CryptoPlux.isPage( '/withdrawal') 
        && ! CryptoPlux.isPage( '/deposit' ) )
        {
            return false;
        }

        if ( arguments && typeof arguments[0] != 'undefined' ) {
            usd = arguments[0];
        }
        else {
            if ( typeof $('#set-usd-amount').length > 0 ) {
                usd = $('#set-usd-amount').val();
            } else {
                usd = 1;
            }
        }

        // usd = Number.parseFloat( usd.toString().replace( ',', '' ) );
        usd = Number.parseFloat( usd.toString().replace( /[,]/g, '' ).replace( /[ ]/g, '' ) );
        if ( Number.isNaN( usd ) ) {
            return false;
        }

        exchangeElemList.hide( 500 ).html('');
        exchangeElemLoader.show( 500 );

        formData = {
            'action'       : 'cryptominner_exchange_rate_in_currency',
            'usd'          : usd,
            'cp_edit_user' : Number.parseInt( Cryptominner.cpEditUser )   
        };

        request = $.ajax({
            url:    Cryptominner.ajax_url.toString(),
            data:   formData,
            method: 'POST',
            cache:  false
        });

        request.done( function ( response, textStatus, jqXHR  )
        {
            exchangeElemLoader.hide( 500 );
            
            if ( response.success == false )
            {
                exchangeElemList.html('').show( 500 ).append( '<p class="offline-user">'+ response.data.msg.toString() +'</p>' );
                return false;
            }
            
            if ( typeof supportedCurrency == 'object' 
            && typeof response.data != 'undefined' )
            {
                exchangeRates    = response.data.rates;
                exchangeCurrency = response.data.currency.toString();

                // Reset the exchangeElemList inner html
                exchangeElemList.show( 500 ).html('');
                $('.usd-cryptocurrency-info').show(500);

                $.each( exchangeRates, function ( key, value )
                {
                    if ( typeof supportedCurrency[ key ] != 'undefined' )
                    {
                        cryptocurrencyLabel = supportedCurrency[ key ];

                        elem = '<li class="cryptocurrency-exchange-rates-list-item"><span class="exchange-rate-key">'+ cryptocurrencyLabel +'</span><span class="exchange-rate-data exchange-rate-'+ key +'">'+ exchangeRates[ key ] +'</span></li>';

                        exchangeElemList.append( elem );
                    }
                });
            }
        });

        request.fail( function( jqXHR, textStatus, errorThrown )
        {
            elem = '<li class="cryptocurrency-exchange-rates-list-item">'+ Cryptominner.exchangeRateErrorMsg.toString() +'</li>';

            exchangeElemList.html('').show( 500 ).append( elem );
        });
    }

    /**
     * Save deposit request controller
     */
    CryptoPlux.saveDeposit = function (e)
    {
        e.preventDefault();

        var request, field, clearUpdatedAccBal,
            isDepositDone = false,
            elem          = $('.activate-deposit-btn'),
            displayText   = '',
            displayElem   = $('.cryptoplux-deposit-response'),
            displayer     = displayElem.children('span'),
            depositLoader = $('.deposit-loader'),
            formData      = $('#cryptoplux-deposit-form').serialize();

        // formData.push({ name: elem.attr('name'), value: 'process_deposit' });

        elem.attr( 'disabled', true ).css( 'cursor', 'not-allowed' );
        
        displayElem.hide( 500 );

        request = $.ajax({
            url:         Cryptominner.ajax_url.toString(),
            data:        formData,
            method:      'POST',
            cache:       false
            // processData: false,
            // dataType:    'json',
            // contentType: 'application/json'
        });

        // elem.children('span').hide( 500 );
        elem.children('.save-deposit-btn-text').show(300);
        elem.children('.make-deposit-btn-text').hide(300);
        depositLoader.show( 500 );

        request.done( function ( response, textStatus, jqXHR  )
        {
            displayElem.show( 500 );

            // console.log( response );
            if ( typeof response.success == 'undefined' 
            || typeof response.data.msg == 'undefined' )
            {
                displayElem.addClass('error').removeClass('success');
                displayText = Cryptominner.errorOccuredText.toString();
            }
            else {
                displayText = response.data.msg.toString();

                if ( response.success == false ) {
                    displayElem.addClass('error').removeClass('success');

                    if ( typeof response.data.plan != 'undefined' ) {
                        field = '.' + response.data.class.toString();
                    }
                    else if ( typeof response.data.class != 'undefined' ) {
                        field = '.' + response.data.class.toString();
                    }

                    $( field ).addClass( 'highlight-error' );
                    CryptoPlux.depositErrorElement = $( field );

                    // Focus the '.hightlight-error' element
                    // $('.highlight-error').trigger('focus');
                }
                else {
                    displayElem.addClass('success').removeClass('error');

                    // Remove the deposit element section
                    if ( typeof response.data.deposited.toString() != 'undefined' 
                    && response.data.deposited.toString() == 'done' )
                    {
                        isDepositDone = true;

                        // Disable the deposit btn
                        elem
                        .attr( 'disabled', true )
                        .addClass('disable-deposit-btn')
                        .removeClass('activate-deposit-btn');

                        $('.deposit-action-response').fadeOut( 200 ).fadeIn( 200 ).html( '<span>'+ displayText +'</span>' ).addClass('deposit-success');

                        // Remove generated deposit fields
                        $('.display-plan-interest-types-field,.display-select-plan-field').fadeOut(700).html('');
                        $( '.remove-amount-field-data' ).remove();

                        $('#select-wallet-address').prop('selectedIndex', 0);

                        // Update the account balance text
                        if ( typeof response.data.account_bal_deposit != 'undefined' 
                        && response.data.account_bal_deposit == 1 )
                        {
                            $('.update-acc-bal-text').text( response.data.acc_bal.toString() );

                            $('.update-acc-bal').addClass('acc-bal-updated');

                            clearUpdatedAccBal = setTimeout( function () {
                                $('.update-acc-bal').removeClass('acc-bal-updated');
                                clearTimeout( clearUpdatedAccBal );
                            }, 5000 );
                        }
                    }
                }
            }

            displayer.html( displayText );

            if ( ! isDepositDone ) {
                elem.attr( 'disabled', false ).css( 'cursor', 'pointer' );
            }
            // elem.children('span').show( 500 );
            elem.children('.save-deposit-btn-text').hide(300);
            elem.children('.make-deposit-btn-text').show(300);
            depositLoader.hide( 500 );
        });

        request.fail( function( jqXHR, textStatus, errorThrown )
        {
            displayElem.show( 500 ).addClass('error').removeClass('success');
            displayer.html( Cryptominner.depositFailedText.toString() );

            elem.attr( 'disabled', false ).css( 'cursor', 'pointer' );
            // elem.children('span').show( 500 );
            elem.children('.save-deposit-btn-text').hide(300);
            elem.children('.make-deposit-btn-text').show(300);
            depositLoader.hide( 500 );
            // console.log( errorThrown );
        });
    }

    /**
     * Monitor Investment
     */
    CryptoPlux.monitorInvestment = function ()
    {
        var formData, request, clearUpdatedAccBal,
            accBalLoader = $('.update-acc-bal-loader-img'),
            accBalText   = $('.update-acc-bal-text');

        formData = {
            'action'             : 'cryptoplux_investment_monitor_walker',
            'deposit_preference' : Cryptominner.makeNonce.toString(),
            'cp_edit_user'       : Number.parseInt( Cryptominner.cpEditUser )
        };

        if ( CryptoPlux.depositRunnerSet ) {
            formData['deposit_walker_installed'] = 1;
        }

        request = $.ajax({
            url:         Cryptominner.ajax_url.toString(),
            data:        formData,
            method:      'POST',
            cache:       false
        });

        accBalLoader.show(500);

        request.done( function ( response, textStatus, jqXHR  )
        {
            // console.log(response);
            response = JSON.parse( response );
            accBalLoader.hide(500);

            if ( typeof response.data != 'undefined' ) { 
                if ( response.data.updated.toString() == 'updated' 
                || response.data.updated.toString() == 'up-to-date' 
                && response.data.acc_bal != 0 )
                {
                    accBalText.text( response.data.acc_bal.toString() );

                    $('.update-acc-bal').addClass('acc-bal-updated');

                    clearUpdatedAccBal = setTimeout( function () {
                        $('.update-acc-bal').removeClass('acc-bal-updated');
                        clearTimeout( clearUpdatedAccBal );
                    }, 5000 );
                }

                if ( typeof response.data.init_runner != 'undefined' ) {
                    CryptoPlux.depositRunnerSet = true;
                    CryptoPlux.depositRunner = Number.parseInt( response.data.init_runner );
                }
            }
        });

        request.fail( function( jqXHR, textStatus, errorThrown )
        {
            accBalLoader.hide(500);
            // console.log( errorThrown );
        });
    }

    // Set the withdrawal button state
    CryptoPlux.setWithdrawalButtonState = function ()
    {
        var disableWithdrawalBtn,
            elem                 = $('.withdrawal-currency-amount'),
            amount               = elem.val(),
            minAmount            = Number.parseFloat( elem.attr( 'data-min-amount' ) ),
            maxAmount            = Number.parseFloat( elem.attr( 'data-max-amount' ) ),
            withdrawalBtn        = $('.withdrawal-btn'),
            highWithdrawalStatus = $('.withdrawal-insufficient-fund.amount-too-high'),
            lowWithdrawalStatus  = $('.withdrawal-insufficient-fund.amount-too-low');
            maxWithdrawalAmountReached  = $('.withdrawal-insufficient-fund.max-withdrawal-limit-reached');

        amount = Number.parseFloat(
            amount.toString().replace( /[,]/g, '' ).replace( /[ ]/g, '' )
            );

        // console.log( amount);

        if ( Number.isNaN( amount ) )
        {
            disableWithdrawalBtn = 'none';
        }
        else {
            if ( amount <= 0 ) {
                disableWithdrawalBtn = true;
            }
            else if ( amount > Cryptominner.currency_balance ) {
                highWithdrawalStatus.slideDown( 300 );
                lowWithdrawalStatus.slideUp( 300 );
                maxWithdrawalAmountReached.slideUp( 300 );
                disableWithdrawalBtn = true;
            }
            else if ( amount < minAmount && minAmount > 0 ) {
                lowWithdrawalStatus.slideDown( 300 );
                highWithdrawalStatus.slideUp( 300 );
                maxWithdrawalAmountReached.slideUp( 300 );
                disableWithdrawalBtn = true;
            }
            else if ( amount > maxAmount && maxAmount > 0 ) {
                maxWithdrawalAmountReached.slideDown( 300 );
                lowWithdrawalStatus.slideUp( 300 );
                highWithdrawalStatus.slideUp( 300 );
                disableWithdrawalBtn = true;
            } else {
                maxWithdrawalAmountReached.slideUp( 300 );
                highWithdrawalStatus.slideUp( 300 );
                lowWithdrawalStatus.slideUp( 300 );
                disableWithdrawalBtn = false;
            }
        }

        if ( disableWithdrawalBtn == 'none' 
        || amount.toString().trim().length < 1 ) {
            // Do nothing
        }
        else if ( disableWithdrawalBtn ) {
            withdrawalBtn
            .attr( 'disabled', true )
            .addClass( 'disable-btn' );
        }
        else {
            withdrawalBtn
            .attr( 'disabled', false )
            .removeClass( 'disable-btn' );
        }
    }

    // Send birthday wish
    CryptoPlux.initBirthdayWish = function ()
    {
        var request, formData;

        formData = {
            'action'                       : 'cryptoplux_send_birthday_wish',
            'cryptoplux_send_birthday_wish': Cryptominner.birthdayWishNonce.toString(),
            'cp_edit_user'                 : Number.parseInt( Cryptominner.cpEditUser )
        };

        request = $.ajax({
            url:    Cryptominner.ajax_url.toString(),
            data:   formData,
            method: 'POST',
            cache:  false
        });

        request.done( function ( response, textStatus, jqXHR  )
        {
            // console.log( response );
        });

        request.fail( function( jqXHR, textStatus, errorThrown )
        {
            // console.log( errorThrown );
        });
    }

    // Set admin wallet address info
    CryptoPlux.setAdminwalletInfo = function ( walletKey )
    {
        walletKey = walletKey.toLowerCase();

        if ( typeof Cryptominner.admin_wallet_info[ walletKey ] != 'undefined' ) {
            CryptoPlux.setAdminWalletAddress = Cryptominner.admin_wallet_info[ walletKey ]['wallet_address'];

            CryptoPlux.setAdminWalletBarCodeImgUrl = Cryptominner.admin_wallet_info[ walletKey ]['wallet_bar_code_img_url'];
        }

        $('.set-admin-wallet-address').val( CryptoPlux.setAdminWalletAddress );
        
        $('.set-admin-wallet-bar-code-img-url').attr( 'src', CryptoPlux.setAdminWalletBarCodeImgUrl );
    }

    // Chart Loader
    CryptoPlux.chartData.displayLoader = function ()
    {
        if ( typeof c3 != 'undefined' )
        {
            var c3Chart,
                chartElem = $('#zoom-chart' );

            c3Chart = c3.generate({
                bindto: '#zoom-chart',
                size: { height: 400 },
                color: {
                    pattern: ['#E91E63']
                },

                // Create the data table.
                data: {
                    columns: [
                        [ 'interest' ]

                    ],
                    empty: {
                        label: {
                          text: chartElem.attr( 'data-loading-label' )
                        }
                    }
                },
                axis: {
                    x: {
                        show: true,
                        label: {
                            text: chartElem.attr( 'data-x-label' ),
                            position: 'outer-left'
                        }
                    },
                    y: {
                        show: true,
                        label: {
                            text: chartElem.attr( 'data-y-label' ),
                            position: 'outer-middle'
                        },
                        tick: {
                            format: d3.format( chartElem.attr('data-currency-label') +',' )
                        }
                    }
                }
            });
        }
    }

    // Update investment hourly interest data
    CryptoPlux.updateHourlyChartInterestData = function ()
    {
        var formData,
            request,
            c3Chart,
            chartCurrentSignal,
            chartElem = $('#zoom-chart' );

        formData = {
            'action'                 : 'cryptominner_update_hourly_interest_data',
            'update_hourly_interest' : Cryptominner.makeNonce.toString(),
            'cp_edit_user'           : Number.parseInt( Cryptominner.cpEditUser )
        };

        request = $.ajax({
            url:    Cryptominner.ajax_url.toString(),
            data:   formData,
            method: 'POST',
            cache:  false
        });

        request.done( function ( response, textStatus, jqXHR  )
        {
            if ( typeof response.data.chart_interests != 'undefined' 
            && typeof c3 != 'undefined' )
            {
                // console.log( response.data.chart_interests );

                CryptoPlux.chartData.initialChartInterests = response.data.chart_interests.toString();

                chartCurrentSignal = response.data.current_signal;

                /**
                 * Zoom chart
                 */
                // Callback that creates and populates a data table, instantiates the zoom chart, passes in the data and draws it.

                // chartInterests = chartElem.attr( 'data-interest-label' ) +',' + chartElem.attr( 'data-chart-interest' ),

                chartDates = chartElem.attr( 'data-date-label' ) +',' + chartElem.attr( 'data-chart-dates' );

                chartDates = chartDates.split( ',' );

                // CryptoPlux.chartData.interests = chartInterests.split( ',' );
                CryptoPlux.chartData.interests = chartElem.attr( 'data-interest-label' ) +',' + CryptoPlux.chartData.initialChartInterests;

                CryptoPlux.chartData.interests = CryptoPlux.chartData.interests.split( ',' );

                c3Chart = c3.generate({
                    bindto: '#zoom-chart',
                    size: { height: 400 },
                    color: {
                        pattern: ['#E91E63']
                    },

                    // Create the data table.
                    data: {
                        // x: 'date',
                        columns: [
                            // chartDates,
                            CryptoPlux.chartData.interests
                        ],
                        empty: {
                            label: {
                              text: chartElem.attr( 'data-loading-label' )
                            }
                        }
                    },
                    zoom: {
                        enabled: true
                    },
                    grid: {
                        y: {
                            show: true,
                            lines: [
                                { value: 0, class: 'grid800', text: chartElem.attr( 'data-grid-y-label' ) }
                            ]
                        },
                        x: {
                            lines: [
                                { value: chartCurrentSignal, class: 'current_grid' }
                            ]
                        },
                    },
                    axis: {
                        x: {
                            show: true,
                            label: {
                                text: chartElem.attr( 'data-x-label' ),
                                position: 'outer-left'
                            }
                        },
                        y: {
                            show: true,
                            label: {
                                text: chartElem.attr( 'data-y-label' ),
                                position: 'outer-middle'
                            },
                            tick: {
                                format: d3.format( chartElem.attr('data-currency-label') +',' )
                            }
                        }
                    },
                    legend: {
                        show: true
                    },
                    regions: [
                        { axis: 'y', end: 0, class: 'regionY' },
                    ]
                });

                setInterval( function ()
                {
                    c3Chart.unload({
                        ids: 'interest'
                    });
                }, 5000 );

                setInterval( function ()
                {
                    c3Chart.load({
                        columns: [
                            // chartDates,
                            CryptoPlux.chartData.interests
                        ]
                    });
                }, 2000 );

                // Resize chart on sidebar width change
                $(".menu-toggle").on('click', function() {
                    c3Chart.resize();
                });
            }
            else {
                CryptoPlux.chartData.displayLoader();
            }
        });

        request.fail( function( jqXHR, textStatus, errorThrown )
        {
            CryptoPlux.chartData.displayLoader();
        });
    }

    $(document).ready( function ()
    {
        // Initializes tooltip
        if ( typeof tooltip == 'function' ) {
            $('[data-toggle="tooltip"]').tooltip();
        }

        // Prevent user from setting the select box value on deposit page
        // to an empty field
        $(this).on( 'change', '#select-wallet-address', function ( e )
        {
            if ( CryptoPlux.selectedDepositOption.walletKey != 0 ) {
                if ( $(this).val().trim() == '' || $(this).val().trim().length < 1 ) {
                    this.selectedIndex = CryptoPlux.selectedDepositOption.walletKey;
                }
            }
        });
        $(this).on( 'change', '#select-plan', function ( e )
        {
            if ( CryptoPlux.selectedDepositOption.selectPlan != 0 ) {
                if ( $(this).val().trim() == '' || $(this).val().trim().length < 1 ) {
                    this.selectedIndex = CryptoPlux.selectedDepositOption.selectPlan;
                }
            }
        });

        $(this).on( 'change', '#select-plan-interest-type', function ( e )
        {
            if ( CryptoPlux.selectedDepositOption.planInterestType != 0 ) {
                if ( $(this).val().trim() == '' || $(this).val().trim().length < 1 ) {
                    this.selectedIndex = CryptoPlux.selectedDepositOption.planInterestType;
                }
            }
        });

        // Save deposit transactions
        $('.disable-deposit-btn').attr('disabled', true);
        $(this).on( 'click', '.cryptoplux-can-save-deposit', function (e)
        {
            // $('.close-deposit-popup').trigger('click');
            // $('.modal-backdrop').remove();
            CryptoPlux.saveDeposit(e);
        });

        // Properly set the deposit form error element class
        $(this).on( 'change', '#cryptoplux-deposit-form', function (e)
        {
            CryptoPlux.removeDepositErrorElement.call( this, ( e.type == 'keyup' ) );
  
        });
        $(this).on( 'keyup', '#cryptoplux-deposit-form', function (e)
        {
            CryptoPlux.removeDepositErrorElement.call( this, ( e.type == 'keyup' ) );
        });

        // focus the '.highlight-error' error element
        $(this).on( 'focus', '.highlight-error', function ()
        {
            var elem = $(this);
            $('html, body').animate({
                scrollTop: elem.offset().top
            }, 700);
        });

        // Update the wallet addrress
        $(this).on( 'click', '#cryptoplux-change-wallet-btn', function (e)
        {
            e.preventDefault();

            var request, field,
                elem        = $(this),
                displayText = '',
                displayElem = $('.cryptoplux-response'),
                displayer   = displayElem.children('span'),
                formData    = $('#cryptoplux-change-wallet-form').serializeArray();

            elem.attr( 'disabled', true ).css( 'cursor', 'not-allowed' );

            formData.push({ name: elem.attr('name'), value: elem.val() });

            displayElem.hide( 500 );

            request = $.ajax({
                url:         Cryptominner.ajax_url.toString(),
                data:        formData,
                method:      'POST',
                cache:       false
            });

            elem.children('span').hide( 500 );
            elem.children('img').show( 500 );

            request.done( function ( response, textStatus, jqXHR  )
            {
                displayElem.show( 500 );
                // console.log( response );

                // console.log( response );
                if ( typeof response.success == 'undefined' 
                || typeof response.data.msg == 'undefined' )
                {
                    displayElem.addClass('error').removeClass('success');
                    displayText = Cryptominner.errorOccuredText.toString();
                    return false;
                }
                else {
                    displayText = response.data.msg.toString();

                    if ( response.success == false ) {
                        displayElem.addClass('error').removeClass('success');
                    }
                    else {
                        displayElem.addClass('success').removeClass('error');
                    }
                }

                displayer.html( displayText );

                elem.attr( 'disabled', false ).css( 'cursor', 'pointer' );
                elem.children('span').show( 500 );
                elem.children('img').hide( 500 );
            });

            request.fail( function( jqXHR, textStatus, errorThrown )
            {
                displayElem.show( 500 );

                elem.attr( 'disabled', false ).css( 'cursor', 'pointer' );
                elem.children('span').show( 500 );
                elem.children('img').hide( 500 );
                // console.log( errorThrown );
            });
        });

        /**
         * Generate the HTML markup for selecting deposit plan
         * when any wallet address is selected
         */
        if ( $('#select-wallet-address').length > 0 ) {
            $('#select-wallet-address')[0].selectedIndex = 0;
        }
        $(this).on( 'change', '#select-wallet-address', function ()
        {
            var request,
                formData,
                depositSection,
                depositMarkup,
                accountBalance,
                walletAddressWrapper,
                elem          = $(this),
                fieldIndex    = this.selectedIndex,
                hasWalletKey  = elem.val(),
                depositLoader = $('.select-plan-loader'),
                planField     = $('.display-select-plan-field');

            if ( CryptoPlux.isPage( '/deposit' ) )
            {
                if ( hasWalletKey.length > 1 
                && hasWalletKey.trim() != '' 
                && CryptoPlux.selectedDepositOption.walletKey != fieldIndex )
                {
                    // CryptoPlux.selectedDepositOption.walletKey = fieldIndex;

                    depositLoader.show( 500 );
                    planField.slideUp( 500 ).html('');
                    CryptoPlux.disableDepositBtn();

                    // Remove generated deposit fields
                    $('.display-plan-interest-types-field').html('');
                    $( '.remove-amount-field-data' ).remove();

                    // Clear deposit field selected index
                    CryptoPlux.selectedDepositOption.selectPlan       = '';
                    CryptoPlux.selectedDepositOption.planInterestType = '';

                    /**
                     * Set the admin wallet info
                     */
                    CryptoPlux.setAdminwalletInfo( hasWalletKey );

                    formData = {
                        'action'             : 'cryptominner_generate_deposit_markup',
                        'deposit_preference' : Cryptominner.makeNonce.toString(),
                        'wallet_key'         : hasWalletKey,
                        'cp_edit_user'       : Number.parseInt( Cryptominner.cpEditUser )
                    };

                    request = $.ajax({
                        url:    Cryptominner.ajax_url.toString(),
                        data:   formData,
                        method: 'POST',
                        cache:  false
                    });

                    request.done( function ( response, textStatus, jqXHR  )
                    {
                        // console.log( response );
                        depositLoader.hide( 500 );

                        if ( typeof response.data.deposit_markup != 'undefined' )
                        {
                            depositMarkup = response.data.deposit_markup.toString();
                            planField.html( depositMarkup ).slideDown( 500 );

                            // Update the currency exchange rate on document load
                            // CryptoPlux.displayCryptocurrencyExchangeRates( 1 );
                        }
                        else {
                            depositMarkup = Cryptominner.noDepositResponse.toString();
                            planField.html( depositMarkup ).slideDown( 500 );
                        }
                    });

                    request.fail( function( jqXHR, textStatus, errorThrown )
                    {
                        depositLoader.hide( 500 );
                        planField.html( Cryptominner.noDepositResponse.toString() ).slideDown( 500 );
                    });
                }
            }
        });

        /**
         * Generate the HTML markup for selecting deposit plan interest types 
         * when any plan is selected
         */
        $(this).on( 'change', '#select-plan', function ()
        {
            var request,
                formData,
                depositSection,
                depositMarkup,
                accountBalance,
                walletAddressWrapper,
                elem          = $(this),
                fieldIndex    = this.selectedIndex,
                hasWalletKey  = $('#select-wallet-address'),
                depositLoader = $('.select-plan-interest-loader'),
                planField     = $('.display-plan-interest-types-field');

            if ( CryptoPlux.isPage( '/deposit' ) )
            {
                $('.cryptoplux-deposit-response').hide();

                if ( hasWalletKey.val().length > 1 
                && hasWalletKey.val().trim() != '' 
                && elem.val().trim() != '' 
                && CryptoPlux.selectedDepositOption.selectPlan != fieldIndex )
                {
                    CryptoPlux.selectedDepositOption.selectPlan       = fieldIndex;
                    CryptoPlux.selectedDepositOption.planInterestType = 0;

                    depositLoader.show( 500 );

                    // Remove the plan field and amount field data
                    planField.slideUp( 500 ).html('');
                    $( '.remove-amount-field-data' ).remove();

                    // Disable the deposit btn
                    CryptoPlux.disableDepositBtn();

                    formData = {
                        'action'             : 'cryptominner_generate_plan_interest_types_markup',
                        'deposit_preference' : Cryptominner.makeNonce.toString(),
                        'wallet_key'         : hasWalletKey.val(),
                        'plan'               : elem.val(),
                        'cp_edit_user'       : Number.parseInt( Cryptominner.cpEditUser )
                    };

                    request = $.ajax({
                        url:    Cryptominner.ajax_url.toString(),
                        data:   formData,
                        method: 'POST',
                        cache:  false
                    });

                    request.done( function ( response, textStatus, jqXHR  )
                    {
                        // console.log( response );
                        depositLoader.hide( 500 );

                        if ( typeof response.data.deposit_markup != 'undefined' )
                        {
                            depositMarkup = response.data.deposit_markup.toString();
                            planField.html( depositMarkup ).slideDown( 500 );
                        }
                        else {
                            depositMarkup = Cryptominner.noDepositResponse.toString();
                            planField.html( depositMarkup ).slideDown( 500 );
                        }
                    });

                    request.fail( function( jqXHR, textStatus, errorThrown )
                    {
                        depositLoader.hide( 500 );
                        planField.html( Cryptominner.noDepositResponse.toString() ).slideDown( 500 );
                    });
                }
            }
        });

        /**
         * Generate the HTML markup for displaying amount field 
         * when any plan interest type is selected
         */
        $(this).on( 'change', '#select-plan-interest-type', function ()
        {
            var request,
                formData,
                depositSection,
                depositMarkup,
                accountBalance,
                walletAddressWrapper,
                elem              = $(this),
                plan              = $('#select-plan'),
                fieldIndex        = this.selectedIndex,
                hasWalletKey      = $('#select-wallet-address'),
                depositLoader     = $('.select-plan-interest-type-loader'),
                planField         = $('.display-amount-field-row'),
                removeAmountField = $( '.remove-amount-field-data' );

            if ( CryptoPlux.isPage( '/deposit' ) )
            {
                $('.cryptoplux-deposit-response').hide();

                if ( hasWalletKey.val().length > 1 
                && hasWalletKey.val().trim() != '' 
                && plan.val().trim() != '' 
                && elem.val().trim() != '' 
                && CryptoPlux.selectedDepositOption.planInterestType != fieldIndex )
                {
                    CryptoPlux.selectedDepositOption.planInterestType = fieldIndex;
                    depositLoader.show( 500 );

                    /**
                     * Remove all amount field related markup
                     */
                    removeAmountField.slideUp( 500 ).remove();

                    // Hide the amount converter response element
                    $('.cryptocurrency-exchange-wrapper').hide();

                    formData = {
                        'action'             : 'cryptominner_generate_plan_amount_field',
                        'deposit_preference' : Cryptominner.makeNonce.toString(),
                        'wallet_key'         : hasWalletKey.val(),
                        'plan'               : plan.val(),
                        'cp_edit_user'       : Number.parseInt( Cryptominner.cpEditUser )
                    };

                    request = $.ajax({
                        url:    Cryptominner.ajax_url.toString(),
                        data:   formData,
                        method: 'POST',
                        cache:  false
                    });

                    request.done( function ( response, textStatus, jqXHR  )
                    {
                        // console.log( response );
                        depositLoader.hide( 500 );

                        if ( typeof response.data.deposit_markup != 'undefined' )
                        {
                            depositMarkup = response.data.deposit_markup.toString();
                            planField.prepend( depositMarkup );
                        }
                        else {
                            depositMarkup = Cryptominner.noDepositResponse.toString();
                            planField.prepend( depositMarkup );
                        }

                        // Disable deposit btn and deposit from acc bal fields
                        CryptoPlux.disableDepositBtn();
                    });

                    request.fail( function( jqXHR, textStatus, errorThrown )
                    {
                        depositLoader.hide( 500 );
                        planField.prepend( Cryptominner.noDepositResponse.toString() );
                    });

                    // Hide the compound interest info whenever simple interest is
                    // Selected
                    if ( elem.val() != 'compound_interest' 
                    && elem.val().trim() != '' )
                    {
                        $('.compound-interest-info').slideUp( 500 );
                    } else {
                        $('.compound-interest-info').slideDown( 500 );
                    }
                }
            }
        });

        // Update the currency exchange rate on document load
        CryptoPlux.displayCryptocurrencyExchangeRates( 1 );

        // Set the exchange rate update interval
        $(this).on( 'click', '#set-live-exchange-rate-interval', function ()
        {
            var minInterval = 1, // 1 mins
                maxInterval = 10, // 10 mins
                updateInterval = Number.parseInt( $(this).val() );

            if ( typeof updateInterval != 'number' ) {
                updateInterval = CryptoPlux.exchangeRateUpdateInterval;
            }
            else if ( updateInterval < 1 ) {
                updateInterval = minInterval;
            }
            else if ( updateInterval > 10 ) {
                updateInterval = maxInterval;
            }

            CryptoPlux.exchangeRateUpdateInterval = 60 * 1000 * updateInterval;
        })
        .on( 'submit', '.set-usd-amount-wrapper form', function ( e )
        {
            e.preventDefault();
            CryptoPlux.displayCryptocurrencyExchangeRates( $('#set-usd-amount').val() );
        })
        .on( 'keyup', '#set-usd-amount', function ( e )
        {
            e.preventDefault();
            CryptoPlux.displayCryptocurrencyExchangeRates( $(this).val() );
        });

        // Update the currency exchange rate every 1 mins
        CryptoPlux.exchangeRateUpdateIntervalID = setInterval(
            CryptoPlux.displayCryptocurrencyExchangeRates,
            CryptoPlux.exchangeRateUpdateInterval
        );

        // Display the maturity period when a user selects compound interest investment
        $(this).on( 'change', '.set-investment-period-data', function ()
        {
            var request,
                formData,
                forecastDisplayer,
                elem                    = $(this),
                setInvestmentPeriodElem = elem;

            if ( typeof setInvestmentPeriodElem == 'object' )
            {
                $('.cryptoplux-deposit-response').hide();

                $('.compound-interest-info').show();

                forecastDisplayer = setInvestmentPeriodElem.siblings('.forecast-investment-period-wrapper');

                forecastDisplayer.children('.forecast-period-loader').show( 500 );
                forecastDisplayer.children('span').hide( 500 );

                formData = {
                    'action'       : 'cryptominner_get_investment_maturity_period',
                    'period'       : elem.val(),
                    'cp_edit_user' : Number.parseInt( Cryptominner.cpEditUser )
                };

                request = $.ajax({
                    url:    Cryptominner.ajax_url.toString(),
                    data:   formData,
                    method: 'POST',
                    cache:  false
                });

                request.done( function ( response, textStatus, jqXHR  )
                {
                    forecastDisplayer.children('.forecast-period-loader').hide( 500 );

                    if ( typeof response.data.msg != 'undefined' ) {
                        forecastDisplayer.children('span').show(500 ).html( response.data.msg.toString() );
                    }
                    else {
                        forecastDisplayer.children('span').show( 500 ).html( Cryptominner.forecastErrorMsg.toString() );
                    }
                });

                request.fail( function( jqXHR, textStatus, errorThrown )
                {
                    forecastDisplayer.children('.forecast-period-loader').hide();
                    forecastDisplayer.children('span').show( 500 ).html( Cryptominner.forecastErrorMsg.toString() );
                });
            }
        })
        .on( 'keyup', '.set-investment-period-data', function ()
        {
            $(this).trigger( 'change' );
        })
        .on( 'change', '.select-plan-interest-type', function ()
        {
            // If interest type is compound interest, trigger the compound interest
            // forecast investment period action
            if ( $(this).val() == 'compound_interest' ) {
                $('.set-investment-period-data').trigger('change');
            }
        })
        .on( 'click', '.select-plan-interest-type option', function ()
        {
            // If interest type is compound interest, trigger the compound interest
            // forecast investment period action
            if ( $(this).attr('value') == 'compound_interest' ) {
                $('.set-investment-period-data').trigger('change');
            }
        });

        // Convert the cryptocurrency amount to USD
        $(this).on( 'keyup', '.coin-investment-amount,.amount-in-currency', function ()
        {
            var request,
                formData,
                isCurrencyField,
                converterDisplayer,
                cryptoAmountField,
                cryptoMinAmountField,
                cryptoMaxAmountField,
                mainAmountField,
                amountInCurrency,
                isAccountBalFund   = true,
                amountElem         = $(this),
                minAmount          = Number.parseFloat( amountElem.attr('data-min-amount') ),
                maxAmount          = amountElem.attr('data-max-amount'),
                amount             = amountElem.val(),
                exchangeWrapper    = $('.cryptocurrency-exchange-wrapper'),
                inputTarget        = $('.'+ amountElem.attr( 'data-input-target' ) ),
                accBalDepositInput = $('.acc-bal-deposit-input');

            if ( amountElem.length > 0 )
            {
                $('.cryptoplux-deposit-response').hide();

                isCurrencyField  = ( typeof amountElem.attr( 'data-is-currency' ) != 'undefined' ) ? 1 : 0;

                amount = Number.parseFloat(
                    amount.toString().replace( /[,]/g, '' ).replace( /[ ]/g, '' )
                    );

                mainAmountField   = $('.coin-investment-amount');

                cryptoAmountField = mainAmountField.val();
                cryptoAmountField = Number.parseFloat(
                    cryptoAmountField.toString().replace( /[,]/g, '' ).replace( /[ ]/g, '' )
                    );

                amountInCurrency = Number.parseFloat(
                    $('.amount-in-currency').val().toString().replace( /[,]/g, '' ).replace( /[ ]/g, '' )
                );

                cryptoMinAmountField = mainAmountField.attr('data-min-amount');
                cryptoMaxAmountField = mainAmountField.attr('data-max-amount');

                if ( Number.isNaN( amount ) || amount <= 0 ) {
                    // do nothing
                    return false;
                }
                else {
                    converterDisplayer = $('.convert-investment-amount-loader');

                    converterDisplayer.show( 500 );

                    formData = {
                        'action'         : 'cryptominner_convert_investment_amount',
                        'amount'         : amount,
                        'cryptocurrency' : $('#select-wallet-address').val().toUpperCase(),
                        'currency'       : inputTarget.attr('data-currency'),
                        'is_currency'    : isCurrencyField,
                        'cp_edit_user'   : Number.parseInt( Cryptominner.cpEditUser )
                    };

                    request = $.ajax({
                        url:    Cryptominner.ajax_url.toString(),
                        data:   formData,
                        method: 'POST',
                        cache:  false
                    });

                    exchangeWrapper.show();

                    request.done( function ( response, textStatus, jqXHR  )
                    {
                        exchangeWrapper.hide( 500 );
                        converterDisplayer.hide( 500 );
                        // console.log(response);

                        if ( typeof response.data.exchange != 'undefined' )
                        {
                            amountElem.addClass( 'amount-field' ).removeClass( 'exchang-field' );

                            inputTarget
                            .val( response.data.readable_exchange_rate.toString() )
                                .addClass( 'exchang-field' ).removeClass( 'amount-field' );

                                // exchangeWrapper.html( response.data.msg.toString() ).addClass( response.data.class.toString() ).show( 500 ).children( '.cryptocurrency-exchange-wrapper' ).removeClass( 'cryptocurrency-exchange-wrapper' ).addClass( 'exchange-item' );

                            // Set the withdrawal button state correctly
                            if ( CryptoPlux.isPage( '/withdrawal' ) ) {
                                CryptoPlux.setWithdrawalButtonState();
                            }

                            if ( CryptoPlux.isPage( '/deposit' ) ) {
                                maxAmount = cryptoMaxAmountField;
                                minAmount = cryptoMinAmountField;

                                // Check if the account balance will be sufficient for 
                                // the deposit
                                if ( Number.parseFloat( accBalDepositInput.attr( 'data-min-amount' ) ) > Number.parseFloat( accBalDepositInput.attr( 'data-main-accbal' ) ) 
                                || Number.parseFloat( accBalDepositInput.attr( 'data-min-amount' ) ) > amountInCurrency )
                                {
                                    isAccountBalFund = false;
                                }
                            }

                            // Reset the amount here to the cryptocurrency amount
                            if ( isCurrencyField ) {
                                amount = Number.parseFloat( mainAmountField.val().toString().replace( /[,]/g, '' ).replace( /[ ]/g, '' ) );
                            }

                            // Check if we can activate the deposit button
                            if ( amount >= minAmount 
                                && ( amount <= maxAmount || maxAmount == '$' ) 
                                && isAccountBalFund 
                            )
                            {
                                $('.deposit-btn')
                                .addClass('activate-deposit-btn')
                                    .removeClass('disable-deposit-btn')
                                        .attr( 'disabled', false );

                                accBalDepositInput
                                .attr( 'disabled', false )
                                    .removeClass('no-account-deposit');

                                // Off the amount field change event
                                $(document).off( 'change', '.coin-investment-amount,.amount-in-currency' );
                            }
                            else {
                                CryptoPlux.disableDepositBtn();
                            }
                        }
                        else {
                            exchangeWrapper.html( Cryptominner.convertAmountErrorMsg.toString() ).show( 500 ).children( '.cryptocurrency-exchange-wrapper' ).removeClass( 'cryptocurrency-exchange-wrapper' ).addClass('exchange-item');
                        }
                    });

                    request.fail( function( jqXHR, textStatus, errorThrown )
                    {
                        converterDisplayer.hide( 500 );
                        exchangeWrapper.html( Cryptominner.convertAmountErrorMsg.toString() ).children( '.cryptocurrency-exchange-wrapper' ).removeClass( 'cryptocurrency-exchange-wrapper' ).addClass( 'exchange-item' );
                    });

                    // amount field 
                }
            }
        })
        // .on( 'change', '.coin-investment-amount,.amount-in-currency', function ()
        // {
        //     // $(this).trigger( 'keyup' );
        // })
        .on( 'blur', '.coin-investment-amount,.amount-in-currency', function ()
        {
            $('.coin-investment-amount').trigger( 'keyup' );
        });

        // Update the deposit details displayed on pop box
        $(this).on( 'click', '.deposit-btn.activate-deposit-btn', function()
        {
            var displayAmountInfo = '',
                amountElem        = $('.coin-investment-amount');
                currencyElem      = $('.amount-in-currency');

            $('.selected-wallet').text( $('#select-wallet-address').val().toUpperCase() );
            $('.selected-plan').text( $('#select-plan').val() );
            $('.selected-interest-type').text(
                $('#select-plan-interest-type').val().replace( '_', ' ' )
                );

            displayAmountInfo = amountElem.val();
            displayAmountInfo += ' '+ amountElem.attr('data-currency');

            $('.selected-amount').html( displayAmountInfo );

            displayAmountInfo = currencyElem.val();
            displayAmountInfo += ' '+ currencyElem.attr('data-currency');

            $('.selected-currency').html( displayAmountInfo );
        });

        /**
         * Generate the withdrawal wallet address fields
         */
        $('.withdrawal-page-visible').on( 'click', function ()
        {
            var request, formData;

            if ( CryptoPlux.isPage( '/withdrawal' ) )
            {
                formData = {
                    'action'           : 'generate_withdrawal_wallet_address',
                    'withdrawal_nonce' : Cryptominner.makeNonce.toString(),
                    'cp_edit_user'     : Number.parseInt( Cryptominner.cpEditUser )
                };

                request = $.ajax({
                    url:    Cryptominner.ajax_url.toString(),
                    data:   formData,
                    method: 'POST',
                    cache:  false
                });

                request.done( function ( response, textStatus, jqXHR  )
                {
                    // console.log( response );
                    // Fade out the withdrawal page loader
                    $('.withdrawal-page-loader').fadeOut( 500 );

                    $('.withdrawal-page')
                    .slideUp( 300 )
                        .fadeIn( 1000 )
                            .html(  response.data.content.toString() );
                });

                request.fail( function ( jqXHR, textStatus, errorThrown )
                {
                    $('.withdrawal-page')
                    .slideUp( 300 )
                        .fadeIn( 1000 )
                            .html(  Cryptominner.noWithdrawalContent.toString() );
                });
            }
        });

        if ( $('.withdrawal-page-visible').length > 0 ) {
            var withdrawalPageTimeout = setTimeout( function ()
            {
                $('.withdrawal-page-visible').trigger( 'click' );
                clearTimeout( withdrawalPageTimeout );
            }, 3000 );
        }

        // Force the selected index to the previous value if the user
        // Selects an empty wallet address option field
        $(this).on( 'change', '.select-withdrawal-wallet', function ()
        {
            if ( CryptoPlux.isPage( '/withdrawal' ) )
            {
                if ( this.value != '' && this.value.length > 1 ) {
                    CryptoPlux.selectedDepositOption.walletKey = this.selectedIndex;
                }
            }
        });

        // Hide/show the withdrawal wallet address info
        $(this).on( 'change', '.select-withdrawal-wallet', function ()
        {
            var elem             = $(this),
                option           = elem.val(),
                amountElem       = $('.withdrawal-amount'),
                selectOptionElem = $( '.option-'+ option );
                targetedInfo     = '.withdrawal-info-'+ option +',.transaction-fee-info-'+ option;

            if ( CryptoPlux.isPage( '/withdrawal' ) )
            {
                $('.cryptoplux-deposit-response').hide();

                if ( option != '' 
                && option.length > 1 
                // && CryptoPlux.selectedDepositOption.walletKey != elem.prop('selectedIndex') 
                )
                {
                    $('.withdrawal-info,.transaction-fee-info').slideUp( 500 );
                    $( targetedInfo ).slideDown( 500 );

                    // Update the amount field to the selected wallet
                    $('.withdrawal-amount-row').slideUp(500).slideDown(500).css( 'display', 'flex' );

                    amountElem.attr( 'data-currency', option.toUpperCase() );
                    $('.set-withdrawal-wallet').text( option.toUpperCase() );

                    amountElem.attr( 'placeholder', amountElem.attr('data-num') +' '+ option.toUpperCase() );

                    $('.withdrawal-currency-amount')
                    .attr( 'data-min-amount', selectOptionElem.attr('data-min-amount') )
                    .attr( 'data-max-amount', selectOptionElem.attr('data-max-amount') );
                }
            }
        });

        // Set the withdrawal button class
        $(this).on( 'click', '.yes-save-this-withdrawal-btn', function ()
        {
            $('.withdrawal-btn').addClass( 'has-withdrawal-btn' ).trigger('click');
        });

        /** 
         * Save the user withdrawal request
         */
        $(this).on( 'click', '.has-withdrawal-btn', function ()
        {
            var request,
                formData,
                withdrawalContent,
                elem            = $(this),
                loader          = $('.make-withdrawal-loader'),
                withdrawalError = $('.withdrawal-response-error'),
                transactionFee  = $('.get-transaction-fee');

            withdrawalError.html('').hide();
            $('.withdrawal-saved').html('').remove();
            loader.show();

            formData = {
                'action'             : 'cryptoplux_save_withdrawal_request',
                'save_withdrawal'    : Cryptominner.makeNonce.toString(),
                'wallet_key'         : $('#select-wallet-address').val(),
                'amount'             : $('.withdrawal-currency-amount').val(),
                'cp_edit_user'       : Number.parseInt( Cryptominner.cpEditUser ),
            };

            elem.attr( 'disabled', true ).removeClass('has-withdrawal-btn');

            request = $.ajax({
                url:    Cryptominner.ajax_url.toString(),
                data:   formData,
                method: 'POST',
                cache:  false
            });

            request.done( function ( response, textStatus, jqXHR  )
            {
                // console.log( response );
                elem.attr( 'disabled', true ).removeClass('has-withdrawal-btn');
                loader.hide( 500 );

                if ( typeof response.data.saved != 'undefined' )
                {
                    withdrawalError.html('').hide();

                    withdrawalContent = ( typeof response.data.content != 'undefined' ) 
                        ? response.data.content.toString() : response.data.msg.toString();

                    $('.withdrawal-page').html( '<div class="contact-msg-response-wrapper"><div class="cryptominner-notice notice-success">'+ withdrawalContent +'</div></div>' );
                    elem.remove();
                }
                else {
                    withdrawalError
                    .show()
                        .html( response.data.msg.toString() );
                }
            });

            request.fail( function ( jqXHR, textStatus, errorThrown )
            {
                // console.log( errorThrown );
                 elem.attr( 'disabled', false ).removeClass('has-withdrawal-btn');
                loader.hide();
                withdrawalError
                .show()
                    .html( Cryptominner.withdrawalRequestFailed.toString() );
            });
        });

        // Hide the withdrawal amount field error
        $(this).on( 'keyup', '#wallet-account-amount,#wallet-address-amount', 
        function ()
        {
            CryptoPlux.controlWithdrawalAmountError( $(this) );
        });

        // Hide the withdrawal exchange address field error
        $(this).on( 'click', '.exchange-wallet-address-key', function ()
        {
            var elem            = $(this),
                withdrawalError = $('.withdrawal-response-error');

            withdrawalError.html('').hide();
            $('.exchange-wallet-error').removeClass('exchange-wallet-error');
        });

        // Hide the withdrawal exchange account field error
        $(this).on( 'click', '.select-withdrawal-wallet-account', function ()
        {
            var elem            = $(this),
                withdrawalError = $('.withdrawal-response-error');

            withdrawalError.html('').hide();
            $('.exchange-account-error').removeClass('exchange-account-error');
        });

        // Hide/show the registration password info
        $('#_userpwd').on('focus', function () {
            $('.reg-password-info').slideDown('700');
        });

        // Handle the clipboard events
        $('.copy-clipboard-btn')
        .on( 'click', function () {
            var elem     = $(this),
                copyText = $('#wallet-clipboard');
            
            copyText.select();
            document.execCommand("copy");

            tooltip = elem.attr('data-copied') +' '+ copyText.val();
            elem.attr( 'data-original-title', tooltip ).tooltip('show');
        })
        .on( 'mouseout', function () {
            var elem         = $(this),
                toolTipTitle = elem.attr('data-reset-title');

            elem.attr( 'data-original-title', toolTipTitle );
        });

        /**
         * Monitor investment
         */
        CryptoPlux.monitorInvestment();

        /**
         * Keep monitoring the investment unitl all the user investment has 
         * been calculated
         */
        var MonitorInvestment = setInterval(
            function () {
                if ( CryptoPlux.depositRunnerCounter <= CryptoPlux.depositRunner )
                {
                    CryptoPlux.depositRunnerCounter += 1;
                    CryptoPlux.monitorInvestment();
                }
                else {
                    clearInterval( MonitorInvestment );
                }
            },
            1000 * 15 // 15 secs
        );

        /**
         * Control account closure button
         */
        $('.close-account-checker').on( 'change', function ()
        {
            if ( this.checked ) {
                $('.close-account-btn').attr( 'disabled', false ).removeClass( 'disable' );
            } else {
                $('.close-account-btn').attr( 'disabled', true ).addClass( 'disable' );
            }
        });

        // Post archive dropdown
        $('#post-archive')
        .val('')
        .on( 'change', function ()
        {
            var url        = $(this).val();
                currentUrl = window.location.href;

            if ( url.length > 10 && url != currentUrl ) {
                window.location.href = url;
            }
        });

        /**
         * Send birthday wish
         */
        CryptoPlux.initBirthdayWish();
        var sendBirthdayWish = setTimeout( function ()
        {
            CryptoPlux.initBirthdayWish();
        }, 1000 * 20 ); // 20 secs

        // Update hourly chart interest on page load
        CryptoPlux.updateHourlyChartInterestData();

        // Should run every 61 minutes to load the hourly calculated interest
        setInterval( function ()
        {
            CryptoPlux.updateHourlyChartInterestData();
        }, 1000 * 61 * 60 );

    });
}(jQuery));