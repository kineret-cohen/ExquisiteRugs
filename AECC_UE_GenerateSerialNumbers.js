/**
 * Created by Jay.
 * @NApiVersion 2.x
 * @NScriptType userEventScript
 * @NModuleScope Public
 */

define(["N/record", "N/search", "N/runtime"],
    function (record, search, runtime) {

        var ALLOWED_TRIGGER_MODES = ["create", "edit"];
        var WH_LOCATION = '1';

        function beforeSubmit(context){
            var title = 'beforeSubmit_generateSerialNumbers';
            log.debug(title, '======== START ========');
            try{
                if (context.type == 'create'){
                    var rec = context.newRecord;
                    var location = rec.getValue({fieldId:'location'})
                    if (isEmpty(location)){
                        rec.setValue({
                            fieldId: 'location',
                            value: WH_LOCATION
                        });
                    }
                }
            }
            catch(error){
                log.error(title,error.toString());
            }
            log.debug(title, '======== END ========');
        }

        function printUsage(title, action) {
            var currentUsage = runtime.getCurrentScript().getRemainingUsage();
            log.debug(title, "Usage so far after " + action + ": " + currentUsage);
        }

        function afterSubmit_generateSerialNumbers(context) {
            var title = 'afterSubmit_generateSerialNumbers';
            log.debug(title, '======== START ========');

            printUsage(title, "start");
            try {
                var triggerType = context.type;
                if (ALLOWED_TRIGGER_MODES.indexOf(triggerType) == -1) {
                    log.debug(title, "Script will only execute for create and edit");
                    return;
                }

                var rec = context.newRecord;
                var recId = rec.id;

                log.debug(title, 'Processing PO ID = ' + recId);

                var newRecord = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: recId
                });

                printUsage(title, "load record");

                var numLines = newRecord.getLineCount({
                    sublistId: 'item'
                });

                printUsage(title, "getLineCount");

                log.debug(title, 'Total number of line items: ' + numLines);

                // First pass: Calculate total serial numbers needed and collect line data
                var totalSerialNumbersNeeded = 0;
                var lineData = [];

                for (var ctrItem = 0; ctrItem < numLines; ctrItem++) {
                    var qty = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: ctrItem
                    });

                    printUsage(title, "getSublistValue");
                    
                    log.debug(title, 'Processing line item ' + ctrItem + ' with quantity ' + qty);
                    
                    var inventoryDetailSubrecord = newRecord.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: ctrItem
                    });

                    printUsage(title, "getSublistSubrecord");

                    // Check which serial numbers we need to generate for this line
                    var serialNumbersToGenerate = [];
                    for (var qtyCtr = 0; qtyCtr < qty; qtyCtr++) {
                        
                        // Check if we need to add a new serial number
                        if (triggerType != 'create') { 
                            var sublistFieldValue = inventoryDetailSubrecord.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'receiptinventorynumber',
                                line: qtyCtr
                            });

                            printUsage(title, "inventoryDetailSubrecord.getSublistValue");

                            if (!isEmpty(sublistFieldValue)) {
                                log.debug(title, 'Line ' + ctrItem + ', Qty ' + (qtyCtr + 1) + ': Skipping - already has serial number ' + sublistFieldValue);
                                continue;
                            }
                        }

                        serialNumbersToGenerate.push(qtyCtr);
                    }

                    if (serialNumbersToGenerate.length > 0) {
                        totalSerialNumbersNeeded += serialNumbersToGenerate.length;
                        lineData.push({
                            lineIndex: ctrItem,
                            inventoryDetailSubrecord: inventoryDetailSubrecord,
                            serialNumbersToGenerate: serialNumbersToGenerate,
                            quantity: serialNumbersToGenerate.length
                        });
                        log.debug(title, 'Line ' + ctrItem + ': Need to generate ' + serialNumbersToGenerate.length + ' serial numbers');
                    } else {
                        log.debug(title, 'Line ' + ctrItem + ': No serial numbers to generate');
                    }
                }

                // Allocate all serial numbers at once if needed
                var startingSerialNumber = 1;
                if (totalSerialNumbersNeeded > 0) {
                    startingSerialNumber = createSerialNumbers(totalSerialNumbersNeeded);
                    log.debug(title, 'Allocated ' + totalSerialNumbersNeeded + ' serial numbers starting from ' + startingSerialNumber);
                }

                // Second pass: Distribute serial numbers to inventory detail records
                var currentSerialNumber = startingSerialNumber;
                for (var i = 0; i < lineData.length; i++) {
                    var lineInfo = lineData[i];
                    var inventoryDetailSubrecord = lineInfo.inventoryDetailSubrecord;
                    var serialNumbersToGenerate = lineInfo.serialNumbersToGenerate;
                    var ctrItem = lineInfo.lineIndex;

                    log.debug(title, 'Distributing ' + serialNumbersToGenerate.length + ' serial numbers to line ' + ctrItem);

                    for (var j = 0; j < serialNumbersToGenerate.length; j++) {
                        var qtyCtr = serialNumbersToGenerate[j];
                        log.debug(title, 'Line ' + ctrItem + ', Qty ' + (qtyCtr + 1) + ': Assigning serial number ' + (currentSerialNumber + j));
                        
                        inventoryDetailSubrecord.insertLine({
                            sublistId: 'inventoryassignment',
                            line: qtyCtr
                        });

                        inventoryDetailSubrecord.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            line: qtyCtr,
                            value: String(currentSerialNumber + j)
                        });

                        inventoryDetailSubrecord.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: qtyCtr,
                            value: 1
                        });

                        printUsage(title, "inventoryDetailSubrecord update");
                    }

                    currentSerialNumber += serialNumbersToGenerate.length;
                }

                var recordId = newRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                printUsage(title, "Save");

                if (context.type == 'create') {
                    var poRecord = record.load({
                        type: record.Type.PURCHASE_ORDER,
                        id: recId
                    });
                    var poLines = poRecord.getLineCount({
                        sublistId: 'item'
                    });
                    for (var i = 0; i < poLines; i++) {
                        var memo = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_line_memo',
                            line: i
                        });
                        if (!isEmpty(memo)) {
                            var poInventoryDetailSubrecord = poRecord.getSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail',
                                line: i
                            });
                            var invDetLines = poInventoryDetailSubrecord.getLineCount({
                                sublistId: 'inventoryassignment'
                            });
                            var receiptinventorynumber = poInventoryDetailSubrecord.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorydetail',
                                line: 0
                            });
                            var sn_search_filters = [];
                            sn_search_filters.push(search.createFilter({
                                name: 'internalid',
                                operator: search.Operator.ANYOF,
                                values: receiptinventorynumber
                            }));
                            var sn_search = search.create({
                                type: 'inventorydetail',
                                filters: sn_search_filters,
                                columns: [{name: 'internalid', join: 'inventoryNumber'}]
                            });
                            var sn_search_results = searchAll(sn_search);
                            if (sn_search_results.length > 0) {
                                for (var k = 0; k < sn_search_results.length; k++) {
                                    var snNum = sn_search_results[k].getValue({
                                        name: 'internalid',
                                        join: 'inventoryNumber'
                                    });
                                    if (!isEmpty(snNum) && !isEmpty(memo)) {
                                        var id = record.submitFields({
                                            type: 'inventorynumber',
                                            id: snNum,
                                            values: {
                                                memo: memo
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                log.debug(title, 'Created Inventory Details for PO ID= ' + recordId);

            }
            catch (error) {
                log.error(title, error.toString());
            }

            log.debug(title, '======== END ========');
        }

        function createSerialNumbers(quantity) {
            var title = 'createSerialNumbers';
            log.debug(title, 'Fetching and incrementing latest serial number by ' + quantity);

            // Always fetch the latest serial number from the custom record
            var serialNumber_search = search.create({
                type: 'customrecord_aecc_latest_serial_number',
                columns: ['custrecord_aecc_serial_number', 'internalid']
            });
            var serialNumber_search_results = searchAll(serialNumber_search);

            printUsage(title, "searchAll");

            if (serialNumber_search_results.length === 0) {
                log.error(title, 'No serial number record found');
                throw 'Could not generate serial number - no serial number record exists';
            }

            var serialNumberRecordId = serialNumber_search_results[0].getValue('internalid');
            var currentSerialNumber = parseInt(serialNumber_search_results[0].getValue('custrecord_aecc_serial_number'));
            var newSerialNumber = currentSerialNumber + quantity;

            // Immediately update the global serial number record
            try {
                record.submitFields({
                    type: 'customrecord_aecc_latest_serial_number',
                    id: serialNumberRecordId,
                    values: {
                        'custrecord_aecc_serial_number': newSerialNumber
                    }
                });
                printUsage(title, "submitFields");
                log.debug(title, 'Successfully updated global serial number to: ' + newSerialNumber);
            } catch (error) {
                log.error(title, 'Failed to update global serial number: ' + error.toString());
                throw error;
            }

            return currentSerialNumber + 1; // Return the first number in the sequence
        }

        function searchAll(objSavedSearch) {
            var arrReturnSearchResults = [];
            var objResultset = objSavedSearch.run();
            var intSearchIndex = 0;
            var objResultSlice = null;
            var maxSearchReturn = 1000;

            var maxResults = 0;

            do {
                var start = intSearchIndex;
                var end = intSearchIndex + maxSearchReturn;
                if (maxResults && maxResults <= end) {
                    end = maxResults;
                }
                objResultSlice = objResultset.getRange(start, end);

                if (!(objResultSlice)) {
                    break;
                }

                arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice);
                intSearchIndex = intSearchIndex + objResultSlice.length;

                if (maxResults && maxResults == intSearchIndex) {
                    break;
                }
            }
            while (objResultSlice.length >= maxSearchReturn);

            return arrReturnSearchResults;
        }

        function isEmpty(stValue) {
            if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
                return true;
            }
            else {
                if (stValue instanceof String) {
                    if ((stValue == '')) {
                        return true;
                    }
                }
                else if (stValue instanceof Array) {
                    if (stValue.length == 0) {
                        return true;
                    }
                }

                return false;
            }
        }

        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit_generateSerialNumbers
        }
    }
);