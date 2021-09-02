/*************************************************************
* File Header
* Script Type: SuiteLet
* Script Name: Rugs_ST_Print_PDF
* File Name: 
* Created On: 
* Modified On: 
* Created By: Shital Warkhade (Yantra Inc.)
* Modified By: 
* Description: 
************************************************************/
    
/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
    
    define(['N/ui/serverWidget', 'N/record', 'N/render', 'N/file', 'N/search'], function (serverWidget, record, render, file, search) {
        function pdfCreation(context) {

           var totalPrice = 0;
            //create form
            var form = serverWidget.createForm({
                title: 'Inventory Transfer',
                hideNavBar: true
            });

            var recId = context.request.parameters.recId;
            log.debug('recId :-', recId);

            var fontSize = 'font-size:5pt;font-family: Century Gothic, sans-serif;';

            if (recId) {
                var recLoad = record.load({
                    type: "inventorytransfer",
                    id: recId,
                    isDynamic: true
                });

                var transID = recLoad.getValue({
                    fieldId: 'tranid'
                });
               // log.debug('transID :-', transID);

                var date = recLoad.getText({
                    fieldId: 'trandate'
                });
               // log.debug('date:-', date);
                
                 var _customerId = recLoad.getValue({
                    fieldId: 'custbody_it_customer'
                });
                //log.debug('_customerId:-', _customerId);

                var _subsidiary = recLoad.getText({
                    fieldId: 'subsidiary'
                });
               // log.debug('_subsidiary:-', _subsidiary);

                var subAddress = recLoad.getValue({
                    fieldId: 'custbody_test_subsidiary_address'
                });
               // log.debug('subAddress:-', subAddress);

                var subFax = recLoad.getValue({
                    fieldId: 'custbody_sub_fax_no'
                });
               // log.debug('subFax:-', subFax);

                var billTo = recLoad.getValue({
                    fieldId: 'custbody_er_customer_billto'
                });
               // log.debug('billTo:-', billTo);

                var shipTo = recLoad.getValue({
                    fieldId: 'custbody_er_customer_shipto'
                });
               // log.debug('shipTo:-', shipTo);

                var shipVia = recLoad.getValue({
                    fieldId: 'custbody_po_ship_via'
                });
               // log.debug('shipVia:-', shipVia);
                
                var memo = recLoad.getText({
                    fieldId: 'memo'
                });
                //log.debug('memo:-', memo);
                
                var lookupTerms = '';
                            
                if (_customerId) {
                     lookupTerms = search.lookupFields({
                         type: search.Type.CUSTOMER,
                         id: _customerId,
                         columns: ['terms', 'companyname']
                     });
                 }
                 else{
                     _customerId = '';
                 }
                 var terms = '';
                 var companyName = '';
                 if(lookupTerms){   
                     if(lookupTerms.terms[0]!= '' && lookupTerms.terms[0]!= undefined){terms = lookupTerms.terms[0].text;}
                     if(lookupTerms.companyname!= ''){companyName = lookupTerms.companyname;}
                 }

                var xml = '';
                xml += '<?xml version="1.0" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n';
                
                xml += '<pdf>';
                xml += '<head>';
                xml += '<meta name="title" value="INVENTORY TRANSFER"/>';
                xml += '<style type="text/css">';

                xml += "table.itemtable th {";
                xml += "padding-bottom: 10px";
                xml += "padding-top: 10px";
                xml += "}";

                xml += "table.header th {";
                xml += "padding-bottom: 10px";
                xml += "padding-top: 10px";
                xml += "}";

                xml += "table.body td {";
                xml += "padding-top: 2px";
                xml += "}";

                xml += "tr.totalrow {";
                xml += "background-color: #e3e3e3";
                xml += "line-height: 200%";
                xml += "}";

                xml += " table.body td {";
                xml += " padding-top: 2px";
                xml += "}";

                xml += 'table.head h2{';
                xml += 'font-size:35px!important';
                xml += 'font-weight:normal!important';
                xml += '}';

                xml += '<macrolist>';
                xml += '<macro id="nlheader">';
                xml += '<table class="header" border="0" style="width: 100%;">';
                xml += '<tr>';
                xml += '<td rowspan="3"  style="width: 30%;" border="0">';
                xml += '<img src=" https://4951235.app.netsuite.com/core/media/media.nl?id=2106&amp;c=4951235&amp;h=ece9007b3f17bf2cc27c" style="margin: 0px; width: 380px; height:40px; padding-bottom: 5px;" />';
                xml += '</td>';
                xml += '<td rowspan="3" border="0" align = "right" class="head"><p style="font-size:30px;font-weight:normal!important">Consignment</p></td>';
                xml += '</tr>';
                xml += '</table>';

                xml += '<table class="header" width="100%" border="0">';
                xml += '<tr>';
                xml += '<td border="0"><p style="width:200px;font-size:14px;">10940 Wilshire Blvd<br></br>Suite 1225<br></br>Los Angeles CA 90024<br></br>United States<br></br>Tel. (310) 208-8283<br></br>Fax. (310) 208-8280</p></td>';
                xml += '<td border="0"><p align = "right" style="font-size: 18px;">#' + transID + '</p><p align = "right" style="font-size: 14px;">' + date + '</p></td>';
                xml += '</tr>';
                xml += '</table>';

                xml += '</macro>';
                xml += '</macrolist>';

                xml += '</style>';
                xml += '</head>';
                xml += '<body header="nlheader" header-height="18%">\n';

                var mySearch = search.load({
                    id: 'customsearch1025'
                });

                //add filter of Inv Trn internal id
                var filters = mySearch.filters; 
                var filterOne = search.createFilter({ //create new filter
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: recId
                });
        
            filters.push(filterOne);

                var searchColObj = mySearch.run();
                var searchResult = mySearch.run().getRange({
                    start: 0,
                    end: 999
                });
                var searchLength = searchResult.length;
                log.debug('searchResult.length:-',searchLength);
          
                xml += '<table width="100%" border="0">';
                xml += '<tr>';  
                xml += '<td style="background-color: #e6e6e6;font-size:14px;"><b>Sold To</b></td>';
                xml += '<td style="background-color: #e6e6e6;font-size:14px;"><b>Ship To</b></td>';
                xml += '</tr>';

                xml += '<tr>';
                xml += '<td><p style="width:200px;font-size:14px;">' + toXml(billTo) + '</p></td>';
                xml += '<td><p style="width:200px;font-size:14px;">' + toXml(shipTo) + '</p></td>';
                xml += '</tr>';

                xml += '</table>';

                xml += '<table width="100%" border="0" style="margin-top:10px;">';
                xml += '<tr>';
                xml += '<td style="background-color: #e6e6e6;font-size:14px;"><b>Customer</b></td>';
                xml += '<td style="background-color: #e6e6e6;font-size:14px;"><b>Ship Via</b></td>';
                xml += '<td style="background-color: #e6e6e6;font-size:14px;"><b>Payment Terms</b></td>';
                xml += '<td style="background-color: #e6e6e6;font-size:14px;"><b>Total Qty</b></td>';
                xml += '</tr>';

                xml += '<tr>';
                xml += '<td style = "font-size:14px;">' + toXml(companyName) + '</td>';
                xml += '<td style = "font-size:14px;">' + toXml(shipVia) + '</td>';
                xml += '<td style = "font-size:14px;">' + toXml(terms) + '</td>';
                xml += '<td style = "font-size:14px;">' + searchLength + '</td>';
                xml += '</tr>';
                xml += '</table>';

                xml += '<table width="100%" border="0" style="margin-top:10px;">';
                xml += '<tr style="background-color: #e6e6e6;font-size:14px;">';
                xml += '<td ><b>Special Instructions</b></td>';
                xml += '</tr>';
                xml += '<tr>';
                xml += '<td style = "font-size:14px;">' + toXml(memo) + '</td>';
                xml += '</tr>';

                xml += '</table>';

                var strName = '<table class="itemtable" style="width: 100%; margin-top: 10px;">';

                strName += '<thead>';
                strName += '<tr>';
                strName += '<th align="left" colspan="4" style="font-size:13px; background-color: #e6e6e6;padding:7px;"><b>Rug Number</b></th>';
                strName += '<th align="left" colspan="4" style="font-size:13px; background-color: #e6e6e6;padding:7px;"><b>Item</b></th>';
                strName += '<th align="left" colspan="2" style="font-size:13px; background-color: #e6e6e6;padding:7px;"><b>Collection</b></th>';
                strName += '<th align="left" colspan="2" style="font-size:13px; background-color: #e6e6e6;padding:7px;"><b>Size</b></th>';
                strName += '<th align="left" colspan="2" style="font-size:13px; background-color: #e6e6e6;padding:7px;"><b>SQFT Area</b></th>';
                strName += '<th align="left" colspan="3" style="font-size:13px; background-color: #e6e6e6;padding:7px;"><b>Piece Price</b></th>';
                strName += '</tr>';
                strName += '</thead>';
                for (var i = 0; i < searchResult.length; i++) {

                    var lineItem = searchResult[i].getText(searchColObj.columns[2]);
                    var actualItem;
                    if(lineItem.indexOf(":")>=0){
                         actualItem = lineItem.substring(0, 5);
                    }
                    else{
                        actualItem = lineItem;
                    }
                    log.debug('lineItem',lineItem);
                    
                    var str="OAK";
                    var indexItem = lineItem.indexOf(str)>=0;
                    if(actualItem.indexOf(str)>=0)
                    {
                          actualItem ="OAK";
                    }
                    var itemName = actualItem;
                    log.debug('itemName',itemName);

                    var lineNumber = searchResult[i].getValue(searchColObj.columns[4]);
                    log.debug('mySearch lineNumber:- ', lineNumber);
                    var itemSrNoArea = searchResult[i].getValue(searchColObj.columns[5]);
                    log.debug('mySearch itemSrNoArea:- ', itemSrNoArea);
                    var itemArea = searchResult[i].getValue(searchColObj.columns[6]);
                    log.debug('mySearch itemArea:- ', itemArea);
                    var itemCollection = searchResult[i].getValue(searchColObj.columns[7]);
                    var itemCustomWidth = searchResult[i].getValue(searchColObj.columns[8]);
                    var itemCustomLength = searchResult[i].getValue(searchColObj.columns[9]);
                    var itemErPrgm = searchResult[i].getText(searchColObj.columns[16]);
                    log.debug('mySearch itemErPrgm:- ', itemErPrgm);
                    var itemSize = searchResult[i].getValue(searchColObj.columns[11]);
                    log.debug('mySearch itemSize:- ', itemSize);

                    var finalCalSizeW1 = itemCustomWidth.replace("###", "'");
                    var finalCalSizeW2 = finalCalSizeW1.replace('##', '"');
                    var finalCalSizeW3 = finalCalSizeW2.replace("#", "'");
                    var finalCalSizeL1 = itemCustomLength.replace("###", "'");
                    var finalCalSizeL2 = finalCalSizeL1.replace('##', '"');
                    var finalCalSizeL3 = finalCalSizeL2.replace("#", "'");
                    if(finalCalSizeW1 == "'" && finalCalSizeL1 == "'"){
                        var calSize = '';
                    }else{
                        calSize = finalCalSizeW3 + 'X' + finalCalSizeL3;
                    }

                    var itemCustomPrice = searchResult[i].getValue(searchColObj.columns[13]);
                    log.debug('mySearch itemCustomPrice:- ', itemCustomPrice);

                    var itemPrice = searchResult[i].getValue(searchColObj.columns[14]);
                    log.debug('mySearch itemPrice:- ', itemPrice);

                    var itemPriceMain = searchResult[i].getValue(searchColObj.columns[15]);
                    log.debug('mySearch itemPriceMain:- ', itemPriceMain);

                    if((itemSize != 'SAMPLE') && (itemErPrgm != 'NEW SAMPLE/UNDER REVIEW' && itemErPrgm != 'OAK NO IMAGE'
                            && itemErPrgm != 'OAK WITH IMAGE' && itemErPrgm !='CUSTOM ')){
                         
                            var itemSplit = lineItem.split("-"); 
                            itemSize = itemSplit[1];
                            log.debug('mySearch itemSplit:- ', itemSplit+'itemSize'+itemSize);

                            itemSrNoArea = itemArea;
                            itemPrice = itemCustomPrice;
                    }
                    else {
                        itemSize = calSize;
                    }
                    
                    strName += '<tr>';

                    strName += '<td align="left" colspan="4" style="font-size:13px;padding:7px;">' + lineNumber + '</td>';
                    strName += '<td align="left" colspan="4" style="font-size:13px;padding:7px;">' + itemName + '</td>';
                    
                    if(itemCollection == '- None -'){
                    strName += '<td align="left" colspan="2" style="font-size:13px;padding:7px;"></td>'; 
                    }
                    else{
                        strName += '<td align="left" colspan="2" style="font-size:13px;padding:7px;">' + itemCollection + '</td>';
                    }
                   
                    strName += '<td align="left" colspan="2" style="font-size:13px;padding:7px;">' + itemSize + '</td>';
                    strName += '<td align="left" colspan="2" style="font-size:13px;padding:7px;">' + round(itemSrNoArea) + '</td>';  //added on 7th jan 2020
                    
                    if (itemPrice) {
                        itemPrice = parseFloat(itemPrice);
                        totalPrice += itemPrice;
                    }

                    strName += '<td align="left" colspan="3" style="font-size:13px;padding:7px;">' + numberWithCommas(itemPrice) + '</td>';  //added on 7th jan 2020  
                    strName += '</tr>';
                }
                strName += '</table>';
                strName += '<hr style="width:100%;color:#e6e6e6;"/>';
                
                strName += '<table border="0" style="width: 100%; margin-top: 10px;">';
                            strName += '<tr>';
                            strName += '<td colspan="4">';
                            strName += '<table border="0" style="width: 307.8px;">';
                            strName += '<tr>';
                            strName += '<td style="width: 299.8px;"><strong>Remit to:</strong></td>';
                            strName += '</tr>';
                            strName += '<tr>';
                            strName += '<td style="width: 299.8px;"> Exquisite Rugs</td>';
                            strName += '</tr>';
                            strName += '<tr>';
                            strName += '<td style="width: 299.8px;"> 10940 Wilshire Blvd, Suite 1225</td>';
                            strName += '</tr>';
                            strName += '<tr>';
                            strName += '<td style="width: 299.8px;"> Los Angeles, CA 90024</td>';
                            strName += '</tr>';
                            strName += '<tr>';
                            strName += '<td style="width: 299.8px;"> Tel. (310) 208-8283</td>';
                            strName += '</tr>';
                            strName += '<tr>';
                            strName += '<td style="width: 299.8px;"> Fax. (310) 208-8280</td>';
                            strName += '</tr>';
                            strName += '</table>';
                            strName += '</td>';
                            strName += '<td align="right" colspan="4">';
                            strName += '<table border = "0">';
                            strName += '<tbody>';
                            strName += '<tr>';
                            strName += '<td colspan="4"></td>';
                            strName += '<td align="right"><b>Merchandise Total:</b></td>';
                            strName += '<td align="right">' + (isNaN(totalPrice) ? '0.00' :  numberWithCommas(totalPrice)) +'</td>';
                            strName += '</tr>';
                            strName += '</tbody>';
                            strName += '</table>';
                            strName += '</td>';
                            strName += '</tr>';
                            strName += '</table>';
                            strName += '<p style="font-size:15px;">Customer Copy. This Invoice is subject to Terms and Conditions agreed when the Account was established. Exclusive Rugs reserves the right to convert consigned goods to invoiced goods if said goods are not accounted and paid for, or returned, within the Consignment Period.</p>';
                            strName += '<pbr/>';
                            strName += '<p style="font-size:14px;"><strong>CONSIGNMENT AGREEMENT</strong></p>';
                            strName += '<p  style="font-size:9px;">The Consignee, in order to induce the consignor to forward the within described merchandise, and in consideration of the delivery thereof in trust, warrants covenants, and agrees as follows.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">1. The merchandise-listed over-leaf is forwarded to the consignee to be held, and exhibited by the Consignee as property of the Consignor. The ownership and title to all merchandise shall remain at all times in the Consignor. A sign or notification shall be evidenced indicating to the public that the merchandise is the property of the consignor.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">2. The Consignee assumes all liability for all injury or loss of any kind or nature once merchandise leaves Consignors premises. The Consignee agrees to keep all consigned merchandise insured at the Consignees expense naming the Consignor as loss payee against all risk, including, but limited to loss or damage resulting from fire, water, theft, pilferage and all risks incurred in handling or transporting the merchandise. Failure of the Consignee to carry such insurance coverage shall deem him or her personally liable for such loss.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">3. The Consignee shall pay all insurance, freight and handling expense. Any part of the consigned merchandise unpaid for shall be returned in the same condition as received immediately upon the Consignors demand, for which may be anytime prior to the expiration of the consignment term or promotion period. None of the rugs consigned may be used on the floor or soiled, and the Consignee agrees to purchase and immediately pay for any rugs which have been shop worn, soiled, stained, or damaged in anyway, unless there is a written agreement to the contrary the consignment term shall be limited to Twenty-four (24) hours from the time of delivery.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">4. The Consignee shall report any claims on damages, or shortage, in writing,o the Consignor within seventy-two (72) hours from the time of receipt of the merchandise.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">5. The Consignee may sell from the consigned merchandise in the ordinary  course of business but only at a price in excess of consignment price indicated herein and only for cash. Immediately upon such sale that the Consignee shall make a report to the Consignor, accompanied by the proceeds of the sale, up to the amount of consignment price title to such merchandise, and the proceeds from sale of said merchandise shall always remain and belong to the Consignor. The title and ownership to the merchandise forwarded herewith may pass to the consignee only upon payment to the Consignor of the full consigned and not otherwise. The acceptance of check, note or other commercial paper, credit card by the Consignor is not to be deemed payment until the said instruments have been paid. Payment of less than consigned price shall not be deemed as a part payment and shall not transfer the title and ownership to the Consignee, but shall be considered merely as a deposit, and the title and ownership shall remain in the Consignor until full price of said particular merchandise is paid by the Consignee.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">6. The original tags, seals and any other markings of the Consignor shall not e removed or disturbed from the merchandise. Neither the consigned merchandise nor any proceeds thereof shall be mingled with the Consignees other property.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">7. The shipping of consigned merchandise by the Consignor shall be an  acceptance in accordance with terms and conditions of this consignment<br />agreement, by the Consignee</p>';
                            strName += '<p class="tcs" style="font-size:9px;">8. Due to the nature of the goods, all rugs are consigned in "AS IS" condition and the Consignor makes no warranties nor be held liable for correctness of the name or any other description such as, but not limited to, physical conditions, size, quality, rarity, value, age, design, color, materials used, or importance. The Consignee agrees to the accuracy and the correctness of any of the rug description and details such as size origin, value, age and etc.; howsoever represented is deemed reliable but not guaranteed, and the consignor shall not be held liable for any loss or claims arising from this.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">9. The Consignee agrees that it is at its responsibility and expense to professionally and safely install, or display any merchandise received under this agreement to prevent any loss or personal injury claims. Consignee agrees that it holds consignor harmless and will indemnify consignor from any<br />such claims or losses, even if the Consignee has assisted in the display or installation of the rugs.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">10. The Consignor is hereby authorized to execute and file a financing statement, and carry out a credit report on the consignee.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">11. A late charge of 1.5% per month, or the maximum permitted by applicable law will be added to all past due accounts.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">12. The Consignee agrees to pay any and all attorney fees and legal expenses howsoever arising out of this transaction, or the use of the merchandise<br />listed.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">13. The Consignee personally guarantees performance under this agreement.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">14. The Consignee warrants and guarantees that all items listed here in are strictly for resale ONLY. The Consignees resale number is _________________; City and State of__________________________. The Consignee must provide Tax Identification Number (Tax ID) ____________________, and, Social Security Number (SSN) __________________________ to the Consignor.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">15. The Consignee agrees that this agreement is deemed to have been consummated in Los Angeles County, and is to be interpreted under the laws of<br />the State of California. Any actions, proceedings or matters arising out of this transaction may be brought only through a competent court with jurisdiction over such a matter in the Los Angeles County.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">16. This contract may only be modified, abridged, or waived in writing by the Consignor and not otherwise.</p>';
                            strName += '<p class="tcs" style="font-size:9px;">Consignees Signature: _________________________________ Date:________________________</p>';

                
                            strName += '<table style="width: 100%;top:10pt;" border = "0"><tr>';
                            strName += '<td align="right"><pagenumber/><span style="font-size: 10px;"> of </span><totalpages/></td>';
                            strName += '</tr></table>';

                xml += strName;
                xml += '</body>\n</pdf>';

                var renderer = render.create();
                renderer.templateContent = xml;
                var newfile = renderer.renderAsPdf();
                log.debug('newfile:- ', newfile);
                var dateFormat = GetDateFormat();
                newfile.name = "IT_Print_" + dateFormat + ".pdf";
                log.debug('newfile:- ', newfile);
                context.response.writeFile(newfile)

            }
        }
      
      function toXml(str) {
        return str.replace(/\n/g, "<br />").replace(/&/g, "&amp;");
      }

      function round(value) {
        return value ? parseFloat(value).toFixed(2).toString() : '';
      }

      function numberWithCommas(num) {
        if (!num)
            return '';
        
        var num_parts = num.toFixed(2).toString().split(".");
        num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return num_parts.join(".");
      }
   

    function GetDateFormat() {
        try {
            var dateFormat = "";
            var currentDate = new Date();
            var dd = currentDate.getDate();
                if (dd < 10) {
                        dd = "0" + dd;
                }
                var month = parseInt(currentDate.getMonth()) + 1;
                if (month < 10) {
                        month = "0" + month;
                }
                var yyyy = currentDate.getFullYear();
                var hh = currentDate.getHours();
                if (hh < 10) {
                        hh = "0" + hh;
                }
                var mm = currentDate.getMinutes();
                if (mm < 10) {
                        mm = "0" + mm;
                }
                var ss = currentDate.getSeconds();
                if (ss < 10) {
                        ss = "0" + ss;
                }
                log.debug('dd - month - yyyy - hh - mm - ss ', dd + " - " + month + " - " + yyyy + " - " + hh + " - " + mm + " - " + ss);
                dateFormat = month + "" + dd + "" + yyyy + "_" + hh + mm + ss;
                return dateFormat;
                } catch (ex) {
                    log.error("Error getting dateformat", ex.message);
                    return Date();
                }
            }

    return {
        onRequest: pdfCreation
    }
});
