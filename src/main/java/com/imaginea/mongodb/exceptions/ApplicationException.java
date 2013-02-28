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
 * Defines all the Exceptions generated while performing any operation in
 * MongoDb. This class extends Exception and is used to insert ErrorCode in the
 * Exception hierarchy for this application.
 *
 * @author Rachit Mittal
 * @since 1 Aug 2011
 */
public class ApplicationException extends Exception {

    private static final long serialVersionUID = 1L;

    private String errorCode;

    /**
     * Creates a new ApplicationException with errorCode and message.
     *
     * @param errorCode : ErrorCode of the Exception thrown
     * @param message   : A description about the Error.
     */

    public ApplicationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    /**
     * Creates a new ApplicationException with errorCode and message and
     * appending the cause of a caught exception.
     *
     * @param errorCode : ErrorCode of the Exception thrown
     * @param message   : A description about the Error.
     * @param cause     : Cause of the previous Exception. This is appended in the new
     *                  DatabaseException formed here.
     */

    public ApplicationException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    /**
     * Return the error code of an exception.
     *
     * @return the errorCode
     */
    public String getErrorCode() {
        return this.errorCode;
    }

}
