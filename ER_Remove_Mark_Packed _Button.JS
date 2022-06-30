/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/runtime', 'N/erro'],

    function(record, runtime, error) {
	/**
     * Function definition to be triggered before record is loaded.
     *
     * Calculate some fields (TOTAL HTVA, TOTAL DISCOUNTS...)
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
        var rec = scriptContext.newRecord;
        var shipStatus = rec.getValue({fieldId: 'shipstatus'});
        var userRole = runtime.getCurrentUser().role;
        if(shipStatus == 'B' && userRole == 3){
            throw error.create({
                name: 'SD_IF_ERR',
                message: 'You are not allowed to change status of this Item Fulfillment',
                notify: true
            });
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };

});