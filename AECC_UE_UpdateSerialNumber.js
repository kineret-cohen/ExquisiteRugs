/**
 * Created by Jay.
 * @NApiVersion 2.x
 * @NScriptType userEventScript
 * @NModuleScope Public
 */

define (["N/record" , "N/search", "N/runtime"] ,
    function (record, search, runtime) {

    	function afterSubmit_updateSerialNumber(context)
    	{
    		var title = 'afterSubmit_updateSerialNumber';
    		log.debug(title, '------ START -----------');
    		try
    		{
    			var objScript = runtime.getCurrentScript();
    			var newRecord = context.newRecord;
	        	var recordType = newRecord.type;
	        	var recordId = newRecord.id;

	        	var snId = newRecord.getValue('custrecord_aecc_sn_id');
	        	var widthFeet = newRecord.getValue('custrecord_aecc_cs_width_feet');
	        	var widthInches = newRecord.getValue('custrecord_aecc_cs_width_inches');
	        	var lengthFeet = newRecord.getValue('custrecord_aecc_cs_length_feet');
	        	var lengthInches = newRecord.getValue('custrecord_aecc_cs_length_inches');
	        	var batchNo = newRecord.getValue('custrecord_aecc_cs_batch_no');
	        	var baleNo = newRecord.getValue('custrecord_aecc_bale_number');
                var eta = newRecord.getValue('custrecord_aecc_eta');
                var memo = newRecord.getValue('custrecord_aecc_memo');
                var allocated = newRecord.getValue('custrecord_allocated_sn');


                var area = (forceParseInt(widthFeet) + (forceParseInt(widthInches) / 12)) * (forceParseInt(lengthFeet) + (forceParseInt(lengthInches) / 12));

	        	log.debug(title, 'snId = ' + snId);
	        	log.debug(title, 'widthFeet = ' + widthFeet + ' | widthInches = ' + widthInches + ' | lengthFeet = ' + lengthFeet + ' | lengthInches = ' + lengthInches + ' | batchNo = ' + batchNo + ' | baleNo = ' + baleNo + ' | area = ' + area);

	        	var serialNumberID = record.submitFields({
	                type: 'inventorynumber',
	                id: snId,
	                values: {
	                    custitemnumber_aecc_width_feet: widthFeet,
	                    custitemnumber_aecc_width_inches: widthInches,
	                    custitemnumber_aecc_length_feet: lengthFeet,
	                    custitemnumber_aecc_length_inches: lengthInches,
	                    custitemnumber_aecc_batch_no: batchNo,
	                    custitemnumber_aecc_bale_number: baleNo,
                        custitemnumber_aecc_eta: eta,
                        custitemnumber_allocated_item_number: allocated,
                        memo: memo,
	                    custitemnumber_aecc_area: area.toFixed(2)
	                }
	            });

	            log.debug(title, serialNumberID);
    		}
    		catch(error)
    		{
            	log.error(title, error.toString());
        	}
        	log.debug(title, '------ END -----------');
    	}

	    function searchAll ( objSavedSearch ) 
	    {
	        var arrReturnSearchResults = [];
	        var objResultset = objSavedSearch.run ();
	        var intSearchIndex = 0;
	        var objResultSlice = null;
	        var maxSearchReturn = 1000;

	        var maxResults = 0;

	        do
	        {
	            var start = intSearchIndex;
	            var end = intSearchIndex + maxSearchReturn;
	            if (maxResults && maxResults <= end) {
	                end = maxResults;
	            }
	            objResultSlice = objResultset.getRange (start , end);

	            if (!(objResultSlice)) {
	                break;
	            }

	            arrReturnSearchResults = arrReturnSearchResults.concat (objResultSlice);
	            intSearchIndex = intSearchIndex + objResultSlice.length;

	            if (maxResults && maxResults == intSearchIndex) {
	                break;
	            }
	        }
	        while (objResultSlice.length >= maxSearchReturn);

	        return arrReturnSearchResults;
	    }

	    function isEmpty ( stValue ) {
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

        function forceParseInt ( stValue ) {
            var flValue = parseInt (stValue);

            if (isNaN (flValue)) {
                return 0;
            }
            return flValue;
        }

	return {
		afterSubmit : afterSubmit_updateSerialNumber
	}
});