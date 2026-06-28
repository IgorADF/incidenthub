export type OmitDefaultValues<T, K extends keyof any = never> = Omit<
	T,
	K | "createdAt" | "id"
>;
