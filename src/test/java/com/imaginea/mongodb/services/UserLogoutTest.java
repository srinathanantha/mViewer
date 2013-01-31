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

import com.imaginea.mongodb.controllers.BaseController;
import com.imaginea.mongodb.controllers.LoginController;
import com.imaginea.mongodb.controllers.LogoutController;
import com.imaginea.mongodb.utils.JSON;
import com.mongodb.BasicDBObject;
import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * Tests the GET request made by user to disconnect from the application. Here we
 * will register a user first and then will check if disconnect invalidates a user's
 * tokenId.
 *
 * @author Rachit Mittal
 * @since 15 July 2011
 */
public class UserLogoutTest extends BaseController {
    private MockHttpServletRequest request = new MockHttpServletRequest();

    /**
     * Class to be tested
     */
    private LogoutController logoutController;

    /**
     * Logger object
     */
    private static Logger logger = Logger.getLogger(UserLoginTest.class);
    private String connectionId;

    /**
     * Instantiates the class LoginController which is to be tested and also gets a
     * mongo instance from mongo instance provider.
     */
    @Before
    public void instantiateTestClass() {
        logoutController = new LogoutController();
        request = new MockHttpServletRequest();
        LoginController loginController = new LoginController();
        // Add user to mappings in userLogin for authentication
        String response = loginController.authenticateUser("admin", "admin", "localhost", "27017", null, request);
        BasicDBObject responseObject = (BasicDBObject) JSON.parse(response);
        connectionId = (String) ((BasicDBObject) responseObject.get("response")).get("connectionId");
    }

    /**
     * Test GET Request made by User to disconnect from the application.
     */
    @Test
    public void testUserLogoutRequest() {
        String status = logoutController.doGet(connectionId, new MockHttpServletRequest());
        assert (status.contains("User Logged Out"));
    }

}
