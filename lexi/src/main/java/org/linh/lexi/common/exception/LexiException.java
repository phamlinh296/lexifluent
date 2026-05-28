package org.linh.lexi.common.exception;

import lombok.Getter;

@Getter
public class LexiException extends RuntimeException {

    private final ErrorCode errorCode;

    public LexiException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public LexiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public LexiException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
    }
}
