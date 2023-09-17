/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 */
define(['N/search', 'N/record'],

    function(search, record) {

        function getInventory(parameters) {
            var pages = readParam(parameters, 'pages', 1);
            var fromPage = readParam(parameters, 'fromPage', 0);
            var pageSize = readParam(parameters, 'pageSize', 1000);
            var id = readParam(parameters, 'id', '');
            var keys = readParam(parameters, 'keys', '').split(',');
            var indecies = readParam(parameters, 'indecies', '').split(',');


            var recObj = [];

            var mySearch = search.load({
                id: id
            });

            var results = [];
            var currentIndex = fromPage * pageSize;

            do {
                var results = mySearch.run().getRange({
                    start: currentIndex,
                    end: currentIndex + pageSize
                });

                for (var i = 0; i < results.length; i++) {
                    try {
                        var record = {};

                        for (var j = 0; j < keys.length; j++) {

                            // first read the text from the relevant column
                            var value = results[i].getText(results[i].columns[Number(indecies[j])]);

                            // if none was found try the value
                            if (!value || value.length == 0)
                                value = results[i].getValue(results[i].columns[Number(indecies[j])]);

                            // set into a specific key name
                            record[keys[j]] = value;
                        }

                        recObj[recObj.length] = record;
                    } catch (e) {
                        //log.error('failed reading value ' + keys[j], e.message);
                    }
                }

                currentIndex += pageSize;
                pages--;
            } while (results.length == pageSize && pages > 0);

            return JSON.stringify({
                fromPage: fromPage,
                pages: results.length / pageSize,
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