/**
 * Created by Jay.
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 * @NModuleScope Public
 */

define(["N/record", "N/search", "N/runtime", "N/currentRecord"],
    function (record, search, runtime, currentRecord) {

        function fieldChanged(context) {
            var title = 'fieldChanged';
            try {
                var sublistIdFld = context.sublistId;
                var fieldNameFld = context.fieldId;
                
                var lineFld = context.line;
                var currentRecord = context.currentRecord;
                if (fieldNameFld == 'entity' || sublistIdFld != 'item') 
                    return;
                
                log.debug('field changed', 'sublistId: ' + sublistIdFld + ', fieldId '+ fieldNameFld);

                if (fieldNameFld == 'custcol_aecc_width_ft' || fieldNameFld == 'custcol_aecc_width_in' || fieldNameFld == 'custcol_aecc_length_ft' || fieldNameFld == 'custcol_aecc_length_in') {
                    currentRecord.selectLine({
                        sublistId: sublistIdFld,
                        line: lineFld
                    });

                    recalcArea(currentRecord, sublistIdFld);
                }
                else if (fieldNameFld == 'quantity') {
                    recalcTotalPrice(currentRecord, sublistIdFld);
                }
                else if (fieldNameFld == 'amount') {
                    recalcPiecePrice(currentRecord, sublistIdFld, true);
                    recalcSqftPrice(currentRecord, sublistIdFld);
                }
                // sqftPrice change
                else if (fieldNameFld == 'custcol_aecc_rate') {
                    recalcPiecePrice(currentRecord, sublistIdFld);
                    recalcTotalPrice(currentRecord, sublistIdFld);
                }
                // price level selection change
                else if (fieldNameFld == 'price') {

                    // we have to reset sqft price and recalc it 
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'custcol_aecc_rate',
                        value: '',
                        ignoreFieldChange: true
                    });

                    recalcSqftPrice(currentRecord, sublistIdFld);
                    recalcPiecePrice(currentRecord, sublistIdFld);
                    recalcTotalPrice(currentRecord, sublistIdFld);
                }
                // piece price change
                else if (fieldNameFld == 'rate') {
                    recalcSqftPrice(currentRecord, sublistIdFld);
                    recalcTotalPrice(currentRecord, sublistIdFld);
                }
                else if (fieldNameFld == 'custcol_aecc_area') {
                    recalcPiecePrice(currentRecord, sublistIdFld);
                    recalcTotalPrice(currentRecord, sublistIdFld);
                }
            }
            catch (error) {
                log.error(title, error.toString());
            }

        }

        function postSourcing(context) {
            var title = 'postSourcing';
            try {
                log.debug('postsourcing', 'changed');
                var sublistIdFld = context.sublistId;
                var fieldNameFld = context.fieldId;
                log.debug('postsourcing changed sublist '+sublistIdFld, 'postsourcing changed '+fieldNameFld);
                var currentRecord = context.currentRecord;
                
                // empty row should be ignore
                if (currentRecord.id === '')
                    return;

                log.debug('currentRecord: ',currentRecord);
                if (fieldNameFld === 'item' && sublistIdFld === 'item') {

                    var widthFt = currentRecord.getCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'custcol_aecc_width_ft'
                    });

                    var widthIn = currentRecord.getCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'custcol_aecc_width_in'
                    });

                    var lengthFt = currentRecord.getCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'custcol_aecc_length_ft'
                    });

                    var lengthIn = currentRecord.getCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'custcol_aecc_length_in'
                    });
                    var qty = currentRecord.getCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'quantity'
                    });
                    var rate = currentRecord.getCurrentSublistValue({
                        sublistId: sublistIdFld,
                        fieldId: 'custcol_aecc_rate'
                    });

                    if (isEmpty(qty))
                        qty = 0;

                    log.debug(title, 'widthFt = ' + widthFt + ' | widthIn = ' + widthIn + ' | lengthFt = ' + lengthFt + ' | lengthIn = ' + lengthIn + ' | rate =  ' + rate + ' | qty = ' + qty);
                    var sqArea = (widthFt + (widthIn / 12)) * (lengthFt + (lengthIn / 12));
                    sqArea = forceParseFloat(sqArea);
                    sqArea = sqArea.toFixed(2);
                    var newrate = rate * sqArea;
                    log.debug(title, 'Sq. Area = ' + sqArea);
                    var totalAmt = rate * qty * sqArea;
                    log.debug(title, 'Total Amount = ' + totalAmt);

                    if (sqArea > 0) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistIdFld,
                            fieldId: 'custcol_aecc_area',
                            value: sqArea,
                            ignoreFieldChange: true
                        });
                    }
                    if (newrate > 0) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistIdFld,
                            fieldId: 'rate',
                            value: newrate,
                            ignoreFieldChange: true
                        });
                    }
                    if (totalAmt > 0) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistIdFld,
                            fieldId: 'amount',
                            value: totalAmt,
                            ignoreFieldChange: true
                        });
                    }
                }
            }
            catch (error) {
                log.error(title, error.toString());
            }
        }

        function recalcArea(currentRecord, sublistIdFld) {
            var widthFt = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_width_ft'
            });

            var widthIn = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_width_in'
            });

            var lengthFt = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_length_ft'
            });

            var lengthIn = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_length_in'
            });

            var sqArea = (widthFt + (widthIn / 12)) * (lengthFt + (lengthIn / 12));
            sqArea = forceParseFloat(sqArea);
            sqArea = sqArea.toFixed(2);
            currentRecord.setCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_area',
                value: sqArea,
                ignoreFieldChange: false
            });
        }

        function recalcPiecePrice(currentRecord, sublistIdFld, totalChanged) {
            var newPiecePrice = '';

            log.debug("recalcPiecePrice", sublistIdFld);
            if (totalChanged) {
                var totalAmt = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'amount'
                });

                var qty = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'quantity'
                });

                if (!isEmpty(qty) &&  qty > 0)
                    newPiecePrice = totalAmt / qty;
            }
            else {
                var sqArea = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'custcol_aecc_area'
                });

                var sqftPrice = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'custcol_aecc_rate'
                });

                if (!isEmpty(sqArea) && !isEmpty(sqftPrice))
                    newPiecePrice = sqftPrice * sqArea;
            }


            currentRecord.setCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'rate',
                value: newPiecePrice,
                ignoreFieldChange: true
            });
        }

        function recalcSqftPrice(currentRecord, sublistIdFld) {

            var sqftPrice = '';
            log.debug("recalcSqftPrice", sublistIdFld);

            var currentSqrFtPrice = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_rate'
            });


            log.debug("recalcSqftPrice", "current sqftPrice="+currentSqrFtPrice);

            // if we don't yet have a sqrtFtPrice we treat the unit price as the sqft price (unless cusom price level)
            if (isEmpty(currentSqrFtPrice)) {
                var rate = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'rate'
                });

                if (!isEmpty(rate))
                    sqftPrice = rate;
            }
            else {

                var area = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'custcol_aecc_area'
                });

                var piecePrice = currentRecord.getCurrentSublistValue({
                    sublistId: sublistIdFld,
                    fieldId: 'rate'
                });

                // protect frmo values not yet defined
                if (!isEmpty(area) && !isEmpty(piecePrice) && area > 0)
                    sqftPrice = piecePrice / area;
            }

            currentRecord.setCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_rate',
                value: sqftPrice,
                ignoreFieldChange: true
            });
            log.debug("recalcSqftPrice", "new sqftPrice="+sqftPrice);
        }

        function recalcTotalPrice(currentRecord, sublistIdFld) {
            log.debug("recalcTotalPrice", sublistIdFld);

            var qty = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'quantity'
            });

            var sqrFtPrice = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_rate'
            });

            var sqArea = currentRecord.getCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'custcol_aecc_area'
            });

            // protect frmo values not yet defined
            if (isEmpty(qty) || isEmpty(sqrFtPrice) || isEmpty(sqArea)) {
                log.debug("recalcTotalPrice", "some field are not valid");
                return;
            }

            var totalAmt = sqrFtPrice * sqArea * qty;
            currentRecord.setCurrentSublistValue({
                sublistId: sublistIdFld,
                fieldId: 'amount',
                value: totalAmt,
                ignoreFieldChange: true
            });
        }

        function isEmpty(stValue) {
            return (stValue === '') || (stValue == null) || (stValue == undefined) || ( (stValue instanceof Array) && stValue.length == 0 );
        }

        function forceParseFloat(stValue) {
            var flValue = parseFloat(stValue);

            if (isNaN(flValue)) {
                return 0.00;
            }

            return flValue;
        }
        
        return {
            fieldChanged: fieldChanged,
            postSourcing: postSourcing
        }
    });
