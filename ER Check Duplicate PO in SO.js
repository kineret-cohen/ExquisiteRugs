/*************************************************************
* File Header
* Script Name: Rugs_ST_Print_PDF
* Modified On: 
* Created By: Kineret Cohen  
************************************************************/

/**
 * @NApiVersion 2.x
 * @NScriptType clientScript
 * @NModuleScope Public
 */


define(["N/currentRecord", "N/search"], function (currentRecord, search) {

  
    function checkForDuplicatePONumber(context){
        
        var salesOrder = context.currentRecord;

        var customerPO = salesOrder.getValue('otherrefnum');
        var customer = salesOrder.getValue('entity');
        var transID = salesOrder.getValue('tranid');
        
        log.debug('customerPO :', customerPO);
        log.debug('customer :', customer);
        log.debug('transID :', transID);

        var searchFilter = search.create({
                                type: search.Type.SALES_ORDER,
                                filters: [
                                            ["mainline", "is", "T"], "and",
                                            ["entity", "is", customer], "and",
                                            ["otherrefnum", "equalto", trim(customerPO)]
                                          ],
                                columns: ["otherrefnum","tranid"]
                            });
    

        // check for no duplciates
        var transSearchResult = searchFilter.run().getRange({start: 0,end: 10});
        if(transSearchResult.length == 0)
              return true;
      
        //If the SO that is saved is alreay in the system then we are actually editing the record and don't need to check
        var soNumber = transSearchResult[0].getValue({name: 'tranid'});
        if (soNumber == transID) 
          return true;


        // if exist, need he user to confirm before saving
        if (confirm('\n* * * DUPLICATE PO# FOR THIS CUSTOMER * * *\n\nCHECK BEFORE CONTINUING !! \n\nPRESS OK TO SAVE OR CANCEL'))
          return true;
        else 
          return false; 

    }   

    
    return {
              saveRecord: checkForDuplicatePONumber
           };
});