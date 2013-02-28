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
 * Defines all the Exceptions generated while performing any operation on
 * Documents in MongoDb. This class extends MongoException which is the General
 * Exception for Databases,Collections and Documents in MongoDb.
 * <p/>
 * <p/>
 * Also a field <errorCode> of type <String> is introduced which gives more info
 * about the error.
 *
 * @author Rachit Mittal
 */
public class DocumentException extends ApplicationException {

    private static final long serialVersionUID = 1L;

    /**
     * Defines a Document Exception and also sets errorCode.
     *
     * @param errorCode the errorCode for the message
     * @param message   the error message
     */
    public DocumentException(String errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Defines a Document Exception along with cause of caught Exception to be
     * appended and also sets errorCode.
     *
     * @param errorCode : ErrorCode of the Exception thrown
     * @param message   : A description about the Exception. *
     * @param cause     : Cause of the caught Exception to be appended in the new
     *                  Document Exception formed here.
     */

    public DocumentException(String errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }


}
