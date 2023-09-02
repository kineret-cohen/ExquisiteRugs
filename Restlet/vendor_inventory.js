/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 */
define(['N/search', 'N/record'],

    function(search, record) {

        function getInventory(parameters) {
            var pages = readParam(parameters, 'pages', 1);
            var fromPage = readParam(parameters, 'fromPage', 0);
            var id = readParam(parameters, 'id', '');
            var keys = readParam(parameters, 'keys', '').split(',');
            var indecies = readParam(parameters, 'indecies', '').split(',');


            var recObj = [];

            var mySearch = search.load({
                id: id
            });

            var results = [];
            var currentIndex = fromPage * 1000;

            do {
                var results = mySearch.run().getRange({
                    start: currentIndex,
                    end: currentIndex + 1000
                });

                for (var i = 0; i < results.length; i++) {
                    try {
                        var record = {};

                        for (var j = 0; j < keys.length; j++) {
                            // read the value from the relevant column into a specific key name
                            record[keys[j]] = results[i].getValue(results[i].columns[Number(indecies[j])]);
                        }

                        recObj[recObj.length] = record;
                    } catch (e) {}
                }

                currentIndex += 1000;
                pages--;
            } while (results.length == 1000 && pages > 0);

            return JSON.stringify({
                fromPage: fromPage,
                pages: results.length / 1000,
                results: recObj
            });
        }

        function readParam(parameters, name, defautValue) {
            var value;

            try {
                value = parameters[name];
                log.debug(name, value);
            } catch (e) {
                log.error('failed reading request parameter', e.message);
                throw e;
            }
            return value ? value : defautValue;
        }

        return {
            get: getInventory,
            post: getInventory
        }
    });