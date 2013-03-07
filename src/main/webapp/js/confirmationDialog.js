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

YUI.add('yes-no-dialog', function(Y) {
    YUI.namespace('com.imaginea.mongoV');
    var MV = YUI.com.imaginea.mongoV;
    var yesNoDialog = null;
    MV.showYesNoDialog = function(header, msg, handleYes, handleNo) {
        if (yesNoDialog === null) {
            yesNoDialog = new YAHOO.widget.SimpleDialog("YesNoDialog", {
                width: "300px",
                fixedcenter: true,
                visible: false,
                draggable: true,
                close: false,
                icon: YAHOO.widget.SimpleDialog.ICON_WARN,
                constraintoviewport: true
            });
            yesNoDialog.render("confirmationDialogContainer");
        }
        var buttons = [
            {
                text: "Yes",
                handler: handleYes,
                isDefault: true
            },
            {
                text: "No",
                handler: handleNo
            }
        ];
        yesNoDialog.setHeader(header);
        yesNoDialog.setBody(msg);
        yesNoDialog.cfg.setProperty("buttons", buttons);
        yesNoDialog.show();
    };
    var sm = MV.StateManager;
    var hideConfirmationDialog = function() {
        if(yesNoDialog) {
            yesNoDialog.hide();
        }
    };
    sm.subscribe(hideConfirmationDialog, [sm.events.actionTriggered]);
}, '3.3.0', {
    requires: []
});
