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
 * @module alert-dialog
 * The module provides function <tt>showAlertMessage</tt> to show a simple information message.
 */
YUI.add('alert-dialog', function(Y) {
    var MV = YUI.com.imaginea.mongoV, timeoutId;

    MV.showAlertMessage = function(msg, icon, errorCode) {
        msg = errorCode != undefined ? msg.format(MV.errorCodeMap[errorCode]) : msg;
        if (errorCode === "INVALID_SESSION") {
            window.location = "index.html?code=INVALID_SESSION";
        } else if (errorCode === "INVALID_CONNECTION") {
            window.location = "index.html?code=INVALID_CONNECTION"
        } else {
            document.getElementById('infoMsg').style.display = 'inline-block';
            clearTimeout(timeoutId);
            Y.one('#infoIcon').set("className", icon);
            Y.one('#infoText').set("innerHTML", msg);
            timeoutId = setTimeout("document.getElementById('infoMsg').style.display='none'", 12000);
        }
    };

    var sm = MV.StateManager;
    var hideAlertMessage = function() {
        document.getElementById('infoMsg').style.display='none';
    };
    sm.subscribe(hideAlertMessage, [sm.events.actionTriggered]);
}, '3.3.0', {
    requires: ["utility", "node"]
});
