/**
 * Created by Jay.
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 * @NModuleScope Public
*/

define (["N/record" , "N/search", "N/runtime", 'N/url', "N/currentRecord", "N/http"] ,
    function (record, search, runtime, url, currentRecord, http) {

    function fieldChanged(context) {
    	var title = 'fieldChanged';
    	
    	try
    	{
    		var fieldName = context.fieldId;
    		var currentRecord = context.currentRecord;

    		if (fieldName == 'custpage_aecc_poitem_vendor' || fieldName == 'custpage_aecc_poitem_po' || fieldName == 'custpage_aecc_poitem_batch' || fieldName == 'custpage_aecc_poitem_item')
    		{
    			var poVendor = currentRecord.getValue({
	                fieldId: 'custpage_aecc_poitem_vendor'
	            });
	            var poPO = currentRecord.getValue({
	                fieldId: 'custpage_aecc_poitem_po'
	            });
	            var poBatch = currentRecord.getValue({
	                fieldId: 'custpage_aecc_poitem_batch'
	            });
                var poItem = currentRecord.getValue({
                    fieldId: 'custpage_aecc_poitem_item'
                });

    			var location = url.resolveScript({
	                scriptId: 'customscript_aecc_inbound_shipment_sl',
	                deploymentId: 'customdeploy_aecc_inbound_shipment_sl'
	            });

    			location = location + '&vendor=' + cleanValue(poVendor) + '&po=' + cleanValue(poPO) 
                                    + '&batch=' + cleanValue(poBatch) + '&item=' + cleanValue(poItem);

    			log.debug(title, 'URL: ' + location);

	            window.onbeforeunload = null;
				window.location.href = location
    		}
    	}
    	catch(error){
        	log.error(title, error.toString());
        } 

    }

    function cleanValue(value) {
        return value? value : '';
    }

    function openSuitelet()
    {
    	try
    	{
    		var location = url.resolveScript({
                scriptId: 'customscript_aecc_inbound_shipment_sl',
                deploymentId: 'customdeploy_aecc_inbound_shipment_sl'
            });

            window.open(location, '_blank', 'location=yes,height=800,width=1500,scrollbars=yes,status=yes');
    	}
    	catch(error){
    		log.error(title, error.toString());
    	}
    }

    function createItemReceipt(recordId, receivedStatus)
    {
        var title = 'createItemReceipt';
        try
        {

            console.log('recordId = ' + recordId + ' | receivedStatus = ' + receivedStatus);

            var id = record.submitFields({
                type: 'customrecord_aecc_custom_inbound_ship',
                id: recordId,
                values: {
                    'custrecord_aecc_is_status' : receivedStatus
                }
            });

            console.log('id = ' + id);

            if (id)
            {
                alert('Item receipt creation is successful.');
                location.reload();
            }
        }
        catch(error)
        {
            alert('Cannot create item receipt. Please contact your Netsuite Administrator.');
            log.error(title, error.toString());
            console.log(error.toString());
        }
    }

    function addItems()
    {
    	var title = 'saveRecord';
    	
    	try
    	{
    		//var currentRecord = context.currentRecord;
    		var record = currentRecord.get();
    		var lineCount = record.getLineCount({sublistId: 'custpage_aecc_poitem_sl'});
    		
    		console.log('lineCount: ' + lineCount);

    		var checkFlag = false;
    		for (var lineCtr = 0; lineCtr < lineCount; lineCtr++)
    		{
    			var addFlag = record.getSublistValue({
    				sublistId: 'custpage_aecc_poitem_sl',
    				fieldId: 'custpage_aecc_poitem_sl_add',
    				line: lineCtr
    			});
    			console.log('checkFlag: ' + checkFlag);
    			if (addFlag == true){
    				checkFlag = true;
    			}
    		}

    		if (checkFlag == false)
    		{
    			alert('Please select items to receive.');
    		}
    		window.onbeforeunload = null;
    		document.forms[0].submit();
    	}
    	catch(error){
        	log.error(title, error.toString());
        }

    }

	return {
		fieldChanged : fieldChanged,
		addItems : addItems,
		openSuitelet : openSuitelet,
        createItemReceipt : createItemReceipt
	}
});