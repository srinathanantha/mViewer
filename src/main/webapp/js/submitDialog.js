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
 * Show a dialog box
 * @module dialog-box
 */

YUI.add('submit-dialog', function(Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;

    MV.showSubmitDialog = function Dialog(form, successHandler, failureHandler) {
        YAHOO.util.Dom.removeClass(form, "yui-pe-content");

        function cancelCurrent() {
            this.cancel();
        }

        function addCollection() {
            Y.log("Submit handler for add collection called", "info");
            var newCollInfo = this.getData();
            if (newCollInfo.newCollName === "") {
                MV.showAlertMessage("Name should be entered to create a Collection!", MV.warnIcon);
                return false;
            } else if (newCollInfo.isCapped === true && newCollInfo.capSize === "") {
                MV.showAlertMessage("Size should be entered to create a Capped Collection!", MV.warnIcon);
                return false;
            } else {
                var updateColl = Y.one("#updateColl").get("value");
                if (updateColl === "false") {
                    MV.appInfo.currentColl = newCollInfo.newCollName;
                }
                Y.one("#" + form + " .bd form").setAttribute("action", MV.URLMap.insertColl());
            }
            return true;
        }

        function addGridFS() {
            Y.log("Submit handler for adding gridFS bucket called", "info");
            var newCollInfo = this.getData();
            if (newCollInfo.name === "") {
                MV.showAlertMessage("Enter the bucket name!", MV.warnIcon);
                return false;
            } else {
                Y.one("#" + form + " .bd form").setAttribute("action", MV.URLMap.addGridFS(newCollInfo.name));
            }
            return true;
        }

        function addDB() {
            var newDBInfo = this.getData();
            if (newDBInfo.name === "") {
                MV.showAlertMessage("Enter the database name!", MV.warnIcon);
                return false;
            } else {
                MV.appInfo.newName = newDBInfo.name;
                Y.one("#" + form + " .bd form").setAttribute("action", MV.URLMap.insertDB());
                MV.showAlertMessage("New Database '"+newDBInfo.name+"' added successfully", MV.warnIcon);
            }
            return true;
        }

        function addDocument() {
            var newDoc = this.getData().document;
            if (newDoc === "") {
                MV.showAlertMessage("Enter a valid Document", MV.warnIcon);
                return false;
            }
            try {
                Y.JSON.parse(newDoc);
                Y.one("#" + form + " .bd form").setAttribute("action", MV.URLMap.insertDoc());
            } catch (e) {
                MV.showAlertMessage("Enter the document in valid JSON format", MV.warnIcon);
                return false;
            }
            return true;
        }

        function addUser() {
            var userName = this.getData().addUser_user_name;
            var password = this.getData().addUser_password;

            if (userName == "") {
                MV.showAlertMessage("Enter the username!", MV.warnIcon);
                return false;
            } else if (password == "") {
                MV.showAlertMessage("Enter the password!", MV.warnIcon);
                return false;
            } else {
                Y.one("#" + form + " .bd form").setAttribute("action", MV.URLMap.adduser());
            }
            return true;
        }

        function addIndex() {
            var indexDocument = this.getData().index_keys;
            try {
                Y.JSON.parse(indexDocument);
                Y.one("#" + form + " .bd form").setAttribute("action", MV.URLMap.addIndex());
            } catch (e) {
                MV.showAlertMessage("Please enter the new index in JSON format", MV.warnIcon);
                Y.log("New Index format not JSON", "error");
                return false;
            }
            return true;
        }

        var sumbitHandlerMap = {
            "addColDialogSubmitHandler": addCollection,
            "addGridFSDialogSubmitHandler": addGridFS,
            "addDBDialogSubmitHandler": addDB,
            "addDocDialogSubmitHandler": addDocument,
            "addUserDialogSubmitHandler": addUser,
            "addIndexDialogSubmitHandler": addIndex
        };

        var dialogBox = $("#" + form).data("dialogBox");
        if (!dialogBox) {
            dialogBox = new YAHOO.widget.Dialog(form, {
                width: "25em",
                fixedcenter: true,
                visible: false,
                draggable: true,
                zIndex: 2000,
                effect: {
                    effect: YAHOO.widget.ContainerEffect.SLIDE,
                    duration: 0.25
                },
                constraintoviewport: true,
                buttons: [
                    {
                        text: "Submit",
                        handler: function() {
                            var doSubmit = (sumbitHandlerMap[form + "SubmitHandler"]).call(this);
                            if (doSubmit) {
                                this.submit();
                            }
                        },
                        isDefault: true
                    },
                    {
                        text: "Cancel",
                        handler: cancelCurrent
                    }
                ]
            });
            dialogBox.callback = {
                success: successHandler,
                failure: failureHandler
            };
            dialogBox.beforeSubmitEvent.subscribe(function() {
                (sumbitHandlerMap[form + "SubmitHandler"]).call(this);
            });
            dialogBox.render();
            $("#" + form).data("dialogBox", dialogBox);
        }
        dialogBox.show();
        return dialogBox;
    };

    function updateCappedSection(event) {
        var isChecked = event.currentTarget._node.checked;
        if (isChecked) {
            $("#cappedSection").removeClass('disabled');
            $("#cappedSection input").removeAttr('disabled');
        } else {
            $("#cappedSection").addClass('disabled');
            $("#cappedSection input").attr('disabled', 'disabled');
        }
    }

    // Add change listener to capped checkbox in Add Collection Dialog
    Y.delegate("click", updateCappedSection, "#addColDialog", "input[name = isCapped]");

}, '3.3.0', {
    requires: ["utility", "node", "alert-dialog"]
});
