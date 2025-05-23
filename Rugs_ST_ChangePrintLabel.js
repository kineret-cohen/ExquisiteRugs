/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/redirect', 'N/render', 'N/url', 'N/https', 'N/task', 'N/format', 'N/runtime', 'N/file', 'N/compress'],
    function(serverWidget, record, search, redirect, render, url, https, task, format, runtime, file, compress) {

        var PAGE_SIZE_LETTER = 1;
        var PAGE_SIZE_UPS = 2;
        var PAGE_SIZE_4X3 = 3;

        var SAMLPE_CATEGORY_SIZE = '1\'X1\'6"';

        var LOGOS_FOLDER = 'Web Site Hosting Files/Live Hosting Files/Logo/';

        function onRequest(context) {

            try {
                var form = serverWidget.createForm({
                    title: 'Print Labels',
                    hideNavBar: false
                });


                form.addFieldGroup({
                    id: 'filtersgroup',
                    label: 'Select One Filter'
                });

                if (context.request.method == 'GET') {

                    form.clientScriptModulePath = 'SuiteScripts/Rugs_CS_ChangePrintLabel.js';

                    var scriptId = context.request.parameters.script;
                    var deploymentId = context.request.parameters.deploy;
                    var searchAction = context.request.parameters.searchAction;

                    log.debug('scriptId', scriptId);
                    log.debug('deploymentId', deploymentId);
                    log.debug('searchAction', searchAction);


                    buildSearchOptions(form);

                    // chcek if this is a search request
                    if (searchAction) {

                        var sublist = buildResultsTable(form);

                        // check what query we should build - start with items
                        var searchQuery = buildItemsQuery(context);

                        // if not, try serial number/transaction based
                        if (!searchQuery)
                            searchQuery = buildSerialNumbersQuery(context);

                        if (searchQuery) {
                            processSearchResults(searchQuery, sublist);
                            buildPrintOptions(context, form);
                        }
                    }

                    context.response.writePage(form);
                }
                // POST is always to print label
                else {
                    returnLabel(context);
                }
            } catch (ex) {
                log.error("Error Printing Label", ex);
            }
        }

        function buildSearchOptions(form) {
            form.addButton({
                id: "custpage_search",
                label: "Search",
                functionName: 'onSearch'
            });

            form.addField({
                id: 'custpage_serialnumbers',
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
                breakType: serverWidget.FieldBreakType.STARTCOL
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
                breakType: serverWidget.FieldBreakType.STARTCOL
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


            field = form.addField({
                id: 'custpage_items',
                label: '4. Item ',
                type: serverWidget.FieldType.MULTISELECT,
                source: 'item',
                container: 'filtersgroup'
            });

            field.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTCOL
            });

        }

        function buildPrintOptions(context, form) {

            // Build the filters and button in the returned form
            form.addSubmitButton({
                label: 'Export PDF'
            });

            form.addFieldGroup({
                id: 'formatgroup',
                label: 'Print Options'
            });

            var formLabelType = context.request.parameters.formLabelType; //get parameter
            var labelType = form.addField({
                id: 'custpage_labeltype',
                label: 'Label Type',
                type: serverWidget.FieldType.SELECT,
                container: 'formatgroup'
            });

            var formPageSize = context.request.parameters.formPageSize; //get parameter
            var pageSize = form.addField({
                id: 'custpage_pagesize',
                label: 'Page Size',
                type: serverWidget.FieldType.SELECT,
                container: 'formatgroup'
            });

            var formLogo = context.request.parameters.formLogo; //get parameter
            var logo = form.addField({
                id: 'custpage_logo',
                label: 'Logo',
                type: serverWidget.FieldType.SELECT,
                container: 'formatgroup'
            });

            // Inject the custom CSS to hide the select field by default
            /* Hide the logo field on page load */
            form.addField({
                id: 'custpage_inline_css',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Inline CSS'
            }).defaultValue = '<style id="custpage_inline_css_id" type="text/css"> div[data-field-name=custpage_logo] { display: none; }</style>';

            // label type options
            labelType.addSelectOption({
                value: "ER",
                text: "Exquisite Rugs",
                isSelected: formLabelType == "ER"
            });
            labelType.addSelectOption({
                value: "SL",
                text: "Studio Library",
                isSelected: formLabelType == "SL"
            });
            labelType.addSelectOption({
                value: "UPC",
                text: "UPC Code",
                isSelected: formLabelType == "UPC"
            });
            labelType.addSelectOption({
                value: "MET",
                text: "MET",
                isSelected: formLabelType == "MET"
            });
            labelType.addSelectOption({
                value: "PL",
                text: "Private Label",
                isSelected: formLabelType == "PL"
            });
            labelType.addSelectOption({
                value: "PL2",
                text: "Private Label (Logo)",
                isSelected: formLabelType == "PL2"
            });

            // page size options
            pageSize.addSelectOption({
                value: "1",
                text: "Letter",
                isSelected: formPageSize == "1"
            });
            pageSize.addSelectOption({
                value: "2",
                text: "UPS Sticker",
                isSelected: formPageSize == "2"
            });
            pageSize.addSelectOption({
                value: "3",
                text: "4x3",
                isSelected: formPageSize == "3"
            });


            // logo options
            var folderID = getFolderIdFromPath(LOGOS_FOLDER);
            logoOptions = getFilesInFolder(folderID);
            logoOptions.forEach(function(item) {
                addLogoOption(logo, item, formLogo);
            });

        }

        // adding both the resulats table UI elements and the actual data to the form
        function buildResultsTable(form) {
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
                id: 'custitem_size',
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
            sublist.addField({
                id: 'custitem_new_upc_code',
                label: 'UPC Code',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            sublist.addField({
                id: 'custitem_met',
                label: 'MET',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });

            return sublist;
        }

        function buildSerialNumbersQuery(context) {
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

            // check the search query parameters are valid
            if (!(formSerialNumbers || formSerialNumberFrom || formSerialNumberTo || (documentType && getFromDoc)))
                return null;


            var invNumFilter = [];
            var invNumColumn = [];

            if (formSerialNumbers) {

                var arr = formSerialNumbers.split(",");
                for (var i = 0; i < arr.length; i++) {
                    invNumFilter.push(["inventorynumber", "is", arr[i]]);
                    invNumFilter.push("OR");
                }

                invNumFilter.pop();

            } else if (formSerialNumberFrom && formSerialNumberTo) {
                invNumFilter.push(["formulanumeric: to_number({inventorynumber})", "between", formSerialNumberFrom, formSerialNumberTo]);
            }

            // doc type filter (converted to list of serial numbers)
            else if (documentType && getFromDoc) {
                var serialNumbersByDocType = getSerialNumbersByDocType(documentType, getFromDoc);

                for (var i = 0; i < serialNumbersByDocType.length; i++) {
                    invNumFilter.push(["inventorynumber", "is", serialNumbersByDocType[i]]);
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

            invNumColumn.push(search.createColumn({
                name: "custitem_new_upc_code",
                join: "item",
                label: "UPC Code"
            }));

            invNumColumn.push(search.createColumn({
                name: "custitem_met",
                join: "item",
                label: "ER - Met Desc"
            }));

            var searchQuery = search.create({
                type: "inventorynumber",
                filters: invNumFilter,
                columns: invNumColumn
            });

            log.debug("searchQuery", searchQuery);
            return searchQuery;
        }

        function buildItemsQuery(context) {
            var formItems = context.request.parameters.formItems; //get parameter
            log.debug('formItems', formItems);

            var searchFilters = [];
            var searchColums = [];

            if (!formItems)
                return null;

            var arr = formItems.split(",");
            for (var i = 0; i < arr.length; i++) {
                searchFilters.push(["internalid", "is", arr[i]]);
                searchFilters.push("OR");
            }

            searchFilters.pop();

            searchColums.push(search.createColumn({
                label: "Serial Number",
                name: 'formulatext',
                formula: "0"
            }));

            searchColums.push(search.createColumn({
                name: "name",
                label: "Name",
                sort: search.Sort.ASC
            }));

            searchColums.push(search.createColumn({
                name: "parent",
                label: "Design (Label PDF)"
            }));

            searchColums.push(search.createColumn({
                label: "ER - Origin",
                name: 'custitem_country_of_origin',
            }));

            searchColums.push(search.createColumn({
                label: "ER - Program",
                name: 'custitem_program',
            }));

            searchColums.push(search.createColumn({
                name: "custitem_content",
                label: "ER - Content"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_collection",
                xlabel: "ER - Collection"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_quality",
                label: "ER - Quality"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_category_size",
                label: "ER - Category Size"
            }));

            searchColums.push(search.createColumn({
                label: "custitemnumber_aecc_width_feet",
                name: 'formulatext',
                formula: "0"
            }));

            searchColums.push(search.createColumn({
                label: "custitemnumber_aecc_width_inches",
                name: 'formulatext',
                formula: "0"
            }));

            searchColums.push(search.createColumn({
                label: "custitemnumber_aecc_length_feet",
                name: 'formulatext',
                formula: "0"
            }));

            searchColums.push(search.createColumn({
                label: "custitemnumber_aecc_length_inches",
                name: 'formulatext',
                formula: "0"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_program_sizes",
                label: "ER - Program Size"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_qr_code",
                label: "QR Code"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_new_upc_code",
                label: "UPC Code"
            }));

            searchColums.push(search.createColumn({
                name: "custitem_met",
                label: "ER - Met Desc"
            }));

            var searchQuery = search.create({
                type: "inventoryitem",
                filters: searchFilters,
                columns: searchColums
            });

            log.debug("searchQuery", searchQuery);
            return searchQuery;
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
            } else if (documentType == 2) {
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

                for (var i = 0; i < transSearchResult.length; i++) {

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

        function getValue(result, column) {
            var value = result.getValue(column);
            if (!value)
                value = result.getText(column);

            return value;
        }

        function getText(result, column) {
            var value = result.getText(column);
            if (!value)
                value = result.getValue(column);

            return value;
        }

        function addResultCell(sublist, id, index, value) {
            if (value) {
                sublist.setSublistValue({
                    id: id,
                    line: index,
                    value: value
                });
            }
        }


        function processSearchResults(invNumSearch, sublist) {
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

                for (var i = 0; i < invNumSearchResult.length; i++) {

                    log.debug('Row', invNumSearchResult[i]);

                    var serialNum = getValue(invNumSearchResult[i], invNumSearchColObj.columns[0]);
                    var displayName = getText(invNumSearchResult[i], invNumSearchColObj.columns[1]);
                    var designLabel = invNumSearchResult[i].getText(invNumSearchColObj.columns[2]);
                    var exqRugsOrigin = invNumSearchResult[i].getText(invNumSearchColObj.columns[3]);
                    var exqRugsPrgm = invNumSearchResult[i].getText(invNumSearchColObj.columns[4]);
                    if (exqRugsPrgm == 'OAK NO IMAGE' || exqRugsPrgm == 'OAK WITH IMAGE' || !designLabel)
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
                    var upcCode = invNumSearchResult[i].getValue(invNumSearchColObj.columns[15]);
                    var metDesc = invNumSearchResult[i].getValue(invNumSearchColObj.columns[16]);

                    // convert the dimensions to size label
                    var size = '';

                    // for samples (specific size catepry: 1'X1'6"), 
                    // the size and design extacted from the parent (design label)
                    if (categorySize == SAMLPE_CATEGORY_SIZE) {
                        size = SAMLPE_CATEGORY_SIZE;

                        var displayNameArr = displayName.split(/[:]+/);
                        if (displayNameArr.length > 1)
                            designLabel = displayNameArr[1].trim();
                    }
                    // in some cases we set the size from rug name (<name>-<size>)
                    else if (categorySize != 'ORDER SIZE' && categorySize != 'SPECIAL ORDER SIZE' &&
                        exqRugsPrgm != 'OAK NO IMAGE' && exqRugsPrgm != 'OAK WITH IMAGE' && exqRugsPrgm != 'CUSTOM'
                    ) {
                        var itemSplit = displayName.split("-");
                        if (itemSplit.length > 1)
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

                    addResultCell(sublist, 'item', index, displayName);
                    addResultCell(sublist, 'custitem_country_of_origin', index, exqRugsOrigin);
                    addResultCell(sublist, 'custitem_program', index, exqRugsPrgm);
                    addResultCell(sublist, 'custitem_content', index, exqRugsContent);
                    addResultCell(sublist, 'custitem_size', index, size);
                    addResultCell(sublist, 'serialnumber', index, serialNum);
                    addResultCell(sublist, 'custitem_er_label_design', index, designLabel);
                    addResultCell(sublist, 'custitem_collection', index, collection);
                    addResultCell(sublist, 'custitem_quality', index, quality);
                    addResultCell(sublist, 'custitem_program_sizes', index, programSize);
                    addResultCell(sublist, 'custitem_qr_code', index, qrCode ? qrCode.toString() : qrCode);
                    addResultCell(sublist, 'custitem_new_upc_code', index, upcCode ? upcCode.toString() : upcCode);
                    addResultCell(sublist, 'custitem_met', index, metDesc);


                    index++;
                }
                resultIndex = resultIndex + resultStep;
            } while (invNumSearchResult.length === resultStep);
        }

        function returnLabel(context) {
            log.debug('returnLabel', "Starting...");

            var request = context.request;

            // get PDF format options
            var labelType = request.parameters["custpage_labeltype"];
            var pageSize = getSelectedOption(request, "custpage_pagesize", 1);
            var logo = request.parameters["custpage_logo"];

            // first extract only lines that user selected
            var lineCount = request.getLineCount('custpage_table');
            var items = [];
            for (var i = 0; i < lineCount; i++) {

                var check = request.getSublistValue('custpage_table', 'checkbox', i);
                if (check != 'T')
                    continue;

                var item = {
                    // apply to all items
                    labelType: labelType,
                    logo: logo,

                    // item specific
                    pdfDesignLabel: request.getSublistValue('custpage_table', 'custitem_er_label_design', i),
                    pdfSize: request.getSublistValue('custpage_table', 'custitem_size', i),
                    pdfExqRugsOrigin: request.getSublistValue('custpage_table', 'custitem_country_of_origin', i),
                    pdfCollection: request.getSublistValue('custpage_table', 'custitem_collection', i),
                    pdfQuality: request.getSublistValue('custpage_table', 'custitem_quality', i),
                    pdfContent: request.getSublistValue('custpage_table', 'custitem_content', i),
                    pdfMet: request.getSublistValue('custpage_table', 'custitem_met', i),
                    programSize: request.getSublistValue('custpage_table', 'custitem_program_sizes', i),
                    qrCode: pageSize == PAGE_SIZE_LETTER ?
                        request.getSublistValue('custpage_table', 'custitem_qr_code', i) == 'true' : false
                };

                log.debug('returnLabel', "Item created...");
                log.debug('item', item);

                if (!item.programSize || item.programSize === "Other")
                    item.programSize = '';

                if (!item.pdfMet)
                    item.pdfMet = "";

                // choose what data we will use for barcode
                if (item.labelType == "ER" || item.labelType == "MET" || item.labelType == "PL" || item.labelType == "PL2")
                    item.barCode = request.getSublistValue('custpage_table', 'serialnumber', i);
                else if (item.labelType == "SL")
                    item.barCode = request.getSublistValue('custpage_table', 'item', i);
                else

                    item.barCode = request.getSublistValue('custpage_table', 'custitem_new_upc_code', i);


                items.push(item);
                log.debug('returnLabel', "Item added...");
            }



            // now we limit to up to 50 elements per PDF (otherwise the PDF becomes too big and fails)
            var pdfFiles = [];
            var nextBatch = 0;
            while (nextBatch <= items.length) {
                addPDF(pageSize, items, nextBatch, 1000, pdfFiles);
                nextBatch += 1000;
            }

            // one file we return as is, mulitlpe we zip into 1 file
            var streamFile = pdfFiles[0];
            /*if (pdfFiles.length > 1) {
              var archiver = compress.createArchiver();
              for (var i=0; i < pdfFiles.length; i++)
                archiver.add({
                    file: pdfFiles[i]
                });

                streamFile = archiver.archive({
                    name: 'export.zip'
                });
              }*/

            context.response.writeFile(streamFile);
        }


        function getLabelInfo(item, pageSize, linesProcessed, isLastItem) {
            var labelInfo = {
                content: '',
                requiresPageBreak: false,
                multiElementsPerRow: false
            };

            switch(item.labelType) {
                case "ER":
                    labelInfo.content = buildERLabel(item, pageSize);
                    break;
                case "PL":
                    labelInfo.content = buildPLLabel(item, pageSize);
                    break;
                case "PL2":
                    labelInfo.content = buildPL2Label(item, pageSize);
                    labelInfo.multiElementsPerRow = true;
                    break;
                case "UPC":
                    labelInfo.content = buildUPCLabel(item, pageSize);
                    break;
                case "MET":
                    labelInfo.content = buildMETLabel(item, pageSize);
                    // For MET labels in letter size, check if we need a page break
                    if (pageSize == PAGE_SIZE_LETTER && linesProcessed > 0 && linesProcessed % 3 == 0) {
                        labelInfo.requiresPageBreak = true;
                    }
                    break;
                case "SL":
                    labelInfo.content = buildSLLabel(item, pageSize);
                    labelInfo.multiElementsPerRow = true;
                    break;
            }

            return labelInfo;
        }

        function addPDF(pageSize, items, startIndex, length, pdfFiles) {
            log.debug('addPDF', startIndex);

            var xml = '<?xml version="1.0" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n';
            xml += '<pdfset>';
            
            var linesProcessed = 0;
            var labelType = '';
            length = (startIndex + length) < items.length ? length : items.length - startIndex;

            // iterate on the items and add to XML
            for (var i = startIndex; i < startIndex + length; i++) {
                var item = items[i];
                labelType = item.labelType;
                var isLastItem = i == startIndex + length - 1;

                // Get label info from the specific label builder
                var labelInfo = getLabelInfo(item, pageSize, linesProcessed, isLastItem);
                
                // Handle page break or initial page setup
                if (linesProcessed == 0 || labelInfo.requiresPageBreak) {
                    if (linesProcessed > 0) {
                        xml += '</body></pdf>';
                    }
                    xml += '<pdf><head><meta name="title" value="PRINT LABEL"/><style type="text/css">body {font-family: Arial, sans-serif; font-weight: bold;} table {font-size: 10pt;table-layout: fixed;} td { padding:4px; margin:0px; }</style></head>';
                    if (pageSize == PAGE_SIZE_LETTER)
                        xml += '<body padding="0.25in 0.4in 0.25in 0.4in" size="Letter">';
                    else if (pageSize == PAGE_SIZE_UPS)
                        xml += '<body padding="0.5in 0.75in 0.5in 0.75in" height="101.6mm" width="152.4mm">';
                    else if (pageSize == PAGE_SIZE_4X3)
                        xml += '<body padding="0.25in 0.25in 0.25in 0.25in" height="3in" width="4in">';
                }

                // Handle table and row structure for ones that support multiple elements per row
                if (labelInfo.multiElementsPerRow) {
                    if (linesProcessed == 0)
                        xml += '<table>';
                    if (linesProcessed % 2 == 0)
                        xml += '<tr style="padding-top:10px">';
                }

                // Add label content
                xml += labelInfo.content;

                // Handle table and row structure for ones that support multiple elements per row
                if (labelInfo.multiElementsPerRow) {
                    if (linesProcessed % 2 == 1 || linesProcessed == length - 1)
                        xml += '</tr>';
                    if (linesProcessed == length - 1) 
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
            newfile.name = labelType + "_Label_" + startIndex + "_" + dateFormat + ".pdf";

            pdfFiles.push(newfile);
        }

        function buildERLabel(item, pageSize) {
            var xml = '';
            xml += '<table border="1" cellpadding="' + (pageSize == PAGE_SIZE_4X3 ? '4px' : '8px') + '" style="width: ' + (pageSize == PAGE_SIZE_4X3 ? '280px' : '400px') + ';padding:' + (pageSize == PAGE_SIZE_4X3 ? '8px' : '15px') + '; border-style: dotted; box-sizing: border-box;">';
            
            // Logo and barcode row
            xml += '<tr>';
            xml += '<td colspan="6" style="width: ' + (pageSize == PAGE_SIZE_4X3 ? '110px' : '150px') + '; box-sizing: border-box;">';
            xml += '<p><img src="https://4951235.app.netsuite.com/core/media/media.nl?id=2106&amp;c=4951235&amp;h=ece9007b3f17bf2cc27c" style="width: ' + (pageSize == PAGE_SIZE_4X3 ? '100px' : '140px') + '; height: 20px;" /></p><p style="font-size: 6pt;">WWW.EXQUISITERUGS.COM</p>';
            xml += '</td>';

            if (pageSize == PAGE_SIZE_LETTER)
                xml += '<td colspan="6" rowspan="2" style="width: 225px; font-size: 42pt;text-align: center; box-sizing: border-box;">';
            else if (pageSize == PAGE_SIZE_UPS)
                xml += '<td colspan="6" rowspan="2" style="width: 180px;font-size: 26pt;text-align: center; box-sizing: border-box;">';
            else
                xml += '<td colspan="6" rowspan="2" style="width: 140px;font-size: 16pt;text-align: center; box-sizing: border-box; padding: 4px;">';

            xml += '<p style="text-align: center; margin: 0; padding: 0;">' + safeHTML(item.barCode) + '<barcode bar-width="' + (pageSize == PAGE_SIZE_4X3 ? '1' : '2') + '" codetype="code128" showtext="false" value="' + safeHTML(item.barCode) + '" style="max-width: 100%;"></barcode></p>';
            xml += '</td>';
            xml += '</tr>';

            // Design row
            xml += '<tr>';
            xml += '<td colspan="6" style="box-sizing: border-box;">';
            if (item.pdfDesignLabel == 'ASSRT')
                xml += '<p>DESIGN: <span style="font-size: ' + (pageSize == PAGE_SIZE_4X3 ? '12pt' : '18pt') + ';line-height:16px;"><strong>' + item.pdfDesignLabel + '</strong></span></p>';
            else
                xml += '<p>DESIGN: <span style="font-size: ' + (pageSize == PAGE_SIZE_4X3 ? '14pt' : '24pt') + ';line-height:20px;"><strong>' + item.pdfDesignLabel + '</strong></span></p>';

            xml += '</td>';
            xml += '</tr>';

            // Size and Collection rows
            xml += getXMLRow('SIZE', item.pdfSize, 12, 'font-size:' + (pageSize == PAGE_SIZE_4X3 ? '9pt' : '16pt') + ';line-height:12px;');
            xml += (item.pdfCollection.length < 12 && pageSize == PAGE_SIZE_LETTER) ?
                getXMLRow('COLLECTION', item.pdfCollection, 12, 'font-size:30pt;line-height:18px;') :
                getXMLRow('COLLECTION', item.pdfCollection, 12, 'font-size:' + (pageSize == PAGE_SIZE_4X3 ? '12pt' : '18pt') + ';line-height:16px;');

            // Content and QR Code row
            var row = getXMLCell('CONTENT', item.pdfContent, 9, 'font-size:9pt;line-height:10px;');
            row += getQRCode(item.pdfDesignLabel, 35, 3, 2, item.qrCode);
            xml += toXMLRow(row);

            // Origin row
            xml += getXMLRow('ORIGIN', item.pdfExqRugsOrigin, 9, 'font-size:9pt;line-height:10px;');
            
            xml += '</table>';
            if (pageSize == PAGE_SIZE_LETTER)
                xml += '<p style="width:100%;border-top:1px dotted #999;margin:15px 0"></p>';

            return xml;
        }

        function buildPLLabel(item, pageSize) {
            var xml = '';
            xml += '<table border="1" cellpadding="2px" style="width: 400px;padding:14px; border-style: dotted;">';
            
            // Barcode row
            xml += '<tr>';
            if (pageSize == PAGE_SIZE_LETTER)
                xml += '<td colspan="12" style="padding: 0;font-size: 42pt;text-align: center;">';
            else
                xml += '<td colspan="12" style="padding: 0;font-size: 26pt;text-align: center;">';

            xml += '<p style="text-align: center;margin:0 auto;">' + safeHTML(item.barCode) + '<barcode bar-width="2" style="width: 100%;" codetype="code128" showtext="false" value="' + safeHTML(item.barCode) + '"></barcode></p>';
            xml += '</td>';
            xml += '</tr>';

            // Code row
            var code = 'X00' + item.pdfDesignLabel.substring(0, 4) + 'A' + item.pdfCollection.substring(0, 3).toUpperCase();
            xml += toXMLRow('<td colspan="12" align="center" style="padding: 0;font-size:10pt;line-height:24px;font-weight:normal">' + code + '</td>');

            // Size, Content, and Origin rows
            xml += getXMLRow('SIZE', item.pdfSize, 12, 'font-size:14pt;line-height:24px;');
            xml += getXMLRow('CONTENT', item.pdfContent, 12, 'font-size:14pt;line-height:24px;');
            xml += getXMLRow('ORIGIN', item.pdfExqRugsOrigin, 12, 'font-size:14pt;line-height:24px;');

            xml += '</table>';
            if (pageSize == PAGE_SIZE_LETTER)
                xml += '<p style="width:100%;border-top:1px dotted #999;margin:14px 0"></p>';

            return xml;
        }

        function buildPL2Label(item, pageSize) {
            var xml = '';
            xml += '<td><table border="1" cellpadding="4px" style="width: 300px; border-style: dotted; border-color:gray;">';
            
            // Logo and barcode row
            xml += '<tr>';
            xml += getLogo(item.logo, 140, 70, 6, 2);
            xml += '<td colspan="6" style="font-size: 32pt;text-align: right;">';
            xml += '<p style="text-align: right;margin:0 auto;"><barcode bar-width="1" style="width: 140px;" codetype="code128" showtext="false" value="' + safeHTML(item.barCode) + '"></barcode></p>';
            xml += '</td>';
            xml += '</tr>';

            // Code row
            var code = 'X00' + item.pdfDesignLabel.substring(0, 4) + 'A' + item.pdfCollection.substring(0, 3).toUpperCase();
            xml += toXMLRow('<td colspan="6" align="center" style="padding: 0;font-size:11pt;font-weight:normal">' + code + '</td>');

            // Content, Origin, and Sizes rows
            xml += getXMLRow('CONTENT', item.pdfContent, 12, 'font-size:10pt;line-height:10px;');
            xml += getXMLRow('ORIGIN', item.pdfExqRugsOrigin, 12, 'font-size:10pt;line-height:10px;');
            xml += getXMLRow('SIZES', item.programSize, 12, 'font-size:10pt;line-height:10px;');

            xml += '</table></td>';
            return xml;
        }

        function buildUPCLabel(item, pageSize) {
            var xml = '';
            xml += '<table border="1" cellpadding="8px" style="width: 400px;padding:15px; border-style: dotted;">';
            
            // Logo and barcode row
            xml += '<tr>';
            xml += '<td colspan="6" style="width: 150px;">';
            xml += '<p><img src="https://4951235.app.netsuite.com/core/media/media.nl?id=2106&amp;c=4951235&amp;h=ece9007b3f17bf2cc27c" style="width: 140px; height: 20px;" /></p><p style="font-size: 6pt;">WWW.EXQUISITERUGS.COM</p>';
            xml += '</td>';

            xml += '<td colspan="6" rowspan="2" style="width: 120px;font-size: 10pt;text-align: center;">';
            xml += '<p style="text-align: center;">' + safeHTML(item.barCode) + '<barcode bar-width="1" codetype="code128" showtext="false" value="' + safeHTML(item.barCode) + '"></barcode></p>';
            xml += '</td>';
            xml += '</tr>';

            xml += '</table>';
            xml += '<p style="width:100%;border-top:1px dotted #999;margin:15px 0"></p>';

            return xml;
        }

        function buildMETLabel(item, pageSize) {
            var xml = '';
            xml += '<table border="1" cellpadding="2px" style="width: 400px;padding:15px; border-style: dotted;">';
            
            // Logo row
            xml += '<tr>';
            xml += '<td colspan="12" style="width: 210px;margin-bottom:10px">';
            xml += '<p><img src="https://4951235.app.netsuite.com/core/media/media.nl?id=96860&amp;c=4951235&amp;h=qGyFvV7IgP4qHpc42AJWvaZImF7JxdQEwqFKHbPN8D7d8iVM" style="width: 210px; height: 35px;" /></p>';
            xml += '</td>';
            xml += '</tr>';

            // Design and barcode row
            var row = getXMLCell('DESIGN', item.pdfDesignLabel, 6, 'font-size:14pt;');
            row += '<td colspan="6" style="font-size:16pt;text-align:center;">' + safeHTML(item.barCode) + '</td>';
            xml += toXMLRow(row);

            // Size and barcode row
            row = getXMLCell('SIZE', item.pdfSize, 6, 'font-size:14pt;');
            row += '<td colspan="6" style="text-align:center;"><barcode bar-width="1" codetype="code128" showtext="false" value="' + safeHTML(item.barCode) + '"></barcode></td>';
            xml += toXMLRow(row);

            // Collection, Content rows
            xml += getXMLRow('COLLECTION', item.pdfCollection, 12, 'font-size:14pt;');
            xml += getXMLRow('CONTENT', item.pdfContent, 12, 'font-size:14pt;');

            // Origin and QR Code row
            row = getXMLCell('ORIGIN', item.pdfExqRugsOrigin, 9, 'font-size:14pt;');
            row += getQRCode("MET_" + item.pdfDesignLabel, 60, 3, 2, item.qrCode);
            xml += toXMLRow(row);

            // Footer row
            xml += toXMLRow(getFooter(item.pdfMet, '&copy;The Metropolitan Museum of Art', 9));

            xml += '</table>';
            if (pageSize == PAGE_SIZE_LETTER)
                xml += '<p style="width:100%;border-top:1px dotted #999;margin:15px 0"></p>';

            return xml;
        }

        function buildSLLabel(item, pageSize) {
            var xml = '';
            xml += '<td><table border="1" cellpadding="4px" style="width: 345px; border-style: dotted; border-color:gray;">';
            
            // Logo and barcode row
            xml += '<tr>';
            xml += '<td colspan="4">';
            xml += '<img src="https://4951235.app.netsuite.com/core/media/media.nl?id=10998&amp;c=4951235&amp;h=qD1ob0v4w04aBj-z-4MzzsdBLhLSfUneQKTXYyKSO0G5tp2-" style="width: 100px; height: 16px;" />';
            xml += '</td>';

            xml += '<td colspan="8" style="width: 140px;">';
            xml += '<p style="font-size: 14pt;text-align: center;">' +
                (item.pdfSize == SAMLPE_CATEGORY_SIZE ? '' : safeHTML(item.barCode)) +
                '<barcode height="22" width="160" codetype="code128" showtext="false" value="' + safeHTML(item.barCode) + '"></barcode></p>';
            xml += '</td>';
            xml += '</tr>';

            // Design, Collection rows
            xml += getXMLRow('DESIGN', item.pdfDesignLabel, 12, 'font-size:18pt');
            xml += getXMLRow('COLLECTION', item.pdfCollection, 12);

            // Content and QR Code row
            var row = getXMLCell('CONTENT', item.pdfContent, 9);
            row += getQRCode(item.pdfDesignLabel, 40, 3, 2, item.qrCode);
            xml += toXMLRow(row);

            // Origin row
            xml += getXMLRow('ORIGIN', item.pdfExqRugsOrigin, 9);

            // Sizes row
            xml += getXMLRow('SIZES', item.programSize, 12, 'font-size:10pt');

            xml += '</table></td>';
            return xml;
        }

        function getSelectedOption(request, optionName, defaultValue) {
            var value = defaultValue;
            try {
                value = parseInt(request.parameters[optionName]);
            } catch (e) {}

            return value;
        }


        function getQRCode(pdfDesignLabel, dim, colspan, rowspan, qrCode) {
            if (qrCode) {
                try {
                    var fileObj = file.load({
                        id: 'Web Site Hosting Files/Live Hosting Files/QRCODE/' + pdfDesignLabel + '.png'
                    }).getContents();
                    return '<td colspan="' + colspan + '" rowspan="' + rowspan + '">' + '<img src=\"data:image/png;base64,' + fileObj + '\" style="width: ' + dim + 'px; height: ' + dim + 'px;" /></td>';
                } catch (e) {}
            }

            return '<td colspan="' + colspan + '" rowspan="' + rowspan + '"> </td>';
        }

        function addLogoOption(element, fileName, currentValue) {
            element.addSelectOption({
                value: fileName,
                text: FileName2DisplayName(fileName),
                isSelected: currentValue == fileName
            });
        }

        function getLogo(name, width, height, colspan, rowspan) {

            var element = '<td colspan="' + colspan + '" rowspan="' + rowspan + '"><div style="width: ' + width + 'px; height: ' + height + 'px;overflow: hidden;">';
            if (name != 'none') {
                try {
                    var fileObj = file.load({
                        id: LOGOS_FOLDER + name
                    }).getContents();
                    element += '<img src="data:image/jpeg;base64,' + fileObj + '" style="width: ' + width + 'px;height: ' + height + ';" />';
                } catch (e) {
                    log.error('getLogo failed', e.message);
                }
            }

            element += '</div></td>';
            return element;
        }

        function getFooter(label, copyright, colspan) {
            return '<td style="margin-right:30px;margin-top:5px;font-weight:normal;line-height:8px;vertical-align:bottom" colspan="' + colspan + '">' +
                '<span style="font-size:6pt">' + label + '</span><br />' +
                '<span style="font-size:5pt;line-height:15px; vertical-align: bottom">' + copyright + '</span>' +
                '</td>';
        }

        function getXMLRow(label, value, colspan, style) {
            return toXMLRow(getXMLCell(label, value, colspan, style));
        }

        function getXMLCell(label, value, colspan, style) {
            return '<td colspan="' + colspan + '">' + label + ': <span style="' + (style ? style : '') + '">' + (value ? value : '') + '</span></td>';
        }

        function toXMLRow(value) {
            return '<tr>' + value + '</tr>';
        }

        function hasValue(value) {
            return value && value != '0';
        }


        function getFolderIdFromPath(folderPath) {
            var pathParts = folderPath.split('/').filter(function(part) {
                return part !== ''; // Remove empty strings
            });

            var currentFolderId = null;

            // Loop through each part of the folder path to find the folder
            for (var i = 0; i < pathParts.length; i++) {
                var folderName = pathParts[i];

                log.debug('Current Folder ID', currentFolderId);
                log.debug('Folder Part', folderName);

                // Search for the folder with the current parent folder and folder name
                var folderSearch = search.create({
                    type: search.Type.FOLDER,
                    filters: [
                        ['parent', 'anyof', currentFolderId || '@NONE@'], // Parent folder (root if first)
                        'AND', ['name', 'is', folderName], // Folder name matches
                        'AND', ['isinactive', 'is', 'F'] // Ensure the folder is active (optional)
                    ],
                    columns: ['internalid', 'name']
                });

                var folderResults = folderSearch.run().getRange({
                    start: 0,
                    end: 1
                });

                if (folderResults.length > 0) {
                    // Update the currentFolderId to the found folder's internal ID
                    currentFolderId = folderResults[0].getValue('internalid');
                } else {
                    // Folder not found, return null
                    return null;
                }
            }

            // Return the final folder ID
            return currentFolderId;
        }


        function getFilesInFolder(folderId) {
            var files = [];

            // Search for files in the folder (Correct record type is 'file')
            var fileSearch = search.create({
                type: 'folder',
                filters: [
                    ['internalid', 'is', folderId]
                ],
                columns: [
                    search.createColumn({
                        name: 'name',
                        join: 'file'
                    })
                ]
            });

            var fileResults = fileSearch.run().getRange({
                start: 0,
                end: 1000
            });

            // Process each file in the result set
            fileResults.forEach(function(fileResult) {
                files.push(fileResult.getValue({
                    name: 'name',
                    join: 'file'
                }));
            });

            return files;
        }

        function safeHTML(text) {
            var table = {
                '<': 'lt',
                '>': 'gt',
                '"': 'quot',
                '\'': 'apos',
                '&': 'amp',
                '\r': '#10',
                '\n': '#13'
            };

            return text.toString().replace(/[<>"'\r\n&]/g, function(chr) {
                return '&' + table[chr] + ';';
            });
        }

        function FileName2DisplayName(fileName) {
            // Remove the file extension (e.g., .jpg, .txt)
            const nameWithoutExtension = fileName.split('.')[0];

            // Split the file name by underscores and dashes (handle common delimiters)
            const words = nameWithoutExtension.split(/[_-]+/);

            // Capitalize the first letter of each word and lowercase the rest
            const capitalizedWords = words.map(function(word) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            });

            // Join the capitalized words back together with spaces
            return capitalizedWords.join(' ');
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