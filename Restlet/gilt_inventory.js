/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 */
define(['N/search', 'N/record'],

    function(search, record) {

        function getInventory(parameters) {
            var pages = readParam(parameters, 'pages', 1);
            var fromPage = readParam(parameters, 'fromPage', 0);

            var recObj = [];

            var mySearch = search.load({
                id: 'customsearch_rue_gilt'
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
                        var record = {
                            sku: results[i].getValue(results[i].columns[0]),
                            quantity: Number(results[i].getValue(results[i].columns[1]))
                        };

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