/**
 * Created by Mustafa AECC.
 * @NApiVersion 2.x
 * @NScriptType userEventScript
 * @NModuleScope Public
 */
define(["N/record", "N/search", "N/runtime"],
    function (record, search, runtime) {
        var ALLOWED_TRIGGER_MODES = ["specialorder"];

        function afterSubmit(context) {
            var title = 'beforeSubmit_CatchPO';
            log.debug(title, '======== START ========');
            try {
                var triggerType = context.type;
                if (ALLOWED_TRIGGER_MODES.indexOf(triggerType) == -1) {
                    log.debug(title, "Script will only execute for create.");
                    return;
                }
                var recid = context.newRecord.id;
              var rec = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    //isDynamic: true,
                    id: recid
                });
                var numLines = rec.getLineCount({
                    sublistId: 'item'
                });
                for (var ctrItem = 0; ctrItem < numLines; ctrItem++) {
                    var cust_rate = forceParseFloat(rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_aecc_rate',
                        line: ctrItem
                    }));
                    var rate = forceParseFloat(rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: ctrItem
                    }));
                    log.debug('rate',rate);
                    var area = forceParseFloat(rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_aecc_area',
                        line: ctrItem
                    }));

                    if (isEmpty(area)) {
                        var widthFt = forceParseFloat(rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aecc_width_ft',
                            line: ctrItem
                        }));
                        var widthIn = forceParseFloat(rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aecc_width_in',
                            line: ctrItem
                        }));
                        var lengthFt = forceParseFloat(rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aecc_length_ft',
                            line: ctrItem
                        }));
                        var lengthIn = forceParseFloat(rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aecc_length_in',
                            line: ctrItem
                        }));
                        var sqArea = (widthFt + (widthIn / 12)) * (lengthFt + (lengthIn / 12));
                        sqArea = forceParseFloat(sqArea);
                        sqArea = sqArea.toFixed(2);
                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aecc_area',
                            value: sqArea,
                            line: ctrItem
                        });
                        area = sqArea;
                        if (!isEmpty(area) && isEmpty(cust_rate) && !isEmpty(rate)) {
                            var qty = rec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: ctrItem
                            });
                            rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_aecc_rate',
                                value: rate,
                                line: ctrItem
                            });
                            var calcRate = area * rate;
                            calcRate = forceParseFloat(calcRate);
                            if (calcRate > 0) {
                                rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: calcRate,
                                    line: ctrItem
                                });
                            }
                            var amount = calcRate * qty;
                            amount = forceParseFloat(amount);
                            if (amount > 0) {
                                rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: amount,
                                    line: ctrItem
                                });
                            }
                        }
                    }
                    if (!isEmpty(area)) {
                        var qty = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: ctrItem
                        });
                        var calcRate = area * rate;
                        calcRate = forceParseFloat(calcRate);
                        if (calcRate > 0) {
                            rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: calcRate,
                                line: ctrItem
                            });
                            rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_aecc_rate',
                                value: rate,
                                line: ctrItem
                            });
                        }
                        var amount = calcRate * qty;
                        amount = forceParseFloat(amount);
                        if (amount > 0) {
                            rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: amount,
                                line: ctrItem
                            });
                        }


                    }
                }
              var recordId = rec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug(title, '======== END ========');
            }
            catch (error) {
                log.error(title, error.toString());
            }

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

        function forceParseFloat(stValue) {
            var flValue = parseFloat(stValue);

            if (isNaN(flValue)) {
                return 0.00;
            }

            return flValue;
        }

        return {
            afterSubmit: afterSubmit
        }
    }
);
