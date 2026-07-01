import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
	label?: string;
	header?: ReactNode;
	showLabel: string;
	hideLabel: string;
	error?: string;
};

export function PasswordInput({
	label,
	header,
	showLabel,
	hideLabel,
	error,
	id,
	autoComplete,
	className,
	...props
}: PasswordInputProps) {
	const [show, setShow] = useState(false);

	return (
		<div className="space-y-2">
			{header ? header : label && <Label htmlFor={id}>{label}</Label>}
			<div className="relative">
				<Input
					id={id}
					type={show ? "text" : "password"}
					autoComplete={autoComplete}
					className={cn("pr-10", className)}
					aria-invalid={error ? "true" : "false"}
					{...props}
				/>
				<button
					type="button"
					onClick={() => setShow((s) => !s)}
					className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex cursor-pointer items-center px-3"
					aria-label={show ? hideLabel : showLabel}
					tabIndex={-1}
				>
					{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}
