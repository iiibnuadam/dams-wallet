import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string | number;
  onValueChange?: (value: string) => void;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    // Format helper using Intl
    const formatValue = (val: string | number | undefined) => {
      if (!val) return "";
      const num = typeof val === "string" ? parseInt(val.toString().replace(/\D/g, ""), 10) : val;
      if (isNaN(num)) return "";
      return new Intl.NumberFormat("id-ID").format(num);
    };

    const [displayValue, setDisplayValue] = React.useState(() => {
        if (value !== undefined) return formatValue(value);
        if (props.defaultValue !== undefined) return formatValue(props.defaultValue.toString());
        return "";
    });

    React.useEffect(() => {
        if (value !== undefined) {
            setDisplayValue(formatValue(value));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      const formatted = formatValue(rawValue);
      
      setDisplayValue(formatted);
      if (onValueChange) {
        onValueChange(rawValue);
      }
    };

    // Remove onChange and value from props to avoid overriding internal logic
    const { onChange: _externalOnChange, value: _externalValue, ...safeProps } = props as any;

    return (
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className={cn("font-mono", className)}
        ref={ref}
        {...safeProps}
      />
    );
  }
);
MoneyInput.displayName = "MoneyInput";
