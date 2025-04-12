import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import { type CustomAttributeKeys, type Options, pinoHttp } from "pino-http";
import env from '@/config/config.js';
import { ServiceResponse } from "@/utils/service-response.js";


enum LogLevel {
	Fatal = "fatal",
	Error = "error",
	Warn = "warn",
	Info = "info",
	Debug = "debug",
	Trace = "trace",
	Silent = "silent",
}



interface ExtendedResponse extends Response {
	locals: {
		err?: Error;
		responseBody?: unknown;
	};
}

type PinoCustomProps = {
	request: Request;
	response: Response;
	error?: Error;
	responseBody?: unknown;
};

const customAttributeKeys: CustomAttributeKeys = {
	req: "request",
	res: "response",
	err: "error",
	responseTime: "timeTaken",
};

const customProps = (req: Request, res: ExtendedResponse): PinoCustomProps => ({
	request: req,
	response: res,
	error: res.locals.err,
	responseBody: res.locals.responseBody,
});

const responseBodyMiddleware: RequestHandler = (_req, res: ExtendedResponse, next) => {
	if (!env.isProduction) {
		const originalSend = res.send.bind(res);
		res.send = (body: any) => {
			res.locals.responseBody = body;

			// Use ServiceResponse to handle structured logging
			const isSuccess = res.statusCode < StatusCodes.BAD_REQUEST;
			const message = getReasonPhrase(res.statusCode);

			if (isSuccess) {
				ServiceResponse.success(message, res.statusCode);
			} else {
				ServiceResponse.failure(message,  res.statusCode);
			}

			return originalSend(body);
		};
	}
	next();
};

const customLogLevel = (
	_req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	err?: Error
): LogLevel => {
	if (err || res.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) return LogLevel.Error;
	if (res.statusCode >= StatusCodes.BAD_REQUEST) return LogLevel.Warn;
	if (res.statusCode >= StatusCodes.MULTIPLE_CHOICES) return LogLevel.Silent;
	return LogLevel.Info;
};

const customSuccessMessage = (
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>
): string => {
	return res.statusCode === StatusCodes.NOT_FOUND
		? getReasonPhrase(StatusCodes.NOT_FOUND)
		: `${req.method} completed`;
};

const genReqId = (req: IncomingMessage, res: ServerResponse<IncomingMessage>): string => {
	const existingID = (req as IncomingMessage & { id?: string }).id ?? req.headers["x-request-id"];
	if (existingID && typeof existingID === "string") return existingID;

	const id = randomUUID();
	res.setHeader("X-Request-Id", id);
	return id;
};

const requestLogger = (options?: Options): RequestHandler[] => {
	const pinoOptions: Options = {
		enabled: env.isProduction,
		customProps: customProps as Options["customProps"],
		customAttributeKeys,
		customLogLevel,
		customSuccessMessage,
		customReceivedMessage: (req: IncomingMessage) => `request received: ${req.method}`,
		customErrorMessage: (_req: IncomingMessage, res: ServerResponse<IncomingMessage>) =>
			`request errored with status code: ${res.statusCode}`,
		genReqId,
		redact: [],
		...options,
	};

	return [responseBodyMiddleware, pinoHttp(pinoOptions)];
};

export default requestLogger();
