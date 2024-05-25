const ERROR_CODES = {
	// Platform specific error codes
	internalServerError: "internal_server_error",
	rateLimitExceeded: "rate_limit_exceeded",
	resourceNotFound: "resource_not_found",
	invalidRequestBody: "invalid_request_body",
	invalidContentType: "invalid_content_type",
	validationError: "validation_error",
	invalidCredentials: "invalid_credentials",
	missingAccessToken: "missing_access_token",
	invalidSession: "invalid_session",
	invalidAccessToken: "invalid_access_token",
	invalidUser: "invalid_user",
	notAllowed: "not_allowed",
	fileUploadError: "file_upload_error",
	unauthorized: "unauthorized",
	notFound: "not_found",
	fileSizeTooLarge: "file_size_too_large",
};
export default ERROR_CODES;
