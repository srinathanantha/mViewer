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
package com.imaginea.mongodb.exceptions;

/**
 * Defines Exception generated when Mongo Host is not found. This class extends
 * UnknownHostException generated when host is not found with an <errorCode>
 * introduced.
 *
 * @author Rachit Mittal
 */

public class MongoConnectionException extends ApplicationException {

    private static final long serialVersionUID = 1L;

    /**
     * Creates a new MongoConnectionException along with errorCode and message
     *
     * @param errorCode
     * @param message
     */
    public MongoConnectionException(String errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Creates a new MongoConnectionException along with errorCode, message and cause
     *
     * @param errorCode : ErrorCode of the Exception thrown
     * @param message   : A description about the Exception. *
     * @param cause     : Cause of the caught Exception to be appended in the new
     *                  Document Exception formed here.
     */

    public MongoConnectionException(String errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }


}
