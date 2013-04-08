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

import com.imaginea.mongodb.controllers.LogoutController;
import com.imaginea.mongodb.controllers.TestingTemplate;
import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import javax.servlet.http.HttpSession;
import java.util.Set;

/**
 * Tests the GET request made by user to disconnect from the application. Here we
 * will register a user first and then will check if disconnect invalidates a user's
 * tokenId.
 *
 * @author Rachit Mittal
 * @since 15 July 2011
 */
public class UserLogoutTest extends TestingTemplate {
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

    @Before
    public void instantiateTestClass() {
        // Class to be tested
        logoutController = new LogoutController();
        connectionId = loginAndGetConnectionId(request);
    }

    /**
     * Test GET Request made by User to disconnect from the application.
     */
    @Test
    public void testUserLogoutRequest() {
        HttpSession session = request.getSession();
        Set<String> existingConnectionIdsInSession = (Set<String>) session.getAttribute("existingConnectionIdsInSession");
        logoutController.doGet(connectionId, request);
        assert !existingConnectionIdsInSession.contains(connectionId);
    }
}
