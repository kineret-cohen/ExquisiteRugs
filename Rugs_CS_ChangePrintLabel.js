/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord','N/search'],
		function (url, currentRecord, search) {

			var globalCurrentObj = [];

			function pageInit(context){
				globalCurrentObj = context.currentRecord;
            }
            
            function fieldChanged_Param(context) {

            	updateExportButton(context.currentRecord);

            	if(context.fieldId == 'custpage_serialnoto'){
            		var serialnofrm =  context.currentRecord.getText({fieldId : 'custpage_serialnofrom'});
            		var serialnoto =  context.currentRecord.getText({fieldId : 'custpage_serialnoto'});
            		if(serialnofrm){
						var invNumFilter	= [];
						var invNumColumn	= [];

						invNumFilter.push(search.createFilter({name: "formulanumeric", operator: search.Operator.GREATERTHANOREQUALTO, values: serialnofrm, formula: 'TO_NUMBER({inventorynumber})'}));
						invNumFilter.push(search.createFilter({name: "formulanumeric", operator: search.Operator.LESSTHANOREQUALTO, values: serialnoto, formula: 'TO_NUMBER({inventorynumber})'}));
						invNumColumn.push(search.createColumn({name: "inventorynumber", sort: search.Sort.ASC, label: "Number"}));
						
						var invNumSearch	= search.create({type: "inventorynumber", filters: invNumFilter, columns: invNumColumn });
						var searchResultCount = invNumSearch.runPaged().count;
						if(searchResultCount > 999){
						 	alert('Sorry, cannot display large volume data. Please try again with different filters.');
						 	window.onbeforeunload = null;
						 	document.location = url.resolveScript({
						        scriptId : getParameterFromURL('script'),
						        deploymentId : getParameterFromURL('deploy')
						    });
						}
                           
            		}

            		if(!(serialnofrm) && serialnoto){
            			alert('Please select Serial Number on Serial No From');
            		}

            	}

				if(context.fieldId == 'custpage_doctype') {

					var fromTransFC = context.currentRecord.getValue({fieldId : 'custpage_doctype'});
					var fromDocFC = context.currentRecord.getText({fieldId : 'custpage_documentno'});

					if(fromTransFC){

						var fieldDocNUm = context.currentRecord.getField({
							fieldId: 'custpage_documentno'
						});
					
						fieldDocNUm.removeSelectOption({
							value: null,
						}); 

						var filters = [];
						var tranType = false;

						if(fromTransFC){
							
							if(fromTransFC == "1" || fromTransFC == "2"){
			
							if(fromTransFC =="1")
							{
								filters.push(search.createFilter({name: 'type', operator: search.Operator.ANYOF,values:["PurchOrd"]}));
								tranType = true;
							}

							else if(fromTransFC == "2")
							{
								filters.push(search.createFilter({name: 'type',operator: search.Operator.ANYOF,values:["InvTrnfr"]}));
								tranType = true;
							}

						}
	                }

					if(!tranType)
					{
						filters.push(search.createFilter({name: 'type',operator: search.Operator.ANYOF,values:["PurchOrd", "InvTrnfr"]}));
					}	
				
					filters.push(search.createFilter({name: 'mainline',operator: search.Operator.IS,values:["T"]}));

					var transactionSearchObj = search.create({
						type: "transaction",
						filters: filters,
						columns:
						[
							search.createColumn({name: "type", label: "Type"}),
							search.createColumn({name: "tranid", label: "Document Number"}),
							search.createColumn({name: "formulanumeric",formula: "SUBSTR({number}, 3 )",label: "Formula (Numeric)", sort: search.Sort.ASC}),
						]
					});
					
					var myTransSearchArray = [];

					var resultIndex = 0;
					var resultStep = 1000;

					do {	
						var transSearchResult = transactionSearchObj.run().getRange({start: resultIndex,end: resultIndex + resultStep});
						if (transSearchResult.length > 0 ) {

							fieldDocNUm.insertSelectOption({value: " " ,text: " ", isSelected:true});
      						
							for (i in transSearchResult) {
								
								fieldDocNUm.insertSelectOption({value: transSearchResult[i].id,text: transSearchResult[i].getValue('tranid'), isSelected:false});
					
							}
						}
					
						//increase pointer
						resultIndex = resultIndex + resultStep
					} while (transSearchResult.length !== 0);
			}
		}
	}

	function updateExportButton(currentRecord) {

		var lines = currentRecord.getLineCount({
		 sublistId: 'custpage_table'
		});

		if (lines <= 0)
			return;

		var exportEnabled = false;
		for (var i=0; i < lines; i++) {
			var value = currentRecord.getSublistValue({
			 sublistId: 'custpage_table',
			 fieldId: 'checkbox',
			 line: i 
			});

			if (value) {
				exportEnabled = true;
			}

		}

		//var exportBtn = currentRecord.getField({fieldId: 'submitter'});
		//var exportBtn2 = currentRecord.getField({fieldId: 'secondarysubmitter'});
		
		//exportBtn.isDisabled = !exportEnabled;
		//exportBtn2.isDisabled = !exportEnabled;
	}

    function onSearch(){
        var formDocType          = globalCurrentObj.getValue({fieldId : 'custpage_doctype'});
        var formDoc              = globalCurrentObj.getText({fieldId : 'custpage_documentno'});
        var formSerialNumbers 	 = globalCurrentObj.getText({fieldId : 'custpage_serialnumber'});
        var formSerialNoFrom     = globalCurrentObj.getText({fieldId : 'custpage_serialnofrom'});
        var formSerialNoTo       = globalCurrentObj.getText({fieldId : 'custpage_serialnoto'});
        var formLabelType       = globalCurrentObj.getValue({fieldId : 'custpage_labeltype'});
        var formPageSize       	= globalCurrentObj.getValue({fieldId : 'custpage_pagesize'});

        
        

        var paramObj = {};

        if(formDocType) { paramObj.formDocType = formDocType; }
        if(formDoc) { paramObj.formDoc = formDoc; }
        if(formSerialNumbers) { paramObj.formSerialNumbers = formSerialNumbers.join(","); }
        if(formSerialNoFrom) { paramObj.formSerialNoFrom = formSerialNoFrom; }
        if(formSerialNoTo) { paramObj.formSerialNoTo = formSerialNoTo; }
        if(formLabelType) { paramObj.formLabelType = formLabelType; }
        if(formPageSize) { paramObj.formPageSize = formPageSize; }

 		window.onbeforeunload = null;
        document.location = url.resolveScript({
            scriptId : getParameterFromURL('script'),
            deploymentId : getParameterFromURL('deploy'),
            params : paramObj
        });
    }


    function getParameterFromURL(param) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return (false);
    }

    return {
        fieldChanged : fieldChanged_Param,
        onSearch : onSearch,
        pageInit : pageInit 
    };

});