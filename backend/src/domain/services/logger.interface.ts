export interface LoggerServiceInterface {
	info: (message: string) => void;
	error: (message: string) => void;
}
