var _ = require('lodash');

var StatsMiner = function (options) {
    if (typeof options !== 'object') {
        throw new Error('Wrong options');
    }

    if (!options.fetchFunction) {
        throw new Error('No fetch function.');
    }

    if (!options.paginationField) {
        throw new Error('No pagination field.');
    }

    var statsFunctions = {
        'totalMedia': function (mediaArray) {
            return mediaArray.length;
        },
        'photos': function (mediaArray) {
            return _.where(mediaArray, {type: 'image'}).length;
        },
        'videos': function (mediaArray) {
            return _.where(mediaArray, {type: 'video'}).length;
        },
        'countByFilterType': function (mediaArray) {
            return _.countBy(mediaArray, 'filter');
        },
        'likesCount': function (mediaArray) {
            return _.reduce(mediaArray, function (accum, media) {
                return media.likes.count + accum;
            }, 0);
        },
        'commentsCount': function (mediaArray) {
            return _.reduce(mediaArray, function (accum, media) {
                return media.comments.count + accum;
            }, 0);
        },
        'mostLiked': function (mediaArray) {
            return _.max(mediaArray, function (media) {
                return media.likes.count
            });
        },
        'mostCommented': function (mediaArray) {
            return _.max(mediaArray, function (media) {
                return media.comments.count
            });
        },
        'postsByHour': function (mediaArray) {
            return _.countBy(mediaArray, function (media) {
                var date = new Date(media.created_time * 1000);
                return ('0' + date.getHours()).slice(-2);
            });
        },
        'postsByDayOfWeek': function (mediaArray) {
            return _.countBy(mediaArray, function (media) {
                var date = new Date(media.created_time * 1000);
                return date.getDay();
            });
        },
        'postsByMonth': function (mediaArray) {
            return _.countBy(mediaArray, function (media) {
                var date = new Date(media.created_time * 1000);
                return date.getMonth();
            });
        },
        'hasGeotag': function (mediaArray) {
            return _.reduce(mediaArray, function (accum, media) {
                return accum + (_.isEmpty(media.location) ? 0 : 1);
            }, 0);
        },
        'likesByMonth': function (mediaArray) {
            return _(mediaArray).chain()
                .groupBy(function (media) {
                    var date = new Date(media.created_time * 1000);
                    return date.getMonth();
                })
                .mapValues(function (mediaArray, index) {
                    return _.reduce(mediaArray, function (accum, media) {
                        return accum + media.likes.count;
                    }, 0);
                })
                .value();
        }
    };

    var unionFunctions = {
        'mostLiked': function (accumStatsValue, statsValue) {
            return _.max([accumStatsValue, statsValue], function (media) {
                return media && media.likes && media.likes.count;
            });
        },
        'mostCommented': function (accumStatsValue, statsValue) {
            return _.max([accumStatsValue, statsValue], function (media) {
                return media && media.comments && media.comments.count;
            });
        }
    };

    this.options = _.defaults(options, {
        requestTimeout: 3 * 1000,
        stopCallback: _.noop,
        statsCallback: _.noop,
        statsFunctions: _.extend(statsFunctions, options.statsFunctions || {}),
        unionFunctions: _.extend(unionFunctions, options.unionFunctions || {}),
        fetchFunctionOptions: {}
    });

    this.calculateStats = function (mediaArray) {
        var stats = _.mapValues(this.options.statsFunctions, (function (value, key) {
            if (typeof value !== 'function') {
                throw new Error('Wrong stats function for ' + key);
            }
            return value(mediaArray);
        }));

        this.options.statsCallback(stats);
    }.bind(this);

    this.mediaFetchCallback = function (response) {
        if (response.meta.code !== 200) {
            throw new Error('Instagram error!!!1' + JSON.stringify(response.meta));
        }

        if (!_.isEmpty(response.pagination)) {
            var options = {};
            options[this.options.paginationField] = response.pagination['next_' + this.options.paginationField];
            var paginationNext = this.mining.bind(this, options, this.mediaFetchCallback);
        }

        this.calculateStats(response.data);

        if (paginationNext) {
            this.timeout = setTimeout(function () {
                paginationNext();
            }, this.options.requestTimeout);
        } else {
            this.options.stopCallback(true);
        }
    }.bind(this);

    this.union = function (a, b) {
        var sum = function (a, b) {
            return (Number(a) || 0) + (Number(b) || 0);
        };

        if (typeof a === 'object' || typeof b === 'object') {
            return _.merge(a || {}, b || {}, sum);
        } else if (typeof a === 'number' || typeof b === 'number') {
            return sum(a, b);
        }
    }.bind(this);

    this.mining = function (options) {
        options = options || {};
        this.options.fetchFunction(options, this.mediaFetchCallback.bind(this));
    }.bind(this);
};

StatsMiner.prototype.calculateTotal = function (statsArray, accumStatsArray) {
    return _.mapValues(statsArray, function (statsValue, statsKey) {
        var accumStatsValue = _.result(accumStatsArray, statsKey);

        var unionFunction = this.options.unionFunctions[statsKey] || this.union;

        if (typeof unionFunction !== 'function') {
            throw new Error('Wrong union function for ' + statsKey);
        }

        return unionFunction(accumStatsValue, statsValue);
    }, this);
};

StatsMiner.prototype.start = function () {
    this.mining(this.options.fetchFunctionOptions);
};

StatsMiner.prototype.stop = function () {
    clearTimeout(this.timeout);
    this.options.stopCallback(false);
};

module.exports = StatsMiner;