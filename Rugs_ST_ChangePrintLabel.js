/**
   * @NApiVersion 2.x
   * @NScriptType Suitelet
   */
  define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/redirect', 'N/render', 'N/url', 'N/https', 'N/task', 'N/format', 'N/runtime', 'N/file'],
      function(serverWidget, record, search, redirect, render, url, https, task, format, runtime, file) {
          function onRequest(context) {

              try {
                  var form = serverWidget.createForm({
                      title: 'Print Labels',
                      hideNavBar: false
                  });

                  form.addFieldGroup({
                      id : 'filtersgroup',
                      label : 'Select One Filter'
                  });

                  if (context.request.method == 'GET') {
                      log.debug('**** START ***** ');

                      form.clientScriptModulePath = 'SuiteScripts/Rugs_CS_ChangePrintLabel.js';

                      var scriptId = context.request.parameters.script;
                      var deploymentId = context.request.parameters.deploy;

                      log.debug('scriptId', scriptId);
                      log.debug('deploymentId', deploymentId);

                      var formSerialNumbers = context.request.parameters.formSerialNumbers; //get parameter
                      log.debug('formSerialNumbers', formSerialNumbers);

                      var formSerialNumberFrom = context.request.parameters.formSerialNoFrom; //get parameter
                      log.debug('formSerialNumberFrom', formSerialNumberFrom);

                      var formSerialNumberTo = context.request.parameters.formSerialNoTo; //get parameter
                      log.debug('formSerialNumberTo', formSerialNumberTo);

                      var documentType = context.request.parameters.formDocType; //get parameter
                      log.debug('documentType', documentType);

                      var getFromDoc = context.request.parameters.formDoc; //get parameter
                      log.debug('getFromDoc', getFromDoc);

                      var formLabelType = context.request.parameters.formLabelType; //get parameter
                      log.debug('formLabelType', formLabelType);

                      var formPageSize = context.request.parameters.formPageSize; //get parameter
                      log.debug('formPageSize', formPageSize);


                      form.addButton({
                          id: "custpage_search",
                          label: "Search",
                          functionName: 'onSearch'
                      });

                      form.addField({
                          id: 'custpage_serialnumber',
                          label: '1. Serial Numbers',
                          type: serverWidget.FieldType.MULTISELECT,
                          source: 'inventorynumber',
                          container: 'filtersgroup'
                      });
                     
                      var field = form.addField({
                          id: 'custpage_serialnofrom',
                          label: '2. Serial Numbers From',
                          type: serverWidget.FieldType.SELECT,
                          source: 'inventorynumber',
                          container: 'filtersgroup'
                      });

                      field.updateBreakType({
                        breakType : serverWidget.FieldBreakType.STARTCOL
                      });
                     
                      field = form.addField({
                          id: 'custpage_serialnoto',
                          label: 'To:',
                          type: serverWidget.FieldType.SELECT,
                          source: 'inventorynumber',
                          container: 'filtersgroup'
                      });

                      var fromTrans = form.addField({
                          id: 'custpage_doctype',
                          label: '3. Document Type',
                          type: serverWidget.FieldType.SELECT,
                          container: 'filtersgroup'
                      });

                      fromTrans.updateBreakType({
                        breakType : serverWidget.FieldBreakType.STARTCOL
                      });

                      fromTrans.addSelectOption({
                          value: "",
                          text: ""
                      });
                      fromTrans.addSelectOption({
                          value: "1",
                          text: "Purchase Order"
                      });
                      fromTrans.addSelectOption({
                          value: "2",
                          text: "Inventory Transfer"
                      });

                      form.addField({
                          id: 'custpage_documentno',
                          label: 'Document Number',
                          type: serverWidget.FieldType.SELECT,
                          container: 'filtersgroup'
                      });


                      if (documentType || getFromDoc || formSerialNumbers || formSerialNumberFrom || formSerialNumberTo) {
                          var sublist = form.addSublist({
                              id: 'custpage_table',
                              type: serverWidget.SublistType.LIST,
                              label: 'Print Label'
                          });

                          sublist.addMarkAllButtons();

                          // Add columns to be shown on Page
                          sublist.addField({
                              id: 'checkbox',
                              label: 'CHECKBOX',
                              type: serverWidget.FieldType.CHECKBOX
                          });

                          sublist.addField({
                              id: 'item',
                              label: 'Display Name',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_country_of_origin',
                              label: 'Origin',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_program',
                              label: 'Program',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_content',
                              label: 'Content',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem14',
                              label: 'Size',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_er_label_design',
                              label: 'Design (Label PDF)',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'serialnumber',
                              label: 'Serial/Lot Number',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'tranid',
                              label: 'Document',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'internalid',
                              label: 'Internal Id',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.HIDDEN
                          });

                          sublist.addField({
                              id: 'custitem_collection',
                              label: 'Collection',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_quality',
                              label: 'Quality',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.HIDDEN
                          });

                          sublist.addField({
                              id: 'custitem_program_sizes',
                              label: 'Program Size',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.HIDDEN
                          });

                          sublist.addField({
                              id: 'custitem_qr_code',
                              label: 'QR Code',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.HIDDEN
                          });



                          if (formSerialNumbers || formSerialNumberFrom || formSerialNumberTo || (documentType && getFromDoc)) {

                              var invNumFilter = [];
                              var invNumColumn = [];

                              if (formSerialNumbers) {

                                var arr = formSerialNumbers.split(",");
                                for(var i=0 ; i<arr.length ; i++){
                                   invNumFilter.push(["inventorynumber", "is", arr[i] ] );
                                   invNumFilter.push("OR");
                                }

                                invNumFilter.pop();

                              }
                              else if (formSerialNumberFrom && formSerialNumberTo) {
                                  invNumFilter.push(["formulanumeric: to_number({inventorynumber})", "between", formSerialNumberFrom, formSerialNumberTo ] );
                              }

                              // doc type filter (converted to list of serial numbers)
                              else if (documentType && getFromDoc) {
                                var serialNumbersByDocType = getSerialNumbersByDocType(documentType, getFromDoc);

                                for(var i=0 ; i<serialNumbersByDocType.length ; i++){
                                   invNumFilter.push(["inventorynumber", "is", serialNumbersByDocType[i] ] );
                                   invNumFilter.push("OR");
                                }

                                invNumFilter.pop();
                              }

                              log.debug('invNumFilter', invNumFilter);

                              invNumColumn.push(search.createColumn({
                                  name: "inventorynumber",
                                  sort: search.Sort.ASC
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "item",
                                  label: "Item"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "parent",
                                  join: "item",
                                  label: "Design (Label PDF)"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitem_country_of_origin",
                                  join: "item",
                                  label: "ER - Origin"
                              }));
                              invNumColumn.push(search.createColumn({
                                  name: "custitem_program",
                                  join: "item",
                                  label: "ER - Program"
                              }));
                              invNumColumn.push(search.createColumn({
                                  name: "custitem_content",
                                  join: "item",
                                  label: "ER - Content"
                              }));
                              invNumColumn.push(search.createColumn({
                                  name: "custitem_collection",
                                  join: "item",
                                  xlabel: "ER - Collection"
                              }));
                              invNumColumn.push(search.createColumn({
                                  name: "custitem_quality",
                                  join: "item",
                                  label: "ER - Quality"
                              }));
                              invNumColumn.push(search.createColumn({
                                  name: "custitem_category_size",
                                  join: "item",
                                  label: "ER - Category Size"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitemnumber_aecc_width_feet"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitemnumber_aecc_width_inches"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitemnumber_aecc_length_feet"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitemnumber_aecc_length_inches"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitem_program_sizes",
                                  join: "item",
                                  label: "ER - Program Size"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitem_qr_code",
                                  join: "item",
                                  label: "QR Code"
                              }));

                              var invNumSearch = search.create({
                                  type: "inventorynumber",
                                  filters: invNumFilter,
                                  columns: invNumColumn
                              });

                              log.debug("invNumSearch", invNumSearch);

                              processSearchResults(invNumSearch, sublist);
                          }

                          // Build the filters and button in the returned form
                          form.addSubmitButton({
                              label: 'Export PDF'
                          });//.isDisabled = true;

                          form.addFieldGroup({
                              id : 'formatgroup',
                              label : 'Print Options'
                          });

                          var labelType = form.addField({
                              id: 'custpage_labeltype',
                              label: 'Label Type',
                              type: serverWidget.FieldType.SELECT,
                              container: 'formatgroup'
                          });

                          labelType.addSelectOption({
                              value: "ER",
                              text: "Exquisite Rugs",
                              isSelected : formLabelType == "ER"
                          });
                          labelType.addSelectOption({
                              value: "SL",
                              text: "Studio Library",
                              isSelected : formLabelType == "SL"
                          });

                          var pageSize = form.addField({
                              id: 'custpage_pagesize',
                              label: 'Page Size',
                              type: serverWidget.FieldType.SELECT,
                              container: 'formatgroup'
                          });

                          pageSize.addSelectOption({
                              value: "1",
                              text: "Letter",
                              isSelected : formPageSize == "1"
                          });
                          pageSize.addSelectOption({
                              value: "2",
                              text: "UPS Sticker",
                              isSelected : formPageSize == "2"
                          });
                      }

                      context.response.writePage(form);
                      log.debug('**** END ***** ');
                  } else {
                      returnLabel(context);
                  }
              } catch (ex) {
                  log.error("Error Printing Label", ex);
              }
          }

          function getSerialNumbersByDocType(documentType, getFromDoc) {
              var serialNumbersByDocType = [];
              var transFilter = [];
              var transColumn = [];

              if (documentType == 1) {
                  transFilter.push(search.createFilter({
                      name: 'type',
                      operator: search.Operator.ANYOF,
                      values: "PurchOrd"
                  }));
              }
              else if (documentType == 2) {
                  transFilter.push(search.createFilter({
                      name: 'type',
                      operator: search.Operator.ANYOF,
                      values: "InvTrnfr"
                  }));
              }

              if (getFromDoc) {
                  transFilter.push(search.createFilter({
                      name: 'formulatext',
                      operator: search.Operator.IS,
                      values: getFromDoc,
                      formula: " TO_CHAR({number})"
                  }));
              }

              transFilter.push(search.createFilter({
                  name: 'mainline',
                  operator: search.Operator.IS,
                  values: "F"
              }));
              transFilter.push(search.createFilter({
                  name: 'shipping',
                  operator: search.Operator.IS,
                  values: "F"
              }));
              transFilter.push(search.createFilter({
                  name: 'taxline',
                  operator: search.Operator.IS,
                  values: "F"
              }));

              transFilter.push(search.createFilter({
                  name: 'formulanumeric',
                  operator: search.Operator.NOTEQUALTO,
                  values: "0",
                  formula: "TO_NUMBER({serialnumbers})"
              }));

              transColumn.push(search.createColumn({
                  name: "inventorynumber",
                  join: "inventoryDetail",
                  summary: search.Summary.GROUP,
                  sort: search.Sort.ASC
              }));

              var transSearch = search.create({
                  type: "transaction",
                  filters: transFilter,
                  columns: transColumn
              });

              var resultIndex = 0;
              var resultStep = 1000;
              var transSearchResult;
              do {

                  transSearchResult = transSearch.run().getRange({
                      start: resultIndex,
                      end: resultIndex + resultStep
                  });

                  log.debug('transSearchResult Length', transSearchResult.length);

                  for (var i=0; i < transSearchResult.length; i++) {

                      var transSrNum = transSearchResult[i].getText({
                          name: "inventorynumber",
                          join: "inventoryDetail",
                          summary: search.Summary.GROUP
                      });

                      serialNumbersByDocType.push(transSrNum);
                  }

                  resultIndex = resultIndex + resultStep;
              } while (transSearchResult.length === resultStep);


              // if none were found we add a fake id to make sure search will not find anything
              if (serialNumbersByDocType.length == 0)
                  serialNumbersByDocType.push("-1");

              log.debug('getSerialNumbersByDocType', serialNumbersByDocType);
              return serialNumbersByDocType;
          }

          function processSearchResults( invNumSearch, sublist ) {
              var resultIndex = 0;
              var resultStep = 1000;
              var index = 0;
              var invNumSearchResult;
              var invNumSearchColObj = invNumSearch.run();
              do {


                  invNumSearchResult = invNumSearch.run().getRange({
                      start: resultIndex,
                      end: resultIndex + resultStep
                  });

                  log.debug('processSearchResults Rows', resultIndex + invNumSearchResult.length);

                    for (var i=0;  i < invNumSearchResult.length; i++) {

                        var serialNum = invNumSearchResult[i].getValue(invNumSearchColObj.columns[0]);
                        var itemName = invNumSearchResult[i].getText(invNumSearchColObj.columns[1]);
                       
                        var designLabel = invNumSearchResult[i].getText(invNumSearchColObj.columns[2]);

                        var exqRugsOrigin = invNumSearchResult[i].getText(invNumSearchColObj.columns[3]);
                        var exqRugsPrgm = invNumSearchResult[i].getText(invNumSearchColObj.columns[4]);

                        if ( exqRugsPrgm == 'OAK NO IMAGE'  || exqRugsPrgm == 'OAK WITH IMAGE' || !designLabel ) 
                            designLabel = 'ASSRT';


                        var exqRugsContent = invNumSearchResult[i].getText(invNumSearchColObj.columns[5]);
                        var collection = invNumSearchResult[i].getText(invNumSearchColObj.columns[6]);
                        var quality = invNumSearchResult[i].getText(invNumSearchColObj.columns[7]);
                        var categorySize = invNumSearchResult[i].getText(invNumSearchColObj.columns[8]);
                       
                        var widthFeet = invNumSearchResult[i].getValue(invNumSearchColObj.columns[9]);
                        var widthInches = invNumSearchResult[i].getValue(invNumSearchColObj.columns[10]);
                        var lengthFeet = invNumSearchResult[i].getValue(invNumSearchColObj.columns[11]);
                        var lengthInches = invNumSearchResult[i].getValue(invNumSearchColObj.columns[12]);
                        var programSize = invNumSearchResult[i].getText(invNumSearchColObj.columns[13]);
                        var qrCode = invNumSearchResult[i].getValue(invNumSearchColObj.columns[14]);

                        // convert the dimensions to size label
                        var size = '';

                        // in some cases we override from rug name (<name>-<size>)
                        if (
                              categorySize != 'SAMPLE' && categorySize != 'ORDER SIZE' && categorySize != 'SPECIAL ORDER SIZE'
                              &&  exqRugsPrgm != 'OAK NO IMAGE' && exqRugsPrgm != 'OAK WITH IMAGE' && exqRugsPrgm != 'CUSTOM'
                           ) {
                            var itemSplit = itemName.split("-");
                            size = itemSplit[1];

                        }
                        // otherwise we use the dimensions
                        else {

                          size = (hasValue(widthFeet) ? widthFeet + "'" : "") + (hasValue(widthInches) ? widthInches + '"' : "");
                          if (size.length > 0) {
                             size = size + " X " +
                             (hasValue(lengthFeet) ? lengthFeet + "'" : "") +
                             (hasValue(lengthInches) ? lengthInches + '"' : "");
                          }
                        }


                        sublist.setSublistValue({
                            id: 'item',
                            line: index,
                            value: itemName
                        });

                        sublist.setSublistValue({
                            id: 'custitem_country_of_origin',
                            line: index,
                            value: exqRugsOrigin
                        });
                        sublist.setSublistValue({
                            id: 'custitem_program',
                            line: index,
                            value: exqRugsPrgm
                        });
                        sublist.setSublistValue({
                            id: 'custitem_content',
                            line: index,
                            value: exqRugsContent
                        });

                        if (size) {
                            sublist.setSublistValue({
                                id: 'custitem14',
                                line: index,
                                value: size
                            });
                        }
                        sublist.setSublistValue({
                            id: 'serialnumber',
                            line: index,
                            value: serialNum
                        });

                        sublist.setSublistValue({
                            id: 'custitem_er_label_design',
                            line: index,
                            value: designLabel
                        });

                        sublist.setSublistValue({
                            id: 'custitem_collection',
                            line: index,
                            value: collection
                        });

                        sublist.setSublistValue({
                            id: 'custitem_quality',
                            line: index,
                            value: quality
                        });

                        if (programSize) {
                          sublist.setSublistValue({
                              id: 'custitem_program_sizes',
                              line: index,
                              value: programSize
                          });
                        }

                        sublist.setSublistValue({
                              id: 'custitem_qr_code',
                              line: index,
                              value: qrCode.toString()
                        });


                        index++;
                  }
                  resultIndex = resultIndex + resultStep;
              } while (invNumSearchResult.length === resultStep);
          }

          function returnLabel(context) {
            var request = context.request;

            // set label base on type
            var labelType = request.parameters["custpage_labeltype"];

            var xml = '<?xml version="1.0" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n';
            xml += '<pdfset>';
            xml += '<pdf>';
            xml += '<head>';
            xml += '<meta name="title" value="PRINT LABEL"/>';
            xml += '<style type="text/css">body {font-family: Arial, sans-serif; font-weight: bold;} table {font-size: 10pt;table-layout: fixed;} td { padding:4px; margin:0px; }</style>';
            xml += '</head>';

            var pageSize = getSelectedOption(request, "custpage_pagesize", 1);
            if (pageSize == 1)
              xml += '<body padding="0.25in 0.4in 0.25in 0.4in" size="Letter">';
            else
              xml += '<body padding="0.5in 0.75in 0.5in 0.75in" height="101.6mm" width="152.4mm">';


            // first check how many selected lines exist
            var lineCount = request.getLineCount('custpage_table');
            var linesToProcess = 0;
            var linesProcessed = 0;
            for (var invTable = 0; invTable < lineCount; invTable++) {
              var check = request.getSublistValue('custpage_table', 'checkbox', invTable);
                if (check == 'T')
                  linesToProcess++;
            }
           
            // now iterate no the lines and add the relevant selected ones to XML
            for (var invTable = 0; invTable < lineCount; invTable++) {

                // ignore rows which were not selected
                var check = request.getSublistValue('custpage_table', 'checkbox', invTable);
                if (check != 'T')
                  continue;

                var pdfSerialNo = request.getSublistValue('custpage_table', 'serialnumber', invTable);
                var pdfDesignLabel = request.getSublistValue('custpage_table', 'custitem_er_label_design', invTable);
                var pdfSize = request.getSublistValue('custpage_table', 'custitem14', invTable);
                var pdfExqRugsOrigin = request.getSublistValue('custpage_table', 'custitem_country_of_origin', invTable);
                var pdfCollection = request.getSublistValue('custpage_table', 'custitem_collection', invTable);
                var pdfQuality = request.getSublistValue('custpage_table', 'custitem_quality', invTable);
                var pdfContent = request.getSublistValue('custpage_table', 'custitem_content', invTable);
                var programSize = request.getSublistValue('custpage_table', 'custitem_program_sizes', invTable);
                var qrCode = request.getSublistValue('custpage_table', 'custitem_qr_code', invTable) == 'true';


                if (!programSize || programSize === "Other")
                  programSize = '';
               
                if (labelType == "ER")
                  xml += '<table border="1" cellpadding="8px" style="width: 400px;padding:15px;">';
                else {
                  // extrenal table to create 2 columns
                  if (linesProcessed == 0)
                    xml += '<table>';

                  // wrap every 2 in a row
                  if (linesProcessed % 2 == 0)
                    xml += '<tr style="padding-top:10px">';

                  xml += '<td><table border="1" cellpadding="4px" style="width: 340px">';
                }

                xml += '<tr>';
               
                if (labelType == "ER")
                  xml += '<td colspan="2" style="width: 150px;">';
                else
                  xml += '<td colspan="2" style="width: 120px;">';

                if (labelType == "ER")
                  xml += '<p><img src="https://4951235.app.netsuite.com/core/media/media.nl?id=2106&amp;c=4951235&amp;h=ece9007b3f17bf2cc27c" style="width: 140px; height: 20px;" /></p><p style="font-size: 6pt;">WWW.EXQUISITERUGS.COM</p>';
                else
                  xml += '<img src="https://4951235.app.netsuite.com/core/media/media.nl?id=10998&amp;c=4951235&amp;h=qD1ob0v4w04aBj-z-4MzzsdBLhLSfUneQKTXYyKSO0G5tp2-" style="width: 120px; height: 20px;" />';

                xml += '</td>';

                // barcode takes 2 rows
                if (labelType == "ER")
                  xml += '<td colspan="3" rowspan="2" style="width: 225px; font-size: 42pt;text-align: center;">';
                else
                  xml += '<td colspan="3" rowspan="2" style="width: 180px;font-size: 26pt;text-align: center;">';

                xml += '<p style="text-align: center;">' + pdfSerialNo + '<barcode bar-width="2" codetype="code128" showtext="false" value="' + pdfSerialNo + '"></barcode></p>';
         
                xml += '</td>';
                xml += '</tr>';

                if (labelType == "ER") {

                  xml += '<tr>';
                  xml += '<td colspan="2">';

                  if (pdfDesignLabel == 'ASSRT')
                    xml += '<p>DESIGN: <span style="font-size: 18pt;line-height:18px;"><strong>'  + pdfDesignLabel + '</strong></span></p>';
                  else
                    xml += '<p>DESIGN: <span style="font-size: 24pt;line-height:24px;"><strong>'  + pdfDesignLabel + '</strong></span></p>';

                 
                  xml += '</td>';
                  xml += '</tr>';


                  xml += getXMLRow('SIZE', pdfSize, 5,'font-size:16pt;');

                  xml += (pdfCollection.length < 12) ?
                    getXMLRow('COLLECTION', pdfCollection, 5, 'font-size:30pt;line-height:18px;') :
                    getXMLRow('COLLECTION', pdfCollection, 5, 'font-size:18pt;line-height:18px;');

                  row = getXMLCell('CONTENT', pdfContent, 4, 'font-size:10pt;line-height:10px;');
                  row += getQRCode( pdfDesignLabel, 40, qrCode );
                  xml += toXMLRow(row);
                  xml += getXMLRow('ORIGIN', pdfExqRugsOrigin, 4, 'font-size:10pt;line-height:10px;');
                  xml += '</table>';

                  if (pageSize == 1)
                    xml += '<p style="width:100%;border-top:1px dotted #999;margin:15px 0"></p>';
                }
                else {
                    xml += getXMLRow('DESIGN', pdfDesignLabel, 3,'font-size:18pt');

                    xml += getXMLRow('COLLECTION', pdfCollection,5);

                    row = getXMLCell('CONTENT', pdfContent,4);
                    row += getQRCode( pdfDesignLabel, 40, qrCode );
                    xml += toXMLRow(row);
                    xml += getXMLRow('ORIGIN', pdfExqRugsOrigin,4);
                    
                    xml += getXMLRow('SIZES', programSize, 5,'font-size:10pt');
   

                    xml += '</table></td>';


                    // extrnal table tags
                    // wrap every 2 in a row
                    if (linesProcessed % 2 == 1 || linesProcessed == linesToProcess - 1)
                      xml += '</tr>';

                    // last element - close the table
                    if (linesProcessed == linesToProcess - 1)
                      xml += '</table>';
                }

                linesProcessed++;
            }

            xml += '</body></pdf>';
            xml += '</pdfset>';

            // rendered the XML as PDF
            var renderer = render.create();
            renderer.templateContent = xml;
            var newfile = renderer.renderAsPdf();
            var dateFormat = GetDateFormat();
            newfile.name = labelType + "_Label_" + dateFormat + ".pdf";
            context.response.writeFile(newfile);
          }


          function getSelectedOption(request, optionName, defaultValue) {
            var value = defaultValue;
            try {
              value = parseInt(request.parameters[optionName]);
            } catch (e) {}

            return value;
          }

          function getQRCode(pdfDesignLabel, dim, qrCode) {
            if (qrCode)
              return '<td colspan="1" rowspan="2"> <p>' + '<img alt="" src="http://4951235-sb1.shop.netsuite.com/c.4951235_SB1/QRCODE/' + pdfDesignLabel + '.png" style="width: '+ dim +'px; height: '+ dim +'px;" /></p></td>';
            else
              return '<td colspan="1" rowspan="2"> </td>';
          }

          function getXMLRow(label, value, colspan, style) {
            return toXMLRow(getXMLCell(label, value, colspan, style));
          }

          function getXMLCell(label, value, colspan, style) {
            return '<td colspan="'+colspan+'">' + label + ': <span style="'+(style ? style : '')+'">' + (value ? value : '') + '</span></td>';
          }

          function toXMLRow(value) {
            return '<tr>' + value + "</tr>";
          }


          function hasValue(value) {
            return value && value != '0';
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
              onRequest: onRequest
          };
      });
