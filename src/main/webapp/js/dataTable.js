/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd.
 * Hyderabad, India
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * <p>custom-datatable creates a datatable with the following columns
 * <ul>
 * <li> key</li>
 * <li> value</li>
 * <li> type</li>
 * </ul>
 * <p>Currently it is used to make the datatable to show the collection and the
 * database statistics. </p>
 *
 * @module custom-datatable
 * @namespace com.imaginea.mongov
 * @requires "io-base", "node", "json-parse", "datatable-scroll", "datasource-io", "datasource-jsonschema", "datatable-datasource", "event-delegate"
 * @param path
 *          <dd>(required) This is the url to which the request will be sent to get the data</dd>
 * @param name
 *          <dd>(required)The name of the collection/database whose data is required.</dd>
 */

YUI.add('custom-datatable', function(Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;
    MV.createDatatable = function(path, name) {
        MV.mainBody.set("innerHTML", "");
        /**
         * <p>The function is used to make the column configuration for the datatable
         * @param colKey
         * <dd>(required)The column name</dd>
         **/
        var createColumn = function(colKey) {
            return {
                key: colKey,
                sortable: true,
                width: "210px"
            };
        };
        var cols = [createColumn("Key"), createColumn("Value"), createColumn("Type")];
        var ds = new Y.DataSource.IO({
            source: path
        });
        ds.plug(Y.Plugin.DataSourceJSONSchema, {
            schema: {
                resultListLocator: "response.result",
                resultFields: ["Key", "Value", "Type"]
            }
        });
        var dt = new Y.DataTable.Base({
            columnset: cols,
            width: "685px"
        }).plug(Y.Plugin.DataTableDataSource, {
            datasource: ds,
            initialRequest: ""
        });

        ds.sendRequest({
            callback: {
                success: function(e) {
                    MV.setHeader(MV.headerConstants.STATISTICS);
                    dt.render("#" + MV.mainBody.get('id'));
                },
                failure: function(e) {
                    var parsedResponse = Y.JSON.parse(e.data.response),
                        errMsg = "Could not get the statistics: " + parsedResponse.response.error.message;
                    Y.log(errMsg, "error");
                    MV.showAlertMessage(errMsg, MV.warnIcon);
                }
            }
        });
    };
}, '3.3.0', {
    requires: ["utility", "alert-dialog", "io-base", "node", "json-parse", "datatable-scroll", "datasource-io", "datasource-jsonschema", "datatable-datasource", "event-delegate"]
});
