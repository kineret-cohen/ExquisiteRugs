/**
 * Created by Jay.
 * @NApiVersion 2.x
 * @NScriptType userEventScript
 * @NModuleScope Public
 */

define(["N/record", "N/search", "N/runtime"],
    function (record, search, runtime) {


        function beforeSubmit(context){

         if (context.type == 'delete') {

                var source = nlapiGetFieldValue('createdfrom');

                if (source != null) {

                                var salesOrderStatus = nlapiLookupField('salesOrder', source, 'status', true);

                                //Check the sales order status if it is billed

                                if (salesOrderStatus == 'Billed') {

                                                var error = nlapiCreateError('Custom Script Error', 'Sales Order(ID:'+source+') has already been billed');

                                                throw(error);

                                }

                }



        }

}
       
        return {
            beforeSubmit: beforeSubmit
        }
    }
);