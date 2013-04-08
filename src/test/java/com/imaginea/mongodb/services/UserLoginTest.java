/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd.
 * Hyderabad, India
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following condition
 * is met:
 *
 *     + Neither the name of Imaginea, nor the
 *       names of its contributors may be used to endorse or promote
 *       products derived from this software.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

package com.imaginea.mongodb.services;

import com.imaginea.mongodb.controllers.LoginController;
import com.imaginea.mongodb.controllers.TestingTemplate;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBObject;
import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.servlet.http.HttpServletRequest;

/**
 * Tests the LoginController Resource functionality. Here we will try to register a
 * user and will check if a valid token Id is provided and then will check if a
 * Mongo Instance is also added corresponding to that tokenId.
 *
 * @author Rachit Mittal
 * @since 15 July 2011
 */
public class UserLoginTest extends TestingTemplate {

    /**
     * Class to be tested
     */
    private LoginController loginController;

    private static Logger logger = Logger.getLogger(UserLoginTest.class);

    /**
     * test username and password
     */
    private String testUsername = "name";
    private String testPassword = "pass";

    @Before
    public void instantiateTestClass() {
        loginController = new LoginController();
    }

    /**
     * Test Post login Request made by User to LoginController resource for
     * authentication. Hereby we will check if a token ID is generated and also
     * will check if a mongoInstacne is set by the servlet.
     */

    @Test
    public void testUserLoginRequest() {
        ErrorTemplate.execute(logger, new ResponseCallback() {
            public Object execute() throws Exception {
                // Insert user in admin db
                mongoInstance.getDB("admin").addUser(testUsername, testPassword.toCharArray());
                String host = mongoInstance.getAddress().getHost();
                Integer port = (Integer) (mongoInstance.getAddress().getPort());
                HttpServletRequest request = new MockHttpServletRequest();
                // Call Service for login
                String response = loginController.authenticateUser(testUsername, testPassword, host, port.toString(), null, request);
                if (response.contains("Login Success")) {
                    BasicDBObject responseObject = ((BasicDBObject) JSON.parse(response));
                    String connectionId = (String) ((BasicDBObject) responseObject.get("response")).get("connectionId");
                    String connectionDetails = loginController.getConnectionDetails(connectionId, request);
                    assert (connectionDetails.contains("result") && connectionDetails.contains("dbNames"));
                    logout(connectionId, request);
                }
                return null;
            }
        });
    }
}
