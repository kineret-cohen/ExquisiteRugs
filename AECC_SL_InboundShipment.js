/**
 * Created by Jay.
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Updates: 2/1/2020 by Kineret
 */
define(["N/record", "N/search", "N/runtime", "N/ui/serverWidget", "N/task", "N/redirect"],
    function(record, search, runtime, serverWidget, task, redirect) {

        function inboundShipment(context) {
            var title = 'inboundShipment';

            log.debug(title, '======== START ========');

            try {
                var request = context.request;
                var params = context.request.parameters;

                var form = serverWidget.createForm({
                    title: 'Recieve Inbound Shipment',
                    hideNavBar: false
                });

                form.clientScriptFileId = 2742;

                if (context.request.method == 'POST') {

                    handlePost(context, search, task, request, params, form, title);
                } else {
                    handleGet(context, search, task, request, params, form, title);
                }
            } catch (error) {
                log.error(title, error.toString());
            }

            log.debug(title, '======== END ========');
        }

        function handlePost(context, search, task, request, params, form, title) {
            log.debug(title, 'PARAMS: ' + JSON.stringify(params));

            var lineCount = request.getLineCount({
                group: 'custpage_aecc_poitem_sl'
            })

            log.debug(title, 'Line Count = ' + lineCount);

            // go over all lines which were checked by user and create an array of of objects
            var poSerialArray = [];
            for (var lineCtr = 0; lineCtr < lineCount; lineCtr++) {

                if (getSublistValue(request, 'custpage_aecc_poitem_sl_add',lineCtr) != 'T')
                    continue;

                poSerialArray.push({
                    'po': getSublistValue(request, 'custpage_aecc_poitem_sl_poid', lineCtr),
                    'item': getSublistValue(request, 'custpage_aecc_poitem_sl_itemid', lineCtr)
                    'serial': getSublistValue(request, 'custpage_aecc_poitem_sl_invid', lineCtr),
                    'location': getSublistValue(request, 'custpage_aecc_poitem_sl_receive', lineCtr),
                    'bin': getSublistValue(request, 'custpage_aecc_poitem_sl_bin', lineCtr),
                    'widthfeet': getSublistValue(request,'custpage_aecc_poitem_sl_wft', lineCtr),
                    'widthinch': getSublistValue(request,'custpage_aecc_poitem_sl_win', lineCtr),
                    'lengthfeet': getSublistValue(request,'custpage_aecc_poitem_sl_lft', lineCtr),
                    'lengthinch': getSublistValue(request, 'custpage_aecc_poitem_sl_lin', lineCtr)
                });
            }

            log.debug(title, 'POARR = ' + JSON.stringify(poSerialArray));
            var fldMessage = form.addField({
                id: 'custpage_aecc_inbound_message',
                type: 'text',
                label: 'Message'
            });

            fldMessage.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            var message = '';
            try {
                var inboundShipmentObj = record.create({
                    type: 'customrecord_aecc_custom_inbound_ship'
                });

                var inboundStatusParams = runtime.getCurrentScript().getParameter("custscript_aecc_is_status_sl");
                inboundShipmentObj.setValue('custrecord_aecc_is_status', inboundStatusParams);

                var inboundShipmentId = inboundShipmentObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                log.debug(title, 'inboundShipmentId = ' + inboundShipmentId);

                var po_id_array = [];
                var items_filter_array = [];
                var po_list_obj = {};
                for (var poObjArrCtr = 0; poObjArrCtr < poSerialArray.length; poObjArrCtr++) {
                    var poObj = poSerialArray[poObjArrCtr];
                    var po = poObj['po'];
                    var item = poObj['item'];
                    var serial = poObj['serial'];
                    var location = poObj['location'];
                    var bin = poObj['bin'];


                    if (po_id_array.indexOf(po) == -1) {
                        po_id_array.push(po);
                        po_list_obj[po] = [];
                    }

                    po_list_obj[po].push(item);

                    var po_search_filters = [];
                    po_search_filters.push(search.createFilter({
                        name: 'mainline',
                        operator: search.Operator.IS,
                        values: false
                    }));

                    po_search_filters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: poObj['po']
                    }));

                    po_search_filters.push(search.createFilter({
                        name: 'item',
                        operator: search.Operator.ANYOF,
                        values: poObj['item']
                    }));

                    po_search_filters.push(search.createFilter({
                        name: 'inventorynumber',
                        join: 'inventorydetail',
                        operator: search.Operator.ANYOF,
                        values: poObj['serial']
                    }));

                    var po_search = search.create({
                        type: 'purchaseorder',
                        filters: po_search_filters,
                        columns: [{
                            name: 'inventorynumber',
                            join: 'inventoryDetail'
                        }, {
                            name: 'quantity'
                        }, {
                            name: 'custcol_aecc_width_ft'
                        }, {
                            name: 'custcol_aecc_width_in'
                        }, {
                            name: 'custcol_aecc_length_ft'
                        }, {
                            name: 'custcol_aecc_length_in'
                        }, {
                            name: 'custcol_aecc_pricing_unit'
                        }, {
                            name: 'custcol_aecc_rate'
                        }, {
                            name: 'amount'
                        }, {
                            name: 'location'
                        }]
                    });

                    var po_search_results = searchAll(po_search);
                    if (po_search_results.length > 0) {
                        var quantity = po_search_results[0].getValue({
                            name: 'quantity'
                        });
                        var widthFt = po_search_results[0].getValue({
                            name: 'custcol_aecc_width_ft'
                        });
                        var widthIn = po_search_results[0].getValue({
                            name: 'custcol_aecc_width_in'
                        });
                        var lengthFt = po_search_results[0].getValue({
                            name: 'custcol_aecc_length_ft'
                        });
                        var lengthIn = po_search_results[0].getValue({
                            name: 'custcol_aecc_length_in'
                        });
                        var pricingUnit = po_search_results[0].getValue({
                            name: 'custcol_aecc_pricing_unit'
                        });
                        var rate = po_search_results[0].getValue({
                            name: 'custcol_aecc_rate'
                        });
                        var amount = po_search_results[0].getValue({
                            name: 'amount'
                        });
                        var location = po_search_results[0].getValue({
                            name: 'location'
                        });
                        var inboundShipmentItemObj = record.create({
                            type: 'customrecord_aecc_custom_inbound_ship_it'
                        });

                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_po_no',
                            value: poObj['po']
                        });
                        if (!isEmpty(poObj['bin'])) {
                            inboundShipmentItemObj.setValue({
                                fieldId: 'custrecord_aecc_is_bin',
                                value: poObj['bin']
                            });
                        }
                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_item',
                            value: poObj['item']
                        });

                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_serial_number',
                            value: poObj['serial']
                        });

                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_vendor',
                            value: poObj['serial']
                        });

                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_quantity',
                            value: quantity
                        });
                        if (!isEmpty(poObj['widthfeet'])) {
                            inboundShipmentItemObj.setValue({
                                fieldId: 'custrecord_aecc_is_weight_ft',
                                value: forceParseFloat(poObj['widthfeet'])
                            });
                        }
                        if (!isEmpty(poObj['widthinch'])) {
                            log.debug('os', poObj['widthinch']);
                            inboundShipmentItemObj.setValue({
                                fieldId: 'custrecord_aecc_is_weight_in',
                                value: forceParseFloat(poObj['widthinch'])
                            });
                        }
                        if (!isEmpty(poObj['lengthfeet'])) {
                            inboundShipmentItemObj.setValue({
                                fieldId: 'custrecord_aecc_is_length_ft',
                                value: forceParseFloat(poObj['lengthfeet'])
                            });
                        }
                        if (!isEmpty(poObj['lengthinch'])) {
                            inboundShipmentItemObj.setValue({
                                fieldId: 'custrecord_aecc_is_length_in',
                                value: forceParseFloat(poObj['lengthinch'])
                            });
                        }
                        if (!isEmpty(pricingUnit)) {
                            inboundShipmentItemObj.setValue({
                                fieldId: 'custrecord_aecc_is_unit',
                                value: pricingUnit
                            });
                        }
                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_rate',
                            value: rate
                        });
                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_amount',
                            value: amount
                        });
                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_location',
                            value: poObj['location']
                        });
                        inboundShipmentItemObj.setValue({
                            fieldId: 'custrecord_aecc_is_inbound_shipment_rec',
                            value: inboundShipmentId
                        });
                        var inboundShipmentItemId = inboundShipmentItemObj.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });

                        log.debug(title, 'Item Created = ' + inboundShipmentItemId);
                    }

                }


                var scheduledScriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 346,
                    deploymentId: 1,
                    params: {
                        custscript_aecc_is_po_obj: poSerialArray
                    }
                });

                var taskId = scheduledScriptTask.submit();

                log.debug(title, 'scheduledScriptId = ' + taskId);
            } catch (ss_error) {
                message = 'Your request has failed to submit. Please check with your administrator'
                log.error(title, ss_error);
            }

            log.debug(title, 'Message = ' + message);
            form.updateDefaultValues({
                'custpage_aecc_inbound_message': message
            });

            redirect.toRecord({
                type: 'customrecord_aecc_custom_inbound_ship',
                id: inboundShipmentId
            });

            context.response.writePage(form);
        }

        function getSublistValue(request, name, line) {
            return request.getSublistValue({
                        group: 'custpage_aecc_poitem_sl',
                        name: name,
                        line: line
                    });
        }

        function handleGet(context, search, task, request, params, form, title) {
            form.addSubmitButton({
                label: 'Receive'
            });

            form.addButton({
                id: 'custpage_aecc_poitem_close',
                label: 'Close'
            });


            log.debug(title, 'params = ' + JSON.stringify(params));


            var dataSearchObj = getData(params);
            var mainObj = dataSearchObj.main;
            var itemObj = dataSearchObj.items;
            var vendorObj = dataSearchObj.vendor;
            var batchObj = dataSearchObj.batch;
            var itemFilterObj = dataSearchObj.itemFilter;
            var binArrayObj = dataSearchObj.binArrayObj;

            //now populate all parts in the page
            var itemgroup = form.addFieldGroup({
                  id : 'batchgroup',
                  label : 'Please Select Batch Number'
              });

            // BATCH NO
            var batchSelect = form.addField({
                id: 'custpage_aecc_poitem_batch',
                label: 'Batch No',
                type: 'select',
                container: 'batchgroup'
            });

            batchSelect.addSelectOption({
                value: '',
                text: ''
            });

            for (var batchCtr = 0; batchCtr < batchObj.length; batchCtr++) {
                batchSelect.addSelectOption({
                    value: batchObj[batchCtr].batch,
                    text: batchObj[batchCtr].batch
                });

            }

            if (typeof params['batch'] != 'undefined') {
                log.debug(title, JSON.stringify(params));
                form.updateDefaultValues({
                    'custpage_aecc_poitem_batch': params['batch']
                })
            }


            // only if batch filter was selected we present the rest
            if (dataSearchObj.isBatchFiltered) {
                itemgroup = form.addFieldGroup({
                      id : 'othergroup',
                      label : 'Additional Filters (Optional)'
                  });

                // Create and populate Vendors Select
                var vendorSelect = form.addField({
                    id: 'custpage_aecc_poitem_vendor',
                    label: 'Vendor',
                    type: 'select',
                    container: 'othergroup'
                });

                vendorSelect.addSelectOption({
                    value: '',
                    text: ''
                });

                
                for (var vendorCtr = 0; vendorCtr < vendorObj.length; vendorCtr++) {
                    vendorSelect.addSelectOption({
                        value: vendorObj[vendorCtr].id,
                        text: vendorObj[vendorCtr].name
                    });

                }

                if (typeof params['vendor'] != 'undefined') {
                    log.debug(title, JSON.stringify(params));
                    form.updateDefaultValues({
                        'custpage_aecc_poitem_vendor': params['vendor']
                    })
                }

                // Purchase Order
                var poSelect = form.addField({
                    id: 'custpage_aecc_poitem_po',
                    label: 'Purchase Order',
                    type: 'select',
                    container: 'othergroup'
                });

                poSelect.addSelectOption({
                    value: '',
                    text: ''
                });

                for (var poCtr = 0; poCtr < mainObj.length; poCtr++) {
                    poSelect.addSelectOption({
                        value: mainObj[poCtr].id,
                        text: mainObj[poCtr].num
                    });

                }

                if (typeof params['po'] != 'undefined') {
                    log.debug(title, JSON.stringify(params));
                    form.updateDefaultValues({
                        'custpage_aecc_poitem_po': params['po']
                    })
                }


                // ITEMS
                var itemSelect = form.addField({
                    id: 'custpage_aecc_poitem_item',
                    label: 'Item',
                    type: 'select',
                    container: 'othergroup'
                });

                itemSelect.addSelectOption({
                    value: '',
                    text: ''
                });

                for (var itemCtr = 0; itemCtr < itemFilterObj.length; itemCtr++) {
                    itemSelect.addSelectOption({
                        value: itemFilterObj[itemCtr].id,
                        text: itemFilterObj[itemCtr].desc
                    });

                }

                if (typeof params['item'] != 'undefined') {
                    log.debug(title, JSON.stringify(params));
                    form.updateDefaultValues({
                        'custpage_aecc_poitem_item': params['item']
                    })
                }

                // The table with all items
                var poSublist = form.addSublist({
                    id: 'custpage_aecc_poitem_sl',
                    label: 'Rugs to Receive (' + dataSearchObj.rowsReturned + ' out of ' + dataSearchObj.totalRows + ')' ,
                    type: 'list'
                });

                var fldAdd = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_add',
                    type: 'checkbox',
                    label: 'Add'
                });
                var fldPONum = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_ponum',
                    type: 'text',
                    label: 'PO #'
                });
                var fldPOID = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_poid',
                    type: 'text',
                    label: 'PO ID'
                });
                
                fldPOID.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                var fldItem = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_item',
                    type: 'text',
                    label: 'Item'
                });
                var fldItemID = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_itemid',
                    type: 'text',
                    label: 'Item ID'
                });
                fldItemID.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                var fldInvendoryDetail = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_inv',
                    type: 'text',
                    label: 'Serial Numbers'
                });
                var fldInvendoryDetailID = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_invid',
                    type: 'text',
                    label: 'Serial Numbers'
                });
                fldInvendoryDetailID.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                var fldVendor = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_vendor',
                    type: 'text',
                    label: 'Vendor'
                });
                var fldReceive = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_receive',
                    type: 'select',
                    label: 'Receiving Location',
                    source: 'location'
                });
                var fldBin = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_bin',
                    type: 'select',
                    label: 'Receiving Bin',
                    source: 'bin'
                });
                var fldWFt = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_wft',
                    type: 'text',
                    label: 'Width (ft)'
                });
                var fldWIn = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_win',
                    type: 'text',
                    label: 'Width (in)'
                });
                var fldLFt = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_lft',
                    type: 'text',
                    label: 'Length (ft)'
                });
                var fldLIn = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_lin',
                    type: 'text',
                    label: 'Length (in)'
                });
                var fldBatch = poSublist.addField({
                    id: 'custpage_aecc_poitem_sl_batch',
                    type: 'text',
                    label: 'Batch No.'
                });

                for (var itemCtr = 0; itemCtr < itemObj.length; itemCtr++)
                    addLine(poSublist, itemObj, itemCtr, binArrayObj);
            }

            context.response.writePage(form);
        }

        function addLine(poSublist, itemObj, itemCtr, binArrayObj) {
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_ponum',
                line: itemCtr,
                value: itemObj[itemCtr].tranId
            });

            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_poid',
                line: itemCtr,
                value: itemObj[itemCtr].internalId
            });

            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_item',
                line: itemCtr,
                value: itemObj[itemCtr].item
            });

            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_itemid',
                line: itemCtr,
                value: itemObj[itemCtr].itemId
            });

            if (!isEmpty(itemObj[itemCtr].invBatch)) {
                poSublist.setSublistValue({
                    id: 'custpage_aecc_poitem_sl_batch',
                    line: itemCtr,
                    value: itemObj[itemCtr].invBatch
                });
            }

            var invVal = (isEmpty(itemObj[itemCtr].invNum)) ? ' ' : itemObj[itemCtr].invNum;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_inv',
                line: itemCtr,
                value: invVal
            });

            var invValId = (isEmpty(itemObj[itemCtr].invNumId)) ? ' ' : itemObj[itemCtr].invNumId;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_invid',
                line: itemCtr,
                value: invValId
            });

            var vendorVal = (isEmpty(itemObj[itemCtr].vendor)) ? ' ' : itemObj[itemCtr].vendor;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_vendor',
                line: itemCtr,
                value: vendorVal
            });

            if (!isEmpty(itemObj[itemCtr].location)) {
                poSublist.setSublistValue({
                    id: 'custpage_aecc_poitem_sl_receive',
                    line: itemCtr,
                    value: itemObj[itemCtr].location
                });
            }

            for (var bincntr = 0; bincntr < binArrayObj.length; bincntr++) {
                var itemid = binArrayObj[bincntr].intid;
                var binnum = binArrayObj[bincntr].binnum;
                var binint = binArrayObj[bincntr].binint;
                var binlocation = binArrayObj[bincntr].binlocation;
                if (itemid == itemObj[itemCtr].itemId) {
                    if (binlocation == itemObj[itemCtr].location) {
                        poSublist.setSublistValue({
                            id: 'custpage_aecc_poitem_sl_bin',
                            line: itemCtr,
                            value: binint
                        });
                    }
                }
            }

            var wFtVal = (isEmpty(itemObj[itemCtr].w_ft)) ? ' ' : itemObj[itemCtr].w_ft;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_wft',
                line: itemCtr,
                value: wFtVal
            });

            var wInVal = (isEmpty(itemObj[itemCtr].w_in)) ? ' ' : itemObj[itemCtr].w_in;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_win',
                line: itemCtr,
                value: wInVal
            });

            var lFtVal = (isEmpty(itemObj[itemCtr].l_ft)) ? ' ' : itemObj[itemCtr].l_ft;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_lft',
                line: itemCtr,
                value: lFtVal
            });

            var lInVal = (isEmpty(itemObj[itemCtr].l_in)) ? ' ' : itemObj[itemCtr].l_in;
            poSublist.setSublistValue({
                id: 'custpage_aecc_poitem_sl_lin',
                line: itemCtr,
                value: lInVal
            });
        }

        function getData(params) {
            var title = 'getData';


            // first we get only batch numbers that have at least some rugs which are in transit
            var batch_search_filters = [];
            batch_search_filters.push(search.createFilter({
                name: 'quantityonorder',
                operator: search.Operator.GREATERTHAN,
                values: ["0"]
            }));

            log.debug("batch_search_filters", batch_search_filters);

            var batch_search = search.create({
                type: 'inventorynumber',
                filters: batch_search_filters,
                columns: [{
                        name: 'custitemnumber_aecc_batch_no',
                        summary: search.Summary.GROUP
                    }
                ]
            });

            var batch_search_results = searchAll(batch_search);
            var batch_array_obj = [];
            for (var i = 0; i < batch_search_results.length; i++) {
                var batch_no = batch_search_results[i].getValue({
                    name: 'custitemnumber_aecc_batch_no',
                    "summary": search.Summary.GROUP
                });


                batch_array_obj.push({
                    'id': batch_no,
                    'batch': batch_no
                })
            }

            log.debug("batch_array_obj", batch_array_obj.length);


            /// now pull the main list filtered also by batch no
            var po_search_filters = [];
            po_search_filters.push(search.createFilter({
                name: 'mainline',
                operator: search.Operator.IS,
                values: false
            }));

            po_search_filters.push(search.createFilter({
                name: 'status',
                operator: search.Operator.ANYOF,
                values: ['PurchOrd:B', 'PurchOrd:E', 'PurchOrd:D']
            }));

            po_search_filters.push(search.createFilter({
                name: 'quantityonorder',
                join: 'itemnumber',
                operator: search.Operator.GREATERTHAN,
                values: ["0"]
            }));


            if (!isEmpty(params['po'])) {
                var poparamarray = params['po'].split(',');
                po_search_filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: poparamarray
                }));
            }

            // only query PO in case a specific batch was selected
            var po_search_results = [];
            var batch = params['batch'];
            if (!isEmpty(batch)) {

                // special case for "no batch"
                if (batch == "- None -") {
                    log.debug("po_search_filters", "searching for none");
                    po_search_filters.push(search.createFilter({
                        name: 'custitemnumber_aecc_batch_no',
                        join: 'itemnumber',
                        operator: search.Operator.ISEMPTY,
                        values: []
                    }));
                }
                else {
                    po_search_filters.push(search.createFilter({
                        name: 'custitemnumber_aecc_batch_no',
                        join: 'itemnumber',
                        operator: search.Operator.CONTAINS,
                        values: [batch]
                    }));
                }

                log.debug("po_search_filters", po_search_filters);
                var po_search = search.create({
                    type: 'purchaseorder',
                    filters: po_search_filters,
                    columns: [{
                            name: 'transactionnumber'
                        }, {
                            name: 'tranid'
                        },
                        {
                            name: 'item'
                        }, {
                            name: 'entity'
                        }, {
                            name: 'location'
                        }, {
                            name: 'quantity'
                        }, {
                            name: 'unit'
                        }, {
                            name: 'rate'
                        },
                        {
                            name: 'internalid'
                        },
                        {
                            name: 'custcol_aecc_width_ft'
                        }, {
                            name: 'custcol_aecc_width_in'
                        },
                        {
                            name: 'custcol_aecc_length_ft'
                        }, {
                            name: 'custcol_aecc_length_in'
                        },
                        {
                            name: 'inventorynumber',
                            join: 'inventoryDetail'
                        }
                    ]
                });

                po_search_results = searchAll(po_search);
            }

            // the items list results for the UI
            var items_list_results_array = [];

            // this is for populating the filters in the UI
            var po_array = [];
            var po_array_obj = [];
            var vendor_array = [];
            var vendors_filter_array = [];
            var items_filter_array = [];
            var bins_filter_array = [];

            // this is for query filter
            var item_array = [];

            // Loop through results
            var itemsReturned = 0;
            var totalItems = 0;
            if (po_search_results.length > 0) {
                var poVendor = '';
                var poVendorId = '';
                var batchNo = '';
                var batchNoId = '';
                var widthfeet = '';
                var widthinches = '';
                var lengthfeet = '';
                var lengthinches = '';
                var area = '';
                var receive_flag = false;

                var inventory_numbers = []

                // First loop we wil use to gather all serial inventory numbers so we can query for all their batch info 
                // in 1 call (otherwise we will hit the API credits limit)
                for (var i = 0; i < po_search_results.length; i++) {
                    var inventorynumber = po_search_results[i].getValue({
                        name: 'inventorynumber',
                        join: 'inventoryDetail'
                    });
                    if (!isEmpty(inventorynumber))
                        inventory_numbers.push(inventorynumber);
                }

                log.debug("inventory_numbers count: ", inventory_numbers.length);

                // create the query to load all relevnt records from inventory numbers table
                var invnumber_search_filters = [];
                invnumber_search_filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: inventory_numbers
                }));

                log.debug("invnumber_search_filters: ", invnumber_search_filters);

                var invnumber_search = search.create({
                    type: 'inventorynumber',
                    filters: invnumber_search_filters,
                    columns: ['custitemnumber_aecc_batch_no', 'internalid', 'custitemnumber_aecc_is_received_flag', 'custitemnumber_aecc_is_ibs_created', 'custitemnumber_aecc_width_feet', 'custitemnumber_aecc_width_inches', 'custitemnumber_aecc_length_feet', 'custitemnumber_aecc_length_inches', 'custitemnumber_aecc_area']
                });

                log.debug("invnumber_search: ", invnumber_search);

                // Now map all results by id
                var inventory_number_map = {}
                var invnumber_search_results = searchAll(invnumber_search);
                log.debug("invnumber_search_results: ", invnumber_search_results.length);

                for (var i = 0; i < invnumber_search_results.length; i++) {
                    inventory_number_map[invnumber_search_results[i].id] = invnumber_search_results[i];
                }

                log.debug("inventory_number_map: ", inventory_number_map.size);

                // now iterate on the results to create all the respose arrays
                for (var poCtr = 0; poCtr < po_search_results.length; poCtr++) {
                    var poNum = po_search_results[poCtr].getValue('tranid');
                    var poId = po_search_results[poCtr].getValue('internalid');
                    var batchId = po_search_results[poCtr].getValue({
                        name: 'inventorynumber',
                        join: 'inventoryDetail'
                    });

                    // try to map the item to a batch
                    if (!isEmpty(batchId)) {
                        var invLookup = inventory_number_map[batchId];
                        if (invLookup) {
                            batchNo = invLookup.getValue('custitemnumber_aecc_batch_no');
                            batchNoId = invLookup.getValue('internalid');
                            receive_flag = invLookup.getValue('custitemnumber_aecc_is_received_flag');
                            widthfeet = invLookup.getValue('custitemnumber_aecc_width_feet');
                            widthinches = invLookup.getValue('custitemnumber_aecc_width_inches');
                            lengthfeet = invLookup.getValue('custitemnumber_aecc_length_feet');
                            lengthinches = invLookup.getValue('custitemnumber_aecc_length_inches');
                            area = invLookup.getValue('custitemnumber_aecc_area');
                        }
                    }

                    // build the PO array for the dropdown filter
                    if (po_array.indexOf(poNum) == -1) {
                        var po_tran_obj = {
                            'id': poId,
                            'num': poNum
                        };
                        po_array.push(poNum);
                        po_array_obj.push(po_tran_obj);

                        var vendorLookup = search.lookupFields({
                            type: 'purchaseorder',
                            id: poId,
                            columns: ['entity', 'internalid']
                        });
                        poVendor = vendorLookup.entity[0].text;
                        poVendorId = vendorLookup.entity[0].value;

                        var vendor_obj = {
                            'id': poVendorId,
                            'name': poVendor
                        }

                        // build the vendors array for the dropdown filter
                        if (vendor_array.indexOf(poVendor) == -1) {
                            vendor_array.push(poVendor);
                            vendors_filter_array.push(vendor_obj);
                        }
                    }

                    var itemIdSearch = po_search_results[poCtr].getValue('item');
                    var itemTextSearch = po_search_results[poCtr].getText('item');
                    var item_tran_obj = {
                        'id': itemIdSearch,
                        'desc': itemTextSearch
                    }

                    // build the items array for the dropdown filter
                    if (item_array.indexOf(itemIdSearch) == -1) {
                        item_array.push(itemIdSearch);
                        items_filter_array.push(item_tran_obj);
                    }

                    var itemResultObj = {
                        'internalId': poId,
                        'tranId': poNum,
                        'item': po_search_results[poCtr].getText('item'),
                        'itemId': po_search_results[poCtr].getValue('item'),
                        'vendor': poVendor,
                        'location': po_search_results[poCtr].getValue('location'),
                        'invNum': po_search_results[poCtr].getText({
                            name: 'inventorynumber',
                            join: 'inventoryDetail'
                        }),
                        'invNumId': po_search_results[poCtr].getValue({
                            name: 'inventorynumber',
                            join: 'inventoryDetail'
                        }),
                        'invBatch': batchNo,
                        'w_ft': widthfeet,
                        'w_in': widthinches,
                        'l_ft': lengthfeet,
                        'l_in': lengthinches
                    }

                    var itemToReturn = null;
                    if (typeof params == 'undefined')
                        itemToReturn = itemResultObj;
                    else if (!receive_flag && 
                                (isEmpty(params['vendor']) || poVendorId == params['vendor'])
                                &&
                                (isEmpty(params['item']) || itemIdSearch == params['item'])
                                &&
                                (isEmpty(params['batch']) || batchNo == params['batch'])
                            ) 
                    {
                        itemToReturn = itemResultObj;
                    }

                    // item that passed the filter. note that we only will return 500 max
                    // to reduce load from the browser
                    if (itemToReturn) {
                        if (itemsReturned < 500) {
                            itemsReturned++;
                            items_list_results_array.push(itemToReturn);
                        }

                        totalItems++;
                    }
                }

                // now search for bins
                var bin_search_filters = [];
                bin_search_filters.push(search.createFilter({
                    name: 'preferredbin',
                    operator: search.Operator.IS,
                    values: 'T'
                }));
                bin_search_filters.push(search.createFilter({
                    name: 'usebins',
                    operator: search.Operator.IS,
                    values: 'T'
                }));
                bin_search_filters.push(search.createFilter({
                    name: 'type',
                    operator: search.Operator.ANYOF,
                    values: 'InvtPart'
                }));
                bin_search_filters.push(search.createFilter({
                    name: 'isserialitem',
                    operator: search.Operator.IS,
                    values: 'T'
                }));
                bin_search_filters.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: item_array
                }));

                var bin_search = search.create({
                    type: 'serializedinventoryitem',
                    filters: bin_search_filters,
                    columns: [{name: 'binnumber'},{name:'internalid'},{name:'internalid',join:'binNumber'},{name:'location',join:'binNumber'}]
                });

                var bin_search_results = searchAll(bin_search);
                log.debug('bin_search_results',bin_search_results.length);
                for (var binCtr =0; binCtr<bin_search_results.length;binCtr++){
                    var intid = bin_search_results[binCtr].getValue('internalid');
                    var binnum = bin_search_results[binCtr].getValue('binnumber');
                    var binint = bin_search_results[binCtr].getValue({name:'internalid', join:'binNumber'});
                    var binlocation = bin_search_results[binCtr].getValue({name:'location', join:'binNumber'});
                    bins_filter_array[binCtr] = {
                        intid : intid,
                        binnum : binnum,
                        binint : binint,
                        binlocation : binlocation
                    }
                }
            }

            var dataObj = {
                'main': po_array_obj,
                'items': items_list_results_array,
                'vendor': vendors_filter_array,
                'batch': batch_array_obj,
                'itemFilter': items_filter_array,
                'binArrayObj': bins_filter_array,
                'isBatchFiltered': !isEmpty(batch),
                'totalRows': totalItems,
                'rowsReturned': itemsReturned
            };

            log.debug(title, JSON.stringify(dataObj));

            return dataObj;

        }

        function computeAmount(qty, rate, widthFt, widthIn, lengthFt, lengthIn) {
            return parseFloat(rate) * parseInt(qty);
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
                log.debug('total records count: ', intSearchIndex);

                if (maxResults && maxResults == intSearchIndex) {
                    break;
                }
            }
            while (objResultSlice.length >= maxSearchReturn);

            return arrReturnSearchResults;
        }

        function isEmpty(stValue) {
            if ((stValue == '') || (stValue == null) || (stValue == undefined) || (stValue == ' ')) {
                return true;
            } else {
                if (stValue instanceof String) {
                    if ((stValue == '')) {
                        return true;
                    }
                } else if (stValue instanceof Array) {
                    if (stValue.length == 0) {
                        return true;
                    }
                }

                return false;
            }
        }

        function forceParseFloat(stValue) {
            var flValue = parseFloat(stValue);
            if (isNaN(flValue) || (Infinity == stValue) || (-Infinity == stValue)) {
                return 0.00;
            }
            return flValue;
        }


        return {
            onRequest: inboundShipment
        }
    });