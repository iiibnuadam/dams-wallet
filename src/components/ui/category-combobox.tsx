"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Category {
  _id: string;
  name: string;
  type?: string;
  icon?: string;
  group?: string;
}

interface CategoryComboboxProps {
  categories: Category[];
  value?: string | string[];
  onChange: (value: any) => void;
  disabled?: boolean;
  placeholder?: string;
  modal?: boolean;
  multiple?: boolean;
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  disabled,
  placeholder = "Select category...",
  modal = false,
  multiple = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Normalize valid values
  const selectedValues = React.useMemo(() => {
    if (multiple) {
        return Array.isArray(value) ? value : ((typeof value === 'string' && value !== "ALL" && value !== "") ? value.split(',') : []);
    }
    return typeof value === 'string' ? [value] : []; 
  }, [value, multiple]);

  const handleSelect = (categoryId: string) => {
    if (multiple) {
        const newValues = selectedValues.includes(categoryId)
            ? selectedValues.filter(id => id !== categoryId)
            : [...selectedValues, categoryId];
        onChange(newValues);
    } else {
        onChange(categoryId);
        setOpen(false);
    }
  };

  // Trigger Label Logic
  const triggerLabel = React.useMemo(() => {
      if (multiple) {
          if (selectedValues.length === 0) return <span className="text-muted-foreground">{placeholder}</span>;
          if (selectedValues.length === 1) {
              const cat = categories.find(c => c._id === selectedValues[0]);
              return <span className="truncate">{cat?.name || "Unknown"}</span>;
          }
          if (selectedValues.length === categories.length && categories.length > 0) return <span className="truncate">All Categories</span>;
          return <span className="truncate">{selectedValues.length} selected</span>;
      } else {
          const selectedCategory = categories.find((c) => c._id === value);
          return selectedCategory ? (
            <span className="truncate">{selectedCategory.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          );
      }
  }, [categories, value, selectedValues, multiple, placeholder]);
  
  // Group categories
  const groupedCategories = React.useMemo(() => {
    const groups: Record<string, Category[]> = {};
    const ungrouped: Category[] = [];

    categories.forEach(cat => {
        if (cat._id === "ALL") {
            ungrouped.push(cat);
            return;
        }
        const groupName = cat.group || "Other";
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(cat);
    });

    const sortedGroups = Object.keys(groups).sort();
    return { ungrouped, groups, sortedGroups };
  }, [categories]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {triggerLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={(value, search) => {
             if (value.toLowerCase().includes(search.toLowerCase())) return 1;
             return 0;
        }}>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            
            {groupedCategories.ungrouped.length > 0 && (
                 <CommandGroup>
                    {groupedCategories.ungrouped.map((category) => (
                        <CommandItem
                            key={category._id}
                            value={category.name}
                            onSelect={() => handleSelect(category._id)}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedValues.includes(category._id) || (!multiple && value === category._id) ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {category.name}
                        </CommandItem>
                    ))}
                 </CommandGroup>
            )}

            {groupedCategories.sortedGroups.map(group => (
                <CommandGroup key={group} heading={group}>
                    {groupedCategories.groups[group].map((category) => (
                        <CommandItem
                        key={category._id}
                        value={category.name} 
                        onSelect={() => handleSelect(category._id)}
                        >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            selectedValues.includes(category._id) || (!multiple && value === category._id) ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {category.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            ))}

          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
