function processItemReceipt()
{
    var title = 'processItemReceipt';
    nlapiLogExecution('DEBUG', title, '---------- START ------------');
    try
    {
        var context = nlapiGetContext();
        var inboundShipmentParam = context.getSetting('SCRIPT', 'custscript_aecc_inbound_ship_id');

        if (isNullOrEmpty(inboundShipmentParam))
        {
    
             return;
        }

        var inboundShipmentItems = getInboundShipment(inboundShipmentParam);

        if (inboundShipmentItems.length == 0)
        {
            nlapiLogExecution('ERROR', title, 'No Inbound Shipment Item.');
        
            return;
        }

        var po_id_array = [];
        var item_array = [];
        var item_array_obj = [];
        var po_list_obj = {};

        for (var lineCtr = 0; lineCtr < inboundShipmentItems.length; lineCtr++)
        {
            var po = inboundShipmentItems[lineCtr].getValue('custrecord_aecc_is_po_no');
            var item = inboundShipmentItems[lineCtr].getValue('custrecord_aecc_is_item');
            var serial = inboundShipmentItems[lineCtr].getText('custrecord_aecc_is_serial_number');
            var serialID = inboundShipmentItems[lineCtr].getValue('custrecord_aecc_is_serial_number');
            var location = inboundShipmentItems[lineCtr].getValue('custrecord_aecc_is_location');
            var bin = inboundShipmentItems[lineCtr].getValue('custrecord_aecc_is_bin');
            nlapiLogExecution('DEBUG','bin',bin);


            if (po_id_array.indexOf(po) == -1)
            {
                po_id_array.push(po);
                po_list_obj[po] = {};
            }

            if(!(po_list_obj[po][location]))po_list_obj[po][location] = [];

            var item_obj = {
                'itemId' : item,
                'serialId' : serial,
                'serialNumId' : serialID,
                'binId' : bin,
            }
            po_list_obj[po][location].push(item_obj);
        }

        nlapiLogExecution('ERROR', title, 'po_list_obj = ' + JSON.stringify(po_list_obj));
        nlapiLogExecution('ERROR', title, 'serial' + serial);
        

        for (var poID in po_list_obj)
        {
          
            var objLocation = po_list_obj[poID];
            for (var locationID in objLocation)
            {
                var list_item = objLocation[locationID];
         
                nlapiLogExecution('DEBUG', title, 'list_item = ' + JSON.stringify(list_item));
                nlapiLogExecution('ERROR', title, 'list_item = ' + JSON.stringify(list_item));

                // Map all items selected in the UI
                var list_item_obj = {};
                var list_item_arr = [];
                var serial_num_arr = [];
                var serial_num_bin_arr = [];
                var serial_obj = {};
                for (var list_item_ctr = 0; list_item_ctr < list_item.length; list_item_ctr++)
                {
                    
                    var list_item_val = list_item[list_item_ctr]['itemId'];
                    var list_serial_val = list_item[list_item_ctr]['serialId'];
                    var list_serialID_val = list_item[list_item_ctr]['serialNumId'];
                    var list_binId_val = list_item[list_item_ctr]['binId'];
                    serial_num_arr.push(list_serialID_val);


                    if (list_item_arr.indexOf(list_item_val) == -1)
                    {
                        
                        list_item_arr.push(list_item_val);
                        list_item_obj[list_item_val] = [];
                        serial_obj[list_item_val] = [];
                    }

                    list_item_obj[list_item_val].push(list_serial_val);
                    serial_obj[list_item_val].push(list_binId_val);

         
                }

                nlapiLogExecution('ERROR', title, 'list_item_obj = ' + JSON.stringify(list_item_obj));
                nlapiLogExecution('ERROR', title, 'list_item_arr = ' + JSON.stringify(list_item_arr));
                nlapiLogExecution('ERROR', title, 'item = ' + JSON.stringify(item));

                var itemReceiptObj = nlapiTransformRecord('purchaseorder', poID, 'itemreceipt', {recordmode: 'dynamic'});
                itemReceiptObj.setFieldValue('location', locationID);
                var lineCount = itemReceiptObj.getLineItemCount('item');
                nlapiLogExecution('ERROR', title, 'lineCount = ' + lineCount);

                if (lineCount > 0)
                {
                    // the lines are 1 based (1 to 10 not 0 to 9)
                    for (var line_ctr = 1; line_ctr <= lineCount; line_ctr++)
                    {

                        var line_item = itemReceiptObj.getLineItemValue('item', 'item', line_ctr);
                        var intQuantity = itemReceiptObj.getLineItemValue('item', 'quantity', line_ctr);
                        itemReceiptObj.selectLineItem('item', line_ctr);

                        // check if the specific item was selected in the UI to be recieved
                        if (typeof list_item_obj[line_item] != 'undefined')
                        {
                            nlapiLogExecution('ERROR', title, 'undefined');
                            itemReceiptObj.setCurrentLineItemValue('item', 'location', locationID);
                            var serial_array = list_item_obj[line_item];
                            var serial_bin = serial_obj[line_item];


                            var inventoryDetailObj = itemReceiptObj.viewLineItemSubrecord('item', 'inventorydetail', line_ctr);
                            nlapiLogExecution('ERROR', title, inventoryDetailObj);
    
                            var inventoryDetailCount = inventoryDetailObj.getLineItemCount('inventoryassignment');

                            nlapiLogExecution('ERROR', title, 'Inventory Detail Count = ' + inventoryDetailCount);

                            for (var inventoryLineCtr = (inventoryDetailCount); inventoryLineCtr >= 1; inventoryLineCtr--)
                            {
                                var serialNumber = inventoryDetailObj.getLineItemValue('inventoryassignment', 'receiptinventorynumber', inventoryLineCtr);
                                nlapiLogExecution('ERROR', title, 'serialNumber = ' + serialNumber);
                                if (serial_array.indexOf(serialNumber) == -1)
                                {
                                    intQuantity--;
                                    nlapiLogExecution('ERROR', title, 'Reduce Quantity (serialNumber not found), Quantity = ' + intQuantity);
                                }
                            }
                         
                            if(intQuantity > 0)
                            {
                                itemReceiptObj.setCurrentLineItemValue('item', 'quantity', intQuantity);
                                var inventoryDetailObj = itemReceiptObj.editCurrentLineItemSubrecord('item', 'inventorydetail');
                                var inventoryDetailCount = inventoryDetailObj.getLineItemCount('inventoryassignment');
                                nlapiLogExecution('ERROR', title, 'Inventory Detail Count = ' + inventoryDetailCount);
                                for (var inventoryLineCtr = (inventoryDetailCount); inventoryLineCtr >= 1; inventoryLineCtr--)
                                {
                                    var serialNumber = inventoryDetailObj.getLineItemValue('inventoryassignment', 'receiptinventorynumber', inventoryLineCtr);

                                    // only relevant items should be recieved 
                                    if (serial_array.indexOf(serialNumber) == -1)
                                    {
                                        inventoryDetailObj.removeLineItem('inventoryassignment', inventoryLineCtr);
                                    }
                                    else
                                    {
                                        if(!isNullOrEmpty(serial_bin[serial_array.indexOf(serialNumber)])) {
                                            inventoryDetailObj.selectLineItem('inventoryassignment', inventoryLineCtr);
                                            inventoryDetailObj.setCurrentLineItemValue('inventoryassignment', 'binnumber', serial_bin[serial_array.indexOf(serialNumber)]);
                                            inventoryDetailObj.commitLineItem('inventoryassignment');
                                        }
                                    }
                                }
                                inventoryDetailObj.commit();
                                itemReceiptObj.commitLineItem('item');
                            }
                            else 
                            {
                
                                nlapiLogExecution('ERROR', title, 'itemreceive F');
                                itemReceiptObj.setCurrentLineItemValue('item', 'itemreceive', 'F');
                            }

                            itemReceiptObj.commitLineItem('item');
                        }
                        // mark item is not for receieving (was not selected by te user)
                        else
                        {
                            itemReceiptObj.setCurrentLineItemValue('item', 'itemreceive', 'F');
                            itemReceiptObj.commitLineItem('item');
                    
                        }
                    }
                    var itemReceiptId = nlapiSubmitRecord(itemReceiptObj, true, true);
                    itemReceiptObj = null;
                    nlapiLogExecution('ERROR', title, 'KINERET Item Receipt Created = ' + itemReceiptId);

                    if (itemReceiptId)
                    {
                         
                        for (var invCtr = 0; invCtr < serial_num_arr.length; invCtr++)
                        {
                            try
                            {
                                nlapiLogExecution('ERROR', title, 'KINERET try');
                                var serialNumberID = serial_num_arr[invCtr];
                                nlapiSubmitField('inventorynumber', serialNumberID, 'custitemnumber_aecc_is_received_flag', 'T');
                                nlapiLogExecution('ERROR', title, 'Updated serial record = ' + serialNumberID);

                            }
                            catch(inv_error)
                            {
                               
                               nlapiLogExecution('ERROR', title, 'KINERET inv_error');
                               log.error(title, inv_error.toString());
                            }
                        }
                    }

                }
            }


        }
    }
    catch(error){
        nlapiLogExecution('ERROR', title, error.toString());
    }

    nlapiLogExecution('DEBUG', title, '---------- END ------------');
}

