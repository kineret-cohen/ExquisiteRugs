/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/*

Author: Kineret Cohen
Created Date:   08 Mar 20222
Version: 1.0
-- Date -- -- Modified By -- --Requested By-- -- Description --
*/
define(['N/record', 'N/url'],
        function(record, url) {
            function beforeLoad(context) {

                //Script will run on View Context.
                if (context.type == context.UserEventType.VIEW) {

                    // Create form.
                    var invTransfer = context.form;

                    //get record type and Id of the current record.
                    var rec = context.newRecord;
                    var recId = rec.getValue('id');
                    var recType = rec.getValue('type');

                    try {

                        //pass the parameters into the suitelet.
                        var suiteletURL = url.resolveScript({
                            scriptId: 'customscript_er_st_print_to_packing_slip',
                            deploymentId: 'customdeploy_er_st_print_to_packing_slip',
                            params: {
                                recId: recId
                            }

                        });


                        //add button "Print" on the form.
                        invTransfer.addButton({
                            id: "custpage_print",
                            label: "Print Packing Slip",
                            functionName: "window.open('" + suiteletURL + "');"
                        });
                    } catch (e) {
                        log.error(e.toString());

                    }

                }

                }
                return {
                    beforeLoad: beforeLoad
                };

            });
