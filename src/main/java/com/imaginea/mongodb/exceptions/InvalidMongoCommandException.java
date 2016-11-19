package com.imaginea.mongodb.exceptions;

/**
 * User: venkateshr
 */
public class InvalidMongoCommandException extends ApplicationException {

  /**
   * Defines an InvalidMongoCommandException
   *
   * @param errorCode
   * @param message
   */
  public InvalidMongoCommandException(String errorCode, String message) {
    super(errorCode, message);
  }

}