function getInboundShipment(id)
{
    var title = 'getInboundShipment';


    var filters = [
        new nlobjSearchFilter('custrecord_aecc_is_inbound_shipment_rec', null, 'anyof', [id])
    ];

    var columns = [
        new nlobjSearchColumn('custrecord_aecc_is_po_no'),
        new nlobjSearchColumn('custrecord_aecc_is_item'),
        new nlobjSearchColumn('custrecord_aecc_is_serial_number'),
        new nlobjSearchColumn('custrecord_aecc_is_location'),
        new nlobjSearchColumn('custrecord_aecc_is_bin')

    ];


    var resultInboundShip = getSearchResults('customrecord_aecc_custom_inbound_ship_it', '', filters, columns);

    return resultInboundShip;
}

function isNullOrEmpty(objVariable) {
    return (objVariable == null || objVariable == '' || objVariable == undefined || objVariable == 'undefined');
}

function getSearchResults(recordType, searchId, filters, columns) {
    if (!isNullOrEmpty(searchId))
    {
        var savedSearch = nlapiLoadSearch(recordType, searchId);
    }
    else
    {
        var savedSearch = nlapiCreateSearch(recordType);
        savedSearch.filters = filters;
        savedSearch.columns = columns;
    }
    var resultset = savedSearch.runSearch();
    var returnSearchResults = [];
    var searchid = 0;
    do {
        var resultslice = resultset.getResults(searchid, searchid + 1000);
        for ( var rs in resultslice) {
            returnSearchResults.push(resultslice[rs]);
            searchid++;
        }
    } while (resultslice.length >= 1000);

    return returnSearchResults;
}
