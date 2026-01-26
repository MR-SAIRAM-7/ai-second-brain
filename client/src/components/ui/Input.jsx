import { forwardRef } from "react";
import { cn } from "./Button"; // Re-use cn utility

const Input = forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            className={cn(
                "flex h-9 w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";

export { Input };
