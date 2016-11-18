/*
 * Copyright (c) 2011 Imaginea Technologies Private Ltd. Hyderabad, India
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted
 * provided that the following condition is met:
 *
 * + Neither the name of Imaginea, nor the names of its contributors may be used to endorse or
 * promote products derived from this software.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package com.imaginea.mongodb.exceptions;

/**
 * A Validation Exception class that inherits all properties of Exception and defines exception
 * generates when invalid data is provided like empty database name, empty collection name or no
 * document data.
 *
 * @author Rachit Mittal
 */
public class ValidationException extends ApplicationException {

  private static final long serialVersionUID = 1L;

  /**
   * Creates a new ValidationException with errorcode and message.
   *
   * @param errorCode : ErrorCode of the Exception thrown
   * @param message : A description about the Error.
   */
  public ValidationException(String errorCode, String message) {
    super(errorCode, message);
  }
}
