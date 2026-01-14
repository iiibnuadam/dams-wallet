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
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  modal?: boolean;
}

export function CategoryCombobox({
  categories,
  value,
  onChange,
  disabled,
  placeholder = "Select category...",
  modal = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Find selected category object
  const selectedCategory = categories.find((c) => c._id === value);

  // Group categories
  const groupedCategories = React.useMemo(() => {
    const groups: Record<string, Category[]> = {};
    
    // Explicitly handle "All Categories" or ungrouped items if they come with a special ID or no group
    const ungrouped: Category[] = [];

    categories.forEach(cat => {
        if (cat._id === "ALL") {
            // Special case for "All Categories" filter option, typically put at top or separate
            // Let's treat it as ungrouped for now or a special group if desired. 
            // Usually filter options like "All" don't have a group.
            ungrouped.push(cat);
            return;
        }

        const groupName = cat.group || "Other";
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(cat);
    });

    // Sort groups alphabetically? Or predefined order?
    // Let's sort alphabetically for now
    return { ungrouped, groups };
  }, [categories]);

  // Sort group names
  const groupNames = React.useMemo(() => Object.keys(groupedCategories.groups).sort(), [groupedCategories]);


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
          {selectedCategory ? (
            <span className="truncate">{selectedCategory.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={(value, search) => {
             // Custom filter to match category name against search
             // value in CommandItem is usually unique ID or value, but we can put name in keywords or label
             if (value.toLowerCase().includes(search.toLowerCase())) return 1;
             return 0;
        }}>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            
            {/* Ungrouped Items (e.g. All Categories) */}
            {groupedCategories.ungrouped.length > 0 && (
                 <CommandGroup>
                    {groupedCategories.ungrouped.map((category) => (
                        <CommandItem
                            key={category._id}
                            value={category.name}
                            onSelect={() => {
                                onChange(category._id);
                                setOpen(false);
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === category._id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {category.name}
                        </CommandItem>
                    ))}
                 </CommandGroup>
            )}

            {/* Grouped Items */}
            {groupNames.map(group => (
                <CommandGroup key={group} heading={group}>
                    {groupedCategories.groups[group].map((category) => (
                        <CommandItem
                        key={category._id}
                        value={category.name} 
                        onSelect={() => {
                            onChange(category._id);
                            setOpen(false);
                        }}
                        >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            value === category._id ? "opacity-100" : "opacity-0"
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
