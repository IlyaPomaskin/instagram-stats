var instajam = require('instajam/dist/instajam');
var $ = require('jquery');
var _ = require('lodash');
var StatsMiner = require('./statsMiner');

$(function () {
    var Instagram = Instajam.init({
        clientId: '21cf45174d124071a7b90c32d02edfa7',
        redirectUri: 'http://localhost:3000/',
        scope: ['basic']
    });

    if (!Instagram.authenticated) {
        $('#auth-header').removeClass('hidden');
        return $('#auth-url').attr('href', Instagram.authUrl);
    } else {
        $('#stats-body').removeClass('hidden');
    }

    var accumStats = {};

    var statsMiner = new StatsMiner({
        paginationField: 'max_id',
        fetchFunction: Instagram.user.media.bind(Instagram, 3),
        fetchFunctionOptions: {
            count: 100
        },
        statsCallback: function (statsArray) {
            accumStats = statsMiner.calculateTotal(statsArray, accumStats);

            var rowsHtmlArray = _.map(accumStats, function (value, key) {
                return _.template($('#stats-row-template').html())({
                    key: key,
                    value: JSON.stringify(value, false, 4)
                });
            });

            $('#stats-table').find('tbody').html(rowsHtmlArray.join(''));
        }
    });

    $('#mining-toggle').on('click', function () {
        var startMining = 'Start mining';
        var stopMining = 'Stop mining';

        if ($(this).text() == startMining) {
            statsMiner.start();
            $(this).text(stopMining);
        } else {
            statsMiner.stop();
            $(this).text(startMining);
        }
    });
});