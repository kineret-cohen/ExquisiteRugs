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
                          type: serverWidget.FieldType.MULTISELEC​T,
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
                              label: 'Exquisite Rugs - Origin',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_program',
                              label: 'Exquisite Rugs - Program',
                              type: serverWidget.FieldType.TEXT
                          }).updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.INLINE
                          });

                          sublist.addField({
                              id: 'custitem_content',
                              label: 'Exquisite Rugs - Content',
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
                              displayType: serverWidget.FieldDisplayType.HIDDEN
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
                                  name: "formulatext",
                                  label: "Size Formula (Text)",
                                  formula: "case when decode({custitemnumber_aecc_width_inches},null,'Y','N')='N'  and decode({custitemnumber_aecc_length_feet},null,'Y','N')='N'  then CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT({custitemnumber_aecc_width_feet},''''), {custitemnumber_aecc_width_inches}),'\" X '), {custitemnumber_aecc_length_feet}),''''), {custitemnumber_aecc_length_inches}),'\"')  else case when decode({custitemnumber_aecc_width_feet},null,'Y','N')='N'  and decode({custitemnumber_aecc_length_feet},null,'Y','N')='N'  THEN CONCAT(CONCAT(CONCAT({custitemnumber_aecc_width_feet},''' X '), {custitemnumber_aecc_length_feet}),'''') else '' End End"
                              }));

                              invNumColumn.push(search.createColumn({
                                  name: "custitem_program_sizes",
                                  join: "item",
                                  label: "ER - Program Size"
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
                        var exqRugsContent = invNumSearchResult[i].getText(invNumSearchColObj.columns[5]);
                        var collection = invNumSearchResult[i].getText(invNumSearchColObj.columns[6]);
                        var quality = invNumSearchResult[i].getText(invNumSearchColObj.columns[7]);
                        var categorySize = invNumSearchResult[i].getText(invNumSearchColObj.columns[8]);
                        var size = invNumSearchResult[i].getValue(invNumSearchColObj.columns[9]);
                        var programSize = invNumSearchResult[i].getText(invNumSearchColObj.columns[10]);


                        if (
                              ((categorySize != 'SAMPLE') && (categorySize != 'ORDER SIZE') && (categorySize != 'SPECIAL ORDER SIZE')) 
                              && 
                              (exqRugsPrgm != 'OAK NO IMAGE' && exqRugsPrgm != 'OAK WITH IMAGE' && exqRugsPrgm != 'CUSTOM')
                           ) 
                        {
                            var itemSplit = itemName.split("-");
                            size = itemSplit[1];

                        }

                        if (!designLabel) {
                            designLabel = 'ASSRT';
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
            xml += '<style type="text/css">body {font-family: Arial, sans-serif; font-weight: bold;} table {font-size: 10pt;} td p { align:left }</style>';
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

                  xml += '<td><table border="1" cellpadding="6px" style="width: 340px">';
                }

                xml += '<tr>';
                
                if (labelType == "ER")
                  xml += '<td style="width: 160px;">';
                else
                  xml += '<td style="width: 120px;padding:0px; margin:0px">';

                if (labelType == "ER")
                  xml += '<p><img src="https://4951235.app.netsuite.com/core/media/media.nl?id=2106&amp;c=4951235&amp;h=ece9007b3f17bf2cc27c" style="width: 140px; height: 20px;" /></p><p style="font-size: 6pt;">WWW.EXQUISITERUGS.COM</p>';
                else
                  xml += '<img src="https://4951235.app.netsuite.com/core/media/media.nl?id=10998&amp;c=4951235&amp;h=qD1ob0v4w04aBj-z-4MzzsdBLhLSfUneQKTXYyKSO0G5tp2-" style="width: 120px; height: 20px;" />';

                xml += '</td>';

                if (labelType == "ER")
                  xml += '<td rowspan="2" style="width: 200px; margin-top: 0px; margin-bottom: 0px; font-size: 48pt;text-align: center;">';
                else
                  xml += '<td rowspan="2" style="width: 200px; font-size: 26pt;text-align: center;">';

                xml += '<p style="text-align: center;">' + pdfSerialNo + '<barcode bar-width="2" codetype="code128" showtext="false" value="' + pdfSerialNo + '"></barcode></p>';
                xml += '</td>';
                xml += '</tr>';

                if (labelType == "ER") {

                  xml += '<tr>';
                  xml += '<td>';
                  xml += '<p>DESIGN: <span style="font-size: 26pt"><strong>'  + pdfDesignLabel + '</strong></span></p>';
                  xml += '</td>';
                  xml += '</tr>';

                  xml += getXMLRow('SIZE', pdfSize, 'font-size:15pt');
                  xml += getXMLRow('COLLECTION', pdfCollection, 'font-size:18pt');
                  xml += getXMLRow('ORIGIN', pdfExqRugsOrigin, 'font-size:15pt');
                  xml += '</table>';

                  if (pageSize == 1)
                    xml += '<p style="width:100%;border-top:1px dotted #999;margin:15px 0"></p>';
                }
                else {
                    xml += getXMLRow('DESIGN', pdfDesignLabel, 'font-size:18pt');
                    xml += getXMLRow('COLLECTION', pdfCollection);
                    xml += getXMLRow('CONTENT', pdfContent);
                    xml += getXMLRow('ORIGIN', pdfExqRugsOrigin);
                    xml += getXMLRow('SIZES', programSize, 'font-size:10pt');
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

          function getXMLRow(label, value, style) {
               return '<tr><td colspan="2"> <p>' + label + ': <span style="'+(style ? style : '')+'">' + (value ? value : '') + '</span></p></td></tr>';
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
