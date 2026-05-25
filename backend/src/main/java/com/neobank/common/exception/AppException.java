package com.neobank.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Custom application exception that carries an HTTP status code.
 * Thrown by services and handled by {@link GlobalExceptionHandler}.
 */
@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
